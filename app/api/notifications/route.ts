import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cursor = new URL(request.url).searchParams.get('cursor');
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 21,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
  const hasMore = notifications.length > 20;
  const items = hasMore ? notifications.slice(0, 20) : notifications;
  const orderIdFor = (href: string) => href.match(/^\/(?:grower|dispensary)\/orders\/([^/?#]+)$/)?.[1];
  const orderIds = items.map(item => orderIdFor(item.href)).filter((id): id is string => Boolean(id));
  const orders = orderIds.length ? await db.order.findMany({
    where: { id: { in: orderIds }, OR: [{ grower: { userId: session.user.id } }, { dispensary: { userId: session.user.id } }] },
    select: { id: true, orderId: true, totalAmount: true, grower: { select: { businessName: true, userId: true } }, dispensary: { select: { businessName: true } } },
  }) : [];
  const byOrderId = new Map(orders.map(order => [order.id, order]));

  return NextResponse.json({
    notifications: items.map(item => {
      const order = byOrderId.get(orderIdFor(item.href) || '');
      if (!order) return item;
      const counterpart = order.grower.userId === session.user.id ? order.dispensary.businessName : order.grower.businessName;
      return { ...item, body: `${counterpart} · #${order.orderId.slice(-6)} · $${Number(order.totalAmount).toFixed(2)}` };
    }),
    unreadCount,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { id?: string; markAllRead?: boolean };
  const readAt = new Date();

  if (body.markAllRead) {
    await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt },
    });
    return NextResponse.json({ success: true });
  }

  if (!body.id) return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  await db.notification.updateMany({
    where: { id: body.id, userId: session.user.id },
    data: { readAt },
  });
  return NextResponse.json({ success: true });
}
