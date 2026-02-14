import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

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
