import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  type: 'order' | 'customer' | 'product' | 'sync';
  title: string;
  subtitle: string;
  timestamp: Date | string;
  status?: 'success' | 'pending' | 'error';
}

function ActivityItem({ type, title, subtitle, timestamp, status }: ActivityItemProps) {
  const icons = {
    order: '📦',
    customer: '👤',
    product: '🌱',
    sync: '🔄',
  };

  const colors = {
    order: 'bg-blue-100 text-blue-800',
    customer: 'bg-purple-100 text-purple-800',
    product: 'bg-green-100 text-green-800',
    sync: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors[type]}`}>
        <span className="text-xl">{icons[type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        <p className="text-xs text-gray-400 mt-1">
          {format(timestamp, 'MMM d, h:mm a')}
          {status && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          )}
        </p>
      </div>
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
    <Link href={href} className={`group block p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm ${colors.hoverBg} transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.text} group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
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
    // Recent orders (last 5)
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
      LIMIT 5
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
    totalRevenue: recentOrders.reduce((sum: number, order: { totalAmount: number }) => sum + Number(order.totalAmount), 0),
    activeCustomers: recentCustomers.length,
    pendingOrders: recentOrders.filter((o: { status: string }) => o.status === 'PENDING').length,
    activeProducts: activeProducts[0]?.count || 0,
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Grower Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <div className="flex gap-3">
                    <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors">
            Download Report
          </button>
          <Link href="/grower/products/add" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
            + New Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats.totalOrders} trend="+12%" trendUp={true} />
        <StatCard 
          title="Total Revenue" 
          value={`\u0024${Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend="+8.5%"
          trendUp={true}
        />
        <StatCard title="Active Customers" value={stats.activeCustomers} trend="+3" trendUp={true} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          title="View Product Catalog"
          href="/grower/products"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          description="Browse your inventory and manage products"
          color="blue"
        />
        <QuickAction
          title="Check Metrc Sync"
          href="/grower/metrc-sync"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          description="List a new cannabis product for sale"
          color="green"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview (Last 7 Days)</h2>
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {chartData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t-lg transition-colors ${
                  day.revenue > 0 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-200'
                }`}
                style={{ height: `${Math.min((day.revenue / maxRevenue * 100), 100)}%`, minHeight: '4px' }}
              />
              <span className="text-xs text-gray-500">
                {format(new Date(day.date), 'EEE')}
              </span>
              {day.revenue > 0 && (
                <span className="text-xs font-medium text-gray-700">
                  ${day.revenue.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/grower/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
            View All
          </Link>
        </div>
        <div className="px-6 pb-6">
          {recentOrders.length > 0 ? (
            <div className="space-y-0">
              {recentOrders.map((order: { orderId: string; dispensaryName: string; totalAmount: unknown; status: string; createdAt: Date }) => (
                <ActivityItem
                  key={order.orderId}
                  type="order"
                  title={`Order #${order.orderId}`}
                  subtitle={`From ${order.dispensaryName}`}
                  timestamp={order.createdAt}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No recent orders found</p>
              <Link href="/grower/products" className="text-green-600 hover:text-green-700 mt-2 inline-block">
                Add products to start receiving orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
