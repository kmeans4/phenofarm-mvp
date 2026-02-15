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
}

function StatCard({ title, value, trend, trendUp, isEmpty }: StatCardProps) {
  return (
    <div className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${isEmpty ? 'opacity-75' : ''}`}>
      <p className="text-xs sm:text-sm text-gray-600">{title}</p>
      <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        {trend && !isEmpty && (
          <span className={`text-xs sm:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      {isEmpty && (
        <p className="text-xs text-gray-400 mt-1">No data yet</p>
      )}
    </div>
  );
}

interface QuickActionProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

function QuickAction({ title, href, icon, description, color }: QuickActionProps) {
  const colorMap: Record<string, { bg: string; text: string; hoverBg: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hoverBg: 'hover:bg-green-50' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', hoverBg: 'hover:bg-yellow-50' },
    red: { bg: 'bg-red-100', text: 'text-red-600', hoverBg: 'hover:bg-red-50' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <Link href={href} className={`group block p-4 sm:p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm ${colors.hoverBg} transition-all touch-manipulation`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 rounded-lg ${colors.bg} ${colors.text} group-hover:scale-105 transition-transform flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 text-sm sm:text-base truncate">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        </div>
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
      action={{ label: 'Add Your First Product', href: '/grower/products/add' }}
    />
  );
}

export default async function GrowerDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch grower dashboard data
  const [recentOrders, recentCustomers, activeProducts, syncStatus] = await Promise.all([
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

    // Latest sync status
    db.$queryRaw<{ success: boolean; recordsSynced: number; errorMessage: string | null; createdAt: Date }[]>`
      SELECT "success", "recordsSynced", "errorMessage", "createdAt"
      FROM "metrc_sync_logs"
      WHERE "growerId" = ${user.growerId}
      ORDER BY "createdAt" DESC
      LIMIT 1
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

  // Get sync status
  const latestSync = syncStatus[0];
  const syncStatusDisplay = latestSync 
    ? latestSync.success 
      ? { status: 'success', message: `Last sync: ${format(latestSync.createdAt, 'MMM d, h:mm a')}` }
      : { status: 'error', message: latestSync.errorMessage || 'Sync failed' }
    : { status: 'pending', message: 'Never synced' };

  const statusColor = syncStatusDisplay.status === 'success' ? 'green' :
                      syncStatusDisplay.status === 'error' ? 'red' : 'yellow';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Grower Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium transition-colors">
            Download Report
          </button>
          <Link href="/grower/products/add" className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium transition-colors text-center">
            + New Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          trend={stats.totalOrders > 0 ? "+12%" : undefined} 
          trendUp={true} 
          isEmpty={stats.totalOrders === 0}
        />
        <StatCard 
          title="Total Revenue" 
          value={isNaN(stats.totalRevenue) ? '$0.00' : `\u0024${Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={stats.totalRevenue > 0 ? "+8.5%" : undefined}
          trendUp={true}
          isEmpty={stats.totalRevenue === 0}
        />
        <StatCard 
          title="Active Customers" 
          value={stats.activeCustomers} 
          trend={stats.activeCustomers > 0 ? "+3" : undefined} 
          trendUp={true} 
          isEmpty={stats.activeCustomers === 0}
        />
        <StatCard 
          title="Active Products" 
          value={stats.activeProducts}
          isEmpty={stats.activeProducts === 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <QuickAction
          title="View Product Catalog"
          href="/grower/products"
          icon={
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          description={stats.activeProducts > 0 ? `${stats.activeProducts} active products` : "No products yet — add your first one"}
          color="blue"
        />
        <QuickAction
          title="Check Metrc Sync"
          href="/grower/metrc-sync"
          icon={
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          description={syncStatusDisplay.message}
          color={statusColor}
        />
        <QuickAction
          title="Add New Product"
          href="/grower/products/add"
          icon={
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          description="List a new cannabis product for sale"
          color="green"
        />
      </div>

      {/* Revenue Chart - Improved Mobile Responsiveness */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Feed</h2>
          <Link href="/grower/orders" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
            View All Orders
          </Link>
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <ActivityFeed orders={serializedOrders} />
        </div>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-green-900">🌱 Welcome to PhenoFarm!</h3>
              <p className="text-sm text-green-700 mt-1">Get started by adding your first product to your catalog.</p>
            </div>
            <Link 
              href="/grower/products/add" 
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors text-center whitespace-nowrap"
            >
              Add First Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
