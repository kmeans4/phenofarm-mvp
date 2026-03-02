import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { OrdersTable } from '../components/OrdersTable';

interface StatusLabelMap {
  [key: string]: string;
}

type BadgeVariant = 'info' | 'error' | 'default' | 'success' | 'secondary' | 'warning' | 'danger' | null;

export default async function DispensaryOrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Fetch all orders for this dispensary
  const orders = await db.order.findMany({
    where: {
      dispensaryId: user.dispensaryId,
    },
    include: {
      grower: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => 
    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
  );
  const activeCount = activeOrders.length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const totalSpent = orders.reduce((sum: number, o: { totalAmount: unknown }) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">View and track your orders from growers</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" asChild>
            <Link href="/dispensary/catalog">
              + New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active Orders</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Browse our catalog to discover quality products from licensed growers.
              </p>
              <Button variant="primary" asChild>
                <Link href="/dispensary/catalog">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Browse catalog
                </Link>
              </Button>
            </div>
          ) : (
            <OrdersTable orders={orders} />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/dispensary/catalog"
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Place New Order</p>
              <p className="text-sm text-gray-600">Browse products from growers</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dispensary/cart"
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Cart</p>
              <p className="text-sm text-gray-600">Review items before checkout</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
