import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { format } from "date-fns";

export default async function GrowerReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string; growerId?: string };
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  // Fetch real stats from database
  const [
    totalOrders,
    activeOrders,
    allOrders,
    dispensaries,
  ] = await Promise.all([
    db.order.count({ where: { growerId: user.growerId } }),
    db.order.count({ 
      where: { 
        growerId: user.growerId,
        status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
      } 
    }),
    db.order.findMany({
      where: { growerId: user.growerId },
      include: { dispensary: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.dispensary.count(),
  ]);

  // Calculate revenue from completed orders
  const completedOrders = allOrders.filter(o => o.status === 'DELIVERED');
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount), 
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get orders by status for the chart
  const ordersByStatus = {
    PENDING: allOrders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: allOrders.filter(o => o.status === 'CONFIRMED').length,
    PROCESSING: allOrders.filter(o => o.status === 'PROCESSING').length,
    SHIPPED: allOrders.filter(o => o.status === 'SHIPPED').length,
    DELIVERED: allOrders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: allOrders.filter(o => o.status === 'CANCELLED').length,
  };

  // Get monthly revenue data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  let monthlyRevenue: { month: string; revenue: number }[] = [];
  try {
    const rawRevenue = await db.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM("totalAmount"::numeric) as revenue
      FROM "orders"
      WHERE "growerId" = ${user.growerId}
        AND status = 'DELIVERED'
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month
    `;
    // Filter out any null months from raw SQL results
    monthlyRevenue = (rawRevenue || []).filter(m => m && m.month);
  } catch (e) {
    console.error('Error fetching monthly revenue:', e);
    monthlyRevenue = [];
  }

  // Get top products by orders
  let topProducts: { productName: string; quantity: number; revenue: number }[] = [];
  try {
    const rawProducts = await db.$queryRaw<{ productName: string; quantity: number; revenue: number }[]>`
      SELECT 
        p.name as "productName",
        SUM(oi.quantity)::int as quantity,
        SUM(oi."totalPrice"::numeric)::numeric as revenue
      FROM "orderItems" oi
      JOIN "orders" o ON oi."orderId" = o.id
      JOIN "products" p ON oi."productId" = p.id
      WHERE o."growerId" = ${user.growerId}
        AND o.status = 'DELIVERED'
      GROUP BY p.name
      ORDER BY revenue DESC
      LIMIT 5
    `;
    topProducts = (rawProducts || []).filter(p => p && p.productName);
  } catch (e) {
    console.error('Error fetching top products:', e);
    topProducts = [];
  }

  // Get top customers
  let topCustomers: { dispensaryName: string; orderCount: number; revenue: number }[] = [];
  try {
    const rawCustomers = await db.$queryRaw<{ dispensaryName: string; orderCount: number; revenue: number }[]>`
      SELECT 
        d."businessName" as "dispensaryName",
        COUNT(o.id)::int as "orderCount",
        SUM(o."totalAmount"::numeric)::numeric as revenue
      FROM "orders" o
      JOIN "dispensaries" d ON o."dispensaryId" = d.id
      WHERE o."growerId" = ${user.growerId}
        AND o.status = 'DELIVERED'
      GROUP BY d."businessName"
      ORDER BY revenue DESC
      LIMIT 5
    `;
    topCustomers = (rawCustomers || []).filter(c => c && c.dispensaryName);
  } catch (e) {
    console.error('Error fetching top customers:', e);
    topCustomers = [];
  }

  const recentOrders = allOrders.slice(0, 10);

  // Helper function for safe date formatting
  const formatMonth = (monthStr: string | null | undefined): string => {
    if (!monthStr) return '';
    try {
      return format(new Date(monthStr + '-01'), 'MMM');
    } catch {
      return '';
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track your sales performance and business metrics</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium transition-colors">
            Export PDF
          </button>
          <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-lg shadow-lg col-span-2 md:col-span-1 lg:col-span-1">
          <p className="text-green-100 text-xs sm:text-sm">Total Revenue</p>
          <p className="text-xl sm:text-3xl font-bold mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-green-100 text-xs sm:text-sm mt-2">
            From {completedOrders.length} completed orders
          </p>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
          <p className="text-xs sm:text-sm text-green-600 mt-2">
            {activeOrders} active orders
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Active Customers</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{dispensaries}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Registered dispensaries</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Avg Order Value</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">${avgOrderValue.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Per order average</p>
        </div>
      </div>

      {/* Charts Row - Improved Mobile Responsiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Revenue Trend (Last 6 Months)</h2>
            <span className="text-xs text-gray-400 sm:hidden">← swipe →</span>
          </div>
          {monthlyRevenue.length > 0 ? (
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
                className="h-36 sm:h-40 md:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 overflow-x-auto pb-2 -mx-3 sm:-mx-0 px-3 sm:px-2 scrollbar-hide snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {monthlyRevenue.map((month, idx) => {
                  const maxRevenue = Math.max(...monthlyRevenue.map(m => Number(m.revenue)));
                  const height = maxRevenue > 0 ? (Number(month.revenue) / maxRevenue) * 100 : 0;
                  const monthLabel = formatMonth(month.month);
                  if (!monthLabel) return null;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[44px] sm:min-w-[52px] snap-center">
                      <div className="w-full flex flex-col items-center justify-end h-24 sm:h-28 md:h-36 group cursor-pointer">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-20 hidden sm:block">
                          ${Number(month.revenue).toLocaleString()}
                        </div>
                        <div 
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                          style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap font-medium">
                        {monthLabel}
                      </span>
                      {Number(month.revenue) > 0 && (
                        <span className="text-[9px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                          {Number(month.revenue) >= 1000 ? `$${(Number(month.revenue) / 1000).toFixed(0)}k` : `$${Number(month.revenue)}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-36 sm:h-48 flex items-center justify-center text-gray-500 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Orders by Status - Improved Mobile Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Orders by Status</h2>
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => {
              const total = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const colors = statusColors[status];
              return (
                <div key={status} className="group">
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors?.bar || 'bg-gray-500'}`} />
                      <span className="text-gray-600">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products & Customers - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
              No product sales data yet
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
                    <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
              No customer data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table - Responsive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold">Recent Orders</h2>
          <a href="/grower/orders" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
            View All
          </a>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 sm:p-12 text-center text-gray-500 text-sm">
            No orders yet. Orders will appear here when customers place them.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Customer</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                      #{order.orderId.slice(-8)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      {order.dispensary?.businessName || 'Unknown'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {format(order.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600 text-right">
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
