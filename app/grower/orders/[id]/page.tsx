import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import Link from 'next/link';
import OrderStatusTimeline from './components/OrderStatusTimeline';
import QuickStatusUpdate from './components/QuickStatusUpdate';
import PrintButton from './components/PrintButton';

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
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: { name: string; strain: string | null; productType: string | null; subType: string | null; unit: string };
  }>;
}

async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  try {
    const order = await db.order.findUnique({
      where: { id, growerId },
      include: {
        dispensary: true,
        items: { 
          include: { 
            product: {
              include: { strain: { select: { id: true, name: true } } }
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
        totalPrice: Number(item.totalPrice),
        product: item.product ? {
          name: item.product.name,
          strain: item.product.strain?.name || item.product.strainLegacy,
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
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
    SHIPPED: 'bg-orange-100 text-orange-800 border-orange-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border`}>
      {status}
    </Badge>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect('/auth/sign_in');
    }

    const user = (session as any).user as { role: string; growerId?: string };

    if (user.role !== 'GROWER') {
      redirect('/dashboard');
    }

    const { id } = await params;
    const order = await fetchOrder(id, user.growerId!);

    if (!order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600 mb-6">This order may have been deleted or you don&apos;t have permission to view it.</p>
          <Link 
            href="/grower/orders" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/grower/dashboard" className="hover:text-gray-700 transition-colors">
          Dashboard
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/grower/orders" className="hover:text-gray-700 transition-colors">
          Orders
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{order.orderId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Order #{order.orderId}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-gray-600">
              Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link 
              href="/grower/orders" 
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">All Orders</span>
            </Link>
            <Link 
              href={`/grower/orders/${order.id}/edit`}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Edit Order</span>
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Order Items
                <span className="text-sm font-normal text-gray-500">
                  ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                            {item.product?.strain && (
                              <p className="text-sm text-gray-500">{item.product.strain}</p>
                            )}
                            {item.product?.productType && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.product.productType}
                                {item.product.subType && ` - ${item.product.subType}`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600">
                          {formatCurrency(item.unitPrice)}/{item.product?.unit || 'unit'}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900 font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                        {item.product?.strain && (
                          <p className="text-sm text-gray-500 truncate">{item.product.strain}</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatCurrency(item.unitPrice)}/{item.product?.unit || 'unit'}</span>
                      <span className="font-medium text-gray-900">Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">{formatCurrency(order.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Status Update */}
          <QuickStatusUpdate orderId={order.id} currentStatus={order.status} />

          {/* Status Timeline */}
          <OrderStatusTimeline currentStatus={order.status} orderId={order.id} />

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900 text-lg">{order.dispensary.businessName}</p>
              {order.dispensary.phone && (
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {order.dispensary.phone}
                </p>
              )}
              {(order.dispensary.address || order.dispensary.city) && (
                <p className="text-gray-600 mt-2 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {order.dispensary.address}
                    {order.dispensary.address && <br className="hidden sm:inline" />}
                    {order.dispensary.city && `${order.dispensary.city}`}
                    {order.dispensary.state && `, ${order.dispensary.state}`}
                    {order.dispensary.zip && ` ${order.dispensary.zip}`}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Order detail page error:', error);
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">We couldn&apos;t load this order. Please try again.</p>
          <Link 
            href="/grower/orders" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }
}
