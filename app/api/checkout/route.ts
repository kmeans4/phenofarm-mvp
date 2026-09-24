import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { formatLicenseExpiry, isLicenseExpired } from '@/lib/license';
import { marketplaceGrowerWhere } from '@/lib/license';
import { createNotification } from '@/lib/notifications';
import { createWithOrderIdRetry } from '@/lib/order-id';

/**
 * Order request API endpoint
 *
 * Base path: /api/checkout
 * Authentication: Required (DISPENSARY role)
 *
 * This compatibility endpoint submits wholesale order requests for dispensaries,
 * creating one request per grower. PhenoShop does not process wholesale payment;
 * item value is tracked for operational reporting and settlement happens
 * directly between buyer and grower.
 */

interface CartItem {
  id: string;
  growerId: string;
  price: number;
  quantity: number;
}

interface OrderItemData {
  productId: string;
  growerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  acceptedQuoteId?: string;
}

interface QuotedItemResult {
  productId: string;
  quantity: number;
  unitPrice: number;
  acceptedQuoteId: string;
}

interface SubmissionReceipt {
  orders: { id: string; orderId: string; growerId: string; orderedProductIds: string[] }[];
  quotedItems: QuotedItemResult[];
}

interface CheckoutIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  reason?: string;
}

class CheckoutConflictError extends Error {
  issues: CheckoutIssue[];

  constructor(issues: CheckoutIssue[]) {
    super('Insufficient inventory for one or more items');
    this.issues = issues;
  }
}

