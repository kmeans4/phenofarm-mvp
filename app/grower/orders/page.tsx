import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

  const user = session.user as ExtendedUser;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch active requests (pending, confirmed, processing, shipped)
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
  // Cancelled requests carry no trackable value
  const trackedWholesaleValue = allOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  // Serialize orders for client component
  const serializedOrders = activeOrders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    updatedAt: order.updatedAt.toISOString(),
    dispensary: order.dispensary,
  }));

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Requests</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Review, accept, and fulfill buyer requests without in-app payment settlement</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/grower/orders/history">View History</Link>
          </Button>
          <Button variant="primary" asChild className="w-full sm:w-auto">
            <Link href="/grower/orders/add">Record Request</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Total Requests</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Active Requests</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Needs Review</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Estimated Request Value</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
            ${trackedWholesaleValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Orders List with Batch Actions */}
      <OrdersList initialOrders={serializedOrders} />
    </div>
  );
}
