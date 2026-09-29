import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import type { Order, UserRole } from '@prisma/client';
import {
  canTransitionOrderStatus,
  getOrderStatusLabel,
  isOrderStatus,
} from '@/lib/order-workflow';
import {
  claimOrder,
  restoreInventory,
  OrderConflictError,
} from '@/lib/order-mutations';
import { orderUndoToken, readOrderUndoToken } from '@/lib/order-undo';
import { createNotification } from '@/lib/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session)
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    const user = session.user;
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const undo =
      typeof body.undoEventId === 'string'
        ? readOrderUndoToken(body.undoEventId)
        : null;
    if (body.undoEventId && !undo)
      return NextResponse.json(
        { error: 'The undo window ended. Refresh this order.' },
        { status: 409 }
      );
    const undoEventId = undo?.eventId || null;
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        grower: { select: { userId: true } },
        dispensary: { select: { userId: true } },
        statusEvents: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
    });
    if (
      !order ||
      (user.role === 'GROWER' && order.growerId !== user.growerId) ||
      (user.role === 'DISPENSARY' && order.dispensaryId !== user.dispensaryId)
    ) {
      return NextResponse.json(
        { error: 'This order is unavailable to your account.' },
        { status: 404 }
      );
    }
    if (!['GROWER', 'DISPENSARY', 'ADMIN'].includes(user.role))
      return NextResponse.json(
        { error: 'Your account cannot update orders.' },
        { status: 403 }
      );
    const previousEvent = order.statusEvents[0];
    // Undo can reverse only this actor's latest unchanged action, once, during the toast window.
    if (
      undoEventId &&
      (user.role === 'DISPENSARY' ||
        !previousEvent ||
        previousEvent.id !== undoEventId ||
        previousEvent.actorUserId !== user.id ||
        !previousEvent.fromStatus ||
        previousEvent.undoOfEventId ||
        Date.now() - previousEvent.createdAt.getTime() > 15000 ||
        previousEvent.toStatus !== order.status ||
        order.updatedAt.toISOString() !== undo?.version)
    ) {
      return NextResponse.json(
        {
          error:
            'This order has changed or the undo window ended. Refresh to see its current status.',
        },
        { status: 409 }
      );
    }
    const newStatus = undoEventId ? previousEvent!.fromStatus! : body.status;
    if (!isOrderStatus(newStatus))
      return NextResponse.json(
        { error: 'Choose a valid order status.' },
        { status: 400 }
      );
    if (
      user.role === 'DISPENSARY' &&
      (newStatus !== 'CANCELLED' || order.status !== 'PENDING')
    )
      return NextResponse.json(
        {
          error:
            'This order was already accepted. Message the grower to arrange cancellation.',
        },
        { status: 409 }
      );
    if (
      !undoEventId &&
      body.expectedStatus &&
      body.expectedStatus !== order.status
    )
      return NextResponse.json(
        {
          error: `This order was already moved to ${getOrderStatusLabel(order.status)} — refresh to see it.`,
        },
        { status: 409 }
      );
    if (!undoEventId && order.status === newStatus)
      return NextResponse.json({
        success: true,
        order: { id: order.id, status: order.status },
      });
    if (!undoEventId && !canTransitionOrderStatus(order.status, newStatus))
      return NextResponse.json(
        {
          error: `This order is ${getOrderStatusLabel(order.status)} — refresh to see its next step.`,
        },
        { status: 409 }
      );
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (
      !undoEventId &&
      newStatus === 'CANCELLED' &&
      user.role !== 'DISPENSARY' &&
      (!reason || reason.length > 500)
    )
      return NextResponse.json(
        { error: 'Choose a cancellation reason (up to 500 characters).' },
        { status: 400 }
      );
    const update: Partial<Order> = { status: newStatus };
    if (newStatus === 'SHIPPED' && !order.shippedAt)
      update.shippedAt = new Date();
    if (newStatus === 'DELIVERED' && !order.deliveredAt)
      update.deliveredAt = new Date();
    if (undoEventId && order.status === 'DELIVERED') update.deliveredAt = null;
    if (undoEventId && order.status === 'SHIPPED') update.shippedAt = null;
    const result = await db.$transaction(async (tx) => {
      await claimOrder(tx, order);
      if (
        newStatus === 'CANCELLED' ||
        (undoEventId && order.status === 'CANCELLED')
      ) {
        const items = await tx.orderItem.findMany({
          where: { orderId },
          orderBy: { productId: 'asc' },
        });
        for (const item of items) {
          if (newStatus === 'CANCELLED')
            await restoreInventory(tx, item.productId, item.quantity);
          else {
            const reserved = await tx.product.updateMany({
              where: {
                id: item.productId,
                growerId: order.growerId,
                isDeleted: false,
                inventoryQty: { gte: item.quantity },
              },
              data: { inventoryQty: { decrement: item.quantity } },
            });
            if (!reserved.count) throw new OrderConflictError();
            await tx.product.updateMany({
              where: { id: item.productId, inventoryQty: 0 },
              data: { isAvailable: false },
            });
          }
        }
      }
      const updated = await tx.order.update({
        where: { id: orderId },
        data: update,
      });
      const event = await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          actorUserId: user.id,
          actorRole: user.role as UserRole,
          note: undoEventId ? 'Previous action undone' : reason || null,
          undoOfEventId: undoEventId,
        },
      });
      await createNotification(tx, {
        userId:
          user.role === 'GROWER'
            ? order.dispensary.userId
            : order.grower.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: `Order ${getOrderStatusLabel(newStatus).toLowerCase()}`,
        body: `Order #${order.orderId} is now ${getOrderStatusLabel(newStatus)}.${reason ? ` Reason: ${reason}` : ''}${undoEventId ? ' The previous update was undone.' : ''}`,
        href:
          user.role === 'GROWER'
            ? `/dispensary/orders/${order.id}`
            : `/grower/orders/${order.id}`,
      });
      return { updated, event };
    });
    return NextResponse.json({
      success: true,
      order: { id: result.updated.id, status: result.updated.status },
      undoEventId: undoEventId
        ? null
        : orderUndoToken(result.event.id, result.updated.updatedAt),
    });
  } catch (error) {
    if (error instanceof OrderConflictError)
      return NextResponse.json(
        {
          error:
            'This order or its stock changed. Refresh before trying again.',
        },
        { status: 409 }
      );
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: 'Could not update the order. Try again.' },
      { status: 500 }
    );
  }
}
