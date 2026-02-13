import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import Link from 'next/link';

interface OrderDetail {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  notes: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  dispensary: {
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: { name: string; strain: string | null; unit: string };
  }>;
}

async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: true,
      items: { include: { product: true } },
    },
  });
  
  if (!order) return null;
  
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    items: order.items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  } as OrderDetail;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;

  if (user.role !== 'GROWER') {
    redirect('/auth/sign_in');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.growerId);

  if (!order) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="mt-2 text-gray-600">The requested order could not be found.</p>
        <Link href="/grower/orders" className="mt-4 inline-block text-green-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Link
            href={`/grower/orders/${order.id}/edit`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Edit Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Order Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{format(order.createdAt, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Dispensary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{order.dispensary.businessName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.product?.name || 'Product Deleted'}
                    {item.product?.strain && <span className="text-gray-500"> ({item.product.strain})</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg space-y-2">
          <div className="flex justify-end">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-end">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-end">
            <span className="text-sm text-gray-600">Shipping:</span>
            <span className="ml-2 text-sm font-medium text-gray-900">{formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="flex justify-end border-t pt-2">
            <span className="text-sm font-semibold text-gray-900">Total:</span>
            <span className="ml-2 text-sm font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">Order Notes</h3>
          <p className="text-sm text-yellow-800">{order.notes}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/grower/orders">Back to Orders</Link>
        </Button>
      </div>
    </div>
  );
}
