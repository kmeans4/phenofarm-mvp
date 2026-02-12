import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Order, OrderItem, Product, User, Dispensary } from '@prisma/client';
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
  updatedAt: Date;
  growerId: string;
  dispensaryId: string;
  dispensary: Dispensary;
  items: OrderItem[];
}

async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  return await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusBadge(status: string) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>
      {statusLabels[status as keyof typeof statusLabels]}
    </span>
  );
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const order = await fetchOrder(params.id, user.growerId);

  if (!order) {
    redirect('/grower/orders');
  }

  const itemsTotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const taxAmount = Number(order.tax);
  const shippingAmount = Number(order.shippingFee);
  const grandTotal = Number(order.totalAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
          <p className="text-gray-600 mt-1">
            {order.dispensary.businessName} • {format(order.createdAt, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white border-gray-300 hover:bg-gray-50">
            Print Invoice
          </Button>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
            Mark as Shipped
          </Button>
        </div>
      </div>

      {/* Order Status */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-900">Order Status</CardTitle>
            {getStatusBadge(order.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900">{format(order.createdAt, 'MMM d, yyyy h:mm a')}</span>
          </div>
          {order.shippedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipped:</span>
              <span className="text-gray-900">{format(order.shippedAt, 'MMM d, yyyy h:mm a')}</span>
            </div>
          )}
          {order.deliveredAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivered:</span>
              <span className="text-gray-900">{format(order.deliveredAt, 'MMM d, yyyy h:mm a')}</span>
            </div>
          )}
          {order.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Notes:</span>
              <p className="text-sm text-gray-600 mt-1">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispensary Info */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Dispensary Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Business Name:</span>
            <span className="text-gray-900 font-medium">{order.dispensary.businessName}</span>
          </div>
          {order.dispensary.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phone:</span>
              <span className="text-gray-900">{order.dispensary.phone}</span>
            </div>
          )}
          {order.dispensary.address && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Address:</span>
              <span className="text-gray-900">{order.dispensary.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product?.name || 'Product deleted'}</h4>
                  {item.product?.strain && (
                    <p className="text-sm text-gray-600">{item.product.strain}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    SKU: {item.product?.id} • {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(Number(item.totalPrice))}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">{formatCurrency(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping:</span>
            <span className="text-gray-900">{formatCurrency(shippingAmount)}</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">{formatCurrency(grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
