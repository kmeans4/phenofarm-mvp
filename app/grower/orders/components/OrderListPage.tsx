import { signInDestination } from '@/lib/auth-navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import type { Prisma, OrderStatus } from '@prisma/client';
import Link from 'next/link';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { Button } from '@/app/components/ui/Button';
import { Pagination } from '@/app/components/ui/Pagination';
import { marketplaceDayStart, shiftDateKey } from '@/lib/report-range';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import OrdersList from './OrdersList';
import { OrderFilters } from './OrderFilters';
export type OrderListParams = {
  dispensary?: string;
  page?: string;
  view?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
};
export async function OrderListPage({
  params,
  history = false,
}: {
  params: OrderListParams;
  history?: boolean;
}) {
  const session = await getAuthSession();
  if (!session) redirect(await signInDestination());
  if (session.user.role !== 'GROWER' || !session.user.growerId)
    redirect('/dashboard');
  const statuses: OrderStatus[] = history
    ? ['DELIVERED', 'CANCELLED']
    : ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
  const requested =
    params.view === 'needs-review' ? 'PENDING' : params.status?.toUpperCase();
  const status = statuses.includes(requested as OrderStatus)
    ? (requested as OrderStatus)
    : null;
  const q = params.q?.trim().slice(0, 160) || '';
  const where: Prisma.OrderWhereInput = {
    growerId: session.user.growerId,
    ...(params.dispensary ? { dispensaryId: params.dispensary } : {}),
    ...(q
      ? {
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
        }
      : {}),
    ...(history && (params.from || params.to)
      ? {
          updatedAt: {
            ...(params.from && marketplaceDayStart(params.from)
              ? { gte: marketplaceDayStart(params.from) }
              : {}),
            ...(params.to && marketplaceDayStart(params.to)
              ? { lt: marketplaceDayStart(shiftDateKey(params.to, 1)) }
              : {}),
          },
        }
      : {}),
  };
  const groups = await db.order.groupBy({
    by: ['status'],
    where: { ...where, status: { in: statuses } },
    _count: { _all: true },
  });
  const total = groups
    .filter((g) => !status || g.status === status)
    .reduce((n, g) => n + g._count._all, 0);
  const pageSize = 50;
  const page = Math.min(
    Math.max(1, Number(params.page) || 1),
    Math.max(1, Math.ceil(total / pageSize))
  );
  const rows = await db.order.findMany({
    where: { ...where, status: status || { in: statuses } },
    select: {
      id: true,
      orderId: true,
      status: true,
      createdAt: true,
      totalAmount: true,
      dispensary: { select: { businessName: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const basePath = history ? '/grower/orders/history' : '/grower/orders';
  const query = Object.fromEntries(
    Object.entries({
      q,
      dispensary: params.dispensary,
      from: params.from,
      to: params.to,
      status: status || undefined,
    }).filter(([, v]) => Boolean(v))
  ) as Record<string, string>;
  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={history ? 'Order history' : 'Orders'}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link
                href={
                  history
                    ? `/grower/orders${params.dispensary ? `?dispensary=${params.dispensary}` : ''}`
                    : `/grower/orders/history${params.dispensary ? `?dispensary=${params.dispensary}` : ''}`
                }
              >
                {history ? 'Active orders' : 'History'}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/grower/orders/add">Record order</Link>
            </Button>
          </>
        }
      />
      <OrderFilters history={history} initialSearch={q} />
      <nav aria-label="Order status" className="flex flex-wrap gap-2">
        {[null, ...statuses].map((key) => (
          <Link
            key={key || 'all'}
            href={`${basePath}?${new URLSearchParams({ ...query, status: key || '' })}`}
            aria-current={key === status ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${key === status ? 'border-pf-accent-line bg-pf-accent-bg text-pf-accent' : 'border-pf-line'}`}
          >
            {key ? getOrderStatusLabel(key) : 'All'}{' '}
            <span>
              {groups
                .filter((g) => !key || g.status === key)
                .reduce((n, g) => n + g._count._all, 0)}
            </span>
          </Link>
        ))}
      </nav>
      {history && (
        <Button variant="outline" asChild>
          <a href={`/api/orders/export?${new URLSearchParams(query)}`}>
            Export all matching orders
          </a>
        </Button>
      )}
      <OrdersList
        history={history}
        initialOrders={rows.map((x) => ({
          ...x,
          totalAmount: Number(x.totalAmount),
          createdAt: x.createdAt.toISOString(),
        }))}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath={basePath}
        query={query}
      />
    </div>
  );
}
