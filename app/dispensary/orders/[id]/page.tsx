import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import Link from 'next/link';
import { OrderDetailActions } from './OrderDetailActions';
import {
  ORDER_STATUS_STEPS,
  getOrderStatusHelp,
  getOrderStatusLabel,
  parseOrderRequestNotes,
} from '@/lib/order-workflow';

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
    id: string;
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: {
      id: string;
      name: string;
      strain: string | null;
      unit: string | null;
      price: number;
      inventoryQty: number;
      isAvailable: boolean;
    };
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
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    notes: order.notes,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    grower: {
      id: order.grower.id,
      businessName: order.grower.businessName,
    },
    items: order.items.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      product: item.product && typeof item.product === 'object'
        ? {
            id: String((item.product as Record<string, unknown>).id),
            name: String((item.product as Record<string, unknown>).name || 'Unknown Product'),
            strain: typeof (item.product as Record<string, unknown>).strainLegacy === 'string'
              ? ((item.product as Record<string, unknown>).strainLegacy as string)
              : null,
            unit: typeof (item.product as Record<string, unknown>).unit === 'string'
              ? ((item.product as Record<string, unknown>).unit as string)
              : null,
            price: Number((item.product as Record<string, unknown>).price || 0),
            inventoryQty: Number((item.product as Record<string, unknown>).inventoryQty || 0),
            isAvailable: Boolean((item.product as Record<string, unknown>).isAvailable),
          }
        : undefined,
    })),
  } as unknown as OrderDetail;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function statusStepState(orderStatus: string, step: string) {
  const order = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentIndex = order.indexOf(orderStatus);
  const stepIndex = order.indexOf(step);

  if (orderStatus === 'CANCELLED') return step === 'PENDING' ? 'complete' : 'cancelled';
  if (currentIndex === -1 || stepIndex === -1) return 'upcoming';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

function StatusTimeline({ order }: { order: OrderDetail }) {
  const steps = ORDER_STATUS_STEPS.map((step) => ({
    ...step,
    date:
      step.status === 'PENDING'
        ? order.createdAt
        : step.status === 'SHIPPED'
          ? order.shippedAt
          : step.status === 'DELIVERED'
            ? order.deliveredAt
            : null,
  }));

  if (order.status === 'CANCELLED') {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-900">Fulfillment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-800">This request was cancelled. Message the grower if you need more detail.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Fulfillment Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-5">
          {steps.map((step) => {
            const state = statusStepState(order.status, step.status);
            return (
              <li key={step.status} className="flex items-start gap-3 sm:block">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:mb-2 ${
                  state === 'complete'
                    ? 'bg-green-600 text-white'
                    : state === 'current'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {state === 'complete' ? '✓' : steps.findIndex((entry) => entry.status === step.status) + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${
                    state === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {step.date ? format(step.date, 'MMM d, yyyy h:mm a') : state === 'current' ? 'Current step' : 'Pending'}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
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
      {getOrderStatusLabel(status)}
    </span>
  );
}

export default async function DispensaryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };

  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.dispensaryId!);

  if (!order) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="mt-2 text-gray-600">The requested order could not be found.</p>
        <Link href="/dispensary/orders" className="mt-4 inline-block text-green-600 hover:underline">
          ← Back to Requests
        </Link>
      </div>
    );
  }

  const requestNotes = parseOrderRequestNotes(order.notes);
  const hasRequestDetails =
    requestNotes.details.fulfillmentMethod ||
    requestNotes.details.requestedWindow ||
    requestNotes.details.paymentTerms ||
    requestNotes.details.buyerNotes ||
    requestNotes.legacyNotes;

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link href="/dispensary/orders" className="text-green-600 hover:underline text-sm mb-1 inline-block">
            ← Back to Requests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Request #{order.orderId}</h1>
          <p className="mt-1 text-sm text-gray-600">{getOrderStatusHelp(order.status)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Request Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{format(order.createdAt, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Estimated value</CardTitle>
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

      <StatusTimeline order={order} />

      <div id="buyer-actions" className="mb-6 scroll-mt-4">
        <OrderDetailActions
          orderId={order.orderId}
          status={order.status}
          growerId={order.grower.id}
          growerName={order.grower.businessName}
          items={order.items
            .filter((item) => item.product)
            .map((item) => ({
              productId: item.product!.id,
              name: item.product!.name,
              unit: item.product!.unit,
              strain: item.product!.strain,
              quantity: item.quantity,
              price: item.product!.price,
              inventoryQty: item.product!.inventoryQty,
              isAvailable: item.product!.isAvailable,
            }))}
        />
      </div>

      {/* Items Table */}
      <Card className="bg-white shadow-sm border border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Requested Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line value</th>
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
              <span className="text-sm text-gray-600">Estimated item value:</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recorded tax:</span>
                <span className="text-sm font-medium">{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Shipping estimate:</span>
                <span className="text-sm font-medium">{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="text-sm font-semibold">Estimated request value:</span>
              <span className="text-sm font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
            </div>
            <p className="pt-1 text-xs text-gray-500">
              PhenoFarm tracks request value only. Wholesale payment is handled directly between buyer and grower.
            </p>
          </div>
        </CardContent>
      </Card>

      {hasRequestDetails && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-yellow-900">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Fulfillment</p>
                <p>{requestNotes.details.fulfillmentMethod || 'Coordinate with grower'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Requested Window</p>
                <p>{requestNotes.details.requestedWindow || 'Coordinate after acceptance'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Direct Payment Terms</p>
                <p>{requestNotes.details.paymentTerms || 'Handled directly'}</p>
              </div>
            </div>
            {(requestNotes.details.buyerNotes || requestNotes.legacyNotes) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Notes</p>
                <p className="whitespace-pre-wrap">{requestNotes.details.buyerNotes || requestNotes.legacyNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-10px_25px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <Link
            href="/dispensary/orders"
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
          >
            Orders
          </Link>
          <a
            href="#buyer-actions"
            className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Buyer actions
          </a>
        </div>
      </div>
    </div>
  );
}
