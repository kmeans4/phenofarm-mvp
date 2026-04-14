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

interface CheckoutIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
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
      item.quantity <= 0
    );

    if (hasInvalidItem) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
    }

    // Group items by grower
    const byGrower: Record<string, CartItem[]> = {};
    normalizedItems.forEach((item) => {
      if (!byGrower[item.growerId]) byGrower[item.growerId] = [];
      byGrower[item.growerId].push(item);
    });

    const orders: { id: string; orderId: string }[] = [];
    const issues: CheckoutIssue[] = [];

    for (const [growerId, growerItems] of Object.entries(byGrower)) {
      const requestedByProduct = new Map<string, number>();
      for (const item of growerItems) {
        requestedByProduct.set(item.id, (requestedByProduct.get(item.id) || 0) + item.quantity);
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
        issues.push(...growerIssues);
        continue;
      }

      try {
        const order = await db.$transaction(async (tx) => {
          let subtotal = 0;
          const orderItems: OrderItemData[] = [];

          for (const item of growerItems) {
            const updateResult = await tx.product.updateMany({
              where: {
                id: item.id,
                growerId,
                isDeleted: false,
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

            const total = item.quantity * item.price;
            subtotal += total;
            orderItems.push({
              productId: item.id,
              growerId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: total,
            });
          }

          const tax = subtotal * 0.06;
          return tx.order.create({
            data: {
              growerId,
              dispensaryId,
              orderId: `ORD-${Date.now()}-${orders.length + 1}`,
              status: 'PENDING',
              totalAmount: subtotal + tax,
              subtotal,
              tax,
              notes,
              items: { create: orderItems },
            },
          });
        });

        orders.push({ id: order.id, orderId: order.orderId });
      } catch (error) {
        if (error instanceof CheckoutConflictError) {
          issues.push(...error.issues);
          continue;
        }
        throw error;
      }
    }

    if (orders.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to create orders from the current cart',
          issues,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      orders, 
      orderCount: orders.length,
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

    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
