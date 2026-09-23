import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OrderTimeline } from '@/app/components/ui/OrderTimeline';
import { MobileOrderNavBar } from '@/app/components/ui/MobileOrderNavBar';
import Link from 'next/link';
import { OrderDetailActions } from './OrderDetailActions';
import {
  getOrderStatusHelp,
  getOrderStatusLabel,
  parseOrderRequestNotes,
} from '@/lib/order-workflow';
import { OrderHistory, type OrderHistoryEvent } from '@/app/components/ui/OrderHistory';
import { OrderRecordExport } from '@/app/components/ui/OrderRecordExport';

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
  createdBy: string;
  buyerAcknowledgedAt: Date | null;
  dispensary: { businessName: string; isOffPlatform: boolean };
  statusEvents: OrderHistoryEvent[];
  grower: {
    id: string;
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    quoted: boolean;
    product?: {
      id: string;
      name: string;
      strain: string | null;
      unit: string | null;
      price: number | null;
      inventoryQty: number;
      isAvailable: boolean;
    };
  }>;
}

async function fetchOrder(id: string, dispensaryId: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id, dispensaryId },
    select: {
      id: true, orderId: true, status: true, totalAmount: true, subtotal: true, tax: true, shippingFee: true,
      notes: true, shippedAt: true, deliveredAt: true, createdAt: true, createdBy: true, buyerAcknowledgedAt: true,
      grower: { select: { id: true, businessName: true } },
      dispensary: { select: { businessName: true, isOffPlatform: true } },
      items: { select: { id: true, quantity: true, unitPrice: true, totalPrice: true, acceptedQuoteId: true,
        product: { select: { id: true, name: true, unit: true, price: true, isPriceVisible: true, isAvailable: true, isDeleted: true, status: true, inventoryQty: true, strain: { select: { name: true } } } },
      } },
      statusEvents: { orderBy: { createdAt: 'asc' }, select: { id: true, fromStatus: true, toStatus: true, actorRole: true, createdAt: true } },
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
    createdBy: order.createdBy,
    buyerAcknowledgedAt: order.buyerAcknowledgedAt,
    dispensary: order.dispensary,
    statusEvents: order.statusEvents,
    grower: {
      id: order.grower.id,
      businessName: order.grower.businessName,
    },
    items: order.items.map(item => ({
      id: item.id, quantity: item.quantity, unitPrice: Number(item.unitPrice), totalPrice: Number(item.totalPrice), quoted: Boolean(item.acceptedQuoteId),
      product: { id: item.product.id, name: item.product.name, strain: item.product.strain?.name ?? null, unit: item.product.unit,
        price: item.product.isPriceVisible ? Number(item.product.price) : null, inventoryQty: item.product.inventoryQty,
        isAvailable: item.product.status === 'PUBLISHED' && !item.product.isDeleted && item.product.isAvailable && item.product.inventoryQty > 0 && item.product.isPriceVisible,
      },
    })),
  };

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
      {getOrderStatusLabel(status)}
    </span>
  );
}

export default async function DispensaryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };

  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
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
          ← Orders
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
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip pb-24">
      <Link href="/dispensary/orders" className="mb-2 inline-flex min-h-10 items-center text-sm text-green-600 hover:underline">
        ← Orders
      </Link>
      <PageHeader
        title={<span className="flex min-w-0 flex-col gap-1"><span>Request</span><span title={order.orderId} className="max-w-full break-all font-sans text-base font-semibold leading-tight text-gray-600 sm:text-lg">#{order.orderId}</span></span>}
        description={getOrderStatusHelp(order.status)}
        actions={<><StatusBadge status={order.status} /><OrderRecordExport order={{ orderId: order.orderId, createdAt: order.createdAt.toISOString(), status: getOrderStatusLabel(order.status), grower: order.grower.businessName, buyer: order.dispensary.businessName, subtotal: order.subtotal, tax: order.tax, shippingFee: order.shippingFee, total: order.totalAmount, items: order.items.map((item) => ({ name: item.product?.name || 'Unknown product', quantity: item.quantity, unit: item.product?.unit || 'unit', unitPrice: item.unitPrice, totalPrice: item.totalPrice, quoted: item.quoted })) }} /></>}
        className="mb-4 sm:mb-6"
      />

      <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 shadow-sm sm:grid-cols-2">
        {[
          { label: 'Request date', value: format(order.createdAt, 'MMM dd, yyyy') },
          { label: 'Grower', value: order.grower?.businessName || 'Grower' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 bg-white px-4 py-3 sm:block sm:py-4">
            <p className="text-xs font-semibold uppercase text-gray-500">{item.label}</p>
            <p className={`min-w-0 truncate text-sm font-semibold text-gray-900 sm:mt-1 sm:text-base`}>{item.value}</p>
          </div>
        ))}
      </div>

      <details className="mb-2 rounded-lg border border-gray-200 bg-white px-3">
        <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-green-700">View timeline</summary>
        <OrderTimeline
        currentStatus={order.status}
        createdAt={order.createdAt}
        shippedAt={order.shippedAt}
        deliveredAt={order.deliveredAt}
        className="mb-3"
        cancelledDescription="This request was cancelled. Message the grower if you need more detail."
      />
      </details>
      <details className="mb-4 rounded-lg border border-gray-200 bg-white px-3">
        <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-green-700">View history</summary>
        <div className="mb-3"><OrderHistory events={order.statusEvents} /></div>
      </details>

      <div id="buyer-actions" className="mb-4 scroll-mt-24 sm:scroll-mt-4">
        <OrderDetailActions
          orderDbId={order.id}
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
          createdBy={order.createdBy}
          buyerAcknowledgedAt={order.buyerAcknowledgedAt?.toISOString() || null}
          isOffPlatform={order.dispensary.isOffPlatform}
        />
      </div>



      {/* Items Table */}
      <Card className="bg-white shadow-sm border border-gray-200 mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Requested Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto sm:block">
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

          <div className="divide-y divide-gray-100 sm:hidden">
            {order.items.map((item) => (
              <div key={`mobile-${item.id}`} className="space-y-2 px-4 py-3">
                <p className="break-words text-sm font-semibold text-gray-900">
                  {item.product?.name || 'Unknown Product'}
                  {item.product?.strain ? <span className="font-normal text-gray-500"> ({item.product.strain})</span> : null}
                </p>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 text-gray-600">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span className="shrink-0 font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 space-y-2 sm:px-6 sm:py-4">
            {(order.tax > 0 || order.shippingFee > 0) && <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>}
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
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasRequestDetails && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-900">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fulfillment</p>
                <p>{requestNotes.details.fulfillmentMethod || 'Coordinate with grower'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requested Window</p>
                <p>{requestNotes.details.requestedWindow || 'Coordinate after acceptance'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment terms</p>
                <p>{requestNotes.details.paymentTerms || 'Handled directly'}</p>
              </div>
            </div>
            {(requestNotes.details.buyerNotes || requestNotes.legacyNotes) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                <p className="whitespace-pre-wrap">{requestNotes.details.buyerNotes || requestNotes.legacyNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <MobileOrderNavBar ordersHref="/dispensary/orders" ordersLabel="Orders" targetId="buyer-actions" targetLabel="Buyer actions" />
    </div>
  );
}
