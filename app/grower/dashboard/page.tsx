import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { ActivityFeed } from './ActivityFeed';
import { SetupChecklist } from '@/app/components/ux/SetupChecklist';
import { GuidedFixPanel } from '@/app/components/ux/GuidedFixPanel';
import { RolePrimaryAction } from '@/app/components/ux/RolePrimaryAction';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  isEmpty?: boolean;
  href: string;
  helperText?: string;
}

function StatCard({ title, value, trend, trendUp, isEmpty, href, helperText }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`group block bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isEmpty ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600">{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
            {trend && !isEmpty && (
              <span className={`text-xs sm:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            )}
          </div>
          {isEmpty ? (
            <p className="text-xs text-gray-500 mt-1">{helperText || 'No data yet'}</p>
          ) : helperText ? (
            <p className="text-xs text-gray-500 mt-1">{helperText}</p>
          ) : null}
        </div>
        <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-green-50 group-hover:text-green-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
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
      title={hasOrders ? 'No delivered request value in the last 7 days' : 'No request value yet'}
      description={
        hasOrders
          ? 'This chart only counts requests marked delivered during the last 7 days. Submitted, accepted, ready, cancelled, and older requests stay out of this trend.'
          : 'Add products and receive delivered requests to see estimated value here.'
      }
      action={hasOrders ? { label: 'View all requests', href: '/grower/orders' } : { label: 'Add product', href: '/grower/products/add' }}
    />
  );
}

