import { isLicenseExpired } from '@/lib/license';
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { deliveredValueByDay } from '@/lib/dashboard-metrics';
import Link from 'next/link';
import { format } from 'date-fns';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { ActivityFeed } from './ActivityFeed';
import { getGrowerPlan } from '@/lib/plans';
import { getGrowerAttentionSummary } from '@/lib/grower-attention';
import { GrowerAttentionPanel } from './GrowerAttentionPanel';
import { DeliveredValueChart } from './DeliveredValueChart';
import { OverviewRequests } from './OverviewRequests';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { ArrowRight, ChevronRight, Plus, PackageCheck } from 'lucide-react';
import { ensureWeeklyLicenseExpiryNotification } from '@/lib/notifications';

interface SetupItem {
  label: string;
  description: string;
  href: string;
  complete: boolean;
  cta?: string;
}

function SetupNextStepsCard({ items }: { items: SetupItem[] }) {
  const pending = items.filter((item) => !item.complete);
  const completed = items.filter((item) => item.complete);
  return (
    <details className="rounded-xl border border-pf-line bg-pf-surface px-3 py-1 shadow-sm sm:p-4">
      <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold text-pf-text sm:min-h-0 sm:py-0">Setup · {pending.length ? `${pending.length} left` : 'Complete'}</summary>
      <div className="mt-3 divide-y divide-pf-line">
        {pending.map((item) => <div key={item.label} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-pf-muted">{item.description}</p></div>
          <Link href={item.href} className="rounded-lg border border-pf-line px-3 py-2 text-sm font-semibold text-pf-accent hover:bg-pf-accent-bg">{item.cta || 'Continue'}</Link>
        </div>)}
      </div>
      {completed.length > 0 && <p className="mt-3 text-xs text-pf-muted">Complete: {completed.map(item => item.label).join(', ')}.</p>}
    </details>
  );
}

function WholesaleValueChartEmpty({ hasOrders }: { hasOrders: boolean }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      title={hasOrders ? 'No deliveries in the last 30 days' : 'No delivered value yet'}
      description={
        hasOrders
          ? 'Delivered requests appear here. Payment stays direct with buyers.'
          : 'Add products and receive delivered requests to see estimated value here.'
      }
      action={hasOrders ? { label: 'View all requests', href: '/grower/orders' } : { label: 'Add product', href: '/grower/products/add' }}
    />
  );
}

