import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function GrowerReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const stats = {
    totalRevenue: 12500,
    totalOrders: 48,
    totalProducts: 12,
    activeCustomers: 8,
    avgOrderValue: 260.42,
    growth: 15.3,
  };

  const monthlyData = [
    { month: 'Jan', revenue: 8500, orders: 24 },
    { month: 'Feb', revenue: 12500, orders: 48 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-green-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-green-100 text-sm mt-2 flex items-center">
            <span className="text-green-200 text-xs">↑ {stats.growth}%</span>
            <span className="ml-1 text-green-200 text-xs">vs last month</span>
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <span className="text-green-500 text-xs">↑ {stats.growth}%</span>
            <span className="ml-1 text-gray-500 text-xs">vs last month</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCustomers}</p>
          <p className="text-sm text-gray-500 mt-2">Current active dispensaries</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">${stats.avgOrderValue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Average order value</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
        <div className="h-64 flex items-end justify-between gap-4">
          {monthlyData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-green-100 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(data.revenue / 15000) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${data.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Top Performing Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Blue Dream Flower</div>
                  <div className="text-sm text-gray-500">Indica</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">$4,200.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">84 units</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">62%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Sativa Concentrate</div>
                  <div className="text-sm text-gray-500">Sativa</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">$2,400.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48 units</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">58%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">EDM Edibles</div>
                  <div className="text-sm text-gray-500">Gummies</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">$1,800.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">72 units</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">71%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Order Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {i < 3 && <div className="w-0.5 h-8 bg-gray-200"></div>}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Order #CB-{2024 + i * 1000}</p>
                    <p className="text-sm text-gray-500">Dispensary #{i}</p>
                  </div>
                  <span className="text-sm text-gray-500">{i} days ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  ${((Math.random() * 500 + 200) * (i + 1)).toFixed(2)} order completed
                </p>
              </div>
            </div>
          ))}
        </div>
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
