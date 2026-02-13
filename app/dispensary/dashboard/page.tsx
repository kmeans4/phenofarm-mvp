import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';

async function fetchDispensaryDashboardData(dispensaryId: string) {
  // Get real orders for this dispensary
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
    take: 10, // Recent 10 orders
  });

  // Get unique growers (customers)
  const growerIds = [...new Set(orders.map(o => o.growerId))];
  const activeGrowers = growerIds.length;

  // Calculate total spent
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

  // Get active orders count (not delivered or cancelled)
  const activeOrders = orders.filter(o => 
    !['DELIVERED', 'CANCELLED'].includes(o.status)
  ).length;

  // Get revenue for last 7 days
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
    
    return {
      day: format(date, 'MMM d'),
      revenue: dayRevenue,
    };
  });

  // Get featured products (from recent orders)
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
    .filter((p, i, arr) => arr.findIndex(x => x.productId === p.productId) === i) // unique products
    .slice(0, 3);

  return {
    orders,
    activeGrowers,
    totalSpent,
    pendingOrders,
    activeOrders,
    last7Days,
    featuredProducts,
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
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
  const colorMap: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
    blue: {
      bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-600', hoverBg: 'hover:bg-blue-50',
    },
    green: {
      bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-600', hoverBg: 'hover:bg-green-50',
    },
    yellow: {
      bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-600', hoverBg: 'hover:bg-yellow-50',
    },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Link href={href} className={`group block p-5 rounded-xl border-2 border-transparent hover:border-gray-200 ${colors.hoverBg} transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.text} group-hover:bg-opacity-75`}>
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

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default async function DispensaryDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const data = await fetchDispensaryDashboardData(user.dispensaryId);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispensary Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dispensary/catalog" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spent" value={`$${data.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        <StatCard title="Pending Orders" value={data.pendingOrders} />
        <StatCard title="Active Growers" value={data.activeGrowers} />
        <StatCard title="Active Orders" value={data.activeOrders} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          title="Browse Catalogs"
          href="/dispensary/catalog"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          description="Browse grower catalogs with search"
          color="blue"
        />
        <QuickAction
          title="View Cart"
          href="/dispensary/cart"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          description="View your shopping cart"
          color="green"
        />
        <QuickAction
          title="My Orders"
          href="/dispensary/orders"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          description="View and track orders"
          color="yellow"
        />
      </div>

      {/* Recent Orders */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link href="/dispensary/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All
            </Link>
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
                      <Badge variant={
                        order.status === 'DELIVERED' ? 'success' :
                        order.status === 'CANCELLED' ? 'error' :
                        order.status === 'PENDING' ? 'warning' :
                        order.status === 'PROCESSING' ? 'info' :
                        'default'
                      }>
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
                    <div 
                      className="w-full bg-green-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.min((day.revenue / 5000) * 100, 100)}%` }}
                    />
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
