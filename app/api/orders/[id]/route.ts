import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET a single order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderId = (await context.params).id;

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
      include: {
        dispensary: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update an order
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderId = (await context.params).id;

    // Check if order exists and belongs to grower
    const existingOrder = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, shippedAt } = body;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
    };

    if (status && existingOrder.status !== status) {
      const allowed = validTransitions[existingOrder.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status transition from ${existingOrder.status} to ${status}. Allowed: ${allowed.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update the order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status,
        notes: notes !== undefined ? notes : existingOrder.notes,
        shippedAt: shippedAt !== undefined ? new Date(shippedAt) : existingOrder.shippedAt,
      },
      include: {
        dispensary: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE an order (cancel)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderId = (await context.params).id;

    // Check if order exists and belongs to grower
    const existingOrder = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow cancellation of pending/confirmed orders
    if (!['PENDING', 'CONFIRMED', 'PROCESSING'].includes(existingOrder.status)) {
      return NextResponse.json({ 
        error: 'Cannot cancel order with status: ' + existingOrder.status 
      }, { status: 400 });
    }

    // Update inventory back
    const orderItems = await db.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          inventoryQty: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete the order
    await db.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ message: 'Order cancelled successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
