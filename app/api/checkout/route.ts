import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

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

interface SessionWithUser {
  user?: {
    id: string;
    email: string;
    role: string;
    dispensaryId?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null;
    
    if (!session?.user) {
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
