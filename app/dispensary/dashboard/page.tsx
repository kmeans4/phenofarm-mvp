import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { StatCard } from '@/app/components/ui/StatCard';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';
import { OrdersTable } from '../components/OrdersTable';
import { CheckCircle2, CircleAlert, Store } from 'lucide-react';
import { LicenseVerificationCard } from './LicenseVerificationCard';
import { ensureWeeklyLicenseExpiryNotification } from '@/lib/notifications';

interface DashboardOrder {
  id: string;
  orderId: string;
  status: string;
  createdAt: Date;
  totalAmount: unknown;
  growerId: string;
  grower: { businessName: string } | null;
}

interface SetupItem {
  label: string;
  description: string;
  href: string;
  complete: boolean;
  cta?: string;
}

interface PrimaryAction {
  title: string;
  description: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
}

function SetupNextStepsCard({
  items,
  primaryAction,
  complete,
}: {
  items: SetupItem[];
  primaryAction: PrimaryAction;
  complete: boolean;
}) {
  const completeCount = items.filter((item) => item.complete).length;
  const percent = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  if (complete) {
    return (
      <Link href="/dispensary/settings#license-verification" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Verified buyer
      </Link>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:pr-16">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Setup & next steps</p>
            <h2 className="mt-1 text-lg font-semibold text-green-950">{primaryAction.title}</h2>
            <p className="mt-1 text-sm text-green-900">{primaryAction.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {primaryAction.secondaryHref && primaryAction.secondaryCta && (
              <Link
                href={primaryAction.secondaryHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-green-200 bg-white px-4 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {primaryAction.secondaryCta}
              </Link>
            )}
            <Link
              href={primaryAction.href}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              {primaryAction.cta}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Buyer readiness</h3>
          <p className="mt-1 text-sm text-gray-600">{completeCount} of {items.length} complete</p>
        </div>
        <div className="min-w-[140px]">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-gray-500">{percent}% ready</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                item.complete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`} aria-hidden="true">
                {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
            {item.complete ? (
              <span className="shrink-0 self-start rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100 sm:self-auto">
                Complete
              </span>
            ) : (
              <Link
                href={item.href}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {item.cta || 'Finish setup'}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

async function fetchDispensaryDashboardData(dispensaryId: string): Promise<{
  orders: DashboardOrder[];
  activeGrowers: number;
  trackedOrderValue: number;
  pendingOrders: number;
  activeOrders: number;
  favoriteCount: number;
  priceAlertCount: number;
  profile: {
    businessName: string;
    licenseNumber: string | null;
    licenseStatus: string;
    licenseExpiry: Date | null;
    phone: string | null;
    address: string | null;
  } | null;
  last7Days: { day: string; revenue: number }[];
  featuredProducts: { productId: string; name: string; category: string; pricePerUnit: number; quantity: number; grower: string }[];
}> {
  const since = startOfDay(subDays(new Date(), 6));
  const [orders, profile, favoriteCount, priceAlertCount, statusTotals, growers, weekOrders, featuredItems] = await Promise.all([
    db.order.findMany({ where: { dispensaryId }, select: {
      id: true, orderId: true, status: true, createdAt: true, totalAmount: true, growerId: true,
      grower: { select: { businessName: true } },
    }, orderBy: { createdAt: 'desc' }, take: 10 }),
    db.dispensary.findUnique({
      where: { id: dispensaryId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseStatus: true,
        licenseExpiry: true,
        phone: true,
        address: true,
      },
    }),
    db.dispensaryFavoriteProduct.count({ where: { dispensaryId } }),
    db.dispensaryPriceAlert.count({ where: { dispensaryId } }),
    db.order.groupBy({ by: ['status'], where: { dispensaryId }, _count: { _all: true }, _sum: { totalAmount: true } }),
    db.order.groupBy({ by: ['growerId'], where: { dispensaryId, status: { not: 'CANCELLED' } } }),
    db.order.findMany({ where: { dispensaryId, createdAt: { gte: since }, status: { not: 'CANCELLED' } }, select: { createdAt: true, totalAmount: true } }),
    db.orderItem.findMany({ where: { order: { dispensaryId, status: { not: 'CANCELLED' } } }, distinct: ['productId'], orderBy: { createdAt: 'desc' }, take: 3,
      select: { productId: true, unitPrice: true, quantity: true, product: { select: { name: true, productType: true } }, grower: { select: { businessName: true } } } }),
  ]);

  const activeGrowers = growers.length;
  const trackedOrderValue = statusTotals.filter(row => row.status !== 'CANCELLED').reduce((sum, row) => sum + Number(row._sum.totalAmount ?? 0), 0);
  const pendingOrders = statusTotals.find(row => row.status === 'PENDING')?._count._all ?? 0;
  const activeOrders = statusTotals.filter(row => !['DELIVERED', 'CANCELLED'].includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dayRevenue = weekOrders
      .filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      })
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { day: format(date, 'MMM d'), revenue: dayRevenue };
  });

  const featuredProducts = featuredItems.map(item => ({
    productId: item.productId, name: item.product.name, category: item.product.productType || 'N/A',
    pricePerUnit: Number(item.unitPrice), quantity: item.quantity, grower: item.grower.businessName,
  }));

  return {
    orders,
    activeGrowers,
    trackedOrderValue,
    pendingOrders,
    activeOrders,
    favoriteCount,
    priceAlertCount,
    profile,
    last7Days,
    featuredProducts,
  };
}

export default async function DispensaryDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect('/auth/sign_in');
  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };
  if (user.role !== 'DISPENSARY' || !user.dispensaryId) redirect('/dashboard');

  const data = await fetchDispensaryDashboardData(user.dispensaryId!);
  await ensureWeeklyLicenseExpiryNotification({
    userId: (session.user as { id: string }).id,
    expiry: data.profile?.licenseExpiry || null,
    settingsHref: '/dispensary/settings#license',
  });
  const hasOrders = data.orders.length > 0;
  const hasSpending = data.last7Days.some((d) => d.revenue > 0);
  const maxDailySpend = Math.max(...data.last7Days.map((d) => d.revenue), 1);
  const hasProfile = Boolean(data.profile?.businessName && data.profile.phone && data.profile.address);
  const hasLicense = Boolean(data.profile?.licenseNumber && data.profile.licenseStatus === 'verified');
  const hasSavedProducts = data.favoriteCount > 0 || data.priceAlertCount > 0 || data.featuredProducts.length > 0 || data.activeGrowers > 0;
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
  const setupComplete = setupItems.every((item) => item.complete);
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
      <PageHeader
        title={data.profile?.businessName || 'Dispensary dashboard'}
        actions={
          <Link href="/dispensary/catalog" className="inline-flex w-full sm:w-auto items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
            Browse Catalog
          </Link>
        }
      />

      {data.profile?.licenseStatus === 'pending_review' && !data.profile.licenseNumber ? <LicenseVerificationCard /> : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {hasOrders ? (
          <>
            <StatCard title="Request value" value={`$${data.trackedOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
            <StatCard title="Awaiting response" value={data.pendingOrders} valueClassName="text-blue-600" />
            <StatCard title="Growers" value={data.activeGrowers} valueClassName="text-yellow-600" />
            <StatCard title="In progress" value={Math.max(0, data.activeOrders - data.pendingOrders)} valueClassName="text-green-600" />
          </>
        ) : (
          <>
            <StatCard title="Request value" value="$0.00" helperText="No data yet" isEmpty valueClassName="text-gray-400" />
            <StatCard title="Awaiting response" value="0" helperText="No data yet" isEmpty valueClassName="text-gray-400" />
            <StatCard title="Growers" value="0" helperText="No data yet" isEmpty valueClassName="text-gray-400" />
            <StatCard title="In progress" value="0" helperText="No data yet" isEmpty valueClassName="text-gray-400" />
          </>
        )}
      </div>

      <div className={setupComplete ? 'flex flex-wrap items-center justify-between gap-2' : 'space-y-3'}>
        <SetupNextStepsCard items={setupItems} primaryAction={primaryAction} complete={setupComplete} />
        <details className="text-xs text-gray-500">
          <summary className="w-fit cursor-pointer py-2">About these totals</summary>
          <p className="mt-1 max-w-2xl">Request value excludes cancelled requests. Awaiting response means the grower has not accepted yet. In progress includes accepted requests through fulfillment.</p>
        </details>
      </div>

      <Link href="/dispensary/saved" className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm hover:border-green-200 focus-visible:ring-2 focus-visible:ring-green-600">
        <span className="font-semibold text-gray-900">Saved</span>
        <span className="text-gray-600">Favorites {data.favoriteCount} · Alerts {data.priceAlertCount}</span>
      </Link>

      {/* Recent requests with date filter */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Recent requests</h3>
            </div>
            <Link href="/dispensary/orders" className="inline-flex min-h-10 items-center text-sm font-medium text-green-700 hover:text-green-800">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <OrdersTable
            orders={serializedOrders}
            compact
            maxRows={5}
            showFilters={false}
            showWorkflowViews={false}
            showResultCount={false}
          />
        </CardContent>
      </Card>

      {/* Featured Products & 7-Day Order Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 sm:gap-4">
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
              <p className="text-sm text-gray-500">No requests this week.</p>
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
              <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                <Store className="h-5 w-5" />
                Welcome to PhenoFarm!
              </h3>
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
