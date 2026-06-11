import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
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

// Dispensaries may only withdraw their own not-yet-accepted requests;
// growers own the rest of the fulfillment lifecycle.
const DISPENSARY_ALLOWED_TARGETS = new Set(['CANCELLED']);
const DISPENSARY_CANCELLABLE_FROM = new Set(['PENDING']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
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

    if (user.role === 'GROWER') {
      if (!user.growerId || order.growerId !== user.growerId) {
        return NextResponse.json({ error: 'Not your order' }, { status: 403 });
      }
    } else if (user.role === 'DISPENSARY') {
      if (!user.dispensaryId || order.dispensaryId !== user.dispensaryId) {
        return NextResponse.json({ error: 'Not your order' }, { status: 403 });
      }
      if (!DISPENSARY_ALLOWED_TARGETS.has(newStatus)) {
        return NextResponse.json({ error: 'Buyers can only cancel their own requests' }, { status: 403 });
      }
      if (!DISPENSARY_CANCELLABLE_FROM.has(order.status)) {
        return NextResponse.json(
          { error: 'This request was already accepted. Message the grower to coordinate a cancellation.' },
          { status: 409 }
        );
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const isCancellation = newStatus === 'CANCELLED' && currentStatus !== 'CANCELLED';

    const updatedOrder = await db.$transaction(async (tx) => {
      if (isCancellation) {
        // Return the inventory that was reserved when the request was created
        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { inventoryQty: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
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
