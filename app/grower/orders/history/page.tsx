import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ExtendedUser } from '@/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../../components/OperationsSummary';
import { formatProductMoney } from '@/lib/product-display';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import Link from 'next/link';
import { Pagination } from '@/app/components/ui/Pagination';

type HistoryStatusFilter = 'all' | 'delivered' | 'cancelled';

export default async function GrowerOrdersHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const params = searchParams ? await searchParams : {};
  const statusFilter: HistoryStatusFilter = params.status === 'delivered' ? 'delivered' : params.status === 'cancelled' ? 'cancelled' : 'all';
  const groups = await db.order.groupBy({ by: ['status'], where: { growerId: user.growerId, status: { in: ['DELIVERED', 'CANCELLED'] } }, _count: { _all: true }, _sum: { totalAmount: true } });
  const deliveredCount = groups.find((group) => group.status === 'DELIVERED')?._count._all || 0;
  const cancelledCount = groups.find((group) => group.status === 'CANCELLED')?._count._all || 0;
  const totalCount = deliveredCount + cancelledCount;
  const deliveredWholesaleValue = Number(groups.find((group) => group.status === 'DELIVERED')?._sum.totalAmount || 0);
  const filteredCount = statusFilter === 'all' ? totalCount : statusFilter === 'delivered' ? deliveredCount : cancelledCount;
  const pageSize = 50;
  const page = Math.min(Math.max(1, Number.parseInt(params.page || '1', 10) || 1), Math.max(1, Math.ceil(filteredCount / pageSize)));
  const filteredOrders = await db.order.findMany({
    where: { growerId: user.growerId, status: { in: statusFilter === 'all' ? ['DELIVERED', 'CANCELLED'] : statusFilter === 'delivered' ? ['DELIVERED'] : ['CANCELLED'] } },
    select: { id: true, orderId: true, status: true, updatedAt: true, totalAmount: true, dispensary: { select: { businessName: true } } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize,
  });
  const filterChips = [
    { key: 'all' as const, label: 'All', href: '/grower/orders/history', count: totalCount },
    { key: 'delivered' as const, label: getOrderStatusLabel('DELIVERED'), href: '/grower/orders/history?status=delivered', count: deliveredCount },
    { key: 'cancelled' as const, label: getOrderStatusLabel('CANCELLED'), href: '/grower/orders/history?status=cancelled', count: cancelledCount },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        mobileInlineActions
        title={<><span className="sm:hidden">History</span><span className="hidden sm:inline">Request history</span></>}
        actions={
          <Link href="/grower/orders" className="shrink-0">
            <Button variant="outline" className="bg-white border-gray-300 hover:bg-gray-50 text-sm">
              <span className="sm:hidden">Active</span><span className="hidden sm:inline">Active requests</span>
            </Button>
          </Link>
        }
      />

      <OperationsSummary items={[{label: 'Requests', value: totalCount}, {label: 'Delivered', value: deliveredCount}, {label: 'Cancelled', value: cancelledCount}, {label: 'Delivered value', value: formatProductMoney(deliveredWholesaleValue)}]} />

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 sm:gap-2" aria-label="Request history status filter">
              {filterChips.map((chip) => {
                const active = statusFilter === chip.key;
                return (
                  <Link
                    key={chip.key}
                    href={chip.href}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2 py-2 sm:gap-2 sm:px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                      active
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
                    }`}>
                      {chip.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {totalCount === 0 ? 'No request history yet' : 'No requests match this filter'}
              </h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                {totalCount === 0
                  ? 'Delivered and cancelled requests will appear here once active requests are closed out.'
                  : 'Switch filters to review another closed request status.'}
              </p>
              {totalCount === 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">Next step: review your active requests and update statuses as they progress.</p>
                  <Link
                    href="/grower/orders"
                    className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    Go to active requests
                  </Link>
                </>
              ) : (
                <Link
                  href="/grower/orders/history"
                  className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  Show all history
                </Link>
              )}
            </div>
          ) : (
            <>
            <div className="space-y-2 sm:hidden">{filteredOrders.map(order => <article key={order.id} className="rounded-xl border border-gray-200 p-3">
              <Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center break-all text-sm font-semibold text-green-700">#{order.orderId}</Link><p className="text-sm text-gray-600">{order.dispensary.businessName}</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><Badge variant={order.status === 'DELIVERED' ? 'success' : 'error'}>{getOrderStatusLabel(order.status)}</Badge><strong className="text-sm">{formatProductMoney(Number(order.totalAmount))}</strong></div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500"><span>{format(order.updatedAt, 'MMM d, yyyy')}</span><Link href={`/grower/orders/${order.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-green-700">View →</Link></div>
            </article>)}</div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Request #</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Customer</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Closed</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Est. value</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="font-medium text-gray-900">#{order.orderId}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                        {order.dispensary.businessName}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                        {format(order.updatedAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <Badge variant={order.status === 'DELIVERED' ? 'success' : 'error'}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <Link 
                          href={`/grower/orders/${order.id}`}
                          className="inline-flex min-h-10 items-center rounded text-xs font-medium text-green-600 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
          <Pagination page={page} pageSize={pageSize} total={filteredCount} basePath="/grower/orders/history" query={statusFilter === 'all' ? {} : { status: statusFilter }} />
        </CardContent>
      </Card>


    </div>
  );
}
