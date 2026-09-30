import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import {
  claimOrder,
  syncOrderInventory,
  lockInventoryProducts,
  OrderInventoryError,
  OrderConflictError,
} from '@/lib/order-mutations';
import {
  canTransitionOrderStatus,
  getInvalidOrderStatusTransitionMessage,
  getOrderStatusLabel,
  isOrderStatus,
  ORDER_STATUS_VALUES,
} from '@/lib/order-workflow';
import { createNotification } from '@/lib/notifications';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json(
        { error: 'Forbidden - Grower access only' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderIds, status } = body;

    if (
      !orderIds ||
      !Array.isArray(orderIds) ||
      orderIds.length === 0 ||
      orderIds.length > 100 ||
      orderIds.some((id: unknown) => typeof id !== 'string') ||
      new Set(orderIds).size !== orderIds.length
    ) {
      return NextResponse.json(
        { error: 'orderIds array is required' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    if (!isOrderStatus(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${ORDER_STATUS_VALUES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const growerId = user.growerId;
    if (!growerId) {
      return NextResponse.json(
        { error: 'Grower ID not found' },
        { status: 400 }
      );
    }

    // Verify all orders belong to this grower
    const orders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        growerId: growerId,
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        updatedAt: true,
        growerId: true,
        inventoryState: true,
        items: { select: { productId: true, quantity: true } },
        shippedAt: true,
        deliveredAt: true,
        dispensary: { select: { userId: true } },
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found or do not belong to you' },
        { status: 403 }
      );
    }

    const targetStatus = status;
    const transitionableOrders = orders.filter(
      (order) =>
        order.status !== targetStatus &&
        canTransitionOrderStatus(order.status, targetStatus)
    );
    const noOpCount = orders.filter(
      (order) => order.status === targetStatus
    ).length;
    const skippedOrders = orders
      .filter(
        (order) =>
          order.status !== targetStatus &&
          !canTransitionOrderStatus(order.status, targetStatus)
      )
      .map((order) => ({
        id: order.id,
        status: order.status,
        statusLabel: getOrderStatusLabel(order.status),
        reason: getInvalidOrderStatusTransitionMessage(
          order.status,
          targetStatus
        ),
      }));

    if (transitionableOrders.length === 0) {
      return NextResponse.json(
        {
          error:
            skippedOrders.length > 0
              ? `No selected requests can move to ${getOrderStatusLabel(targetStatus)}.`
              : `Selected requests are already ${getOrderStatusLabel(targetStatus)}.`,
          updatedCount: 0,
          skippedCount: skippedOrders.length,
          noOpCount,
          skippedOrders,
        },
        { status: skippedOrders.length > 0 ? 409 : 200 }
      );
    }

    const transitionableIds = transitionableOrders.map((order) => order.id);

    const result = await db.$transaction(async (tx) => {
      // Claim all orders first, then lock all products in a single global order.
      const sorted = [...transitionableOrders].sort((a, b) =>
        a.id.localeCompare(b.id)
      );
      for (const order of sorted) await claimOrder(tx, order);
      await lockInventoryProducts(
        tx,
        sorted.flatMap((order) => order.items.map((item) => item.productId))
      );
      for (const order of sorted) {
        await syncOrderInventory(
          tx,
          order,
          order.items,
          order.items,
          targetStatus
        );
        await tx.order.update({
          where: { id: order.id },
          data: {
            updatedAt: new Date(
              Math.max(Date.now(), order.updatedAt.getTime() + 1)
            ),
            status: targetStatus,
            ...(targetStatus === 'SHIPPED' && !order.shippedAt
              ? { shippedAt: new Date() }
              : {}),
            ...(targetStatus === 'DELIVERED' && !order.deliveredAt
              ? { deliveredAt: new Date() }
              : {}),
          },
        });
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: targetStatus,
            actorUserId: user.id,
            actorRole: 'GROWER',
          },
        });
        await createNotification(tx, {
          userId: order.dispensary.userId,
          type: 'ORDER_STATUS_CHANGED',
          title: `Request ${getOrderStatusLabel(targetStatus).toLowerCase()}`,
          body: `Request #${order.orderId} is now ${getOrderStatusLabel(targetStatus)}.`,
          href: `/dispensary/orders/${order.id}`,
        });
      }
      return { count: transitionableOrders.length };
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      updatedOrderIds: transitionableIds,
      skippedCount: skippedOrders.length,
      noOpCount,
      skippedOrders,
      status: status,
    });
  } catch (error) {
    if (error instanceof OrderInventoryError)
      return NextResponse.json(
        { error: error.message, code: error.code, issues: error.issues },
        { status: 409 }
      );
    if (error instanceof OrderConflictError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    console.error('Batch status update error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
