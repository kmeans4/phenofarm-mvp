import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { EmptyState } from '@/app/components/ui/EmptyState';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';
import { OrdersTable } from './OrdersTable';

interface DashboardOrder {
  id: string;
  orderId: string;
  status: string;
  createdAt: Date;
  totalAmount: unknown;
  growerId: string;
  grower: { businessName: string } | null;
}

async function fetchDispensaryDashboardData(dispensaryId: string): Promise<{
  orders: DashboardOrder[];
  activeGrowers: number;
  totalSpent: number;
  pendingOrders: number;
  activeOrders: number;
  last7Days: { day: string; revenue: number }[];
  featuredProducts: { productId: string; name: string; category: string; pricePerUnit: number; quantity: number; grower: string }[];
}> {
  const orders = await db.order.findMany({
    where: { dispensaryId },
    include: {
      grower: { select: { businessName: true } },
      items: {
        include: {
          product: {
            select: { name: true, productType: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
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
      category: item.product?.productType || 'N/A',
      pricePerUnit: Number(item.unitPrice),
      quantity: item.quantity,
      grower: orders.find(o => o.id === item.orderId)?.grower?.businessName || 'Unknown',
    }))
    .filter((p, i, arr) => arr.findIndex(x => x.productId === p.productId) === i)
    .slice(0, 3);

  return { orders, activeGrowers, totalSpent, pendingOrders, activeOrders, last7Days, featuredProducts };
}

// Empty state for stats
function StatCardEmpty({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 opacity-75">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-400 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">No data yet</p>
    </div>
  );
}

export default async function DispensaryDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/sign_in');
  const user = (session as any).user as { role: string; growerId?: string; dispensaryId?: string };
  if (user.role !== 'DISPENSARY') redirect('/dashboard');

  const data = await fetchDispensaryDashboardData(user.dispensaryId!);
  const hasOrders = data.orders.length > 0;
  const hasSpending = data.last7Days.some(d => d.revenue > 0);

  // Serialize orders for client component
  const serializedOrders = data.orders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    growerId: order.growerId,
    grower: order.grower,
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispensary Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/dispensary/catalog" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
          Browse Catalog
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasOrders ? (
          <>
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
          </>
        ) : (
          <>
            <StatCardEmpty title="Total Spent" value="$0.00" />
            <StatCardEmpty title="Pending Orders" value="0" />
            <StatCardEmpty title="Active Growers" value="0" />
            <StatCardEmpty title="Active Orders" value="0" />
          </>
        )}
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

      {/* Recent Orders with Date Filter */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <OrdersTable orders={serializedOrders} />
        </CardHeader>
      </Card>

      {/* Featured Products & 7-Day Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recently Ordered</h3>
          </CardHeader>
          <CardContent>
            {data.featuredProducts.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                title="No products yet"
                description="Products you order will appear here for quick reordering."
                action={{ label: 'Browse Catalog', href: '/dispensary/catalog' }}
              />
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
            <h3 className="text-lg font-semibold text-gray-900">7-Day Spending</h3>
          </CardHeader>
          <CardContent>
            {!hasSpending ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No spending data yet"
                description="Your spending activity will be tracked here once you start placing orders."
              />
            ) : (
              <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 sm:px-0 overflow-x-auto pb-1">
                {data.last7Days.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[36px]">
                    <div className="w-full flex flex-col gap-1">
                      <div className="w-full bg-green-500 rounded-t-lg" style={{ height: `${Math.min((day.revenue / 5000) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{day.day}</span>
                    <span className="text-xs font-medium text-green-600">${Math.round(day.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasOrders && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">🏪 Welcome to PhenoFarm!</h3>
              <p className="text-blue-700 mt-1">Get started by browsing grower catalogs and finding products for your dispensary.</p>
            </div>
            <Link 
              href="/dispensary/catalog" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Browse Catalogs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
