import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import { parsePage } from '@/lib/buyer-products';
import { Prisma, OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { unreadMessageCounts } from '@/lib/message-counts';
import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { StatCard } from '@/app/components/ui/StatCard';
import { OrdersTable } from '../components/OrdersTable';

export default async function DispensaryOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { id: string; role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parsePage(params.page ?? null);
  const pageSize = 25;
  const status = params.status && Object.values(OrderStatus).includes(params.status as OrderStatus) ? params.status as OrderStatus : undefined;
  const search = params.search?.trim().slice(0, 160) || '';
  const where: Prisma.OrderWhereInput = { dispensaryId: user.dispensaryId, ...(status ? { status } : {}),
    ...(search ? { OR: [{ orderId: { contains: search, mode: 'insensitive' } }, { grower: { businessName: { contains: search, mode: 'insensitive' } } }] } : {}) };
  const [orders, filteredCount, summaries] = await Promise.all([
    db.order.findMany({ where, select: { id: true, orderId: true, growerId: true, createdAt: true, status: true, totalAmount: true, createdBy: true, buyerAcknowledgedAt: true, grower: { select: { businessName: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
    db.order.count({ where }),
    db.order.groupBy({ by: ['status'], where: { dispensaryId: user.dispensaryId }, _count: { _all: true }, _sum: { totalAmount: true } }),
  ]);
  const pageHref = (next: number) => `/dispensary/orders?${new URLSearchParams({ page: String(next), ...(search ? { search } : {}), ...(status ? { status } : {}) })}`;

  const growerIds = Array.from(new Set(orders.map((order) => order.growerId).filter(Boolean)));
  const conversations = growerIds.length > 0
    ? await db.conversation.findMany({
        where: {
          dispensaryId: user.dispensaryId,
          growerId: { in: growerIds },
        },
        select: {
          id: true,
          growerId: true,
          dispensaryLastReadAt: true,
        },
      })
    : [];
  const unreadByConversation = await unreadMessageCounts(user.id, conversations.map(conversation => ({
    id: conversation.id, lastReadAt: conversation.dispensaryLastReadAt,
  })));
  const unreadGrowerIds = new Set(conversations
    .filter(conversation => (unreadByConversation.get(conversation.id) || 0) > 0)
    .map(conversation => conversation.growerId));

  const serializedOrders = orders.map(order => ({ id: order.id, orderId: order.orderId, status: order.status,
    createdAt: order.createdAt.toISOString(), totalAmount: Number(order.totalAmount), grower: order.grower,
    createdBy: order.createdBy, buyerAcknowledgedAt: order.buyerAcknowledgedAt?.toISOString() ?? null,
    hasUnreadMessages: unreadGrowerIds.has(order.growerId),
  }));
  const totalOrders = summaries.reduce((sum, row) => sum + row._count._all, 0);
  const activeCount = summaries.filter(row => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);
  const pendingCount = summaries.find(row => row.status === 'PENDING')?._count._all ?? 0;
  const trackedOrderValue = summaries.filter(row => row.status !== 'CANCELLED').reduce((sum, row) => sum + Number(row._sum.totalAmount ?? 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        mobileInlineActions
        actions={
          <Button variant="primary" asChild className="w-auto">
            <Link href="/dispensary/catalog">
              Catalog
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Requests" value={totalOrders} />
        <StatCard title="In progress" value={activeCount} valueClassName="text-pf-info" />
        <StatCard title="Awaiting response" value={pendingCount} valueClassName="text-pf-warning" />
        <StatCard
          title="Request value"
          value={`$${trackedOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          valueClassName="text-pf-accent"
        />
      </div>

      {/* Orders List */}
      <Card className="bg-pf-surface shadow-sm border border-pf-line">
        <CardContent className="p-3 sm:p-4">
          <form className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap" action="/dispensary/orders">
            <input name="search" defaultValue={search} aria-label="Search all order requests" placeholder="Search orders" className="col-span-2 min-w-0 flex-1 rounded-lg border border-pf-line-strong p-2 text-base sm:text-sm" />
            <select name="status" defaultValue={status || ''} aria-label="Request status" className="min-w-0 rounded-lg border border-pf-line-strong p-2 text-base sm:text-sm"><option value="">All statuses</option>{Object.values(OrderStatus).map(value => <option key={value} value={value}>{getOrderStatusLabel(value)}</option>)}</select>
            <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-[#032116]">Filter</button>
          </form>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-pf-line-strong bg-pf-canvas px-4 py-8 text-center sm:py-10">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pf-surface flex items-center justify-center">
                <svg className="w-8 h-8 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-pf-text mb-2">No requests yet</h3>
              <p className="mx-auto mb-4 max-w-sm text-sm text-pf-muted">
                Find products in the catalog to start a request.
              </p>
              <Button variant="primary" asChild>
                <Link href="/dispensary/catalog">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Browse catalog
                </Link>
              </Button>
            </div>
          ) : (
            <OrdersTable orders={serializedOrders} showFilters={false} showWorkflowViews={false} showResultCount={false} />
          )}
          <nav aria-label="Request pages" className="mt-4 flex items-center justify-between gap-3 text-sm">
            {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border border-pf-line-strong px-3 py-2">Previous</Link> : <span />}
            <span>{filteredCount} {filteredCount === 1 ? 'request' : 'requests'}{filteredCount > pageSize ? ` · Page ${page}` : ''}</span>
            {page * pageSize < filteredCount ? <Link href={pageHref(page + 1)} className="rounded-lg border border-pf-line-strong px-3 py-2">Next</Link> : <span />}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
