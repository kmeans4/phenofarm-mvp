import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Button } from "@/app/grower/orders/components/Button";
import { Badge } from "@/app/components/ui/Badge";
import { format } from "date-fns";
import { ButtonProps as OrdersButtonProps } from "@/app/grower/orders/components/Button";

async function fetchOrderById(orderId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders/${orderId}`, { cache: 'no-store' });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function GrowerOrderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const order = await fetchOrderById(params.id);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
            <Badge variant={
              order.status === 'DELIVERED' ? 'success' :
              order.status === 'CANCELLED' ? 'danger' :
              order.status === 'PROCESSING' ? 'info' :
              order.status === 'SHIPPED' ? 'warning' :
              'outline'
            }>
              {order.status}
            </Badge>
          </div>
          <p className="text-gray-600">
            Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')} at {format(new Date(order.createdAt), 'h:mm a')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Download PDF</Button>
          <Button variant="primary">Add Tracking</Button>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Order Total</p>
            <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="text-xl font-semibold text-gray-900">${order.subtotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tax</p>
            <p className="text-xl font-semibold text-gray-900">${order.tax.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shipping</p>
            <p className="text-xl font-semibold text-gray-900">${order.shippingFee.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Business Name</p>
            <p className="text-lg text-gray-900">{order.dispensary?.businessName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">License Number</p>
            <p className="text-lg text-gray-900">{order.dispensary?.licenseNumber || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Contact Information</p>
            <p className="text-gray-900">
              {order.dispensary?.phone} • {order.dispensary?.address}
              {order.dispensary?.city && `, ${order.dispensary?.city}`}
              {order.dispensary?.state && ` ${order.dispensary?.state}`}
              {order.dispensary?.zip && ` ${order.dispensary?.zip}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-lg text-gray-900">
              {order.shippedAt ? 'Shipped' : order.status === 'DELIVERED' ? 'Delivered' : 'Processing'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estimated Delivery</p>
            <p className="text-lg text-gray-900">{order.status === 'DELIVERED' ? 'Completed' : 'TBD'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Shipping Address</p>
            <p className="text-gray-900">
              {order.dispensary?.address}
              {order.dispensary?.city && `, ${order.dispensary?.city}`}
              {order.dispensary?.state && ` ${order.dispensary?.state}`}
              {order.dispensary?.zip && ` ${order.dispensary?.zip}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({order.items?.length || 0})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.product?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.strain || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
              {order.items?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No items in this order
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-6 py-4 text-right font-medium text-gray-900">Order Total:</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Actions */}
      {order.status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => { /* Confirm order logic */ }}>
              Confirm Order
            </Button>
            <Button variant="secondary" onClick={() => { /* Cancel order logic */ }}>
              Cancel Order
            </Button>
            <Button variant="outline" onClick={() => { /* Edit order logic */ }}>
              Edit Order
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Back Link */}
      <div className="flex justify-start">
        <Link href="/grower/orders" className="text-green-600 hover:text-green-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
