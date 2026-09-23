import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const order = await db.order.findFirst({
    where: { id, dispensaryId: session.user.dispensaryId },
    include: {
      grower: { select: { userId: true } },
      dispensary: { select: { isOffPlatform: true } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.createdBy !== 'GROWER' || order.dispensary.isOffPlatform) {
    return NextResponse.json({ error: 'This request does not require buyer confirmation' }, { status: 409 });
  }
  if (order.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only submitted requests can be confirmed' }, { status: 409 });
  }
  if (order.buyerAcknowledgedAt) {
    return NextResponse.json({ success: true, buyerAcknowledgedAt: order.buyerAcknowledgedAt });
  }

  const acknowledgedAt = new Date();
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { buyerAcknowledgedAt: acknowledgedAt },
    });
    await createNotification(tx, {
      userId: order.grower.userId,
      type: 'DIRECT_ORDER_ACKNOWLEDGED',
      title: 'Buyer confirmed request record',
      body: `The buyer confirmed request #${order.orderId}.`,
      href: `/grower/orders/${order.id}`,
    });
  });

  return NextResponse.json({ success: true, buyerAcknowledgedAt: acknowledgedAt });
}
