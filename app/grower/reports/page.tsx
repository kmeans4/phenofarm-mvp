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
    PENDING: { bg: 'bg-pf-warning-bg', text: 'text-pf-warning', bar: 'bg-pf-warning' },
    CONFIRMED: { bg: 'bg-pf-info-bg', text: 'text-pf-info', bar: 'bg-pf-info' },
    PROCESSING: { bg: 'bg-pf-purple-bg', text: 'text-pf-purple', bar: 'bg-pf-purple' },
    SHIPPED: { bg: 'bg-pf-purple-bg', text: 'text-pf-purple', bar: 'bg-pf-purple' },
    DELIVERED: { bg: 'bg-pf-accent-bg', text: 'text-pf-accent', bar: 'bg-pf-accent' },
    CANCELLED: { bg: 'bg-pf-danger-bg', text: 'text-pf-danger', bar: 'bg-pf-danger' },
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

      <div className="flex items-center justify-between gap-2 rounded-lg border border-pf-line bg-pf-surface p-2 shadow-sm">
        <p className="sr-only sm:not-sr-only text-sm font-medium text-pf-secondary">Date range</p>
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
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-pf-accent-bg text-pf-accent ring-1 ring-inset ring-pf-accent-line'
                    : 'bg-pf-canvas text-pf-secondary hover:bg-pf-surface'
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
          className="border-pf-accent-line bg-pf-accent-bg"
          valueClassName="text-pf-accent sm:text-3xl"
        />
        <StatCard compact title="Requests" value={totalOrders} helperText={`${activeOrders} active`} valueClassName="sm:text-3xl" />
        <StatCard compact title="Customers" value={activeCustomers} valueClassName="sm:text-3xl" />
        <StatCard compact title="Avg. delivered value" value={`$${avgOrderValue.toFixed(2)}`} valueClassName="sm:text-3xl" />
      </div>

      {/* Charts Row - Improved Mobile Responsiveness */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly delivered value chart */}
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Delivered value by month</h2>
            {monthlyRevenue.length > 6 && <span className="text-xs text-pf-muted sm:hidden">← swipe →</span>}
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
                          <span className="text-pf-muted">{formatCalendarMonth(month.month)}</span>
                          <span className="font-semibold text-pf-accent">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-pf-surface" aria-hidden="true">
                          <div className="h-full rounded-full bg-pf-accent" style={{ width: `${maxRevenue > 0 ? revenue / maxRevenue * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Mobile scroll hint - enhanced */}
              {monthlyRevenue.length > 6 && <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none bg-gradient-to-l from-pf-surface via-pf-surface/80 to-transparent pl-4 pr-1">
                <div className="bg-pf-surface rounded-full p-1.5 shadow-sm">
                  <svg className="w-4 h-4 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 bg-pf-raised text-pf-text text-xs rounded whitespace-nowrap z-20 hidden sm:block">
                          ${revenue.toLocaleString()}
                        </div>
                        <div 
                          className="w-full bg-pf-accent rounded-t hover:bg-pf-accent/80 transition-colors"
                          title={`${monthTitle}: $${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className="text-xs text-pf-muted whitespace-nowrap font-medium">
                        {monthLabel}
                      </span>
                      {revenue > 0 && (
                        <span className="text-xs font-medium text-pf-muted whitespace-nowrap">
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
              <p className="font-medium text-pf-text">
                {totalOrders > 0 ? 'No delivered request value in this range' : 'No request value yet'}
              </p>
              <p className="mt-1 max-w-sm text-pf-muted">
                {totalOrders > 0
                  ? `The trend uses delivered requests in ${rangeSentence}; submitted, ready, and cancelled requests are excluded.`
                  : 'Delivered requests will appear here after buyers submit requests and fulfillment is complete.'}
              </p>
              <Link href={totalOrders > 0 ? '/grower/orders' : '/grower/products/add'} className="mt-3 text-sm font-medium text-pf-accent hover:text-pf-accent">
                {totalOrders > 0 ? 'Review requests' : 'Add product'}
              </Link>
            </div>
          )}
        </div>

        {/* Requests by status */}
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Requests by status</h2>
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
                  className="group block rounded-lg p-2 transition-colors hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                  aria-label={`View ${statusLabel} requests`}
                >
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors?.bar || 'bg-pf-hover'}`} />
                      <span className="text-pf-muted group-hover:text-pf-text">{statusLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count}</span>
                      <span className="text-pf-muted text-xs">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 sm:h-2.5 bg-pf-surface rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors?.bar || 'bg-pf-hover'} rounded-full transition-all duration-500 group-hover:opacity-80`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          {Object.values(ordersByStatus).some((count) => count === 0) && (
            <details className="mt-3 text-sm">
              <summary className="min-h-10 cursor-pointer py-2 text-pf-muted">Empty statuses</summary>
              <div className="flex flex-wrap gap-2 py-2">
                {Object.entries(ordersByStatus).filter(([, count]) => count === 0).map(([status]) => (
                  <Link key={status} href={getStatusHref(status)} className="rounded-lg border border-pf-line px-3 py-2 text-pf-muted hover:bg-pf-hover">{getOrderStatusLabel(status)} · 0</Link>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Top products & Customers - Responsive Grid */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top products */}
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-pf-line">
            <h2 className="text-base sm:text-lg font-semibold">Top products</h2>
          </div>
          {topProducts.length > 0 ? (
            <div className="divide-y divide-pf-line">
              {topProducts.map((product, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-pf-accent-bg text-pf-accent text-xs sm:text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-pf-text text-sm sm:text-base truncate">{product.productName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-pf-accent text-sm sm:text-base">${Number(product.revenue).toLocaleString()}</p>
                    <p className="text-xs text-pf-muted">{product.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-sm">
              <p className="font-medium text-pf-text">No delivered product value yet</p>
              <p className="mx-auto mt-1 max-w-sm text-pf-muted">
                Product rankings include only line items from delivered requests in {rangeSentence}.
              </p>
              <Link href="/grower/catalog" className="mt-3 inline-flex text-sm font-medium text-pf-accent hover:text-pf-accent">
                Open catalog workspace
              </Link>
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-pf-line">
            <h2 className="text-base sm:text-lg font-semibold">Top customers</h2>
          </div>
          {topCustomers.length > 0 ? (
            <div className="divide-y divide-pf-line">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-pf-info-bg text-pf-info text-xs sm:text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-pf-text text-sm sm:text-base truncate">{customer.dispensaryName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-pf-accent text-sm sm:text-base">${Number(customer.revenue).toLocaleString()}</p>
                    <p className="text-xs text-pf-muted">{customer.orderCount} request{Number(customer.orderCount) === 1 ? '' : 's'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-sm">
              <p className="font-medium text-pf-text">No delivered customer value yet</p>
              <p className="mx-auto mt-1 max-w-sm text-pf-muted">
                Customer rankings are based on delivered request value in {rangeSentence}.
              </p>
              <Link href="/grower/orders" className="mt-3 inline-flex text-sm font-medium text-pf-accent hover:text-pf-accent">
                View request history
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent requests Table */}
      <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-pf-line flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold">Recent requests</h2>
          <Link href="/grower/orders" className="text-xs sm:text-sm text-pf-accent hover:text-pf-accent font-medium">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-5 sm:p-8 text-center text-sm">
            <p className="font-medium text-pf-text">No requests yet</p>
            <p className="mx-auto mt-1 max-w-sm text-pf-muted">
              Requests created in {rangeSentence} will appear here before they count toward delivered request value.
            </p>
            <Link href="/grower/catalog" className="mt-3 inline-flex text-sm font-medium text-pf-accent hover:text-pf-accent">
              Open catalog workspace
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="min-w-full divide-y divide-pf-line">
              <thead className="bg-pf-canvas">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-pf-muted uppercase">Request</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-pf-muted uppercase hidden sm:table-cell">Customer</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-pf-muted uppercase">Status</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-pf-muted uppercase hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-medium text-pf-muted uppercase">Est. value</th>
                </tr>
              </thead>
              <tbody className="bg-pf-surface divide-y divide-pf-line">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-pf-canvas">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-medium text-pf-text text-xs sm:text-sm">
                      <Link href={`/grower/orders/${order.id}`} className="block max-w-[150px] whitespace-normal text-pf-accent hover:underline sm:hidden">
                        {order.dispensary?.businessName || 'Unknown'}
                        <span className="mt-1 block text-xs font-normal text-pf-muted">{format(order.createdAt, 'MMM d')} · #{order.orderId.slice(-6)}</span>
                      </Link>
                      <span className="hidden sm:inline">#{order.orderId.slice(-8)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-pf-muted hidden sm:table-cell">
                      {order.dispensary?.businessName || 'Unknown'}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] sm:text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-pf-accent-bg text-pf-accent' :
                        order.status === 'PENDING' ? 'bg-pf-warning-bg text-pf-warning' :
                        order.status === 'CANCELLED' ? 'bg-pf-danger-bg text-pf-danger' :
                        'bg-pf-surface text-pf-secondary'
                      }`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-pf-muted hidden md:table-cell">
                      {format(order.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-pf-accent text-right">
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
