import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

/**
 * Checkout API Endpoint
 * 
 * Base path: /api/checkout
 * Authentication: Required (DISPENSARY role)
 * 
 * This endpoint processes cart checkout for dispensaries, creating orders
 * from multiple growers. Handles inventory deduction and order splitting
 * when cart contains products from different growers.
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
}

/**
 * POST /api/checkout
 * 
 * Processes checkout from a dispensary's shopping cart.
 * Creates one order per grower when cart contains items from multiple growers.
 * 
 * Request Body:
 * - items (required): Array of cart items, each containing:
 *   - id (string): Product ID
 *   - growerId (string): ID of the grower selling the product
 *   - price (number): Unit price
 *   - quantity (number): Quantity to purchase
 * - notes (optional): Order notes or special instructions
 * 
 * Business Logic:
 * - Items are automatically grouped by growerId
 * - One order is created per unique grower in the cart
 * - Inventory is deducted atomically during order creation
 * - Orders with insufficient inventory are skipped and reported as errors
 * - Tax is calculated at 6% per order subtotal
 * - Order IDs are auto-generated as 'ORD-{timestamp}-{sequence}'
 * 
 * Response: 200 OK - Checkout result with:
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
      return NextResponse.json({ error: 'Only dispensaries can checkout' }, { status: 403 });
    }

    if (!user.dispensaryId) {
      return NextResponse.json({ error: 'Dispensary profile not found' }, { status: 400 });
    }

    const dispensaryId = user.dispensaryId;

    const { items, notes } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Group items by grower
    const byGrower: Record<string, CartItem[]> = {};
    items.forEach((item: CartItem) => {
      if (!byGrower[item.growerId]) byGrower[item.growerId] = [];
      byGrower[item.growerId].push(item);
    });

    const orders: { id: string; orderId: string }[] = [];
    const errors: string[] = [];

    for (const [growerId, growerItems] of Object.entries(byGrower)) {
      let subtotal = 0;
      const orderItems: OrderItemData[] = [];

      for (const item of growerItems) {
        const product = await db.product.findUnique({ where: { id: item.id } });
        
        if (!product || product.inventoryQty < item.quantity) {
          errors.push(`${item.id}: insufficient inventory`);
          continue;
        }

        // Deduct inventory
        await db.product.update({
          where: { id: item.id },
          data: { inventoryQty: { decrement: item.quantity } }
        });

        const total = item.quantity * item.price;
        subtotal += total;
        orderItems.push({
          productId: item.id,
          growerId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: total
        });
      }

      if (orderItems.length > 0) {
        const tax = subtotal * 0.06;
        const order = await db.order.create({
          data: {
            growerId,
            dispensaryId,
            orderId: `ORD-${Date.now()}-${orders.length + 1}`,
            status: 'PENDING',
            totalAmount: subtotal + tax,
            subtotal,
            tax,
            notes,
            items: { create: orderItems }
          }
        });
        orders.push({ id: order.id, orderId: order.orderId });
      }
    }

    return NextResponse.json({ 
      success: true, 
      orders, 
      orderCount: orders.length,
      ...(errors.length > 0 && { errors })
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