export default async function GrowerDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch grower dashboard data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [rawRecentOrders, customerGroups, activeProducts, lowStockProducts, growerProfile, deliveredRecently] = await Promise.all([
    // Recent orders (last 100 for client-side filtering)
    db.order.findMany({
      where: { growerId: user.growerId },
      select: {
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
        subscriptionStatus: true,
        subscriptionPlan: true,
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

    // Delivered request value for the trailing 7 days
    db.order.findMany({
      where: {
        growerId: user.growerId,
        status: 'DELIVERED',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  const recentOrders = rawRecentOrders.map((order) => ({
    orderId: order.orderId,
    dispensaryName: order.dispensary.businessName,
    totalAmount: Number(order.totalAmount),
    status: order.status as string,
    createdAt: order.createdAt,
  }));

  const revenueByDate = new Map<string, number>();
  for (const order of deliveredRecently) {
    const date = format(order.createdAt, 'yyyy-MM-dd');
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(order.totalAmount));
  }
  const revenueData = Array.from(revenueByDate.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate stats
  const stats = {
    totalOrders: recentOrders.length,
    deliveredWholesaleValue: recentOrders
      .filter((order) => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
    activeCustomers: customerGroups.length,
    pendingOrders: recentOrders.filter((o) => o.status === 'PENDING').length,
    activeProducts,
    lowStockProducts,
  };

  const hasData = stats.totalOrders > 0 || stats.activeProducts > 0;
  const hasWholesaleValue = revenueData.length > 0 && revenueData.some(d => Number(d.revenue) > 0);
  const hasProfile = Boolean(growerProfile?.businessName && growerProfile.phone && growerProfile.address);
  const hasLicense = Boolean(growerProfile?.licenseNumber && growerProfile.licenseExpiry && new Date(growerProfile.licenseExpiry) > new Date());
  const hasSubscription = growerProfile?.subscriptionStatus === 'active' || growerProfile?.subscriptionPlan === 'pro' || growerProfile?.subscriptionPlan === 'business';
  const hasCommercialTerms = Boolean(
    growerProfile?.commercialMinimumOrder &&
    growerProfile.commercialFulfillmentMethods &&
    growerProfile.commercialFulfillmentRegion &&
    growerProfile.commercialPaymentTerms &&
    growerProfile.commercialResponseWindow
  );

  // Revenue chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'yyyy-MM-dd');
  });

  interface RevenueData {
    date: string;
    revenue: number;
  }

  const chartData = last7Days.map(date => {
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
    orderId: order.orderId,
    dispensaryName: order.dispensaryName,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const actionItems = [
    stats.pendingOrders > 0
      ? {
          title: `${stats.pendingOrders} pending request${stats.pendingOrders === 1 ? '' : 's'} need review`,
          description: 'Confirm, update, or message dispensaries before requests sit too long.',
          href: '/grower/orders',
          cta: 'Review requests',
          tone: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        }
      : null,
    stats.activeProducts === 0
      ? {
          title: 'Build your first catalog listing',
          description: 'Add a product so dispensaries can discover your grower profile.',
          href: '/grower/products/add',
          cta: 'Add product',
          tone: 'bg-green-50 border-green-200 text-green-900',
        }
      : null,
    stats.lowStockProducts > 0
      ? {
          title: `${stats.lowStockProducts} catalog item${stats.lowStockProducts === 1 ? '' : 's'} at low stock`,
          description: 'Review inventory before buyers place orders for scarce products.',
          href: '/grower/inventory',
          cta: 'Open inventory',
          tone: 'bg-red-50 border-red-200 text-red-900',
        }
      : null,
    {
      title: 'Confirm subscription and license setup',
      description: 'Keep PhenoFarm subscription, license, and commercial terms current before taking larger requests.',
      href: '/grower/settings',
      cta: 'Open settings',
      tone: 'bg-blue-50 border-blue-200 text-blue-900',
    },
  ].filter((item): item is { title: string; description: string; href: string; cta: string; tone: string } => item !== null);

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
      description: hasSubscription ? 'Cultivator subscription is active or configured.' : 'Connect the cultivator subscription when Stripe Billing is ready.',
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
      description: hasCommercialTerms ? 'MOQ, fulfillment, response, and direct-payment defaults are saved.' : 'Set MOQ, fulfillment, region, response, and direct-payment defaults.',
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
  const primaryAction = stats.pendingOrders > 0
    ? {
        title: 'Review pending buyer requests',
        description: 'Pending requests are the fastest path to keeping buyers moving.',
        href: '/grower/orders',
        cta: 'Review requests',
        secondaryHref: '/grower/products',
        secondaryCta: 'Check catalog',
      }
    : stats.activeProducts === 0
      ? {
          title: 'Publish your first catalog listing',
          description: 'A visible product gives dispensaries something concrete to request.',
          href: '/grower/products/add',
          cta: 'Add product',
          secondaryHref: '/grower/products',
          secondaryCta: 'Quick add',
        }
      : stats.lowStockProducts > 0
        ? {
            title: 'Fix low inventory before requests arrive',
            description: 'Update scarce products so buyers see accurate availability.',
            href: '/grower/inventory',
            cta: 'Open inventory',
            secondaryHref: '/grower/products',
            secondaryCta: 'Bulk edit',
          }
        : {
            title: 'Open catalog workspace',
            description: 'Review visibility, pricing, and stock health from one focused workspace.',
            href: '/grower/catalog',
            cta: 'Open workspace',
            secondaryHref: '/grower/orders',
            secondaryCta: 'View requests',
          };
  const guidedFixes = setupItems
    .filter((item) => !item.complete)
    .slice(0, 3)
    .map((item) => ({
      title: item.label,
      description: item.description,
      href: item.href,
      cta: item.cta || 'Resolve',
      severity: item.label === 'Subscription' || item.label === 'License' ? 'critical' as const : 'warning' as const,
    }));

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Grower Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Track buyer requests, estimated value, and catalog health from one place.</p>
      </div>

      <RolePrimaryAction {...primaryAction} />

      <SetupChecklist title="Get marketplace-ready faster" items={setupItems} />

      <GuidedFixPanel
        title="Unblock buyer readiness"
        description="Fix these account and catalog gaps before depending on buyer requests."
        fixes={guidedFixes}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority work</p>
            <h2 className="text-lg font-semibold text-gray-900">What needs attention next</h2>
          </div>
          <Link href="/grower/catalog" className="text-sm font-medium text-green-700 hover:text-green-800">
            Open catalog workspace
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {actionItems.slice(0, 4).map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`block rounded-lg border p-3 transition hover:shadow-sm ${item.tone}`}
            >
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
        <StatCard 
          title="Total Requests" 
          value={stats.totalOrders} 
          isEmpty={stats.totalOrders === 0}
          href="/grower/orders"
          helperText={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending review` : 'View request history'}
        />
        <StatCard 
          title="Delivered Request Value" 
          value={isNaN(stats.deliveredWholesaleValue) ? '$0.00' : `\u0024${Number(stats.deliveredWholesaleValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          isEmpty={stats.deliveredWholesaleValue === 0}
          href="/grower/reports"
          helperText={stats.totalOrders > 0 ? 'Value tracked only; settlement is direct' : 'Delivered requests will count here'}
        />
        <StatCard 
          title="Active Customers" 
          value={stats.activeCustomers} 
          isEmpty={stats.activeCustomers === 0}
          href="/grower/customers"
          helperText={stats.activeCustomers > 0 ? 'Manage dispensary relationships' : 'Add or review customer accounts'}
        />
        <StatCard 
          title="Active Products" 
          value={stats.activeProducts}
          isEmpty={stats.activeProducts === 0}
          href="/grower/catalog"
          helperText={stats.activeProducts > 0 ? 'Manage your catalog' : 'Start building your catalog'}
        />
      </div>

      {/* Delivered value chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Delivered Request Value (Last 7 Days)</h2>
          <span className="text-xs text-gray-400 sm:hidden">← swipe →</span>
        </div>
        {!hasWholesaleValue ? (
          <WholesaleValueChartEmpty hasOrders={stats.totalOrders > 0} />
        ) : (
          <div className="relative">
            {/* Mobile scroll hint - enhanced */}
            <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent pl-4 pr-1">
              <div className="bg-gray-100 rounded-full p-1.5 shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div 
              className="h-40 sm:h-48 md:h-64 flex items-end justify-between gap-1 sm:gap-2 md:gap-3 px-2 sm:px-4 overflow-x-auto pb-2 -mx-3 sm:-mx-0 px-3 sm:px-4 scrollbar-hide snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[40px] sm:min-w-[48px] md:min-w-[60px] snap-center">
                  {/* Bar container with larger touch target */}
                  <div className="w-full flex flex-col items-center justify-end h-28 sm:h-36 md:h-48 group cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-20 hidden sm:block">
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
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap font-medium">
                    {format(new Date(day.date), 'EEE')}
                  </span>
                  {/* Revenue label - show on mobile only for larger values */}
                  {day.revenue > 0 && (
                    <span className="text-[9px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                      {day.revenue >= 1000 ? `$${(day.revenue / 1000).toFixed(0)}k` : `$${day.revenue}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity with Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Activity Feed</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Track new requests by timeframe without leaving the dashboard.</p>
          </div>
          <Link href="/grower/orders" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
            View All Requests
          </Link>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <ActivityFeed orders={serializedOrders} />
        </div>
      </div>

      {/* Getting Started Banner - only show when no data */}
      {!hasData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-green-900">🌱 Welcome to PhenoFarm!</h3>
            <p className="text-sm text-green-700 mt-1">You are all set to launch once your first products and requests start coming in.</p>
            <p className="text-xs sm:text-sm text-green-700/90 mt-1">Use the Products area when you are ready to build your catalog and publish listings.</p>
          </div>
        </div>
      )}
    </div>
  );
}
