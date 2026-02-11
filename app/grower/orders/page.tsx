import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { format } from "date-fns";

async function fetchOrders(status?: string, page = 1, limit = 20) {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders?${params.toString()}`, { cache: 'no-store' });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { orders: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
}

// Helper to format price
function formatPrice(price: any): string {
  return `$${Number(price).toFixed(2)}`;
}

// Helper to get status badge variant
function getStatusVariant(status: string): 'success' | 'danger' | 'info' | 'warning' | 'outline' {
  switch (status) {
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    case 'PROCESSING': return 'info';
    case 'SHIPPED': return 'warning';
    default: return 'outline';
  }
}

export default async function GrowerOrdersPage({ 
  searchParams 
}: { 
  searchParams?: { 
    status?: string; 
    page?: string; 
    limit?: string 
  } 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const status = searchParams?.status;
  const page = parseInt(searchParams?.page || '1');
  const limit = parseInt(searchParams?.limit || '20');

  const data = await fetchOrders(status, page, limit);
  const orders = data.orders;
  const pagination = data.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Export Orders</Button>
          <Button variant="primary">Create Order</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'PROCESSING').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <CardTitle>Filter Orders</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={status || ''}
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  if (e.target.value) params.set('status', e.target.value);
                  else params.delete('status');
                  window.history.pushState({}, '', `?${params.toString()}`);
                }}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Orders ({pagination.total || 0})</CardTitle>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders yet. Orders will appear here once dispensaries place orders.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.orderId}</div>
                      {order.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {order.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{order.dispensary?.businessName || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">
                        {order.dispensary?.city}, {order.dispensary?.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{format(new Date(order.createdAt), 'M/d/yyyy')}</div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(order.createdAt), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/grower/orders/${order.id}`} 
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        View
                      </Link>
                      {order.status === 'PENDING' && (
                        <Link 
                          href={`/grower/orders/${order.id}/edit`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {orders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-center items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (page > 1) params.set('page', (page - 1).toString());
                window.history.pushState({}, '', `?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {pagination.totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (page < (pagination.totalPages || 1)) params.set('page', (page + 1).toString());
                window.history.pushState({}, '', `?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
