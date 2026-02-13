import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';

async function fetchDispensaryDashboardData(dispensaryId: string) {
  const orders = await db.order.findMany({
    where: { dispensaryId },
    include: {
      grower: { select: { businessName: true } },
      items: {
        include: {
          product: {
            select: { name: true, category: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const growerIds = [...new Set(orders.map(o => o.growerId))];
  const activeGrowers = growerIds.length;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const activeOrders = orders.filter(o => 
    !['DELIVERED', 'CANCELLED'].includes(o.status)
  ).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dayRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      })
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { day: format(date, 'MMM d'), revenue: dayRevenue };
  });

  const featuredProducts = orders
    .flatMap(o => o.items)
    .map(item => ({
      productId: item.productId,
      name: item.product?.name || 'Unknown',
      category: item.product?.category || 'N/A',
      pricePerUnit: Number(item.unitPrice),
      quantity: item.quantity,
      grower: orders.find(o => o.id === item.orderId)?.grower?.businessName || 'Unknown',
    }))
    .filter((p, i, arr) => arr.findIndex(x => x.productId === p.productId) === i)
    .slice(0, 3);

  return { orders, activeGrowers, totalSpent, pendingOrders, activeOrders, last7Days, featuredProducts };
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export default async function DispensaryDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/sign_in');
  const user = session.user as any;
  if (user.role !== 'DISPENSARY') redirect('/dashboard');

  const data = await fetchDispensaryDashboardData(user.dispensaryId);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispensary Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <Link href="/dispensary/catalog" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
          Browse Catalog
        </Link>
      </div>

      {/* Stats Cards - matching orders page style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${data.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{data.pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Growers</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{data.activeGrowers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Orders</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{data.activeOrders}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dispensary/catalog" className="group block p-5 rounded-xl border-2 border-transparent hover:border-gray-200 hover:bg-blue-50 transition-all bg-white shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Browse Catalogs</h3>
              <p className="text-sm text-gray-600 mt-1">Browse grower catalogs with search</p>
            </div>
          </div>
        </Link>
        <Link href="/dispensary/cart" className="group block p-5 rounded-xl border-2 border-transparent hover:border-gray-200 hover:bg-green-50 transition-all bg-white shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Cart</h3>
              <p className="text-sm text-gray-600 mt-1">View your shopping cart</p>
            </div>
          </div>
        </Link>
        <Link href="/dispensary/orders" className="group block p-5 rounded-xl border-2 border-transparent hover:border-gray-200 hover:bg-yellow-50 transition-all bg-white shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-600 mt-1">View and track orders</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link href="/dispensary/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">View All</Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.orders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No orders yet</td></tr>
              ) : (
                data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(order as any).grower?.businessName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{format(new Date(order.createdAt), 'M/d/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : order.status === 'PENDING' ? 'warning' : order.status === 'PROCESSING' ? 'info' : 'default'}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Featured Products & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Recently Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            {data.featuredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No products ordered yet</p>
            ) : (
              <div className="space-y-3">
                {data.featuredProducts.map((product) => (
                  <div key={product.productId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category} • from {product.grower}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${product.pricePerUnit.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">7-Day Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {data.last7Days.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div className="w-full bg-green-500 rounded-t-lg" style={{ height: `${Math.min((day.revenue / 5000) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                  <span className="text-xs font-medium text-green-600">${Math.round(day.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
