import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import type { Order, UserRole } from '@prisma/client';
import {
  canTransitionOrderStatus,
  getOrderStatusLabel,
  getInvalidOrderStatusTransitionMessage,
  isOrderStatus,
} from '@/lib/order-workflow';
import { claimOrder, restoreInventory, OrderConflictError } from '@/lib/order-mutations';
import { createNotification } from '@/lib/notifications';

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
    const { status: newStatus } = await request.json().catch(() => ({})) as { status: string };

    if (!isOrderStatus(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        grower: { select: { userId: true, businessName: true } },
        dispensary: { select: { userId: true, businessName: true } },
      },
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

    if (order.status === newStatus) return NextResponse.json({ success: true, order: { id: order.id, status: order.status, shippedAt: order.shippedAt, deliveredAt: order.deliveredAt } });
    const currentStatus = order.status;
    if (!canTransitionOrderStatus(currentStatus, newStatus)) {
      return NextResponse.json({
        error: getInvalidOrderStatusTransitionMessage(currentStatus, newStatus)
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
      await claimOrder(tx, order);
      if (isCancellation) {
        // Return the inventory that was reserved when the request was created
        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await restoreInventory(tx, item.productId, item.quantity);
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          actorUserId: user.id,
          actorRole: user.role as UserRole,
        },
      });

      const recipientUserId = user.role === 'GROWER'
        ? order.dispensary.userId
        : order.grower.userId;
      await createNotification(tx, {
        userId: recipientUserId,
        type: 'ORDER_STATUS_CHANGED',
        title: `Request ${getOrderStatusLabel(newStatus).toLowerCase()}`,
        body: `Request #${order.orderId} is now ${getOrderStatusLabel(newStatus)}.`,
        href: user.role === 'GROWER' ? `/dispensary/orders/${order.id}` : `/grower/orders/${order.id}`,
      });

      return updated;
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
    if (error instanceof OrderConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
