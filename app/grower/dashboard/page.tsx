import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ActivityFeed } from './ActivityFeed';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  isEmpty?: boolean;
  href: string;
  helperText?: string;
}

function StatCard({ title, value, trend, trendUp, isEmpty, href, helperText }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`group block bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isEmpty ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600">{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
            {trend && !isEmpty && (
              <span className={`text-xs sm:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            )}
          </div>
          {isEmpty ? (
            <p className="text-xs text-gray-400 mt-1">No data yet</p>
          ) : helperText ? (
            <p className="text-xs text-gray-500 mt-1">{helperText}</p>
          ) : null}
        </div>
        <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-green-50 group-hover:text-green-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// Revenue chart empty state component
function RevenueChartEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      title="No revenue data yet"
      description="Start adding products and receiving orders to see your revenue trend here."
    />
  );
}

export default async function GrowerDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch grower dashboard data
  const [recentOrders, recentCustomers, activeProducts] = await Promise.all([
    // Recent orders (last 100 for client-side filtering)
    db.$queryRaw<{ orderId: string; dispensaryName: string; totalAmount: number; status: string; createdAt: Date }[]>`
      SELECT 
        o."orderId",
        d."businessName" as dispensaryName,
        o."totalAmount"::numeric as totalAmount,
        o.status,
        o."createdAt"
      FROM "orders" o
      JOIN "dispensaries" d ON o."dispensaryId" = d.id
      WHERE o."growerId" = ${user.growerId}
      ORDER BY o."createdAt" DESC
      LIMIT 100
    `,
    
    // Recent customers (from orders)
    db.$queryRaw<{ customerId: string; dispensaryName: string; lastOrder: Date; orderCount: number }[]>`
      SELECT 
        d.id as customerId,
        d."businessName",
        MAX(o."createdAt") as lastOrder,
        COUNT(DISTINCT o.id) as orderCount
      FROM "orders" o
      JOIN "dispensaries" d ON o."dispensaryId" = d.id
      WHERE o."growerId" = ${user.growerId}
      GROUP BY d.id, d."businessName"
      ORDER BY MAX(o."createdAt") DESC
      LIMIT 5
    `,

    // Active products count
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count
      FROM "products"
      WHERE "growerId" = ${user.growerId}
    `,
  ]);

  // Fetch revenue for last 7 days
  const revenueData = await db.$queryRaw<{ date: string; revenue: number }[]>`
    SELECT 
      TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
      SUM("totalAmount"::numeric) as revenue
    FROM "orders"
    WHERE "growerId" = ${user.growerId}
      AND "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
    ORDER BY date
  `;

  // Calculate stats
  const stats = {
    totalOrders: recentOrders.length,
    totalRevenue: recentOrders.reduce((sum: number, order: { totalAmount: unknown }) => sum + (Number(order.totalAmount) || 0), 0),
    activeCustomers: recentCustomers.length,
    pendingOrders: recentOrders.filter((o: { status: string }) => o.status === 'PENDING').length,
    activeProducts: activeProducts[0]?.count || 0,
  };

  const hasData = stats.totalOrders > 0 || stats.activeProducts > 0;
  const hasRevenue = revenueData.length > 0 && revenueData.some(d => Number(d.revenue) > 0);

  // Revenue chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'yyyy-MM-dd');
  });

  interface RevenueData {
    date: string;
    revenue: number;
  }

  const chartData = last7Days.map(date => {
    const dayData = revenueData.find((d: RevenueData) => d.date === date);
    return {
      date,
      revenue: dayData ? Number(dayData.revenue) : 0,
    };
  });

  // Calculate max revenue for chart, avoid division by zero
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Serialize orders for client component
  const serializedOrders = recentOrders.map(order => ({
    orderId: order.orderId,
    dispensaryName: order.dispensaryName,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Grower Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Track orders, revenue, and catalog health from one place.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          trend={stats.totalOrders > 0 ? '+12%' : undefined} 
          trendUp={true} 
          isEmpty={stats.totalOrders === 0}
          href="/grower/orders"
          helperText={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending review` : 'View order history'}
        />
        <StatCard 
          title="Total Revenue" 
          value={isNaN(stats.totalRevenue) ? '$0.00' : `\u0024${Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={stats.totalRevenue > 0 ? '+8.5%' : undefined}
          trendUp={true}
          isEmpty={stats.totalRevenue === 0}
          href="/grower/reports"
          helperText="Open revenue reports"
        />
        <StatCard 
          title="Active Customers" 
          value={stats.activeCustomers} 
          trend={stats.activeCustomers > 0 ? '+3' : undefined} 
          trendUp={true} 
          isEmpty={stats.activeCustomers === 0}
          href="/grower/customers"
          helperText={stats.activeCustomers > 0 ? 'Manage dispensary relationships' : 'Add or review customer accounts'}
        />
        <StatCard 
          title="Active Products" 
          value={stats.activeProducts}
          isEmpty={stats.activeProducts === 0}
          href="/grower/products"
          helperText={stats.activeProducts > 0 ? 'Manage your catalog' : 'Start building your catalog'}
        />
      </div>

      {/* Revenue Chart - Improved Mobile Responsiveness */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Overview (Last 7 Days)</h2>
          <span className="text-xs text-gray-400 sm:hidden">← swipe →</span>
        </div>
        {!hasRevenue ? (
          <RevenueChartEmpty />
        ) : (
          <div className="relative">
            {/* Mobile scroll hint - enhanced */}
            <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent pl-4 pr-1">
              <div className="bg-gray-100 rounded-full p-1.5 shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div 
              className="h-40 sm:h-48 md:h-64 flex items-end justify-between gap-1 sm:gap-2 md:gap-3 px-2 sm:px-4 overflow-x-auto pb-2 -mx-3 sm:-mx-0 px-3 sm:px-4 scrollbar-hide snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[40px] sm:min-w-[48px] md:min-w-[60px] snap-center">
                  {/* Bar container with larger touch target */}
                  <div className="w-full flex flex-col items-center justify-end h-28 sm:h-36 md:h-48 group cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-20 hidden sm:block">
                      ${day.revenue.toLocaleString()}
                    </div>
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        day.revenue > 0 
                          ? 'bg-green-500 group-hover:bg-green-600' 
                          : 'bg-gray-200'
                      }`}
                      style={{ height: `${Math.min((day.revenue / maxRevenue * 100), 100)}%`, minHeight: day.revenue > 0 ? '4px' : '2px' }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap font-medium">
                    {format(new Date(day.date), 'EEE')}
                  </span>
                  {/* Revenue label - show on mobile only for larger values */}
                  {day.revenue > 0 && (
                    <span className="text-[9px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                      {day.revenue >= 1000 ? `$${(day.revenue / 1000).toFixed(0)}k` : `$${day.revenue}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity with Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Feed</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Track new orders by timeframe without leaving the dashboard.</p>
          </div>
          <Link href="/grower/orders" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
            View All Orders
          </Link>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <ActivityFeed orders={serializedOrders} />
        </div>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-green-900">🌱 Welcome to PhenoFarm!</h3>
            <p className="text-sm text-green-700 mt-1">You are all set to launch once your first products and orders start coming in.</p>
            <p className="text-xs sm:text-sm text-green-700/90 mt-1">Use the Products area when you are ready to build your catalog and publish listings.</p>
          </div>
        </div>
      )}
    </div>
  );
}
