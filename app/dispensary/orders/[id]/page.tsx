import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
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
  grower: {
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

async function fetchOrder(id: string, dispensaryId: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id, dispensaryId },
    include: {
      grower: true,
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
    items: order.items.map((item: unknown) => ({
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
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default async function DispensaryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as unknown;

  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.dispensaryId);

  if (!order) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="mt-2 text-gray-600">The requested order could not be found.</p>
        <Link href="/dispensary/orders" className="mt-4 inline-block text-green-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link href="/dispensary/orders" className="text-green-600 hover:underline text-sm mb-1 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Order Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{format(order.createdAt, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(order.totalAmount)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Grower</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{order.grower?.businessName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="bg-white shadow-sm border border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.product?.name || 'Unknown Product'}
                      {item.product?.strain && (
                        <span className="text-gray-500"> ({item.product.strain})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm font-medium">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Shipping:</span>
              <span className="text-sm font-medium">{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="text-sm font-semibold">Total:</span>
              <span className="text-sm font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
