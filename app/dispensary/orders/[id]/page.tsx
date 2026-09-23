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
    PENDING: 'bg-pf-warning-bg text-pf-warning',
    CONFIRMED: 'bg-pf-info-bg text-pf-info',
    PROCESSING: 'bg-pf-purple-bg text-pf-purple',
    SHIPPED: 'bg-pf-warning-bg text-pf-warning',
    DELIVERED: 'bg-pf-accent-bg text-pf-accent',
    CANCELLED: 'bg-pf-danger-bg text-pf-danger',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-pf-surface text-pf-secondary'}`}>
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
        <h1 className="text-2xl font-bold">Request not found</h1>
        <p className="mt-2 text-pf-muted">The requested order could not be found.</p>
        <Link href="/dispensary/orders" className="mt-4 inline-block text-pf-accent hover:underline">
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
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip">
      <Link href="/dispensary/orders" className="mb-2 inline-flex min-h-10 items-center text-sm text-pf-accent hover:underline">
        ← Orders
      </Link>
      <PageHeader
        title={<span className="flex min-w-0 flex-col gap-1"><span>Request</span><span title={order.orderId} className="max-w-full break-all font-sans text-base font-semibold leading-tight text-pf-muted sm:text-lg">#{order.orderId}</span></span>}
        description={getOrderStatusHelp(order.status)}
        actions={<><StatusBadge status={order.status} /><OrderRecordExport order={{ orderId: order.orderId, notes: order.notes, createdAt: order.createdAt.toISOString(), status: getOrderStatusLabel(order.status), grower: order.grower.businessName, buyer: order.dispensary.businessName, subtotal: order.subtotal, tax: order.tax, shippingFee: order.shippingFee, total: order.totalAmount, items: order.items.map((item) => ({ name: item.product?.name || 'Unknown product', quantity: item.quantity, unit: item.product?.unit || 'unit', unitPrice: item.unitPrice, totalPrice: item.totalPrice, quoted: item.quoted })) }} /></>}
        className="mb-4 sm:mb-6"
      />

      <div className="mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-pf-line bg-pf-raised shadow-sm sm:grid-cols-2">
        {[
          { label: 'Request date', value: format(order.createdAt, 'MMM dd, yyyy') },
          { label: 'Grower', value: order.grower?.businessName || 'Grower' },
        ].map((item) => (
          <div key={item.label} className="flex min-w-0 items-start justify-between gap-4 bg-pf-surface px-4 py-3 sm:block sm:py-4">
            <p className="shrink-0 text-xs font-semibold uppercase text-pf-muted">{item.label}</p>
            <p className="min-w-0 flex-1 break-words text-right text-sm font-semibold text-pf-text sm:mt-1 sm:text-left sm:text-base">{item.value}</p>
          </div>
        ))}
      </div>

      <details className="mb-2 rounded-lg border border-pf-line bg-pf-surface px-3">
        <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-pf-accent">View timeline</summary>
        <OrderTimeline
        currentStatus={order.status}
        createdAt={order.createdAt}
        shippedAt={order.shippedAt}
        deliveredAt={order.deliveredAt}
        className="mb-3"
        cancelledDescription="This request was cancelled. Message the grower if you need more detail."
      />
      </details>
      <details className="mb-4 rounded-lg border border-pf-line bg-pf-surface px-3">
        <summary className="min-h-10 cursor-pointer content-center text-sm font-medium text-pf-accent">View history</summary>
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
      <Card className="bg-pf-surface shadow-sm border border-pf-line mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Requested items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full divide-y divide-pf-line">
              <thead className="bg-pf-canvas">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-pf-muted uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-pf-muted uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-pf-muted uppercase">Line value</th>
                </tr>
              </thead>
              <tbody className="bg-pf-surface divide-y divide-pf-line">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium text-pf-text">
                      {item.product?.name || 'Unknown Product'}
                      {item.product?.strain && (
                        <span className="text-pf-muted"> ({item.product.strain})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-pf-muted text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-pf-muted text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-pf-text text-right">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-pf-line sm:hidden">
            {order.items.map((item) => (
              <div key={`mobile-${item.id}`} className="space-y-2 px-4 py-3">
                <p className="break-words text-sm font-semibold text-pf-text">
                  {item.product?.name || 'Unknown Product'}
                  {item.product?.strain ? <span className="font-normal text-pf-muted"> ({item.product.strain})</span> : null}
                </p>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 text-pf-muted">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span className="shrink-0 font-semibold text-pf-text">{formatCurrency(item.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-pf-line px-4 py-3 bg-pf-canvas space-y-2 sm:px-6 sm:py-4">
            {(order.tax > 0 || order.shippingFee > 0) && <div className="flex justify-between">
              <span className="text-sm text-pf-muted">Subtotal</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-pf-muted">Recorded tax</span>
                <span className="text-sm font-medium">{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-pf-muted">Shipping estimate</span>
                <span className="text-sm font-medium">{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold text-pf-accent">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasRequestDetails && (
        <Card className="bg-pf-surface border-pf-line">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pf-text">Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-pf-text">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Fulfillment</p>
                <p>{requestNotes.details.fulfillmentMethod || 'Coordinate with grower'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Requested window</p>
                <p>{requestNotes.details.requestedWindow || 'Coordinate after acceptance'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Payment terms</p>
                <p>{requestNotes.details.paymentTerms || 'Handled directly'}</p>
              </div>
            </div>
            {(requestNotes.notesText) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Notes</p>
                <p className="whitespace-pre-wrap break-words">{requestNotes.notesText}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <MobileOrderNavBar ordersHref="/dispensary/orders" ordersLabel="Orders" targetId="buyer-actions" targetLabel="Buyer actions" />
    </div>
  );
}
