import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ExtendedUser } from '@/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

export default async function GrowerOrdersHistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch historical orders only (DELIVERED or CANCELLED)
  const orders = await db.order.findMany({
    where: {
      growerId: user.growerId,
      status: {
        in: ['DELIVERED', 'CANCELLED'],
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
      updatedAt: 'desc',
    },
  });

  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED');
  const cancelledOrders = orders.filter((order) => order.status === 'CANCELLED');
  const deliveredRevenue = deliveredOrders.reduce(
    (sum: number, order: { totalAmount: number | string }) => sum + Number(order.totalAmount),
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View delivered and cancelled orders only</p>
        </div>
        <Link href="/grower/orders" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-300 hover:bg-gray-50 text-sm">
            Back to Active Orders
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Historical Orders</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-3xl font-bold text-green-600">{deliveredOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{cancelledOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Delivered Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${deliveredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Delivered & Cancelled Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No order history yet</h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                Delivered and cancelled orders will appear here once active orders are closed out.
              </p>
              <p className="text-sm text-gray-500 mb-6">Next step: review your active orders and update statuses as they progress.</p>
              <Link
                href="/grower/orders"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Go to active orders
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Order #</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Closed</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">#{order.orderId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.dispensary.businessName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(order.updatedAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.status === 'DELIVERED' ? 'success' : 'error'}>
                          {order.status === 'DELIVERED' ? 'Delivered' : 'Cancelled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          href={`/grower/orders/${order.id}`}
                          className="text-green-600 hover:text-green-700 font-medium text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
