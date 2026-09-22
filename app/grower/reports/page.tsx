import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { formatCalendarMonth } from "@/lib/calendar-month";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AuthSession } from "@/types";
import { ReportsExportActions } from "./ReportsExportActions";
import { getOrderStatusLabel } from "@/lib/order-workflow";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatCard } from "@/app/components/ui/StatCard";

const REPORT_RANGE_OPTIONS = [
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
  { key: 'all', label: 'All' },
] as const;

type ReportRangeKey = (typeof REPORT_RANGE_OPTIONS)[number]['key'];

const REPORT_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function normalizeRange(value?: string): ReportRangeKey {
  return REPORT_RANGE_OPTIONS.some((option) => option.key === value) ? (value as ReportRangeKey) : '90d';
}

function getRangeStart(range: ReportRangeKey) {
  if (range === 'all') return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === '30d') start.setDate(start.getDate() - 30);
  else if (range === '90d') start.setDate(start.getDate() - 90);
  else start.setMonth(start.getMonth() - 12);

  return start;
}

function getStatusHref(status: string) {
  if (status === 'DELIVERED') return '/grower/orders/history?status=delivered';
  if (status === 'CANCELLED') return '/grower/orders/history?status=cancelled';
  return '/grower/orders';
}

function formatRangeForSentence(label: string) {
  return label === 'All' ? 'all time' : label.toLowerCase();
}

