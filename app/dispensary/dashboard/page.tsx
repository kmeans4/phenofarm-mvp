import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import Link from 'next/link';
import { format } from 'date-fns';

// Stats Card Component
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

// Activity Item Component
interface ActivityItemProps {
  type: 'order' | 'customer' | 'product' | 'sync';
  title: string;
  subtitle: string;
  timestamp: Date;
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

// Quick Action Card
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
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50',
    },
    green: {
      bg: 'bg-green-100',
      border: 'border-green-200',
      text: 'text-green-600',
      hoverBg: 'hover:bg-green-50',
    },
    yellow: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      hoverBg: 'hover:bg-yellow-50',
    },
    red: {
      bg: 'bg-red-100',
      border: 'border-red-200',
      text: 'text-red-600',
      hoverBg: 'hover:bg-red-50',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <Link href={href} className={`group block p-5 rounded-xl border-2 border-transparent hover:border-${colors.border.split('-')[1]}-200 ${colors.hoverBg} transition-all`}>
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

// Mock data functions - would call API in production
async function fetchDispensaryDashboardData(dispensaryId: string) {
  // In production, fetch from database API
  return {
    recentOrders: [
      {
        orderId: 'ORD-2024-001',
        growerName: 'Green Valley Farms',
        totalAmount: 4500.00,
        status: 'PENDING' as const,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        orderId: 'ORD-2024-002',
        growerName: 'Sky High Cultivation',
        totalAmount: 3200.50,
        status: 'CONFIRMED' as const,
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        orderId: 'ORD-2024-003',
        growerName: 'Organic Roots Co.',
        totalAmount: 5800.00,
        status: 'PROCESSING' as const,
        createdAt: new Date(Date.now() - 3600000 * 10),
      },
      {
        orderId: 'ORD-2024-004',
        growerName: 'Mountain Growers',
        totalAmount: 2100.75,
        status: 'DELIVERED' as const,
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        orderId: 'ORD-2024-005',
        growerName: 'Sunshine Agriculture',
        totalAmount: 6700.00,
        status: 'PENDING' as const,
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
    ],
    customers: [
      {
        customerId: 'CUS-001',
        growerName: 'Green Valley Farms',
        lastOrder: new Date(Date.now() - 3600000 * 2),
        orderCount: 15,
      },
      {
        customerId: 'CUS-002',
        growerName: 'Sky High Cultivation',
        lastOrder: new Date(Date.now() - 3600000 * 5),
        orderCount: 8,
      },
      {
        customerId: 'CUS-003',
        growerName: 'Organic Roots Co.',
        lastOrder: new Date(Date.now() - 3600000 * 10),
        orderCount: 22,
      },
    ],
    featuredProducts: [
      {
        productId: 'PROD-001',
        name: 'Blue Dream Feminized',
        category: 'Flower',
        pricePerUnit: 45,
        quantityAvailable: 500,
        grower: 'Green Valley Farms',
      },
      {
        productId: 'PROD-002',
        name: 'OG Kush Auto',
        category: 'Flower',
        pricePerUnit: 38,
        quantityAvailable: 350,
        grower: 'Sky High Cultivation',
      },
      {
        productId: 'PROD-003',
        name: 'CBD Oil 500mg',
        category: 'Extract',
        pricePerUnit: 65,
        quantityAvailable: 200,
        grower: 'Organic Roots Co.',
      },
    ],
  };
}

export default async function DispensaryDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const data = await fetchDispensaryDashboardData(user.id);

  // Calculate stats
  const totalRevenue = data.recentOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
  const pendingOrders = data.recentOrders.filter(o => o.status === 'PENDING').length;
  const activeCustomers = data.customers.length;

  // Revenue chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'MMM d');
  });

  const chartData = last7Days.map((day, index) => {
    // Simulated revenue data
    const baseRevenue = 2500;
    const randomFactor = Math.random() * 1500;
    return {
      day,
      revenue: baseRevenue + randomFactor,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dispensary Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white border-gray-300 hover:bg-gray-50">
            Download Report
          </Button>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
            + New Catalog
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${Number(totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          icon={<Badge variant="outline">awaiting</Badge>}
        />
        <StatCard
          title="Active Growers"
          value={activeCustomers}
          trend="+3"
          trendUp={true}
        />
        <StatCard
          title="Total Orders"
          value={data.recentOrders.length}
          trend="+8.5%"
          trendUp={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          title="Browse Catalogs"
          href="/dispensary/catalog"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          description="Browse grower catalogs with search and filter"
          color="blue"
        />
        <QuickAction
          title="View Cart"
          href="/dispensary/cart"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          description="View your shopping cart and checkout"
          color="green"
        />
        <QuickAction
          title="Manage Products"
          href="/dispensary/products"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          description="Manage your product listings"
          color="yellow"
        />
      </div>

      {/* Recent Orders Section */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{order.orderId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.growerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(order.createdAt, 'M/d/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      order.status === 'DELIVERED' ? 'success' :
                      order.status === 'CANCELLED' ? 'danger' :
                      order.status === 'PENDING' ? 'warning' :
                      order.status === 'PROCESSING' ? 'info' :
                      order.status === 'SHIPPED' ? 'warning' :
                      'outline'
                    }>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Featured Products */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-900">Featured Products</CardTitle>
            <Link href="/dispensary/catalog" className="text-sm text-green-600 hover:text-green-700 font-medium">
              Browse All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.featuredProducts.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${product.pricePerUnit}/unit
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{product.quantityAvailable} units available</span>
                  <Link href={`/dispensary/catalog?grower=${product.grower}`} className="text-xs text-green-600 hover:text-green-700 font-medium">
                    View Catalog
                  </Link>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">from {product.grower}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Approvals</span>
                <Badge variant="warning">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
                <Badge variant="danger">5</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Orders</span>
                <span className="text-sm font-medium text-green-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Past 30 Days Revenue</span>
                <span className="text-sm font-medium text-gray-900">$28,450</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div 
                      className="w-full bg-green-500 hover:bg-green-600 rounded-t-lg"
                      style={{ height: `${Math.min((day.revenue / 4000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                  <span className="text-xs font-medium text-gray-700">
                    ${Math.round(day.revenue).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
