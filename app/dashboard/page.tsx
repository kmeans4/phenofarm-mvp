import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  // Get user stats based on role
  let stats = {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  };

  if (user.role === 'GROWER') {
    stats = await db.$queryRaw<{ totalProducts:bigint; totalOrders:bigint; pendingOrders:bigint; totalRevenue:bigint }[]>`
      SELECT 
        COALESCE(COUNT(DISTINCT p.id), 0) as totalProducts,
        COALESCE(COUNT(DISTINCT o.id), 0) as totalOrders,
        COALESCE(COUNT(DISTINCT CASE WHEN o.status = 'PENDING' THEN o.id END), 0) as pendingOrders,
        COALESCE(SUM(oi.total), 0) as totalRevenue
      FROM "products" p
      LEFT JOIN "order_items" oi ON p.id = oi."productId"
      LEFT JOIN "orders" o ON oi."orderId" = o.id
      WHERE p."sellerId" = ${user.id}
    `;
  } else if (user.role === 'DISPENSARY') {
    stats = await db.$queryRaw<{ totalProducts:bigint; totalOrders:bigint; pendingOrders:bigint; totalRevenue:bigint }[]>`
      SELECT 
        COALESCE(COUNT(DISTINCT oi."productId"), 0) as totalProducts,
        COALESCE(COUNT(DISTINCT o.id), 0) as totalOrders,
        COALESCE(COUNT(DISTINCT CASE WHEN o.status = 'PENDING' THEN o.id END), 0) as pendingOrders,
        COALESCE(SUM(oi.total), 0) as totalRevenue
      FROM "order_items" oi
      JOIN "orders" o ON oi."orderId" = o.id
      WHERE o."customerId" = (
        SELECT id FROM "customers" WHERE "userId" = ${user.id}
      )
    `;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        {user.role === 'GROWER' && (
          <Link href="/dashboard/inventory/add" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Add Product
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts?.toString() || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders?.toString() || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders?.toString() || '0'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            ${Number(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {user.role === 'GROWER' ? 'Recent Orders' : 'Recent Activity'}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ORD-2024-001</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 15, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,250.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href="#" className="text-green-600 hover:text-green-900">View</Link>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ORD-2024-002</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 12, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Processing
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$875.50</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href="#" className="text-green-600 hover:text-green-900">View</Link>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ORD-2024-003</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 10, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Cancelled
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$450.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href="#" className="text-green-600 hover:text-green-900">View</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {user.role === 'DISPENSARY' && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <Link href="/dashboard/catalog" className="text-green-600 hover:text-green-900 font-medium">
              Browse Product Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