export default async function GrowerReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as AuthSession).user;
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const params = searchParams ? await searchParams : {};
  const selectedRange = normalizeRange(params.range);
  const selectedRangeOption = REPORT_RANGE_OPTIONS.find((option) => option.key === selectedRange) || REPORT_RANGE_OPTIONS[1];
  const rangeStart = getRangeStart(selectedRange);
  const rangeSentence = formatRangeForSentence(selectedRangeOption.label);
  const rangeWhere: Prisma.OrderWhereInput = {
    growerId: user.growerId,
    ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
  };

  const sqlRange = rangeStart ? Prisma.sql`AND o."createdAt" >= ${rangeStart}` : Prisma.empty;
  const [statusGroups, customerGroups, recentOrders, monthlyRows, productRows, customerRows] = await Promise.all([
    db.order.groupBy({ by: ['status'], where: rangeWhere, _count: { _all: true }, _sum: { totalAmount: true } }),
    db.order.groupBy({ by: ['dispensaryId'], where: rangeWhere }),
    db.order.findMany({ where: rangeWhere, select: { id: true, orderId: true, status: true, createdAt: true, totalAmount: true, dispensary: { select: { businessName: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 10 }),
    db.$queryRaw<Array<{ month: string; revenue: number }>>(Prisma.sql`
      SELECT to_char(o."createdAt", 'YYYY-MM') AS month, SUM(o."totalAmount")::float AS revenue
      FROM orders o WHERE o."growerId" = ${user.growerId} AND o.status = 'DELIVERED' ${sqlRange}
      GROUP BY 1 ORDER BY 1`),
    db.$queryRaw<Array<{ productName: string; quantity: number; revenue: number }>>(Prisma.sql`
      SELECT p.name AS "productName", SUM(i.quantity)::float AS quantity, SUM(i."totalPrice")::float AS revenue
      FROM order_items i JOIN orders o ON o.id = i."orderId" JOIN products p ON p.id = i."productId"
      WHERE o."growerId" = ${user.growerId} AND o.status = 'DELIVERED' ${sqlRange}
      GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5`),
    db.$queryRaw<Array<{ dispensaryName: string; orderCount: number; revenue: number }>>(Prisma.sql`
      SELECT d."businessName" AS "dispensaryName", COUNT(*)::int AS "orderCount", SUM(o."totalAmount")::float AS revenue
      FROM orders o JOIN dispensaries d ON d.id = o."dispensaryId"
      WHERE o."growerId" = ${user.growerId} AND o.status = 'DELIVERED' ${sqlRange}
      GROUP BY d.id, d."businessName" ORDER BY revenue DESC LIMIT 5`),
  ]);
  const totalOrders = statusGroups.reduce((sum, group) => sum + group._count._all, 0);
  const activeOrders = statusGroups.filter((group) => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(group.status)).reduce((sum, group) => sum + group._count._all, 0);
  const activeCustomers = customerGroups.length;
  const delivered = statusGroups.find((group) => group.status === 'DELIVERED');
  const totalRevenue = Number(delivered?._sum.totalAmount || 0);
  const avgOrderValue = delivered?._count._all ? totalRevenue / delivered._count._all : 0;
  const ordersByStatus = Object.fromEntries(REPORT_STATUSES.map((status) => [status, statusGroups.find((group) => group.status === status)?._count._all || 0]));
  const monthlyRevenue = monthlyRows;
  const topProducts = productRows;
  const topCustomers = customerRows;
  const exportOrders = recentOrders.map((order) => ({
    orderId: order.orderId,
    customer: order.dispensary?.businessName || 'Unknown',
    status: getOrderStatusLabel(order.status),
    date: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
  }));
  const exportMonthlyRevenue = monthlyRevenue.map((month) => ({
    month: month.month,
    revenue: Number(month.revenue),
  }));
  const exportTopProducts = topProducts.map((product) => ({
    productName: product.productName,
    quantity: Number(product.quantity),
    revenue: Number(product.revenue),
  }));
  const exportTopCustomers = topCustomers.map((customer) => ({
    dispensaryName: customer.dispensaryName,
    orderCount: Number(customer.orderCount),
    revenue: Number(customer.revenue),
  }));

  // Status color mapping for improved visual
  const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-blue-500' },
    PROCESSING: { bg: 'bg-purple-100', text: 'text-purple-800', bar: 'bg-purple-500' },
    SHIPPED: { bg: 'bg-indigo-100', text: 'text-indigo-800', bar: 'bg-indigo-500' },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reports"
        mobileInlineActions
        actions={
          <ReportsExportActions
            summary={{
              totalRevenue,
              totalOrders,
              activeOrders,
              activeCustomers,
              avgOrderValue,
            }}
            rangeLabel={selectedRangeOption.label}
            monthlyRevenue={exportMonthlyRevenue}
            topProducts={exportTopProducts}
            topCustomers={exportTopCustomers}
            recentOrders={exportOrders}
          />
        }
      />

      <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <p className="sr-only sm:not-sr-only text-sm font-medium text-gray-700">Date range</p>
        <div className="flex flex-wrap gap-2" aria-label="Report date range">
          {REPORT_RANGE_OPTIONS.map((option) => {
            const active = selectedRange === option.key;
            const href = option.key === '90d' ? '/grower/reports' : `/grower/reports?range=${option.key}`;
            return (
              <Link
                key={option.key}
                href={href}
                aria-label={option.label}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.key === '12m' ? '12mo' : option.key === 'all' ? 'All' : option.key}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Key Metrics - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          compact
          title="Delivered value"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          helperText={`${delivered?._count._all || 0} delivered request${delivered?._count._all === 1 ? '' : 's'}`}
          className="border-green-200 bg-green-50"
          valueClassName="text-green-700 sm:text-3xl"
        />
        <StatCard compact title="Requests" value={totalOrders} helperText={`${activeOrders} active`} valueClassName="sm:text-3xl" />
        <StatCard compact title="Customers" value={activeCustomers} valueClassName="sm:text-3xl" />
        <StatCard compact title="Avg. delivered value" value={`$${avgOrderValue.toFixed(2)}`} valueClassName="sm:text-3xl" />
      </div>

      {/* Charts Row - Improved Mobile Responsiveness */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly delivered value chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Delivered value by month</h2>
            {monthlyRevenue.length > 6 && <span className="text-xs text-gray-400 sm:hidden">← swipe →</span>}
          </div>
          {monthlyRevenue.length > 0 ? (
            <div className="relative">
              {monthlyRevenue.length <= 3 && (
                <div className="space-y-3 sm:hidden">
                  {monthlyRevenue.map((month) => {
                    const revenue = Number(month.revenue);
                    const maxRevenue = Math.max(...monthlyRevenue.map((row) => Number(row.revenue)));
                    return (
                      <div key={month.month}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                          <span className="text-gray-600">{formatCalendarMonth(month.month)}</span>
                          <span className="font-semibold text-green-700">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${maxRevenue > 0 ? revenue / maxRevenue * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Mobile scroll hint - enhanced */}
              {monthlyRevenue.length > 6 && <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent pl-4 pr-1">
                <div className="bg-gray-100 rounded-full p-1.5 shadow-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>}
              <div 
                className={`h-40 ${monthlyRevenue.length <= 3 ? 'hidden sm:flex' : 'flex'} items-end justify-start gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:-mx-0 px-3 sm:px-2 scrollbar-hide snap-x snap-mandatory`}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {monthlyRevenue.map((month, idx) => {
                  const maxRevenue = Math.max(...monthlyRevenue.map(m => Number(m.revenue)));
                  const revenue = Number(month.revenue);
                  const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                  const monthLabel = formatCalendarMonth(month.month);
                  const monthTitle = formatCalendarMonth(month.month, true);
                  if (!monthLabel) return null;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[44px] max-w-[88px] sm:min-w-[52px] snap-center">
                      <div className="w-full flex flex-col items-center justify-end h-24 group cursor-pointer">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-20 hidden sm:block">
                          ${revenue.toLocaleString()}
                        </div>
                        <div 
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                          title={`${monthTitle}: $${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                        {monthLabel}
                      </span>
                      {revenue > 0 && (
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                          {revenue >= 1000 ? `$${(revenue / 1000).toFixed(0)}k` : `$${revenue}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-36 sm:h-48 flex flex-col items-center justify-center px-4 text-center text-sm">
              <p className="font-medium text-gray-900">
                {totalOrders > 0 ? 'No delivered request value in this range' : 'No request value yet'}
              </p>
              <p className="mt-1 max-w-sm text-gray-500">
                {totalOrders > 0
                  ? `The trend uses delivered requests in ${rangeSentence}; submitted, ready, and cancelled requests are excluded.`
                  : 'Delivered requests will appear here after buyers submit requests and fulfillment is complete.'}
              </p>
              <Link href={totalOrders > 0 ? '/grower/orders' : '/grower/products/add'} className="mt-3 text-sm font-medium text-green-700 hover:text-green-800">
                {totalOrders > 0 ? 'Review requests' : 'Add product'}
              </Link>
            </div>
          )}
        </div>

        {/* Requests by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Requests by Status</h2>
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(ordersByStatus).filter(([, count]) => count > 0).map(([status, count]) => {
              const total = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const colors = statusColors[status];
              const statusLabel = getOrderStatusLabel(status);
              return (
                <Link
                  key={status}
                  href={getStatusHref(status)}
                  className="group block rounded-lg p-2 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  aria-label={`View ${statusLabel} requests`}
                >
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors?.bar || 'bg-gray-500'}`} />
                      <span className="text-gray-600 group-hover:text-gray-900">{statusLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count}</span>
                      <span className="text-gray-400 text-xs">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors?.bar || 'bg-gray-500'} rounded-full transition-all duration-500 group-hover:opacity-80`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          {Object.values(ordersByStatus).some((count) => count === 0) && (
            <details className="mt-3 text-sm">
              <summary className="min-h-10 cursor-pointer py-2 text-gray-500">Empty statuses</summary>
              <div className="flex flex-wrap gap-2 py-2">
                {Object.entries(ordersByStatus).filter(([, count]) => count === 0).map(([status]) => (
                  <Link key={status} href={getStatusHref(status)} className="rounded-lg border px-3 py-2 text-gray-600">{getOrderStatusLabel(status)} · 0</Link>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Top Products & Customers - Responsive Grid */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold">Top Products</h2>
          </div>
          {topProducts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topProducts.map((product, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.productName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-green-600 text-sm sm:text-base">${Number(product.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{product.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-sm">
              <p className="font-medium text-gray-900">No delivered product value yet</p>
              <p className="mx-auto mt-1 max-w-sm text-gray-500">
                Product rankings include only line items from delivered requests in {rangeSentence}.
              </p>
              <Link href="/grower/catalog" className="mt-3 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
                Open catalog workspace
              </Link>
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold">Top Customers</h2>
          </div>
          {topCustomers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{customer.dispensaryName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-green-600 text-sm sm:text-base">${Number(customer.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{customer.orderCount} request{Number(customer.orderCount) === 1 ? '' : 's'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-sm">
              <p className="font-medium text-gray-900">No delivered customer value yet</p>
              <p className="mx-auto mt-1 max-w-sm text-gray-500">
                Customer rankings are based on delivered request value in {rangeSentence}.
              </p>
              <Link href="/grower/orders" className="mt-3 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
                View request history
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold">Recent Requests</h2>
          <Link href="/grower/orders" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 sm:p-12 text-center text-sm">
            <p className="font-medium text-gray-900">No requests yet</p>
            <p className="mx-auto mt-1 max-w-sm text-gray-500">
              Requests created in {rangeSentence} will appear here before they count toward delivered request value.
            </p>
            <Link href="/grower/catalog" className="mt-3 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
              Open catalog workspace
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Request</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Customer</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-medium text-gray-500 uppercase">Est. value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm">
                      <Link href={`/grower/orders/${order.id}`} className="block max-w-[150px] whitespace-normal text-green-700 hover:underline sm:hidden">
                        {order.dispensary?.businessName || 'Unknown'}
                        <span className="mt-1 block text-xs font-normal text-gray-500">{format(order.createdAt, 'MMM d')} · #{order.orderId.slice(-6)}</span>
                      </Link>
                      <span className="hidden sm:inline">#{order.orderId.slice(-8)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      {order.dispensary?.businessName || 'Unknown'}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] sm:text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {format(order.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600 text-right">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
