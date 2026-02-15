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
    const session: any = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Only growers can create orders' }, { status: 403 });
    }

    const body = await request.json();
    const { dispensaryId, items, notes, shippingFee } = body;

    if (!dispensaryId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: OrderItemInput) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const tax = subtotal * 0.06;

    // Create order with items - use connect for relations
    const order = await db.order.create({
      data: {
        growerId: user.growerId,
        dispensaryId,
        orderId: `ORD-${Date.now()}`,
        status: 'PENDING',
        totalAmount: subtotal + tax + (shippingFee || 0),
        subtotal,
        tax,
        shippingFee: shippingFee || 0,
        notes: notes || null,
        items: {
          create: items.map((item: OrderItemInput) => ({
            product: { connect: { id: item.productId } },
            grower: { connect: { id: user.growerId } },
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
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
export async function GET(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
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
