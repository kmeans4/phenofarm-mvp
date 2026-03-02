import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import OrdersList from './components/OrdersList';
import { ExtendedUser } from '@/types';

export default async function GrowerOrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as ExtendedUser;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch active orders (pending, confirmed, processing, shipped)
  const activeOrders = await db.order.findMany({
    where: {
      growerId: user.growerId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
      },
    },
    include: {
      dispensary: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all orders for stats
  const allOrders = await db.order.findMany({
    where: {
      growerId: user.growerId,
    },
    include: {
      dispensary: {
        select: {
          businessName: true,
        },
      },
    },
  });

  // Calculate stats
  const totalOrders = allOrders.length;
  const activeCount = activeOrders.length;
  const pendingCount = allOrders.filter(o => o.status === 'PENDING').length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  // Serialize orders for client component
  const serializedOrders = activeOrders.map(order => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    updatedAt: order.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage and process customer orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/grower/orders/history">View History</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/grower/orders/add">+ New Order</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Active Orders</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
        />
        <select className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      {/* Orders List with Batch Actions */}
      <OrdersList initialOrders={serializedOrders} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          href="/grower/orders/add"
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Order</p>
              <p className="text-sm text-gray-600">Add items for a dispensary</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/grower/orders/history"
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Order History</p>
              <p className="text-sm text-gray-600">View past orders</p>
            </div>
          </div>
        </Link>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Tracking</p>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
