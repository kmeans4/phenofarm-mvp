import { signInDestination } from '@/lib/auth-navigation';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { customerWhere } from '@/lib/customers';
import { formatMoney, formatDate } from '@/lib/format';
import {
  getOrderStatusLabel,
  parseOrderRequestNotes,
  isOrderStatus,
} from '@/lib/order-workflow';
import {
  marketplaceDateKey,
  shiftDateKey,
  marketplaceDayStart,
  reportOrderDateWhere,
} from '@/lib/report-range';
import { StatementCsvExport } from './StatementCsvExport';
export default async function CustomerStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect(await signInDestination());
  const user = session.user;
  if (user.role !== 'GROWER' || !user.growerId) redirect('/dashboard');
  const { id } = await params;
  const filters = await searchParams;
  const customer = await db.dispensary.findFirst({
    where: { id, ...customerWhere(user.growerId) },
    select: { businessName: true },
  });
  if (!customer) notFound();
  const status =
    filters.status === 'all'
      ? undefined
      : isOrderStatus(filters.status)
        ? filters.status
        : 'DELIVERED';
  const from = filters.from ? marketplaceDayStart(filters.from) : undefined;
  const until =
    filters.to && marketplaceDayStart(filters.to)
      ? marketplaceDayStart(shiftDateKey(filters.to, 1))
      : undefined;
  const orders = await db.order.findMany({
    where: {
      growerId: user.growerId,
      dispensaryId: id,
      ...(status ? { status } : {}),
      ...reportOrderDateWhere(from, until),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
  });
  const total = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((n, o) => n + Number(o.totalAmount), 0);
  const today = marketplaceDateKey();
  const month = today.slice(0, 7) + '-01';
  const prior = new Date(`${month}T12:00:00Z`);
  prior.setUTCMonth(prior.getUTCMonth() - 1);
  const presets = [
    ['This month', month, today],
    ['Last month', prior.toISOString().slice(0, 10), shiftDateKey(month, -1)],
    ['90 days', shiftDateKey(today, -89), today],
    ['Year', today.slice(0, 4) + '-01-01', today],
  ];
  const rows = [
    [
      'Order',
      'Date',
      'Status',
      'Product',
      'Quantity',
      'Unit',
      'Unit price',
      'Line total',
      'Order total',
      'Notes',
    ],
    ...orders.flatMap((o) =>
      o.items.map((i) => [
        o.orderId,
        formatDate(o.deliveredAt || o.createdAt),
        getOrderStatusLabel(o.status),
        i.product.name,
        String(i.quantity),
        i.product.unit,
        Number(i.unitPrice).toFixed(2),
        Number(i.totalPrice).toFixed(2),
        Number(o.totalAmount).toFixed(2),
        parseOrderRequestNotes(o.notes).notesText,
      ])
    ),
  ];
  const content = (
    <>
      <PageHeader
        title="Statement"
        description={customer.businessName}
        actions={
          <StatementCsvExport name={customer.businessName} rows={rows} />
        }
      />
      <p className="text-sm">
        {status ? getOrderStatusLabel(status) : 'All statuses'} ·{' '}
        {orders.length} orders · {formatMoney(total)} (excludes cancelled value)
      </p>
      <section className="divide-y divide-pf-line rounded-xl border border-pf-line bg-pf-surface">
        {orders.length ? (
          orders.map((o) => (
            <article key={o.id} className="p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-pf-accent"
                  href={`/grower/orders/${o.id}`}
                >
                  #{o.orderId}
                </Link>
                <strong>{formatMoney(Number(o.totalAmount))}</strong>
              </div>
              <p className="text-pf-muted">
                {formatDate(o.deliveredAt || o.createdAt)} ·{' '}
                {getOrderStatusLabel(o.status)}
              </p>
              <p className="mt-2">
                {o.items
                  .map((i) => `${i.product.name} × ${i.quantity}`)
                  .join(', ')}
              </p>
              {parseOrderRequestNotes(o.notes).notesText && (
                <p className="mt-2 whitespace-pre-wrap">
                  {parseOrderRequestNotes(o.notes).notesText}
                </p>
              )}
            </article>
          ))
        ) : (
          <p className="p-6 text-center text-sm">No orders in this range.</p>
        )}
      </section>
    </>
  );
  return (
    <div className="space-y-4">
      <Link
        href={`/grower/customers/${id}`}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Customer
      </Link>
      <nav className="flex flex-wrap gap-2" aria-label="Statement range">
        {presets.map(([label, start, end]) => (
          <Link
            key={label}
            href={`?${new URLSearchParams({ from: start, to: end, status: status || 'all' })}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-pf-line px-3 text-sm"
          >
            {label}
          </Link>
        ))}
      </nav>
      <form className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          From
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className="mt-1 block min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className="mt-1 block min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
          />
        </label>
        <label className="text-sm">
          Status
          <select
            name="status"
            defaultValue={status || 'all'}
            className="mt-1 block min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
          >
            <option value="DELIVERED">Delivered</option>
            <option value="all">All statuses</option>
            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'].map(
              (s) => (
                <option key={s} value={s}>
                  {getOrderStatusLabel(s)}
                </option>
              )
            )}
          </select>
        </label>
        <button className="min-h-11 rounded-lg bg-emerald-500 px-4 text-sm text-[#032116]">
          Apply
        </button>
      </form>
      {content}
      <div className="order-print-summary">{content}</div>
    </div>
  );
}