export default async function GrowerDashboardPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { id: string; role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  // Fetch grower dashboard data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0);
  const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [rawRecentOrders, customerTotals, activeProducts, lowStockProducts, growerProfile, revenueData, attentionSummary, orderStats, lowStockItems, pendingOrders, progressingOrders] = await Promise.all([
    // Only the activity feed is limited; dashboard statistics use aggregate queries.
    db.order.findMany({
      where: { growerId: user.growerId },
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        dispensary: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),

    // Distinct dispensaries this grower has orders with
    db.$queryRaw<{ count: number }[]>(Prisma.sql`SELECT COUNT(DISTINCT "dispensaryId")::int AS count FROM orders WHERE "growerId" = ${user.growerId}`),

    db.product.count({
      where: { growerId: user.growerId, isDeleted: false },
    }),

    db.product.count({
      where: {
        growerId: user.growerId,
        isDeleted: false,
        inventoryQty: { lte: 10 },
      },
    }),

    db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseExpiry: true,
        isVerified: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionCancelAtPeriodEnd: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        commercialMinimumOrder: true,
        commercialFulfillmentMethods: true,
        commercialFulfillmentRegion: true,
        commercialPaymentTerms: true,
        commercialResponseWindow: true,
      },
    }),

    deliveredValueByDay(user.growerId, thirtyDaysAgo, tomorrow, serverTimeZone),

    getGrowerAttentionSummary({
      growerId: user.growerId!,
      userId: user.id,
    }),
    db.order.groupBy({ by: ['status'], where: { growerId: user.growerId }, _count: { _all: true }, _sum: { totalAmount: true } }),
    db.product.findMany({
      where: { growerId: user.growerId, isDeleted: false, inventoryQty: { lte: 10 } },
      select: { id: true, name: true, inventoryQty: true, unit: true, productType: true, images: true },
      orderBy: [{ inventoryQty: 'asc' }, { name: 'asc' }], take: 3,
    }),
    db.order.findMany({
      where: { growerId: user.growerId, status: 'PENDING' },
      select: { id: true, orderId: true, totalAmount: true, status: true, dispensary: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' }, take: 4,
    }),
    db.order.findMany({
      where: { growerId: user.growerId, status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
      select: { id: true, orderId: true, totalAmount: true, status: true, dispensary: { select: { businessName: true } } },
      orderBy: { updatedAt: 'desc' }, take: 4,
    }),
  ]);

  const recentOrders = rawRecentOrders.map((order) => ({
    id: order.id,
    orderId: order.orderId,
    dispensaryName: order.dispensary.businessName,
    totalAmount: Number(order.totalAmount),
    status: order.status as string,
    createdAt: order.createdAt,
  }));

  // Calculate stats
  const stats = {
    totalOrders: orderStats.reduce((sum, group) => sum + group._count._all, 0),
    deliveredWholesaleValue: Number(orderStats.find((group) => group.status === 'DELIVERED')?._sum.totalAmount || 0),
    activeCustomers: customerTotals[0].count,
    pendingOrders: orderStats.find((group) => group.status === 'PENDING')?._count._all || 0,
    activeProducts,
    lowStockProducts,
  };

  const activeRequestCount = orderStats.filter(item => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(item.status)).reduce((sum, item) => sum + item._count._all, 0);
  const delivered30DayValue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
  await ensureWeeklyLicenseExpiryNotification({
    userId: user.id,
    expiry: growerProfile?.licenseExpiry || null,
    settingsHref: '/grower/settings#business-profile',
  });
  const licenseExpired = isLicenseExpired(growerProfile?.licenseExpiry);
  const marketplaceHidden = !growerProfile?.isVerified || licenseExpired;
  const hasWholesaleValue = revenueData.length > 0 && revenueData.some(d => Number(d.revenue) > 0);
  const hasProfile = Boolean(growerProfile?.businessName && growerProfile.phone && growerProfile.address);
  const hasLicense = Boolean(growerProfile?.licenseNumber && growerProfile.licenseExpiry && !isLicenseExpired(growerProfile.licenseExpiry));
  const hasSubscription = getGrowerPlan(growerProfile) !== 'free';
  const hasCommercialTerms = Boolean(
    growerProfile?.commercialMinimumOrder &&
    growerProfile.commercialFulfillmentMethods &&
    growerProfile.commercialFulfillmentRegion &&
    growerProfile.commercialPaymentTerms &&
    growerProfile.commercialResponseWindow
  );

  // Revenue chart data (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return format(date, 'yyyy-MM-dd');
  });

  interface RevenueData {
    date: string;
    revenue: number;
  }

  const chartData = last30Days.map(date => {
    const dayData = revenueData.find((d: RevenueData) => d.date === date);
    return {
      date,
      revenue: dayData ? Number(dayData.revenue) : 0,
    };
  });

  // Calculate max revenue for chart, avoid division by zero

  // Serialize orders for client component
  const serializedOrders = recentOrders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    dispensaryName: order.dispensaryName,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const setupItems = [
    {
      label: 'Profile',
      description: hasProfile ? 'Business profile has the basics buyers need.' : 'Add contact and address details buyers can trust.',
      href: '/grower/settings',
      complete: hasProfile,
      cta: 'Complete profile',
    },
    {
      label: 'License',
      description: hasLicense ? 'License information is current.' : 'Add a current license number and expiry date.',
      href: '/grower/settings',
      complete: hasLicense,
      cta: 'Update license',
    },
    {
      label: 'Subscription',
      description: hasSubscription ? 'Cultivator subscription is active.' : 'Choose a plan for your business.',
      href: '/grower/settings',
      complete: hasSubscription,
      cta: 'Review subscription',
    },
    {
      label: 'Catalog',
      description: stats.activeProducts > 0 ? 'Products are available for buyer discovery.' : 'Add at least one product listing.',
      href: '/grower/products/add',
      complete: stats.activeProducts > 0,
      cta: 'Add product',
    },
    {
      label: 'Commercial terms',
      description: hasCommercialTerms ? 'Your order and payment terms are saved.' : 'Set minimum order, delivery and payment terms.',
      href: '/grower/settings',
      complete: hasCommercialTerms,
      cta: 'Set terms',
    },
    {
      label: 'Request readiness',
      description: stats.pendingOrders > 0 ? 'Buyer requests are waiting for review.' : 'Ready for the first buyer request.',
      href: '/grower/orders',
      complete: stats.pendingOrders > 0 || stats.totalOrders > 0,
      cta: 'Review requests',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        mobileInlineActions hideDescriptionOnMobile
        className="sm:items-center [&_h1]:sm:text-[2.75rem]"
        eyebrow={<span className="font-sans text-xs normal-case tracking-normal text-pf-muted">{format(new Date(), 'EEE, MMM d, yyyy')}</span>}
        title="Overview"
        description="Requests, inventory, and your wholesale business at a glance."
        actions={<Link href="/grower/orders/add" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] transition-colors hover:bg-emerald-400"><Plus className="h-4 w-4" />Record request</Link>}
      />

      {marketplaceHidden ? (
        <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4 text-pf-warning">
          <h2 className="font-semibold">{licenseExpired ? 'License expired — listings are hidden' : 'Awaiting PhenoShop verification'}</h2>
          <p className="mt-1 text-sm">Listings are hidden from buyers until your account and current license are verified. You can keep building and editing the catalog.</p>
          <Link href="/grower/settings#business-profile" className="mt-3 inline-flex text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">Review license details</Link>
        </section>
      ) : null}

      {growerProfile?.subscriptionStatus === 'past_due' ? (
        <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4 text-pf-warning">
          <h2 className="font-semibold">Payment issue — update billing to keep Pro features</h2>
          <Link href="/grower/settings#subscription" className="mt-2 inline-flex text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">Manage billing</Link>
        </section>
      ) : growerProfile?.subscriptionCancelAtPeriodEnd ? (
        <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4 text-sm text-pf-warning">Your paid plan is scheduled to end. New listings and CSV import will follow Free plan limits afterward.</section>
      ) : null}

      <section aria-label="Summary" className="pf-panel grid grid-cols-3 divide-x divide-pf-line">
        {[
          { label: 'Active requests', value: activeRequestCount, href: '/grower/orders', tone: 'text-pf-accent', note: 'Submitted to in transit' },
          { label: 'Delivered value', value: `$${delivered30DayValue.toLocaleString()}`, href: '/grower/reports', tone: 'text-pf-text', note: 'Last 30 days' },
          { label: 'Low stock', value: stats.lowStockProducts, href: '/grower/inventory', tone: 'text-pf-warning', note: '10 units or fewer' },
        ].map(item => <Link key={item.label} href={item.href} className="min-w-0 px-3 py-4 transition-colors hover:bg-pf-raised sm:px-6 sm:py-5"><p className="text-[11px] text-pf-secondary sm:text-sm">{item.label}</p><p className={`mt-1 break-words text-xl font-semibold tracking-tight tabular-nums sm:text-3xl ${item.tone}`}>{item.value}</p><p className="mt-1 text-[10px] text-pf-muted sm:text-xs">{item.note}</p></Link>)}
      </section>

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <OverviewRequests
          pending={pendingOrders.map(order => ({ id: order.id, orderId: order.orderId, buyer: order.dispensary.businessName, status: order.status, value: Number(order.totalAmount) }))}
          inProgress={progressingOrders.map(order => ({ id: order.id, orderId: order.orderId, buyer: order.dispensary.businessName, status: order.status, value: Number(order.totalAmount) }))}
          pendingCount={stats.pendingOrders} inProgressCount={activeRequestCount - stats.pendingOrders}
        />
        <section className="pf-panel flex flex-col" aria-labelledby="overview-inventory-title">
          <div className="flex items-center justify-between gap-2 border-b border-pf-line px-4 py-4 sm:px-5"><h2 id="overview-inventory-title" className="text-base font-semibold">Inventory</h2><Link href="/grower/inventory" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-pf-accent">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="px-4 py-3 sm:px-5">
            <p className="mb-2 text-sm font-medium">Low stock <span className="ml-2 rounded-full border border-pf-warning-line bg-pf-warning-bg px-2 py-0.5 text-xs text-pf-warning">{stats.lowStockProducts}</span></p>
            {lowStockItems.length ? lowStockItems.map(product => <Link key={product.id} href={`/grower/products/${product.id}/edit`} className="flex items-center gap-3 border-t border-pf-line py-3 hover:bg-pf-raised">
              <ProductImage src={product.images[0]} alt={product.name} showPlaceholderLabel={false} className="h-11 w-11 shrink-0 rounded-lg border border-pf-line" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 truncate text-xs text-pf-muted">{product.productType || 'Product'} · {product.unit}</p></div>
              <span className={`shrink-0 text-xs tabular-nums ${product.inventoryQty === 0 ? 'text-pf-danger' : 'text-pf-warning'}`}>{product.inventoryQty} left</span><ChevronRight className="h-4 w-4 shrink-0 text-pf-muted" />
            </Link>) : <div className="flex flex-col items-center gap-2 py-8 text-center"><PackageCheck className="h-7 w-7 text-pf-accent" /><p className="text-sm">{stats.activeProducts ? 'Stock levels look good' : 'Your inventory starts here'}</p><Link href="/grower/products/add" className="text-xs text-pf-accent">Add a product</Link></div>}
          </div>
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="pf-panel p-4 sm:p-5">
          {hasWholesaleValue ? <DeliveredValueChart days={chartData} /> : <><h2 className="text-base font-semibold">Delivered value</h2><p className="mt-1 text-xs text-pf-muted">Last 30 days</p><WholesaleValueChartEmpty hasOrders={stats.totalOrders > 0} /></>}
        </section>
        <section className="pf-panel p-4 sm:p-5"><ActivityFeed orders={serializedOrders} compact /></section>
      </div>
      <GrowerAttentionPanel summary={attentionSummary} />
      <SetupNextStepsCard items={setupItems} />
    </div>
  );
}
