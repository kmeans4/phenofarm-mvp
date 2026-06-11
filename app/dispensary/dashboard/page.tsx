import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { EmptyState } from '@/app/components/ui/EmptyState';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';
import { OrdersTable } from './OrdersTable';
import { SetupChecklist } from '@/app/components/ux/SetupChecklist';
import { GuidedFixPanel } from '@/app/components/ux/GuidedFixPanel';
import { RolePrimaryAction } from '@/app/components/ux/RolePrimaryAction';

interface DashboardOrder {
  id: string;
  orderId: string;
  status: string;
  createdAt: Date;
  totalAmount: unknown;
  growerId: string;
  grower: { businessName: string } | null;
}

async function fetchDispensaryDashboardData(dispensaryId: string): Promise<{
  orders: DashboardOrder[];
  activeGrowers: number;
  trackedOrderValue: number;
  pendingOrders: number;
  activeOrders: number;
  profile: {
    businessName: string;
    licenseNumber: string | null;
    licenseStatus: string;
    phone: string | null;
    address: string | null;
  } | null;
  last7Days: { day: string; revenue: number }[];
  featuredProducts: { productId: string; name: string; category: string; pricePerUnit: number; quantity: number; grower: string }[];
}> {
  const [orders, profile] = await Promise.all([
    db.order.findMany({
      where: { dispensaryId },
      include: {
        grower: { select: { businessName: true } },
        items: {
          include: {
            product: {
              select: { name: true, productType: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.dispensary.findUnique({
      where: { id: dispensaryId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseStatus: true,
        phone: true,
        address: true,
      },
    }),
  ]);

  const growerIds = [...new Set(orders.map(o => o.growerId))];
  const activeGrowers = growerIds.length;
  const trackedOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const activeOrders = orders.filter(o => 
    !['DELIVERED', 'CANCELLED'].includes(o.status)
  ).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dayRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      })
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { day: format(date, 'MMM d'), revenue: dayRevenue };
  });

  const featuredProducts = orders
    .flatMap(o => o.items)
    .map(item => ({
      productId: item.productId,
      name: item.product?.name || 'Unknown',
      category: item.product?.productType || 'N/A',
      pricePerUnit: Number(item.unitPrice),
      quantity: item.quantity,
      grower: orders.find(o => o.id === item.orderId)?.grower?.businessName || 'Unknown',
    }))
    .filter((p, i, arr) => arr.findIndex(x => x.productId === p.productId) === i)
    .slice(0, 3);

  return { orders, activeGrowers, trackedOrderValue, pendingOrders, activeOrders, profile, last7Days, featuredProducts };
}

// Empty state for stats
function StatCardEmpty({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 opacity-75">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-400 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">No data yet</p>
    </div>
  );
}

export default async function DispensaryDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/sign_in');
  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };
  if (user.role !== 'DISPENSARY') redirect('/dashboard');

  const data = await fetchDispensaryDashboardData(user.dispensaryId!);
  const hasOrders = data.orders.length > 0;
  const hasSpending = data.last7Days.some((d) => d.revenue > 0);
  const maxDailySpend = Math.max(...data.last7Days.map((d) => d.revenue), 1);
  const hasProfile = Boolean(data.profile?.businessName && data.profile.phone && data.profile.address);
  const hasLicense = Boolean(data.profile?.licenseNumber && data.profile.licenseStatus === 'verified');
  const hasSavedProducts = data.featuredProducts.length > 0 || data.activeGrowers > 0;
  const setupItems = [
    {
      label: 'Profile',
      description: hasProfile ? 'Buyer profile has the basics growers expect.' : 'Add contact and address details for grower trust.',
      href: '/dispensary/settings',
      complete: hasProfile,
      cta: 'Complete profile',
    },
    {
      label: 'License',
      description: hasLicense ? 'Retail license is verified.' : 'Keep license details current for ordering readiness.',
      href: '/dispensary/settings',
      complete: hasLicense,
      cta: 'Review license',
    },
    {
      label: 'Suppliers',
      description: hasSavedProducts ? 'You have supplier history or saved product context.' : 'Browse growers and save useful products.',
      href: '/dispensary/catalog',
      complete: hasSavedProducts,
      cta: 'Browse catalog',
    },
    {
      label: 'Request draft',
      description: data.activeOrders > 0 ? 'You have active requests to track.' : 'Start a request draft when products are ready.',
      href: '/dispensary/cart',
      complete: data.activeOrders > 0,
      cta: 'Open draft',
    },
    {
      label: 'Request tracking',
      description: hasOrders ? 'Request history is available for follow-up.' : 'Submitted requests will appear in request tracking.',
      href: '/dispensary/orders',
      complete: hasOrders,
      cta: 'View requests',
    },
  ];
  const buyerActions = [
    data.pendingOrders > 0
      ? {
          title: `${data.pendingOrders} pending request${data.pendingOrders === 1 ? '' : 's'} waiting on growers`,
          description: 'Review request status and message growers if timing matters.',
          href: '/dispensary/orders',
          cta: 'Track requests',
          tone: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        }
      : null,
    {
      title: 'Review request draft',
      description: 'Confirm quantities, grower splits, logistics, and direct payment terms before submitting.',
      href: '/dispensary/cart',
      cta: 'Open draft',
      tone: 'bg-green-50 border-green-200 text-green-900',
    },
    {
      title: 'Use Saved to revisit products',
      description: 'Favorites, price alerts, and recently ordered products now live together.',
      href: '/dispensary/saved',
      cta: 'Open saved',
      tone: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    {
      title: 'Keep license details current',
      description: 'Verified license status helps growers trust purchase requests.',
      href: '/dispensary/settings',
      cta: 'Open settings',
      tone: 'bg-gray-50 border-gray-200 text-gray-900',
    },
  ].filter((item): item is { title: string; description: string; href: string; cta: string; tone: string } => item !== null);
  const primaryAction = data.pendingOrders > 0
    ? {
        title: 'Track requests waiting on growers',
        description: 'Follow up on pending requests before starting another draft.',
        href: '/dispensary/orders',
        cta: 'Track requests',
        secondaryHref: '/dispensary/cart',
        secondaryCta: 'Open draft',
      }
    : data.activeOrders > 0
      ? {
          title: 'Review active request progress',
          description: 'Check active grower responses, fulfillment status, and direct terms.',
          href: '/dispensary/orders',
          cta: 'Review requests',
          secondaryHref: '/dispensary/catalog',
          secondaryCta: 'Browse catalog',
        }
      : {
          title: 'Build a request from the catalog',
          description: 'Start with products, then confirm logistics and direct payment terms in review.',
          href: '/dispensary/catalog',
          cta: 'Browse products',
          secondaryHref: '/dispensary/saved',
          secondaryCta: 'Open saved',
        };
  const guidedFixes = setupItems
    .filter((item) => !item.complete)
    .slice(0, 3)
    .map((item) => ({
      title: item.label,
      description: item.description,
      href: item.href,
      cta: item.cta || 'Resolve',
      severity: item.label === 'License' ? 'critical' as const : 'warning' as const,
    }));

  // Serialize orders for client component
  const serializedOrders = data.orders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    growerId: order.growerId,
    grower: order.grower,
  }));

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dispensary Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Track estimated request value, monitor grower responses, and quickly revisit trusted products.</p>
        </div>
        <Link href="/dispensary/catalog" className="inline-flex w-full sm:w-auto items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
          Browse Catalog
        </Link>
      </div>

      <RolePrimaryAction {...primaryAction} />

      <SetupChecklist title="Get request-ready faster" items={setupItems} />

      <GuidedFixPanel
        title="Unblock request readiness"
        description="Resolve profile, license, and supplier gaps that slow grower responses."
        fixes={guidedFixes}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority work</p>
            <h2 className="text-lg font-semibold text-gray-900">What to do next</h2>
          </div>
          <Link href="/dispensary/catalog" className="text-sm font-medium text-green-700 hover:text-green-800">
            Browse catalog
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {buyerActions.map((item) => (
            <Link key={item.title} href={item.href} className={`block rounded-lg border p-3 transition hover:shadow-sm ${item.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm opacity-80">{item.description}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-white/80 px-2 py-1 text-xs font-medium">
                  {item.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {hasOrders ? (
          <>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <p className="text-xs sm:text-sm text-gray-600">Estimated Request Value</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">${data.trackedOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <p className="text-xs sm:text-sm text-gray-600">Requests Waiting</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{data.pendingOrders}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <p className="text-xs sm:text-sm text-gray-600">Active Growers</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">{data.activeGrowers}</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <p className="text-xs sm:text-sm text-gray-600">Active Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{data.activeOrders}</p>
            </div>
          </>
        ) : (
          <>
            <StatCardEmpty title="Estimated Request Value" value="$0.00" />
            <StatCardEmpty title="Requests Waiting" value="0" />
            <StatCardEmpty title="Active Growers" value="0" />
            <StatCardEmpty title="Active Requests" value="0" />
          </>
        )}
      </div>

      {/* Recent requests with date filter */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <OrdersTable orders={serializedOrders} />
        </CardHeader>
      </Card>

      {/* Featured Products & 7-Day Order Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recently Requested</h3>
          </CardHeader>
          <CardContent>
            {data.featuredProducts.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                title="No products yet"
                description="Products you request will appear here for quick repeat-request context."
                action={{ label: 'Browse Catalog', href: '/dispensary/catalog' }}
              />
            ) : (
              <div className="space-y-3">
                {data.featuredProducts.map((product) => (
                  <div key={product.productId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category} • from {product.grower}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${product.pricePerUnit.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">7-Day Request Value</h3>
          </CardHeader>
          <CardContent>
            {!hasSpending ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title={hasOrders ? 'No request value in the last 7 days' : 'No request value yet'}
                description={hasOrders ? 'Your existing requests are outside this 7-day window. Use request tracking to review the full history.' : 'Estimated request value will appear here once you submit requests.'}
                action={hasOrders ? { label: 'View All Requests', href: '/dispensary/orders' } : undefined}
              />
            ) : (
              <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 sm:px-0 overflow-x-auto pb-1">
                {data.last7Days.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[36px]">
                    <div className="w-full flex flex-col gap-1">
                      <div className="w-full bg-green-500 rounded-t-lg" style={{ height: `${Math.min((day.revenue / maxDailySpend) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{day.day}</span>
                    <span className="text-xs font-medium text-green-600">${Math.round(day.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasOrders && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">🏪 Welcome to PhenoFarm!</h3>
              <p className="text-blue-700 mt-1">Get started by browsing grower catalogs and finding products for your next request.</p>
            </div>
            <Link 
              href="/dispensary/catalog" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
