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

  const user = session.user as { role: string; growerId?: string };
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  // Fetch real stats from database
  const [
    totalOrders,
    activeOrders,
    pendingOrders,
    allOrders,
    products,
    dispensaries,
  ] = await Promise.all([
    db.order.count({ where: { growerId: user.growerId } }),
    db.order.count({ 
      where: { 
        growerId: user.growerId,
        status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
      } 
    }),
    db.order.count({ 
      where: { growerId: user.growerId, status: 'PENDING' } 
    }),
    db.order.findMany({
      where: { growerId: user.growerId },
      include: { dispensary: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.product.count({ where: { growerId: user.growerId } }),
    db.dispensary.count(),
  ]);

  // Calculate revenue from completed orders
  const completedOrders = allOrders.filter(o => o.status === 'DELIVERED');
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount), 
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get recent orders for activity feed
  const recentOrders = allOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-green-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-green-100 text-sm mt-2 flex items-center">
            <span className="text-green-200 text-xs">From {completedOrders.length} completed orders</span>
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <span className="text-gray-500 text-xs">{activeOrders} active</span>
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

      {/* Orders by Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => {
            const count = allOrders.filter(o => o.status === status).length;
            const colors: Record<string, string> = {
              PENDING: 'bg-yellow-100 text-yellow-800',
              CONFIRMED: 'bg-blue-100 text-blue-800',
              PROCESSING: 'bg-purple-100 text-purple-800',
              SHIPPED: 'bg-orange-100 text-orange-800',
              DELIVERED: 'bg-green-100 text-green-800',
            };
            return (
              <div key={status} className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-1">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
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
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      #{order.orderId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.dispensary.businessName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
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

      {/* Export Actions */}
      <div className="flex justify-end gap-4">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Export PDF
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Export CSV
        </button>
      </div>
    </div>
  );
}