/**
 * POST /api/checkout
 *
 * Submits an order request from a dispensary's request draft.
 * Creates one order request per grower when the draft contains items from multiple growers.
 *
 * Request Body:
 * - items (required): Array of cart items, each containing:
 *   - id (string): Product ID
 *   - growerId (string): ID of the grower selling the product
 *   - price (number): Unit price
 *   - quantity (number): Quantity requested
 * - notes (optional): Request notes, logistics, and direct payment terms
 *
 * Business Logic:
 * - Items are automatically grouped by growerId
 * - One order is created per unique grower in the cart
 * - Inventory is reserved atomically during request creation to avoid overselling
 * - Orders with insufficient inventory are skipped and reported as errors
 * - Tax is not calculated or collected by PhenoShop
 * - Order IDs are auto-generated as 'ORD-{timestamp}-{sequence}'
 *
 * Response: 200 OK - Request result with:
 *   - success (boolean): true if at least one order created
 *   - orders (array): Created orders with id and orderId
 *   - orderCount (number): Number of orders created
 *   - errors (array, optional): List of inventory errors by product ID
 *
 * Response: 400 Bad Request - Empty cart or missing dispensary profile
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a DISPENSARY
 * Response: 500 Internal Server Error - Database or server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (user.role !== 'DISPENSARY') {
      return NextResponse.json({ error: 'Only dispensaries can submit order requests' }, { status: 403 });
    }

    if (!user.dispensaryId) {
      return NextResponse.json({ error: 'Dispensary profile not found' }, { status: 400 });
    }

    const dispensaryId = user.dispensaryId;

    const dispensary = await db.dispensary.findUnique({
      where: { id: dispensaryId },
      select: { licenseStatus: true, licenseExpiry: true, businessName: true },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const submissionKey = request.headers.get('Idempotency-Key');
    if (!submissionKey || !/^[a-zA-Z0-9_-]{16,128}$/.test(submissionKey)) {
      return NextResponse.json({ error: 'Refresh your request draft before submitting again.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    const { items, notes } = body;
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 1000)) return NextResponse.json({ error: 'Notes must be text under 1000 characters' }, { status: 400 });
    if (!Array.isArray(items) || items.length > 100 || items.some(item => !item || typeof item !== 'object')) return NextResponse.json({ error: 'Choose up to 100 valid items' }, { status: 400 });

    if (!items?.length) {
      return NextResponse.json({ error: 'Order request draft is empty' }, { status: 400 });
    }

    const normalizedItems: CartItem[] = (Array.isArray(items) ? items : []).map((item: Partial<CartItem>) => ({
      id: String(item.id || ''),
      growerId: String(item.growerId || ''),
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const hasInvalidItem = normalizedItems.some((item) =>
      !item.id ||
      !item.growerId ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 || item.quantity > 9999 || item.id.length > 100 || item.growerId.length > 100
    );

    if (hasInvalidItem) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
    }

    // Consolidate duplicate lines before applying inventory and quote caps.
    const consolidated = new Map<string, CartItem>();
    for (const item of normalizedItems) {
      const key = `${item.growerId}:${item.id}`;
      const existing = consolidated.get(key);
      consolidated.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item);
    }

    if ([...consolidated.values()].some(item => item.quantity > 9999)) {
      return NextResponse.json({ error: 'Invalid cart quantities' }, { status: 400 });
    }
    // Bind the key to the complete intent, independently of mutable inventory and quotes.
    // Display prices are deliberately excluded; the server owns the actual price.
    const payloadHash = createHash('sha256').update(JSON.stringify({
      items: [...consolidated.values()].map(({ id, growerId, quantity }) => ({ id, growerId, quantity }))
        .sort((a, b) => a.growerId.localeCompare(b.growerId) || a.id.localeCompare(b.id)),
      notes: notes || '',
    })).digest('hex');
    // An empty-update Prisma upsert can race as a read followed by an insert.
    // INSERT ON CONFLICT DO NOTHING lets simultaneous first attempts share the
    // winning receipt without changing the payload originally bound to its key.
    await db.orderRequestSubmission.createMany({
      data: [{ dispensaryId, key: submissionKey, payloadHash }],
      skipDuplicates: true,
    });
    const submission = await db.orderRequestSubmission.findUniqueOrThrow({
      where: { dispensaryId_key: { dispensaryId, key: submissionKey } },
    });
    if (submission.payloadHash !== payloadHash) {
      return NextResponse.json({ error: 'This request has already been submitted with different details. Check your requests.', code: 'SUBMISSION_CONFLICT' }, { status: 409 });
    }

    // Group items by grower
    const byGrower: Record<string, CartItem[]> = {};
    consolidated.forEach((item) => {
      if (!byGrower[item.growerId]) byGrower[item.growerId] = [];
      byGrower[item.growerId].push(item);
    });

    const savedReceipt = submission.receipt as unknown as SubmissionReceipt;
    if (savedReceipt.orders.length === Object.keys(byGrower).length) {
      return NextResponse.json({ success: true, ...savedReceipt, orderCount: savedReceipt.orders.length });
    }
    if (isLicenseExpired(dispensary.licenseExpiry)) {
      await db.dispensary.update({ where: { id: dispensaryId }, data: { licenseStatus: 'expired', isVerified: false } });
      return NextResponse.json({ error: `License expired ${formatLicenseExpiry(dispensary.licenseExpiry!)} - update it in Settings; ordering resumes after re-verification`, code: 'LICENSE_EXPIRED', licenseStatus: 'expired' }, { status: 403 });
    }
    if (dispensary.licenseStatus !== 'verified') {
      return NextResponse.json({ error: 'License verification required. This dispensary must have a verified license to submit order requests.', code: 'LICENSE_NOT_VERIFIED', licenseStatus: dispensary.licenseStatus }, { status: 403 });
    }

    const orders: SubmissionReceipt['orders'] = [];
    const quotedItems: QuotedItemResult[] = [];
    const issues: CheckoutIssue[] = [];
    let uncertainResult = false;

    for (const [growerId, growerItems] of Object.entries(byGrower)) {
      try {
        const requestedByProduct = new Map<string, number>();
        for (const item of growerItems) {
          requestedByProduct.set(item.id, (requestedByProduct.get(item.id) || 0) + item.quantity);
        }

        const productIds = Array.from(requestedByProduct.keys());
        const result = await createWithOrderIdRetry((orderId) => db.$transaction(async (tx) => {
          // Serialize repeats of this intent. The order, inventory, notifications and
          // receipt commit together, so a dropped response cannot submit it twice.
          await tx.$queryRaw`SELECT id FROM order_request_submissions WHERE id = ${submission.id} FOR UPDATE`;
          const saved = await tx.orderRequestSubmission.findUniqueOrThrow({ where: { id: submission.id } });
          const receipt = saved.receipt as unknown as SubmissionReceipt;
          const previous = receipt.orders.find(order => order.growerId === growerId);
          if (previous) return { order: previous, quotedItems: receipt.quotedItems.filter(item => previous.orderedProductIds.includes(item.productId)) };

          const products = await tx.product.findMany({
            where: {
              id: { in: productIds },
              growerId,
              isDeleted: false,
              status: 'PUBLISHED',
              grower: marketplaceGrowerWhere(),
            },
            select: {
              id: true,
              name: true,
              price: true,
              inventoryQty: true,
              isAvailable: true,
              isPriceVisible: true,
              grower: { select: { userId: true, businessName: true } },
            },
          });

          const productById = new Map(products.map((product) => [product.id, product]));
          const growerIssues: CheckoutIssue[] = [];

          for (const [productId, requested] of requestedByProduct.entries()) {
            const product = productById.get(productId);
            const available = Number(product?.inventoryQty || 0);

            if (!product || !product.isAvailable || requested > available) {
              growerIssues.push({
                productId,
                productName: product?.name || 'Unknown product',
                requested,
                available,
              });
            }
          }

          if (growerIssues.length > 0) {
            throw new CheckoutConflictError(growerIssues);
          }

          let subtotal = 0;
          const orderItems: OrderItemData[] = [];
          const orderQuotedItems: QuotedItemResult[] = [];

          for (const item of [...growerItems].sort((a, b) => a.id.localeCompare(b.id))) {
            const updateResult = await tx.product.updateMany({
              where: {
                id: item.id,
                growerId,
                isDeleted: false,
                status: 'PUBLISHED',
                grower: marketplaceGrowerWhere(),
                isAvailable: true,
                inventoryQty: { gte: item.quantity },
              },
              data: { inventoryQty: { decrement: item.quantity } },
            });

            if (updateResult.count === 0) {
              const latest = await tx.product.findUnique({
                where: { id: item.id },
                select: { id: true, name: true, inventoryQty: true },
              });

              throw new CheckoutConflictError([
                {
                  productId: item.id,
                  productName: latest?.name || productById.get(item.id)?.name || 'Unknown product',
                  requested: item.quantity,
                  available: Number(latest?.inventoryQty || 0),
                },
              ]);
            }

            const currentProduct = await tx.product.findUniqueOrThrow({ where: { id: item.id }, select: { price: true, isPriceVisible: true, inventoryQty: true } });
            if (currentProduct.inventoryQty === 0) await tx.product.update({ where: { id: item.id }, data: { isAvailable: false } });
            const serverPrice = Number(currentProduct.price);
            const acceptedQuote = await tx.acceptedQuote.findFirst({
              where: {
                dispensaryId,
                growerId,
                productId: item.id,
                consumedByOrderId: null,
                expiresAt: { gt: new Date() },
              },
              orderBy: { acceptedAt: 'desc' },
            });
            const quotedQuantity = acceptedQuote
              ? Math.min(item.quantity, acceptedQuote.quantity ?? item.quantity)
              : 0;

            if (!currentProduct.isPriceVisible && quotedQuantity < item.quantity) {
              throw new CheckoutConflictError([{ productId: item.id, productName: productById.get(item.id)?.name || 'Product', requested: item.quantity, available: quotedQuantity, reason: 'An accepted quote for the full quantity is required' }]);
            }
            if (acceptedQuote && quotedQuantity > 0) {
              const quotePrice = Number(acceptedQuote.unitPrice);
              const quoteTotal = Math.round(quotedQuantity * quotePrice * 100) / 100;
              subtotal += quoteTotal;
              orderItems.push({
                productId: item.id,
                growerId,
                quantity: quotedQuantity,
                unitPrice: quotePrice,
                totalPrice: quoteTotal,
                acceptedQuoteId: acceptedQuote.id,
              });
              orderQuotedItems.push({
                productId: item.id,
                quantity: quotedQuantity,
                unitPrice: quotePrice,
                acceptedQuoteId: acceptedQuote.id,
              });
            }

            const listQuantity = item.quantity - quotedQuantity;
            if (listQuantity > 0) {
              const listTotal = Math.round(listQuantity * serverPrice * 100) / 100;
              subtotal += listTotal;
              orderItems.push({
                productId: item.id,
                growerId,
                quantity: listQuantity,
                unitPrice: serverPrice,
                totalPrice: listTotal,
              });
            }
          }

          const tax = 0;
          const createdOrder = await tx.order.create({
            data: {
              growerId,
              dispensaryId,
              orderId,
              status: 'PENDING',
              totalAmount: Math.round(subtotal * 100) / 100,
              subtotal: Math.round(subtotal * 100) / 100,
              tax,
              notes,
              createdBy: 'DISPENSARY',
            },
          });

          await tx.orderItem.createMany({
            data: orderItems.map((item) => ({ ...item, orderId: createdOrder.id })),
          });

          for (const quote of orderQuotedItems) {
            const consumed = await tx.acceptedQuote.updateMany({
              where: { id: quote.acceptedQuoteId, consumedByOrderId: null },
              data: { consumedByOrderId: createdOrder.id },
            });
            if (consumed.count !== 1) throw new Error('Accepted quote was already consumed');
          }

          await tx.orderStatusEvent.create({
            data: {
              orderId: createdOrder.id,
              fromStatus: null,
              toStatus: 'PENDING',
              actorUserId: user.id,
              actorRole: 'DISPENSARY',
            },
          });

          const growerUserId = productById.get(growerItems[0]?.id)?.grower.userId;
          await createNotification(tx, {
            userId: growerUserId,
            type: 'ORDER_CREATED',
            title: 'New order request',
            body: `${dispensary.businessName} submitted a new order request.`,
            href: `/grower/orders/${createdOrder.id}`,
          });

          const order = { id: createdOrder.id, orderId: createdOrder.orderId, growerId, orderedProductIds: productIds };
          await tx.orderRequestSubmission.update({ where: { id: submission.id }, data: {
            receipt: { orders: [...receipt.orders, order], quotedItems: [...receipt.quotedItems, ...orderQuotedItems].map(item => ({ ...item })) },
          } });
          return { order, quotedItems: orderQuotedItems };
        }, { timeout: 15_000 }));

        orders.push(result.order);
        quotedItems.push(...result.quotedItems);
      } catch (error) {
        if (error instanceof CheckoutConflictError) {
          issues.push(...error.issues);
          continue;
        }
        uncertainResult = true;
        console.error('Unable to submit grower request:', error);
        issues.push(...growerItems.map(item => ({ productId: item.id, productName: 'Product', requested: item.quantity, available: 0, reason: 'This request could not be submitted. Please retry.' })));
      }
    }

    if (uncertainResult) {
      return NextResponse.json({ error: 'Your request could not be fully confirmed. Check the request again to safely finish it.', orders, issues }, { status: 503 });
    }

    if (orders.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to create order requests from the current draft',
          issues,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      orders,
      orderCount: orders.length,
      quotedItems,
      ...(issues.length > 0 && { issues })
    });
  } catch (error) {
    if (error instanceof CheckoutConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          issues: error.issues,
        },
        { status: 409 }
      );
    }

    console.error('Order request error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
