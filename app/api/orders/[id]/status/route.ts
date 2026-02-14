import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { Order } from '@prisma/client';

const ALLOWED_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

interface SessionUser {
  role: string;
  growerId?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user as SessionUser;
    const { id: orderId } = await params;
    const { status: newStatus } = await request.json() as { status: string };
    
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { grower: true }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (user.role === 'GROWER' && order.growerId !== user.growerId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 });
    }
    
    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
      return NextResponse.json({ 
        error: `Cannot go from ${currentStatus} to ${newStatus}` 
      }, { status: 400 });
    }
    
    const updateData: Partial<Order> = { status: newStatus as Order['status'] };
    
    if (newStatus === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (newStatus === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
    });
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        shippedAt: updatedOrder.shippedAt,
        deliveredAt: updatedOrder.deliveredAt,
      }
    });
    
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
