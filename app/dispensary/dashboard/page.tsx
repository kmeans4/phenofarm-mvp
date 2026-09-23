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
  const pendingItems = items.filter((item) => !item.complete);
  const completedItems = items.filter((item) => item.complete);

  return (
    <details className="rounded-xl border border-pf-line bg-pf-surface px-4">
      <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-pf-text">
        {complete ? 'Setup complete' : `Setup · ${pendingItems.length} left`}
      </summary>
      <div className="space-y-3 border-t border-pf-line pb-3 pt-1">
        {pendingItems.length > 0 && (
          <div className="divide-y divide-pf-line">
            {pendingItems.map((item) => (
              <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2">
                <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-pf-text">
                  <CircleAlert className="h-4 w-4 shrink-0 text-pf-warning" aria-hidden="true" />
                  {item.label}
                </p>
                <Link href={item.href} className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg">
                  {item.cta || 'Finish setup'}
                </Link>
                <p className="col-span-2 pl-6 text-xs text-pf-muted">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {completedItems.length > 0 && (
          <details className="rounded-lg border border-pf-line bg-pf-canvas px-3">
            <summary className="min-h-10 cursor-pointer content-center text-xs font-medium text-pf-muted">Completed ({completedItems.length})</summary>
            <div className="divide-y divide-pf-line pb-2">
              {completedItems.map((item) => (
                <Link key={item.label} href={item.href} className="flex min-h-10 items-start gap-2 py-2 text-sm hover:text-pf-accent">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pf-accent" aria-hidden="true" />
                  <span className="min-w-0"><span className="block font-medium">{item.label}</span><span className="mt-0.5 block text-xs text-pf-muted">{item.description}</span></span>
                </Link>
              ))}
            </div>
          </details>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-pf-accent-bg px-3 py-2">
          <p className="min-w-0 text-xs text-pf-secondary" title={primaryAction.description}>{primaryAction.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            {primaryAction.secondaryHref && primaryAction.secondaryCta && (
              <Link href={primaryAction.secondaryHref} className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-medium text-pf-secondary hover:bg-pf-raised">{primaryAction.secondaryCta}</Link>
            )}
            <Link href={primaryAction.href} className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-pf-accent hover:bg-pf-raised">{primaryAction.cta}</Link>
          </div>
        </div>
      </div>
    </details>
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
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        mobileInlineActions
        actions={
          <Link href="/dispensary/catalog" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-3 text-sm font-medium text-[#032116] hover:bg-emerald-400">
            Browse catalog
          </Link>
        }
      />

      {data.profile?.licenseStatus === 'pending_review' && !data.profile.licenseNumber ? <LicenseVerificationCard /> : !hasLicense ? (
        <Link href="/dispensary/settings#license-verification" className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-pf-warning-line bg-pf-warning-bg px-3 py-2 text-sm text-pf-warning">
          <span className="flex min-w-0 items-center gap-2"><CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />License verification needed</span>
          <span className="shrink-0 font-medium">Review →</span>
        </Link>
      ) : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {hasOrders ? (
          <>
            <StatCard title="Request value" value={`$${data.trackedOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
            <StatCard title="Awaiting response" value={data.pendingOrders} valueClassName="text-pf-info" />
            <StatCard title="Growers" value={data.activeGrowers} valueClassName="text-pf-warning" />
            <StatCard title="In progress" value={Math.max(0, data.activeOrders - data.pendingOrders)} valueClassName="text-pf-accent" />
          </>
        ) : (
          <>
            <StatCard title="Request value" value="$0.00" helperText="No data yet" isEmpty valueClassName="text-pf-muted" />
            <StatCard title="Awaiting response" value="0" helperText="No data yet" isEmpty valueClassName="text-pf-muted" />
            <StatCard title="Growers" value="0" helperText="No data yet" isEmpty valueClassName="text-pf-muted" />
            <StatCard title="In progress" value="0" helperText="No data yet" isEmpty valueClassName="text-pf-muted" />
          </>
        )}
      </div>


      <Link href="/dispensary/saved" className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-pf-line bg-pf-surface px-4 py-3 text-sm shadow-sm hover:border-pf-accent-line focus-visible:ring-2 focus-visible:ring-emerald-400">
        <span className="font-semibold text-pf-text">Saved</span>
        <span className="text-pf-muted">Favorites {data.favoriteCount} · Alerts {data.priceAlertCount}</span>
      </Link>

      {/* Recent requests with date filter */}
      <Card className="bg-pf-surface shadow-sm border border-pf-line">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-pf-text sm:text-lg">Recent requests</h3>
            </div>
            <Link href="/dispensary/orders" className="inline-flex min-h-10 items-center text-sm font-medium text-pf-accent hover:text-pf-accent">
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

      <div className="space-y-1">
        <SetupNextStepsCard items={setupItems} primaryAction={primaryAction} complete={setupComplete} />
        <details className="text-xs text-pf-muted">
          <summary className="w-fit cursor-pointer py-2">About these totals</summary>
          <p className="mt-1 max-w-2xl">Request value excludes cancelled requests. Awaiting response means the grower has not accepted yet. In progress includes accepted requests through fulfillment.</p>
        </details>
      </div>


      {/* Featured Products & 7-Day Order Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 sm:gap-4">
        <Card className="bg-pf-surface shadow-sm border border-pf-line">
          <CardHeader>
            <h3 className="text-lg font-semibold text-pf-text">Recently requested</h3>
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
                description="Requested products appear here for easy reference."
                action={{ label: 'Browse catalog', href: '/dispensary/catalog' }}
              />
            ) : (
              <div className="space-y-3">
                {data.featuredProducts.map((product) => (
                  <div key={product.productId} className="flex justify-between items-center gap-3 py-2 border-b border-pf-line last:border-0">
                    <div>
                      <p className="break-words text-sm font-medium text-pf-text">{product.name}</p>
                      <p className="text-xs text-pf-muted">{product.category} • from {product.grower}</p>
                    </div>
                    <span className="text-sm font-bold text-pf-text">${product.pricePerUnit.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-pf-surface shadow-sm border border-pf-line">
          <CardHeader>
            <h3 className="text-lg font-semibold text-pf-text">7-day request value</h3>
          </CardHeader>
          <CardContent>
            {!hasSpending ? (
              <p className="text-sm text-pf-muted">No requests this week.</p>
            ) : (
              <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 sm:px-0 overflow-x-auto pb-1">
                {data.last7Days.map((day, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col items-center gap-1 sm:gap-2 min-w-[36px]">
                    <div className="flex min-h-0 w-full flex-1 items-end">
                      <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${Math.min((day.revenue / maxDailySpend) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-pf-muted">{day.day}</span>
                    <span className="text-xs font-medium text-pf-accent">${Math.round(day.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasOrders && (
        <div className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-pf-accent">
                <Store className="h-5 w-5" />
                Find your next grower
              </h3>
              <p className="mt-1 text-sm text-pf-secondary">Browse grower catalogs to start a request.</p>
            </div>
            <Link 
              href="/dispensary/catalog" 
              className="px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Browse catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
