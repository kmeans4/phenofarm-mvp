import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, OrderStatus } from '@prisma/client';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import {
  getOrderStatusLabel,
  parseOrderRequestNotes,
} from '@/lib/order-workflow';
import {
  reportRange,
  reportOrderDateWhere,
  marketplaceDayStart,
  shiftDateKey,
} from '@/lib/report-range';
const csv = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
};
export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'GROWER' || !session.user.growerId)
    return NextResponse.json(
      { error: 'Please sign in as a grower.' },
      { status: 403 }
    );
  const p = request.nextUrl.searchParams;
  if (
    ['from', 'to'].some(
      (key) => p.get(key) && !marketplaceDayStart(p.get(key)!)
    )
  )
    return NextResponse.json(
      { error: 'Choose valid report dates.' },
      { status: 400 }
    );
  const report = p.get('report') === 'true';
  const q = p.get('q')?.trim().slice(0, 160) || '';
  const range = reportRange({
    range: p.get('range') || 'all',
    from: p.get('from') || undefined,
    to: p.get('to') || undefined,
  });
  const selected = p.get('status')?.toUpperCase();
  const statuses: OrderStatus[] =
    selected === 'DELIVERED' || selected === 'CANCELLED'
      ? [selected]
      : ['DELIVERED', 'CANCELLED'];
  const where: Prisma.OrderWhereInput = {
    growerId: session.user.growerId,
    ...(p.get('dispensary') ? { dispensaryId: p.get('dispensary')! } : {}),
    ...(report
      ? reportOrderDateWhere(range.since, range.until)
      : {
          status: { in: statuses },
          ...(p.get('from') || p.get('to')
            ? {
                updatedAt: {
                  ...(p.get('from')
                    ? { gte: marketplaceDayStart(p.get('from')!) }
                    : {}),
                  ...(p.get('to')
                    ? { lt: marketplaceDayStart(shiftDateKey(p.get('to')!, 1)) }
                    : {}),
                },
              }
            : {}),
        }),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { orderId: { contains: q, mode: 'insensitive' } },
                {
                  dispensary: {
                    businessName: { contains: q, mode: 'insensitive' },
                  },
                },
                {
                  items: {
                    some: {
                      product: { name: { contains: q, mode: 'insensitive' } },
                    },
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };
  const total = await db.order.aggregate({
    where,
    _count: { _all: true },
    _sum: { totalAmount: true },
  });
  const delivered = await db.order.aggregate({
    where: { AND: [where, { status: 'DELIVERED' }] },
    _sum: { totalAmount: true },
  });
  let cursor: string | undefined;
  const encoder = new TextEncoder();
  let first = true;
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        if (first) {
          first = false;
          controller.enqueue(
            encoder.encode(
              [
                ['PhenoShop order report'],
                ['Orders', total._count._all],
                [
                  'Delivered value',
                  Number(delivered._sum.totalAmount || 0).toFixed(2),
                ],
                [
                  'Date basis',
                  report
                    ? 'Delivered date for delivered orders; created date for other orders'
                    : 'Closed date',
                ],
                [],
                [
                  'Order',
                  'Customer',
                  'Status',
                  'Created',
                  'Delivered',
                  'Product',
                  'Quantity',
                  'Unit',
                  'Unit price',
                  'Line total',
                  'Subtotal',
                  'Tax',
                  'Delivery fee',
                  'Order total',
                  'Pricing source',
                  'Settlement / order notes',
                ],
              ]
                .map((r) => r.map(csv).join(','))
                .join('\r\n') + '\r\n'
            )
          );
        }
        const orders = await db.order.findMany({
          where,
          orderBy: { id: 'asc' },
          take: 100,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            dispensary: { select: { businessName: true } },
            items: {
              include: { product: { select: { name: true, unit: true } } },
            },
          },
        });
        if (!orders.length) {
          controller.close();
          return;
        }
        const rows = orders.flatMap((o) =>
          o.items.map((i) => [
            o.orderId,
            o.dispensary.businessName,
            getOrderStatusLabel(o.status),
            o.createdAt.toISOString(),
            o.deliveredAt?.toISOString() || '',
            i.product.name,
            i.quantity,
            i.product.unit,
            Number(i.unitPrice).toFixed(2),
            Number(i.totalPrice).toFixed(2),
            Number(o.subtotal).toFixed(2),
            Number(o.tax).toFixed(2),
            Number(o.shippingFee).toFixed(2),
            Number(o.totalAmount).toFixed(2),
            i.acceptedQuoteId
              ? 'Accepted quote'
              : i.priceOverrideReason || 'List price',
            parseOrderRequestNotes(o.notes).notesText,
          ])
        );
        controller.enqueue(
          encoder.encode(
            rows.map((r) => r.map(csv).join(',')).join('\r\n') + '\r\n'
          )
        );
        cursor = orders[orders.length - 1].id;
        if (orders.length < 100) controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="phenoshop-orders.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
