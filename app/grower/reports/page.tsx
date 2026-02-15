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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Track your sales performance and business metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors">
            Export PDF
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-green-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-green-100 text-sm mt-2">
            From {completedOrders.length} completed orders
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
          <p className="text-sm text-green-600 mt-2">
            {activeOrders} active orders
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{dispensaries}</p>
          <p className="text-sm text-gray-500 mt-2">Registered dispensaries</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">${avgOrderValue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Per order average</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend (Last 6 Months)</h2>
          {monthlyRevenue.length > 0 ? (
            <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 overflow-x-auto pb-1">
              {monthlyRevenue.map((month, idx) => {
                const maxRevenue = Math.max(...monthlyRevenue.map(m => Number(m.revenue)));
                const height = maxRevenue > 0 ? (Number(month.revenue) / maxRevenue) * 100 : 0;
                const monthLabel = formatMonth(month.month);
                if (!monthLabel) return null;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[44px]">
                    <div 
                      className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                      style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                      title={`$${Number(month.revenue).toLocaleString()}`}
                    />
                    <span className="text-xs text-gray-500">
                      {monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => {
              const total = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const colors: Record<string, string> = {
                PENDING: 'bg-yellow-500',
                CONFIRMED: 'bg-blue-500',
                PROCESSING: 'bg-purple-500',
                SHIPPED: 'bg-indigo-500',
                DELIVERED: 'bg-green-500',
                CANCELLED: 'bg-red-500',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[status] || 'bg-gray-500'} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Products</h2>
          </div>
          {topProducts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topProducts.map((product, idx) => (
                <div key={idx} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900">{product.productName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${Number(product.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{product.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No product sales data yet
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Customers</h2>
          </div>
          {topCustomers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900">{customer.dispensaryName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${Number(customer.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No customer data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <a href="/grower/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
            View All
          </a>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No orders yet. Orders will appear here when customers place them.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      #{order.orderId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.dispensary?.businessName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(order.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
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
