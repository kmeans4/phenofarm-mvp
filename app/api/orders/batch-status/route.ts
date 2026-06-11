import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { OrderStatus } from '@prisma/client';
import {
  canTransitionOrderStatus,
  getInvalidOrderStatusTransitionMessage,
  getOrderStatusLabel,
  isOrderStatus,
  ORDER_STATUS_VALUES,
} from '@/lib/order-workflow';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER') {
      return NextResponse.json(
        { error: 'Forbidden - Grower access only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
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
        { error: `Invalid status. Must be one of: ${ORDER_STATUS_VALUES.join(', ')}` },
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
      select: { id: true, status: true },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found or do not belong to you' },
        { status: 403 }
      );
    }

    const updateData: { status: OrderStatus; shippedAt?: Date | null; deliveredAt?: Date | null } = { 
      status: status as OrderStatus 
    };
    
    // Set timestamps based on status
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const targetStatus = status;
    const transitionableOrders = orders.filter((order) =>
      order.status !== targetStatus && canTransitionOrderStatus(order.status, targetStatus)
    );
    const noOpCount = orders.filter((order) => order.status === targetStatus).length;
    const skippedOrders = orders
      .filter((order) => order.status !== targetStatus && !canTransitionOrderStatus(order.status, targetStatus))
      .map((order) => ({
        id: order.id,
        status: order.status,
        statusLabel: getOrderStatusLabel(order.status),
        reason: getInvalidOrderStatusTransitionMessage(order.status, targetStatus),
      }));

    if (transitionableOrders.length === 0) {
      return NextResponse.json(
        {
          error: skippedOrders.length > 0
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
      if (status === 'CANCELLED') {
        const items = await tx.orderItem.findMany({
          where: { orderId: { in: transitionableIds } },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { inventoryQty: { increment: item.quantity } },
          });
        }

        return tx.order.updateMany({
          where: {
            id: { in: transitionableIds },
            growerId: growerId,
          },
          data: updateData,
        });
      }

      return tx.order.updateMany({
        where: {
          id: { in: transitionableIds },
          growerId: growerId,
        },
        data: updateData,
      });
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
    console.error('Batch status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
