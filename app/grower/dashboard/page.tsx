import { signInDestination } from '@/lib/auth-navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { isLicenseExpired } from '@/lib/license';
import { getGrowerAttentionSummary } from '@/lib/grower-attention';
import { deliveredValueByDay } from '@/lib/dashboard-metrics';
import {
  marketplaceDateKey,
  shiftDateKey,
  marketplaceDayStart,
} from '@/lib/report-range';
import { formatMoney, formatQuantity } from '@/lib/format';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { Button } from '@/app/components/ui/Button';
import { GrowerAttentionPanel } from './GrowerAttentionPanel';
import { DeliveredValueChart } from './DeliveredValueChart';
import { ensureWeeklyLicenseExpiryNotification } from '@/lib/notifications';
export default async function GrowerDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect(await signInDestination());
  const user = session.user;
  if (user.role !== 'GROWER' || !user.growerId) redirect('/dashboard');
  const today = marketplaceDateKey();
  const since = marketplaceDayStart(shiftDateKey(today, -29))!;
  const until = marketplaceDayStart(shiftDateKey(today, 1))!;
  const lowWhere = {
    growerId: user.growerId,
    isDeleted: false,
    status: 'PUBLISHED' as const,
    isAvailable: true,
    isPriceVisible: true,
    OR: [
      { unit: { in: ['Lb', 'lb', 'pound'] }, inventoryQty: { gt: 0, lte: 1 } },
      {
        unit: { in: ['Ounce', 'Half Ounce'] },
        inventoryQty: { gt: 0, lte: 8 },
      },
      {
        unit: { notIn: ['Lb', 'lb', 'pound', 'Ounce', 'Half Ounce'] },
        inventoryQty: { gt: 0, lte: 10 },
      },
    ],
  };
  const [grower, products, attention, groups, revenue, lowStock, lowCount] =
    await Promise.all([
      db.grower.findUniqueOrThrow({
        where: { id: user.growerId },
        select: {
          businessName: true,
          phone: true,
          address: true,
          licenseNumber: true,
          licenseExpiry: true,
          isVerified: true,
          logo: true,
          commercialTermsUpdatedAt: true,
          commercialPaymentTerms: true,
          commercialFulfillmentMethods: true,
          subscriptionStatus: true,
        },
      }),
      db.product.count({
        where: { growerId: user.growerId, isDeleted: false },
      }),
      getGrowerAttentionSummary({ growerId: user.growerId, userId: user.id }),
      db.order.groupBy({
        by: ['status'],
        where: { growerId: user.growerId },
        _count: { _all: true },
      }),
      deliveredValueByDay(user.growerId, since, until, 'America/New_York'),
      db.product.findMany({
        where: lowWhere,
        orderBy: { inventoryQty: 'asc' },
        take: 4,
        select: { id: true, name: true, inventoryQty: true, unit: true },
      }),
      db.product.count({ where: lowWhere }),
    ]);
  await ensureWeeklyLicenseExpiryNotification({
    userId: user.id,
    expiry: grower.licenseExpiry,
    settingsHref: '/grower/settings#license',
  });
  const pending = attention.counts.pendingRequests;
  const active = groups
    .filter((g) => !['DELIVERED', 'CANCELLED'].includes(g.status))
    .reduce((n, g) => n + g._count._all, 0);
  const setup = [
    {
      label: 'Business profile',
      done: !!(grower.businessName && grower.phone && grower.address),
      href: '/grower/settings#profile',
    },
    {
      label: 'License approved',
      done: grower.isVerified && !isLicenseExpired(grower.licenseExpiry),
      href: '/grower/settings#license',
    },
    {
      label: 'Order terms',
      done: !!(
        grower.commercialTermsUpdatedAt &&
        grower.commercialPaymentTerms &&
        grower.commercialFulfillmentMethods
      ),
      href: '/grower/settings#terms',
    },
    {
      label: 'First product',
      done: products > 0,
      href: '/grower/products/add',
    },
    {
      label: 'Business logo',
      done: !!grower.logo,
      href: '/grower/settings#branding',
    },
  ];
  const chart = Array.from({ length: 30 }, (_, i) => {
    const date = shiftDateKey(today, i - 29);
    return {
      date,
      revenue: revenue.find((d) => d.date === date)?.revenue || 0,
    };
  });
  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        actions={
          <>
            <Button variant={pending ? 'outline' : 'primary'} asChild>
              <Link href="/grower/orders/add">Record order</Link>
            </Button>
            {pending > 0 && (
              <Button asChild>
                <Link href="/grower/orders?view=needs-review">
                  Review {pending} new {pending === 1 ? 'order' : 'orders'}
                </Link>
              </Button>
            )}
          </>
        }
      />
      {setup.some((x) => !x.done) && (
        <section className="pf-panel p-4">
          <h2 className="font-semibold">
            Finish setup · {setup.filter((x) => x.done).length} of{' '}
            {setup.length}
          </h2>
          <div className="mt-2 divide-y divide-pf-line">
            {setup
              .filter((x) => !x.done)
              .map((x) => (
                <Link
                  key={x.label}
                  href={x.href}
                  className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm"
                >
                  <span>{x.label}</span>
                  <span className="text-pf-accent">Continue →</span>
                </Link>
              ))}
          </div>
        </section>
      )}
      {(!grower.isVerified || isLicenseExpired(grower.licenseExpiry)) && (
        <div className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4 text-sm text-pf-warning">
          {isLicenseExpired(grower.licenseExpiry)
            ? 'License expired — listings are hidden.'
            : 'Listings are hidden until your license is approved.'}{' '}
          <Link
            href="/grower/settings#license"
            className="inline-flex min-h-11 items-center font-semibold underline"
          >
            Review license
          </Link>
        </div>
      )}
      {grower.subscriptionStatus === 'past_due' && (
        <Link
          href="/grower/settings#subscription"
          className="block rounded-xl bg-pf-warning-bg p-4 text-sm text-pf-warning"
        >
          Payment failed — update billing
        </Link>
      )}
      <div className="grid grid-cols-3 divide-x divide-pf-line rounded-xl border border-pf-line bg-pf-surface">
        {[
          { label: 'Active orders', value: active, href: '/grower/orders' },
          {
            label: 'Delivered · 30 days',
            value: formatMoney(revenue.reduce((n, d) => n + d.revenue, 0)),
            href: '/grower/reports?range=30d',
          },
          {
            label: 'Low stock',
            value: lowCount,
            href: '/grower/products?view=low-stock',
          },
        ].map((x) => (
          <Link key={x.label} href={x.href} className="min-w-0 p-3 sm:p-5">
            <p className="text-sm text-pf-muted">{x.label}</p>
            <strong className="mt-1 block break-words text-lg sm:text-2xl">
              {x.value}
            </strong>
          </Link>
        ))}
      </div>
      <GrowerAttentionPanel summary={attention} />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="pf-panel p-4 sm:p-5">
          <DeliveredValueChart days={chart} />
          <p className="mt-2 text-sm text-pf-muted">
            Last 30 days, by delivery date.
          </p>
        </section>
        <section className="pf-panel p-4 sm:p-5">
          <h2 className="font-semibold">Low stock</h2>
          {lowStock.length ? (
            lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/grower/products/${p.id}/edit`}
                className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-pf-line py-3 text-sm"
              >
                <span>{p.name}</span>
                <span className="text-pf-warning">
                  {formatQuantity(p.inventoryQty, p.unit)}
                </span>
              </Link>
            ))
          ) : (
            <p className="mt-3 text-sm text-pf-muted">
              No live listings need restocking.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
