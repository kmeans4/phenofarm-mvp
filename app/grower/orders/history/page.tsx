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

  const user = (session as any).user as ExtendedUser;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch all completed orders (DELIVERED or CANCELLED)
  const orders = await db.order.findMany({
    where: {
      growerId: user.growerId,
      status: {
        in: ['DELIVERED', 'CANCELLED', 'SHIPPED'],
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

  const statusLabels = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-1">View past orders and export reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white border-gray-300 hover:bg-gray-50 text-sm">
            Export CSV
          </Button>
          <Button variant="secondary" className="bg-white border-gray-300 hover:bg-gray-50 text-sm">
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Shipped</p>
            <p className="text-3xl font-bold text-orange-600">
              {orders.filter((o) => o.status === 'SHIPPED').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-600 mb-4">No order history yet</p>
              <p className="text-sm text-gray-500">Completed orders will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Order #</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">Date</th>
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
                        {format(order.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          order.status === 'DELIVERED' ? 'success' :
                          order.status === 'CANCELLED' ? 'error' :
                          order.status === 'SHIPPED' ? 'warning' :
                          'default'
                        }>
                          {statusLabels[order.status as keyof typeof statusLabels]}
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

      {/* Pagination (placeholder) */}
      {orders.length > 0 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <span className="text-sm text-gray-700">Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      )}
    </div>
  );
}
