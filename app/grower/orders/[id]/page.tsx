import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OrderTimeline } from '@/app/components/ui/OrderTimeline';
import Link from 'next/link';
import QuickStatusUpdate from './components/QuickStatusUpdate';
import PrintButton from './components/PrintButton';
import MessageBuyerButton from './components/MessageBuyerButton';
import { getOrderStatusLabel, parseOrderRequestNotes } from '@/lib/order-workflow';
import { OrderHistory, type OrderHistoryEvent } from '@/app/components/ui/OrderHistory';
import { OrderRecordExport } from '@/app/components/ui/OrderRecordExport';
import { formatProductUnit } from '@/lib/product-display';

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
  statusEvents: OrderHistoryEvent[];
  grower: {
    businessName: string;
  };
  dispensary: {
    id: string;
    businessName: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    isOffPlatform: boolean;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    catalogUnitPrice: number | null;
    priceOverrideReason: string | null;
    totalPrice: number;
    quoted: boolean;
    quoteAcceptedAt: Date | null;
    product?: { name: string; strain: string | null; productType: string | null; subType: string | null; unit: string };
  }>;
}

async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  try {
    const order = await db.order.findUnique({
      where: { id, growerId },
      include: {
        dispensary: { select: { id: true, businessName: true, phone: true, address: true, city: true, state: true, zip: true, isOffPlatform: true } },
        grower: {
          select: {
            businessName: true,
          },
        },
        statusEvents: { orderBy: { createdAt: 'asc' } },
        items: { 
          include: { 
            acceptedQuote: { select: { acceptedAt: true } },
            product: {
              select: { name: true, productType: true, subType: true, unit: true, strain: { select: { name: true } } }
            } 
          } 
        },
      },
    });
    
    if (!order) return null;
    
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingFee: Number(order.shippingFee),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        catalogUnitPrice: item.catalogUnitPrice == null ? null : Number(item.catalogUnitPrice),
        totalPrice: Number(item.totalPrice),
        quoted: Boolean(item.acceptedQuoteId),
        quoteAcceptedAt: item.acceptedQuote?.acceptedAt || null,
        product: item.product ? {
          name: item.product.name,
          strain: item.product.strain?.name || null,
          productType: item.product.productType,
          subType: item.product.subType,
          unit: item.product.unit,
        } : undefined,
      })),
    } as OrderDetail;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-pf-warning-bg text-pf-warning border-pf-warning-line',
    CONFIRMED: 'bg-pf-info-bg text-pf-info border-pf-info-line',
    PROCESSING: 'bg-pf-purple-bg text-pf-purple border-pf-purple-line',
    SHIPPED: 'bg-pf-warning-bg text-pf-warning border-pf-warning-line',
    DELIVERED: 'bg-pf-accent-bg text-pf-accent border-pf-accent-line',
    CANCELLED: 'bg-pf-danger-bg text-pf-danger border-pf-danger-line',
  };

  return (
    <Badge className={`${statusColors[status] || 'bg-pf-surface text-pf-secondary'} border`}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string };

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const { id } = await params;
  let order: Awaited<ReturnType<typeof fetchOrder>> = null;
  let loadError = false;

  try {
    order = await fetchOrder(id, user.growerId!);
  } catch (error) {
    console.error('Order detail page error:', error);
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pf-danger-bg flex items-center justify-center">
            <svg className="w-8 h-8 text-pf-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pf-text mb-2">Something went wrong</h2>
          <p className="text-pf-muted mb-6">We couldn&apos;t load this order. Please try again.</p>
          <Link
            href="/grower/orders"
            className="inline-flex items-center px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

    if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pf-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-pf-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pf-text mb-2">Order not found</h2>
          <p className="text-pf-muted mb-6">This order may have been deleted or you don&apos;t have permission to view it.</p>
          <Link 
            href="/grower/orders" 
            className="inline-flex items-center px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  const requestNotes = parseOrderRequestNotes(order.notes);
  const statusLabel = getOrderStatusLabel(order.status);
  const hasRequestDetails =
    requestNotes.details.fulfillmentMethod ||
    requestNotes.details.requestedWindow ||
    requestNotes.details.paymentTerms ||
    requestNotes.details.buyerNotes ||
    requestNotes.legacyNotes;

  return (
    <div className="w-full space-y-3 sm:space-y-6 sm:pb-24 max-w-7xl mx-auto">
      <section className="order-print-summary" aria-hidden="true">
        <header className="mb-6 border-b border-pf-line-strong pb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-pf-muted">PhenoFarm request summary</p>
          <h1 className="mt-1 text-2xl font-bold text-pf-text">Order Request #{order.orderId}</h1>
          <p className="mt-1 text-sm text-pf-muted">
            Submitted {format(new Date(order.createdAt), 'MMMM d, yyyy \'at\' h:mm a')} - Status: {statusLabel}
          </p>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-pf-muted">Grower</h2>
            <p className="mt-1 font-semibold text-pf-text">{order.grower.businessName}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-pf-muted">Buyer</h2>
            <p className="mt-1 font-semibold text-pf-text">{order.dispensary.businessName}</p>
            {(order.dispensary.address || order.dispensary.city) && (
              <p className="mt-1 text-sm text-pf-secondary">
                {order.dispensary.address}
                {order.dispensary.address && <br />}
                {order.dispensary.city}
                {order.dispensary.state && `, ${order.dispensary.state}`}
                {order.dispensary.zip && ` ${order.dispensary.zip}`}
              </p>
            )}
          </div>
        </div>

        <table className="mb-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-pf-line-strong">
              <th className="py-2 pr-4 font-semibold text-pf-secondary">Item</th>
              <th className="px-4 py-2 text-right font-semibold text-pf-secondary">Unit value</th>
              <th className="px-4 py-2 text-right font-semibold text-pf-secondary">Qty</th>
              <th className="py-2 pl-4 text-right font-semibold text-pf-secondary">Line value</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-pf-line">
                <td className="py-2 pr-4">
                  <p className="font-medium text-pf-text">{item.product?.name || 'Unknown Product'}</p>
                  {(item.product?.strain || item.product?.productType) && (
                    <p className="text-xs text-pf-muted">
                      {[item.product?.strain, item.product?.productType].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-pf-secondary">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-2 text-right text-pf-secondary">{item.quantity}</td>
                <td className="py-2 pl-4 text-right font-medium text-pf-text">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-72 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span>Recorded tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
          )}
          {order.shippingFee > 0 && (
            <div className="flex justify-between">
              <span>Shipping estimate</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-pf-line-strong pt-2 text-base font-bold">
            <span>Est. total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <p className="pt-1 text-xs italic text-pf-muted">
            Payment is arranged directly with the buyer.
          </p>
        </div>
      </section>

      <Link href="/grower/orders" className="inline-flex min-h-10 items-center text-sm font-medium text-pf-accent hover:underline">← Requests</Link>

      <PageHeader
        mobileInlineActions
        title="Request"
        actions={
          <>
            <span className="hidden sm:inline-flex"><StatusBadge status={order.status} /></span>
            <details className="relative">
              <summary className="min-h-10 cursor-pointer rounded-lg border border-pf-line-strong bg-pf-surface px-3 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-canvas">Actions</summary>
              <div className="absolute right-0 z-20 mt-2 grid w-44 gap-2 rounded-xl border border-pf-line bg-pf-surface p-3 shadow-lg">
            <Link
              href={`/grower/orders/${order.id}/edit`}
              className="inline-flex min-h-10 items-center justify-center px-3 py-2 border border-pf-line-strong text-pf-secondary rounded-lg hover:bg-pf-canvas text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <PrintButton />
            <OrderRecordExport order={{ orderId: order.orderId, createdAt: order.createdAt.toISOString(), status: getOrderStatusLabel(order.status), grower: order.grower.businessName, buyer: order.dispensary.businessName, subtotal: order.subtotal, tax: order.tax, shippingFee: order.shippingFee, total: order.totalAmount, items: order.items.map((item) => ({ name: item.product?.name || 'Unknown product', quantity: item.quantity, unit: item.product?.unit || 'unit', unitPrice: item.unitPrice, totalPrice: item.totalPrice, quoted: item.quoted })) }} />
              </div>
            </details>
          </>
        }
      />

      <div className="space-y-1 text-sm text-pf-muted">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all font-medium">#{order.orderId}</p><span className="sm:hidden"><StatusBadge status={order.status} /></span></div>
        <p>Submitted {format(new Date(order.createdAt), 'MMM d, yyyy · h:mm a')}</p>
      </div>
      <QuickStatusUpdate orderId={order.id} currentStatus={order.status} />
      <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-6">
          {/* Items */}
          <Card>
            <CardHeader className="border-b border-pf-line">
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-pf-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Items
                <span className="text-sm font-normal text-pf-muted">
                  ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pf-canvas border-b border-pf-line">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-pf-muted uppercase tracking-wider">Product</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-semibold text-pf-muted uppercase tracking-wider">Price</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-semibold text-pf-muted uppercase tracking-wider">Qty</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[11px] sm:text-xs font-semibold text-pf-muted uppercase tracking-wider">Line value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pf-line">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-pf-canvas transition-colors">
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                          <div>
                            <p className="font-medium text-sm sm:text-base text-pf-text">{item.product?.name || 'Unknown Product'}</p>
                            {item.quoted ? <p className="mt-1 text-xs font-semibold text-pf-accent">Priced by accepted quote{item.quoteAcceptedAt ? ` from ${format(item.quoteAcceptedAt, 'MMM d, yyyy')}` : ''}</p> : null}
                            {item.priceOverrideReason && <p className="mt-1 text-xs text-pf-muted">{item.priceOverrideReason} · Catalog {formatCurrency(item.catalogUnitPrice ?? item.unitPrice)}</p>}
                            {item.product?.strain && (
                              <p className="text-xs sm:text-sm text-pf-muted">{item.product.strain}</p>
                            )}
                            {item.product?.productType && (
                              <p className="text-[11px] text-pf-muted mt-0.5">
                                {item.product.productType}
                                {item.product.subType && ` - ${item.product.subType}`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-4 text-right text-xs sm:text-sm text-pf-muted">
                          {formatCurrency(item.unitPrice)}/{formatProductUnit(item.product?.unit)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-4 text-right text-sm sm:text-base text-pf-text font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-right text-sm sm:text-base text-pf-text font-semibold">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-pf-line">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm text-pf-text">{item.product?.name || 'Unknown Product'}</p>
                        {item.product?.strain && (
                          <p className="text-xs text-pf-muted truncate">{item.product.strain}</p>
                        )}
                      </div>
                      <p className="font-semibold text-pf-text whitespace-nowrap">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-pf-muted">
                      <span>{formatCurrency(item.unitPrice)}/{formatProductUnit(item.product?.unit)}</span>
                      <span className="font-medium text-pf-text">Qty: {item.quantity}</span>
                    </div>
                    {item.priceOverrideReason && <p className="mt-1 text-xs text-pf-muted">{item.priceOverrideReason} · Catalog {formatCurrency(item.catalogUnitPrice ?? item.unitPrice)}</p>}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-pf-line bg-pf-canvas p-3 sm:p-6">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-pf-muted">Subtotal</span>
                    <span className="text-pf-text">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pf-muted">Recorded tax</span>
                      <span className="text-pf-text">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pf-muted">Shipping estimate</span>
                      <span className="text-pf-text">{formatCurrency(order.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-pf-line">
                    <span className="text-pf-text">Est. total</span>
                    <span className="text-pf-accent">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <p className="pt-1 text-xs italic text-pf-muted">
                    Payment is arranged directly with the buyer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasRequestDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg className="w-5 h-5 text-pf-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Request details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-pf-muted">Fulfillment</p>
                    <p className="text-sm text-pf-text">{requestNotes.details.fulfillmentMethod || 'Coordinate with buyer'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-pf-muted">Window</p>
                    <p className="text-sm text-pf-text">{requestNotes.details.requestedWindow || 'Coordinate after acceptance'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-pf-muted">Payment terms</p>
                    <p className="text-sm text-pf-text">{requestNotes.details.paymentTerms || 'Handled directly'}</p>
                  </div>
                </div>
                {(requestNotes.details.buyerNotes || requestNotes.legacyNotes) && (
                  <div>
                    <p className="text-xs font-medium text-pf-muted">Notes</p>
                    <p className="text-pf-secondary whitespace-pre-wrap">{requestNotes.details.buyerNotes || requestNotes.legacyNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3 sm:space-y-6">
          {/* Status Timeline */}
          <details className="rounded-xl border border-pf-line bg-pf-surface">
            <summary className="min-h-10 cursor-pointer px-3 py-2.5 text-sm font-semibold sm:p-4">Progress</summary>
            <div>
              <OrderTimeline
                className="border-0 shadow-none"
                currentStatus={order.status}
                createdAt={order.createdAt}
                shippedAt={order.shippedAt}
                deliveredAt={order.deliveredAt}
              />
            </div>
          </details>
          <details className="rounded-xl border border-pf-line bg-pf-surface px-3 py-1 sm:p-4"><summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold sm:py-0">Request history</summary><div className="mt-3"><OrderHistory events={order.statusEvents} /></div></details>
          {order.createdBy === 'GROWER' ? <div className="rounded-xl border border-pf-info-line bg-pf-info-bg p-4 text-sm text-pf-info">{order.dispensary.isOffPlatform ? 'Off-platform record — no buyer account confirmation is required.' : order.buyerAcknowledgedAt ? `Buyer confirmed ${format(order.buyerAcknowledgedAt, 'MMM d, yyyy h:mm a')}.` : 'Awaiting buyer confirmation.'}</div> : null}

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-pf-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/grower/customers/${order.dispensary.id}/edit`}
                className="inline-flex min-h-10 items-center text-base font-medium sm:text-lg text-pf-text underline-offset-4 hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
              >
                {order.dispensary.businessName}
              </Link>
              {order.dispensary.phone && (
                <p className="text-sm text-pf-muted mt-1 flex sm:text-base items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {order.dispensary.phone}
                </p>
              )}
              {(order.dispensary.address || order.dispensary.city) && (
                <p className="text-sm text-pf-muted mt-2 flex sm:text-base items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {order.dispensary.address}
                    {order.dispensary.address && <br />}
                    {order.dispensary.city && `${order.dispensary.city}`}
                    {order.dispensary.state && `, ${order.dispensary.state}`}
                    {order.dispensary.zip && ` ${order.dispensary.zip}`}
                  </span>
                </p>
              )}
              <MessageBuyerButton
                buyerName={order.dispensary.businessName}
                dispensaryId={order.dispensary.id}
                orderId={order.orderId}
                statusLabel={statusLabel}
              />
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
