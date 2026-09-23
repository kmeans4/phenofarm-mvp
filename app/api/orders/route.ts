import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { customerWhere } from '@/lib/customers';
import { db } from '@/lib/db';
import { formatLicenseExpiry, isLicenseExpired } from '@/lib/license';
import { createNotification } from '@/lib/notifications';
import { createWithOrderIdRetry } from '@/lib/order-id';

/**
 * Orders API Endpoint
 * 
 * Base path: /api/orders
 * Authentication: Required (GROWER or DISPENSARY role)
 * 
 * This endpoint manages wholesale order records between growers and dispensaries.
 * PhenoFarm tracks operational value and fulfillment status only; wholesale
 * payment settlement happens directly between the businesses.
 */

interface OrderItemInput {
  productId: string;
  quantity: number;
  priceOverride?: { unitPrice: number; reason: string };
}

interface InventoryIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

class OrderValidationError extends Error {}

class InventoryConflictError extends Error {
  issues: InventoryIssue[];

  constructor(issues: InventoryIssue[]) {
    super('Insufficient inventory for one or more items');
    this.issues = issues;
  }
}

/**
 * POST /api/orders
 * 
 * Creates a new order from a grower to a dispensary.
 * Only users with GROWER role can create orders.
 * 
 * Request Body:
 * - dispensaryId (required): ID of the target dispensary
 * - items (required): Array of order items, each containing:
 *   - productId (string): ID of the product
 *   - quantity (number): Quantity ordered
 *   - priceOverride (optional): Explicit agreed unit price plus a required reason
 * - notes (optional): Order notes or special instructions
 * - shippingFee (optional): Shipping cost as number
 * 
 * Business Logic:
 * - Catalog prices are read under inventory locks; explicit owner overrides are audited
 * - Tax is not calculated or collected by PhenoFarm
 * - Total amount = subtotal + optional shipping estimate
 * - Order status is set to 'PENDING' on creation
 * - Order ID is auto-generated as 'ORD-{timestamp}'
 * 
 * Response: 201 Created - Newly created order with items and relations
 * Response: 400 Bad Request - Missing required fields (dispensaryId or items)
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a GROWER
 * Response: 500 Internal Server Error - Database or server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Only growers can create direct order records' }, { status: 403 });
    }

    const growerId = user.growerId;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    const { dispensaryId, items, notes, shippingFee } = body;

    if (typeof dispensaryId !== 'string' || !dispensaryId || !Array.isArray(items) || items.length === 0 || items.length > 100 || items.some(item => !item || typeof item !== 'object')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeShippingFee = shippingFee === undefined ? 0 : Number(shippingFee);
    if (!Number.isFinite(safeShippingFee) || safeShippingFee < 0 || safeShippingFee > 999999.99 || (notes != null && (typeof notes !== 'string' || notes.length > 1000))) {
      return NextResponse.json({ error: 'Invalid shipping fee or notes' }, { status: 400 });
    }
    // Verify dispensary license status
    const dispensary = await db.dispensary.findFirst({
      where: { id: dispensaryId, OR: [{ userId: { not: null } }, customerWhere(growerId)] },
      select: { userId: true, licenseStatus: true, licenseExpiry: true, isOffPlatform: true, businessName: true },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    if (isLicenseExpired(dispensary.licenseExpiry)) {
      await db.dispensary.update({
        where: { id: dispensaryId },
        data: { licenseStatus: 'expired', isVerified: false },
      });
      return NextResponse.json(
        {
          error: `License expired ${formatLicenseExpiry(dispensary.licenseExpiry!)} - update the customer record before continuing`,
          code: 'LICENSE_EXPIRED',
          licenseStatus: 'expired',
        },
        { status: 403 }
      );
    }

    if (!dispensary.isOffPlatform && dispensary.licenseStatus !== 'verified') {
      return NextResponse.json(
        { 
          error: 'License verification required. This dispensary must have a verified license before direct order records can be created.',
          code: 'LICENSE_NOT_VERIFIED',
          licenseStatus: dispensary.licenseStatus,
        },
        { status: 403 }
      );
    }

    const normalizedItems: OrderItemInput[] = items.map((item: Partial<OrderItemInput>) => ({
      productId: String(item.productId || ''),
      quantity: Number(item.quantity),
      ...(item.priceOverride !== undefined ? { priceOverride: {
        unitPrice: typeof item.priceOverride?.unitPrice === 'number' ? item.priceOverride.unitPrice : NaN,
        reason: typeof item.priceOverride?.reason === 'string' ? item.priceOverride.reason.trim() : '',
      } } : {}),
    }));

    const invalidItem = normalizedItems.some((item) =>
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 || item.quantity > 9999 ||
      (item.priceOverride !== undefined && (
        !Number.isFinite(item.priceOverride.unitPrice) || item.priceOverride.unitPrice < 0 || item.priceOverride.unitPrice > 999999.99 ||
        Math.abs(item.priceOverride.unitPrice * 100 - Math.round(item.priceOverride.unitPrice * 100)) > 0.000001 ||
        !item.priceOverride.reason || item.priceOverride.reason.length > 240
      ))
    );

    if (invalidItem) {
      return NextResponse.json({ error: 'Invalid order items. Custom prices require a valid amount and a reason (up to 240 characters).' }, { status: 400 });
    }

    const requestedByProduct = new Map<string, number>();
    for (const item of normalizedItems) {
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.quantity);
    }

    const productIds = Array.from(requestedByProduct.keys());

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        growerId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        inventoryQty: true,
        isAvailable: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more selected products could not be found.' }, { status: 400 });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const initialIssues: InventoryIssue[] = [];

    for (const [productId, requested] of requestedByProduct.entries()) {
      const product = productById.get(productId);
      const available = Number(product?.inventoryQty || 0);
      const isAvailable = Boolean(product?.isAvailable);

      if (!product || !isAvailable || requested > available) {
        initialIssues.push({
          productId,
          productName: product?.name || 'Unknown product',
          requested,
          available,
        });
      }
    }

    if (initialIssues.length > 0) {
      return NextResponse.json(
        {
          error: 'Insufficient inventory for one or more items',
          issues: initialIssues,
        },
        { status: 409 }
      );
    }

    const order = await createWithOrderIdRetry((orderId) => db.$transaction(async (tx) => {
      for (const [productId, requested] of [...requestedByProduct.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: productId,
            growerId,
            isDeleted: false,
            isAvailable: true,
            inventoryQty: { gte: requested },
          },
          data: {
            inventoryQty: { decrement: requested },
          },
        });

        if (updateResult.count === 0) {
          const latest = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, inventoryQty: true },
          });

          throw new InventoryConflictError([
            {
              productId,
              productName: latest?.name || productById.get(productId)?.name || 'Unknown product',
              requested,
              available: Number(latest?.inventoryQty || 0),
            },
          ]);
        }
      }

      await tx.product.updateMany({ where: { growerId, id: { in: productIds }, inventoryQty: 0 }, data: { isAvailable: false } });
      // Inventory updates hold the product locks through price snapshot + order creation.
      const pricedProducts = await tx.product.findMany({ where: { id: { in: productIds }, growerId }, select: { id: true, price: true } });
      const catalogPrices = new Map(pricedProducts.map(product => [product.id, Number(product.price)]));
      const pricedItems = normalizedItems.map(item => {
        const catalogUnitPrice = catalogPrices.get(item.productId);
        if (catalogUnitPrice === undefined) throw new OrderValidationError('A selected product is no longer available.');
        const unitPrice = item.priceOverride?.unitPrice ?? catalogUnitPrice;
        return { ...item, unitPrice, catalogUnitPrice, priceOverrideReason: item.priceOverride?.reason || null };
      });
      const subtotal = pricedItems.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100), 0) / 100;
      const tax = 0;
      if (Math.round((subtotal + safeShippingFee) * 100) > 9999999999) throw new OrderValidationError('Order total exceeds the supported amount.');

      const createdOrder = await tx.order.create({
        data: {
          growerId,
          dispensaryId,
          orderId,
          status: 'PENDING',
          totalAmount: Math.round((subtotal + tax + safeShippingFee) * 100) / 100,
          subtotal,
          tax,
          shippingFee: Math.round(safeShippingFee * 100) / 100,
          notes: notes || null,
          createdBy: 'GROWER',
          items: {
            create: pricedItems.map((item) => ({
              product: { connect: { id: item.productId } },
              grower: { connect: { id: growerId } },
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              catalogUnitPrice: item.catalogUnitPrice,
              priceOverrideReason: item.priceOverrideReason,
              totalPrice: Math.round(item.quantity * item.unitPrice * 100) / 100,
            })),
          },
        },
        include: {
          dispensary: { select: { businessName: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: createdOrder.id,
          fromStatus: null,
          toStatus: 'PENDING',
          actorUserId: user.id,
          actorRole: 'GROWER',
        },
      });

      await createNotification(tx, {
        userId: dispensary.userId,
        type: 'DIRECT_ORDER_RECORDED',
        title: 'Grower-recorded request needs confirmation',
        body: `A grower recorded request #${createdOrder.orderId} for you to confirm or decline.`,
        href: `/dispensary/orders/${createdOrder.id}`,
      });

      return createdOrder;
    }));

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof InventoryConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          issues: error.issues,
        },
        { status: 409 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/orders
 * 
 * Retrieves orders for the authenticated user.
 * - GROWERs see orders they created (outgoing orders)
 * - DISPENSARYs see orders placed with them (incoming orders)
 * 
 * Query Parameters: take (default 100, max 200), cursor (optional order id)
 * 
 * Response includes:
 * - Order details (id, orderId, status, totals, notes)
 * - Dispensary business name
 * - Order items with product names
 * - Sorted by createdAt descending (newest first)
 * 
 * Response: 200 OK - { orders: [], nextCursor }
 * Response: 401 Unauthorized - No valid session
 * Response: 500 Internal Server Error - Database or server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    const take = Math.min(200, Math.max(1, Number.parseInt(searchParams.get('take') || '100', 10) || 100));
    const cursor = searchParams.get('cursor');

    if (!['GROWER', 'DISPENSARY'].includes(user.role)) return NextResponse.json({ error: 'Use the admin portal to review orders' }, { status: 403 });
    if (user.role === 'GROWER' && !user.growerId) {
      return NextResponse.json({ error: 'Grower ID not found' }, { status: 400 });
    }

    if (user.role !== 'GROWER' && !user.dispensaryId) {
      return NextResponse.json({ error: 'Dispensary ID not found' }, { status: 400 });
    }

    const rows = await db.order.findMany({
      where: user.role === 'GROWER'
        ? { growerId: user.growerId }
        : { dispensaryId: user.dispensaryId },
      include: {
        dispensary: { select: { businessName: true } },
        items: { select: {
          id: true, orderId: true, productId: true, growerId: true, quantity: true, unitPrice: true, totalPrice: true, createdAt: true, acceptedQuoteId: true,
          catalogUnitPrice: user.role === 'GROWER', priceOverrideReason: user.role === 'GROWER',
          product: { select: { name: true } },
        } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const orders = hasMore ? rows.slice(0, take) : rows;
    return NextResponse.json({
      orders,
      nextCursor: hasMore ? orders[orders.length - 1]?.id || null : null,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
