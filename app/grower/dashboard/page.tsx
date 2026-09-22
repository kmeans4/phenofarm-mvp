import { isLicenseExpired } from '@/lib/license';
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../components/OperationsSummary';
import { ActivityFeed } from './ActivityFeed';
import { getGrowerPlan } from '@/lib/plans';
import { getGrowerAttentionSummary } from '@/lib/grower-attention';
import { GrowerAttentionPanel } from './GrowerAttentionPanel';
import { DeliveredValueChartFrame } from './DeliveredValueChartFrame';
import { Sprout } from 'lucide-react';
import { ensureWeeklyLicenseExpiryNotification } from '@/lib/notifications';

interface SetupItem {
  label: string;
  description: string;
  href: string;
  complete: boolean;
  cta?: string;
}

function formatAxisCurrency(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

function SetupNextStepsCard({ items }: { items: SetupItem[] }) {
  const pending = items.filter((item) => !item.complete);
  const completed = items.filter((item) => item.complete);
  return (
    <details className="rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm sm:p-4">
      <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold text-gray-900 sm:min-h-0 sm:py-0">Setup · {pending.length ? `${pending.length} left` : 'Complete'}</summary>
      <div className="mt-3 divide-y divide-gray-100">
        {pending.map((item) => <div key={item.label} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-gray-600">{item.description}</p></div>
          <Link href={item.href} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">{item.cta || 'Continue'}</Link>
        </div>)}
      </div>
      {completed.length > 0 && <p className="mt-3 text-xs text-gray-500">Complete: {completed.map(item => item.label).join(', ')}.</p>}
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
      title={hasOrders ? 'No delivered request value in the last 30 days' : 'No request value yet'}
      description={
        hasOrders
          ? 'This chart only counts requests marked delivered during the last 30 days. Submitted, accepted, ready, cancelled, and older requests stay out of this trend.'
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

  const [rawRecentOrders, customerGroups, activeProducts, lowStockProducts, growerProfile, deliveredRecently, attentionSummary, orderStats] = await Promise.all([
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
    db.order.groupBy({
      by: ['dispensaryId'],
      where: { growerId: user.growerId },
    }),

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

    // Delivered request value for the trailing 30 days
    db.order.findMany({
      where: {
        growerId: user.growerId,
        status: 'DELIVERED',
        OR: [{ deliveredAt: { gte: thirtyDaysAgo } }, { deliveredAt: null, updatedAt: { gte: thirtyDaysAgo } }],
      },
      select: { deliveredAt: true, updatedAt: true, totalAmount: true },
    }),

    getGrowerAttentionSummary({
      growerId: user.growerId!,
      userId: user.id,
    }),
    db.order.groupBy({ by: ['status'], where: { growerId: user.growerId }, _count: { _all: true }, _sum: { totalAmount: true } }),
  ]);

  const recentOrders = rawRecentOrders.map((order) => ({
    id: order.id,
    orderId: order.orderId,
    dispensaryName: order.dispensary.businessName,
    totalAmount: Number(order.totalAmount),
    status: order.status as string,
    createdAt: order.createdAt,
  }));

  const revenueByDate = new Map<string, number>();
  for (const order of deliveredRecently) {
    const date = format(order.deliveredAt || order.updatedAt, 'yyyy-MM-dd');
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(order.totalAmount));
  }
  const revenueData = Array.from(revenueByDate.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate stats
  const stats = {
    totalOrders: orderStats.reduce((sum, group) => sum + group._count._all, 0),
    deliveredWholesaleValue: Number(orderStats.find((group) => group.status === 'DELIVERED')?._sum.totalAmount || 0),
    activeCustomers: customerGroups.length,
    pendingOrders: orderStats.find((group) => group.status === 'PENDING')?._count._all || 0,
    activeProducts,
    lowStockProducts,
  };

  const hasData = stats.totalOrders > 0 || stats.activeProducts > 0;
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
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

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
  const midRevenue = maxRevenue / 2;
  const chartAriaLabel = `Delivered request value bar chart for the last 30 days. Maximum daily value is ${formatAxisCurrency(maxRevenue)}.`;

  return (
    <div className="space-y-3 sm:space-y-6 sm:pb-24">
      <PageHeader
        eyebrow={<span className="hidden sm:inline">Good morning</span>}
        title={growerProfile?.businessName || 'Grower dashboard'}
      />

      {marketplaceHidden ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <h2 className="font-semibold">{licenseExpired ? 'License expired — listings are hidden' : 'Awaiting PhenoFarm verification'}</h2>
          <p className="mt-1 text-sm">Listings are hidden from buyers until your account and current license are verified. You can keep building and editing the catalog.</p>
          <Link href="/grower/settings#business-profile" className="mt-3 inline-flex text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">Review license details</Link>
        </section>
      ) : null}

      {growerProfile?.subscriptionStatus === 'past_due' ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <h2 className="font-semibold">Payment issue — update billing to keep Pro features</h2>
          <Link href="/grower/settings#subscription" className="mt-2 inline-flex text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">Manage billing</Link>
        </section>
      ) : growerProfile?.subscriptionCancelAtPeriodEnd ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Your paid plan is scheduled to end. New listings and CSV import will follow Free plan limits afterward.</section>
      ) : null}

      <OperationsSummary items={[
        { label: 'Requests', value: stats.totalOrders, href: '/grower/orders' },
        { label: 'Delivered value', value: `$${Number(stats.deliveredWholesaleValue || 0).toLocaleString()}`, href: '/grower/reports' },
        { label: 'Customers', value: stats.activeCustomers, href: '/grower/customers' },
        { label: 'Products', value: stats.activeProducts, href: '/grower/catalog' },
      ]} />
      <GrowerAttentionPanel summary={attentionSummary} />
      <SetupNextStepsCard items={setupItems} />

      {/* Delivered value chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Delivered value · 30 days</h2>
        </div>
        <p className="mb-3 text-xs text-gray-500">{format(parseISO(chartData[0].date), 'MMM d')}–{format(parseISO(chartData[chartData.length - 1].date), 'MMM d')} · Payment is arranged directly with buyers.</p>
        {!hasWholesaleValue ? (
          <WholesaleValueChartEmpty hasOrders={stats.totalOrders > 0} />
        ) : (
          <div className="flex min-w-0 gap-3" role="img" aria-label={chartAriaLabel}>
            <div className="flex min-h-40 shrink-0 flex-col justify-between pb-12 text-right text-[10px] font-medium text-gray-400 sm:min-h-48 sm:text-xs" aria-hidden="true">
              <span>{formatAxisCurrency(maxRevenue)}</span>
              <span>{formatAxisCurrency(midRevenue)}</span>
              <span>$0</span>
            </div>
            <DeliveredValueChartFrame>
              <div className="flex h-40 min-w-full items-end justify-between gap-1 px-1 sm:h-48 sm:gap-2 sm:px-2 md:gap-3 md:px-4">
                {chartData.map((day) => (
                  <div key={day.date} className="flex min-w-[40px] flex-1 flex-col items-center gap-1 sm:min-w-[48px] sm:gap-2 md:min-w-[60px]">
                    <div className="group flex h-28 w-full cursor-pointer flex-col items-center justify-end sm:h-36">
                      <div className="z-20 mb-1 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                        ${day.revenue.toLocaleString()}
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          day.revenue > 0
                            ? 'bg-green-500 group-hover:bg-green-600'
                            : 'bg-gray-200'
                        }`}
                        style={{ height: `${Math.min((day.revenue / maxRevenue * 100), 100)}%`, minHeight: day.revenue > 0 ? '4px' : '2px' }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-medium text-gray-500 sm:text-xs">
                      {format(parseISO(day.date), 'M/d')}
                    </span>
                    {day.revenue > 0 && (
                      <span className="whitespace-nowrap text-[9px] font-medium text-gray-600 sm:text-xs">
                        {day.revenue >= 1000 ? `$${(day.revenue / 1000).toFixed(0)}k` : `$${day.revenue}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </DeliveredValueChartFrame>
          </div>
        )}
      </div>

      {/* Recent Activity with Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <ActivityFeed orders={serializedOrders} />
        </div>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div>
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-green-900">
              <Sprout className="h-5 w-5" />
              Welcome to PhenoFarm!
            </h3>
            <p className="text-sm text-green-700 mt-1">You are all set to launch once your first products and requests start coming in.</p>
            <p className="text-xs sm:text-sm text-green-700/90 mt-1">Use the Products area when you are ready to build your catalog and publish listings.</p>
          </div>
        </div>
      )}
    </div>
  );
}
