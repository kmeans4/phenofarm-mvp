import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Orders API Endpoint
 * 
 * Base path: /api/orders
 * Authentication: Required (GROWER or DISPENSARY role)
 * 
 * This endpoint manages cannabis product orders between growers and dispensaries.
 * Growers can create orders and view their outgoing orders.
 * Dispensaries can view their incoming orders.
 */

interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface InventoryIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

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
 *   - unitPrice (number): Price per unit
 * - notes (optional): Order notes or special instructions
 * - shippingFee (optional): Shipping cost as number
 * 
 * Business Logic:
 * - Subtotal is calculated from items (quantity * unitPrice)
 * - Tax is automatically calculated as 6% of subtotal
 * - Total amount = subtotal + tax + shippingFee
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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Only growers can create orders' }, { status: 403 });
    }

    const growerId = user.growerId;

    const body = await request.json();
    const { dispensaryId, items, notes, shippingFee } = body;

    if (!dispensaryId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify dispensary license status
    const dispensary = await db.dispensary.findUnique({
      where: { id: dispensaryId },
      select: { licenseStatus: true, businessName: true },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    if (dispensary.licenseStatus !== 'verified') {
      return NextResponse.json(
        { 
          error: 'License verification required. This dispensary must have a verified license to place orders.',
          code: 'LICENSE_NOT_VERIFIED',
          licenseStatus: dispensary.licenseStatus,
        },
        { status: 403 }
      );
    }

    const normalizedItems: OrderItemInput[] = items.map((item: Partial<OrderItemInput>) => ({
      productId: String(item.productId || ''),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    const invalidItem = normalizedItems.some((item) =>
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0
    );

    if (invalidItem) {
      return NextResponse.json({ error: 'Invalid order items. Check product, quantity, and price.' }, { status: 400 });
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

    // Calculate totals
    const subtotal = normalizedItems.reduce((sum: number, item: OrderItemInput) =>
      sum + (item.quantity * item.unitPrice), 0
    );
    const tax = subtotal * 0.06;
    const safeShippingFee = Number(shippingFee) || 0;

    const order = await db.$transaction(async (tx) => {
      for (const [productId, requested] of requestedByProduct.entries()) {
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

      return tx.order.create({
        data: {
          growerId,
          dispensaryId,
          orderId: `ORD-${Date.now()}`,
          status: 'PENDING',
          totalAmount: subtotal + tax + safeShippingFee,
          subtotal,
          tax,
          shippingFee: safeShippingFee,
          notes: notes || null,
          items: {
            create: normalizedItems.map((item: OrderItemInput) => ({
              product: { connect: { id: item.productId } },
              grower: { connect: { id: growerId } },
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          dispensary: { select: { businessName: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
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
 * Query Parameters: None
 * 
 * Response includes:
 * - Order details (id, orderId, status, totals, notes)
 * - Dispensary business name
 * - Order items with product names
 * - Sorted by createdAt descending (newest first)
 * 
 * Response: 200 OK - Array of order objects
 * Response: 401 Unauthorized - No valid session
 * Response: 500 Internal Server Error - Database or server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role === 'GROWER' && !user.growerId) {
      return NextResponse.json({ error: 'Grower ID not found' }, { status: 400 });
    }

    if (user.role !== 'GROWER' && !user.dispensaryId) {
      return NextResponse.json({ error: 'Dispensary ID not found' }, { status: 400 });
    }

    const orders = await db.order.findMany({
      where: user.role === 'GROWER'
        ? { growerId: user.growerId }
        : { dispensaryId: user.dispensaryId },
      include: {
        dispensary: { select: { businessName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
