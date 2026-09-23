import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from 'next/link';
import { SeedDataButton } from "../components/SeedDataButton";
import { ConfirmActionButton } from "@/app/admin/components/ConfirmActionButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatCard } from "@/app/components/ui/StatCard";
import { ArrowRight, Building2, CheckCircle2, Circle, Sprout, Users } from "lucide-react";

type PendingVerificationItem = {
  id: string;
  type: 'grower' | 'dispensary';
  businessName: string;
  email: string | null;
  licenseNumber: string | null;
  createdAt: Date;
};

type AdminPrimaryAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
};

export default async function AdminPage() {
  await requireAdmin();
  const now = new Date();
  // Fetch stats
  let stats = { users: 0, growers: 0, dispensaries: 0, growersToReview: 0, dispensariesToReview: 0, verifiedGrowers: 0 };
  let pendingVerificationItems: PendingVerificationItem[] = [];
  try {
    const [
      users,
      growers,
      dispensaries,
      dispensariesToReview,
      verifiedGrowers,
      pendingGrowers,
      pendingDispensaries,
    ] = await Promise.all([
      db.user.count(),
      db.grower.count(),
      db.dispensary.count({ where: { isOffPlatform: false } }),
      db.dispensary.count({ where: { isVerified: false, isOffPlatform: false } }),
      db.grower.count({ where: { isVerified: true } }),
      db.grower.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          businessName: true,
          licenseNumber: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      db.dispensary.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          businessName: true,
          licenseNumber: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);
    stats = {
      users,
      growers,
      dispensaries,
      growersToReview: Math.max(0, growers - verifiedGrowers),
      dispensariesToReview,
      verifiedGrowers,
    };
    pendingVerificationItems = [
      ...pendingGrowers.map((grower) => ({
        id: grower.id,
        type: 'grower' as const,
        businessName: grower.businessName,
        email: grower.user?.email || null,
        licenseNumber: grower.licenseNumber,
        createdAt: grower.createdAt,
      })),
      ...pendingDispensaries.map((dispensary) => ({
        id: dispensary.id,
        type: 'dispensary' as const,
        businessName: dispensary.businessName,
        email: dispensary.user?.email || null,
        licenseNumber: dispensary.licenseNumber,
        createdAt: dispensary.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  } catch {
    // Keep default stats on error
  }

  const needsSeeding = stats.growers === 0 && stats.dispensaries === 0;
  const seedEnabled = process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production';
  const subscriptionConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    (process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_BUSINESS_PRICE_ID)
  );
  const adminChecklist = [
    {
      label: 'Grower review',
      description: stats.growersToReview === 0 ? 'All growers are reviewed.' : `${stats.growersToReview} grower accounts need review.`,
      href: '/admin/growers',
      complete: stats.growersToReview === 0,
      cta: 'Review growers',
    },
    {
      label: 'Dispensary review',
      description: stats.dispensariesToReview === 0 ? 'All dispensaries are reviewed.' : `${stats.dispensariesToReview} dispensary accounts need review.`,
      href: '/admin/dispensaries',
      complete: stats.dispensariesToReview === 0,
      cta: 'Review dispensaries',
    },
    {
      label: 'Subscription configuration',
      description: subscriptionConfigured
        ? 'Stripe Billing keys and at least one price ID are configured.'
        : 'Confirm Stripe Billing price IDs and support details before enabling paid plans.',
      href: '/admin/settings',
      complete: subscriptionConfigured,
      cta: 'Open settings',
    },
    {
      label: 'Marketplace activity',
      description: stats.growers > 0 && stats.dispensaries > 0 ? 'Marketplace has growers and dispensaries.' : 'Seed or invite both sides of the marketplace.',
      href: needsSeeding ? '#developer-tools' : '/admin/users',
      complete: stats.growers > 0 && stats.dispensaries > 0,
      cta: needsSeeding ? 'Open developer tools' : 'Review users',
    },
  ];
  const primaryAction: AdminPrimaryAction = stats.growersToReview > 0
    ? {
        title: 'Review grower verification queue',
        description: 'Grower access and subscription readiness are the highest-impact admin checks.',
        href: '/admin/growers',
        cta: 'Review growers',
        secondaryHref: '/admin/settings',
        secondaryCta: 'Subscription settings',
      }
    : stats.dispensariesToReview > 0
      ? {
          title: 'Review dispensary verification queue',
          description: 'Clear dispensary verification issues before they submit requests.',
          href: '/admin/dispensaries',
          cta: 'Review dispensaries',
          secondaryHref: '/admin/growers',
          secondaryCta: 'Growers',
        }
      : {
          title: 'Review subscription settings',
          description: 'Keep PhenoFarm subscription configuration current for grower billing.',
          href: '/admin/settings',
          cta: 'Open settings',
      };
  const primaryActionHrefs = new Set([primaryAction.href, primaryAction.secondaryHref].filter(Boolean));
  const pendingChecklist = adminChecklist.filter((item) => !item.complete);
  const completedChecklist = adminChecklist.filter((item) => item.complete);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
          compact
        title="Overview"
        description="Account access and marketplace operations."
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          compact
          title="Users"
          value={stats.users}
          href="/admin/users"
          icon={<Users className="h-5 w-5" />}
          className="sm:p-5"
          valueClassName="text-2xl"
        />
        <StatCard
          compact
          title="Growers"
          value={stats.growers}
          helperText={`${stats.verifiedGrowers} verified`}
          href="/admin/growers"
          icon={<Sprout className="h-5 w-5 text-pf-accent" />}
          className="sm:p-5"
          valueClassName="text-2xl text-pf-accent"
        />
        <StatCard
          compact
          title="Dispensaries"
          value={stats.dispensaries}
          helperText={`${stats.dispensariesToReview} pending`}
          href="/admin/dispensaries"
          icon={<Building2 className="h-5 w-5 text-pf-info" />}
          className="sm:p-5"
          valueClassName="text-2xl text-pf-info"
        />
      </div>

      <section className="rounded-xl border border-pf-line bg-pf-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Operations checklist</p>
            <h2 className="mt-1 text-lg font-semibold text-pf-text">{primaryAction.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-pf-muted">{primaryAction.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
            <Link
              href={primaryAction.href}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-pf-canvas hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              {primaryAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {primaryAction.secondaryHref && primaryAction.secondaryCta ? (
              <Link
                href={primaryAction.secondaryHref}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-pf-line-strong px-4 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                {primaryAction.secondaryCta}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 divide-y divide-pf-line rounded-lg border border-pf-line">
          {pendingChecklist.length ? pendingChecklist.map((item) => (
            <div key={item.label} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  item.complete ? 'bg-pf-accent-bg text-pf-accent' : 'bg-pf-warning-bg text-pf-warning'
                }`}>
                  {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 fill-current" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-pf-text">{item.label}</p>
                  <p className="mt-0.5 text-sm text-pf-muted">{item.description}</p>
                </div>
              </div>
              {primaryActionHrefs.has(item.href) ? null : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas sm:flex-shrink-0"
                >
                  {item.cta}
                </Link>
              )}
            </div>
          )) : <p className="p-3 text-sm text-pf-muted">All checks complete.</p>}
        </div>
        {completedChecklist.length ? (
          <details className="mt-2 text-sm">
            <summary className="min-h-10 cursor-pointer py-2 text-pf-accent">{completedChecklist.length} checks complete</summary>
            <div className="flex flex-wrap gap-2 pt-2">
              {completedChecklist.map((item) => (
                <Link key={item.label} href={item.href} className="rounded-lg bg-pf-accent-bg px-3 py-2 text-pf-accent">
                  {item.label} ✓
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section className="rounded-xl border border-pf-line bg-pf-surface shadow-sm">
        <div className="border-b border-pf-line px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {pendingVerificationItems.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide text-pf-muted">Pending verification</p>}
              <h2 className={pendingVerificationItems.length ? 'mt-1 text-lg font-semibold text-pf-text' : 'text-sm font-medium text-pf-secondary'}>{pendingVerificationItems.length ? 'Newest accounts awaiting review' : 'No accounts awaiting review'}</h2>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/growers?status=pending"
                className="rounded-lg border border-pf-line-strong px-3 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Growers
              </Link>
              <Link
                href="/admin/dispensaries?status=pending"
                className="rounded-lg border border-pf-line-strong px-3 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Dispensaries
              </Link>
            </div>
          </div>
        </div>
        {pendingVerificationItems.length > 0 ? (
          <div className="divide-y divide-pf-line">
            {pendingVerificationItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-pf-text">{item.businessName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.type === 'grower' ? 'bg-pf-accent-bg text-pf-accent' : 'bg-pf-info-bg text-pf-info'
                    }`}>
                      {item.type === 'grower' ? 'Grower' : 'Dispensary'}
                    </span>
                    {now.getTime() - item.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000 ? <span className="rounded-full bg-pf-warning-bg px-2 py-0.5 text-xs font-semibold text-pf-warning">New</span> : null}
                  </div>
                  <p className="mt-1 break-words text-sm text-pf-muted">
                    {item.email || 'No email'} · License {item.licenseNumber || 'not provided'} · Joined {item.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <form action={`/admin/${item.type === 'grower' ? 'growers' : 'dispensaries'}/${item.id}/verify`} method="POST">
                  <ConfirmActionButton
                    confirmMessage={`Verify marketplace access for ${item.businessName}?`}
                    confirmTitle={`Verify ${item.type}?`}
                    confirmLabel="Verify"
                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-pf-canvas hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                  >
                    Verify
                  </ConfirmActionButton>
                </form>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <Link href="/help" className="inline-flex min-h-10 items-center text-sm font-medium text-pf-accent underline underline-offset-2 hover:text-pf-accent">Settlement & billing policy</Link>

      {seedEnabled ? <section id="developer-tools" className="scroll-mt-24 rounded-xl border border-pf-warning-line bg-pf-warning-bg p-3 shadow-sm sm:p-4">
        <details>
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-pf-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-warning focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            Developer tools <span className="ml-2 font-normal text-pf-warning">Demo data seeding</span>
          </summary>
          <div className="mt-3 border-t border-pf-warning-line pt-3">
            <p className="text-sm text-pf-warning">Dev/demo environments only. Never seed production data.</p>
            {needsSeeding && (
              <p className="mt-2 text-sm text-pf-warning">
                No growers or dispensaries were found in this environment.
              </p>
            )}
            <div className="mt-3">
              <SeedDataButton />
            </div>
          </div>
        </details>
      </section> : null}
    </div>
  );
}
