import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { AdminVerificationFilters } from "@/app/admin/components/AdminVerificationFilters";
import { ConfirmActionButton } from "@/app/admin/components/ConfirmActionButton";
import { LicenseExpiryBadge } from "@/app/admin/components/LicenseExpiryBadge";
import { SubscriptionStatusBadge } from "@/app/admin/components/SubscriptionStatusBadge";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { startOfLicenseDay } from "@/lib/license";
import type { Prisma } from "@prisma/client";

interface GrowerWithUser {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  licenseExpiry: Date | null;
  isVerified: boolean;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string | null;
    name: string | null;
  };
}

type AdminGrowerSearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
}>;

const PAGE_SIZE = 25;

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function getPageValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildGrowersHref(query: string, status: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status !== 'all') params.set('status', status);
  if (page > 1) params.set('page', String(page));
  const queryString = params.toString();
  return queryString ? `/admin/growers?${queryString}` : '/admin/growers';
}

export default async function AdminGrowersPage({ searchParams }: { searchParams?: AdminGrowerSearchParams }) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const query = getParamValue(params.q).trim();
  const rawStatus = getParamValue(params.status);
  const page = getPageValue(params.page);
  const status: 'all' | 'pending' | 'verified' | 'expiring' | 'expired' = ['verified', 'pending', 'expiring', 'expired'].includes(rawStatus) ? rawStatus as 'pending' | 'verified' | 'expiring' | 'expired' : 'all';
  const now = startOfLicenseDay();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const where: Prisma.GrowerWhereInput = {
    ...(status === 'verified' ? { isVerified: true } : {}),
    ...(status === 'pending' ? { isVerified: false } : {}),
    ...(status === 'expired' ? { licenseExpiry: { lt: now } } : {}),
    ...(status === 'expiring' ? { licenseExpiry: { gte: now, lte: inThirtyDays } } : {}),
    ...(query
      ? {
          OR: [
            { businessName: { contains: query, mode: 'insensitive' } },
            { licenseNumber: { contains: query, mode: 'insensitive' } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  // Fetch growers with error handling
  let growers: GrowerWithUser[] = [];
  let totalGrowerCount = 0;
  try {
    [growers, totalGrowerCount] = await Promise.all([
      db.grower.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.grower.count({ where }),
    ]);
  } catch {
    growers = [];
    totalGrowerCount = 0;
  }

  growers.sort((a, b) => {
    const aExpired = a.licenseExpiry ? a.licenseExpiry < now : false;
    const bExpired = b.licenseExpiry ? b.licenseExpiry < now : false;
    return aExpired === bExpired ? b.createdAt.getTime() - a.createdAt.getTime() : aExpired ? -1 : 1;
  });
  const hasFilters = query.length > 0 || status !== 'all';
  const resultCountLabel = hasFilters
    ? `${totalGrowerCount} ${totalGrowerCount === 1 ? "match" : "matches"}`
    : `${totalGrowerCount} ${totalGrowerCount === 1 ? "grower" : "growers"}`;
  const pageCount = Math.max(1, Math.ceil(totalGrowerCount / PAGE_SIZE));

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <PageHeader
          compact
          title="Growers"
          description="View grower licenses, access, and plans."
          className="md:max-xl:flex-col md:max-xl:items-start"
          actions={
            <AdminVerificationFilters
              key={`growers-${query}-${status}`}
              basePath="/admin/growers"
              entityLabel="growers"
              inputId="grower-search"
              query={query}
              status={status}
              hasFilters={hasFilters}
              resultLabel={resultCountLabel}
            />
          }
        />
      </div>

      <div className="bg-pf-surface rounded-lg border border-pf-line overflow-hidden">
        {growers.length === 0 ? (
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-pf-raised flex items-center justify-center">
              <svg className="w-5 h-5 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-pf-text mb-1">{hasFilters ? 'No matching growers' : 'No growers yet'}</h3>
            <p className="text-sm text-pf-muted mb-4 max-w-sm mx-auto">
              {hasFilters ? 'Try a different search or status filter.' : 'Registered growers appear here.'}
            </p>
            {hasFilters ? (
              <Button variant="secondary" asChild>
                <Link href="/admin/growers">Clear filters</Link>
              </Button>
            ) : (
              <Button variant="primary" asChild>
                <Link href="/auth/sign_up">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add a grower
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
          <div className="divide-y divide-pf-line xl:hidden">
            {growers.map((g) => (
              <article key={`mobile-${g.id}`} className="space-y-3 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold text-pf-text">{g.businessName}</h2>
                    {g.user?.email ? (
                      <a href={`mailto:${g.user.email}`} className="inline-flex min-h-10 items-center break-all text-sm font-medium text-pf-accent hover:underline">
                        {g.user.email}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${g.isVerified ? 'bg-pf-accent-bg text-pf-accent' : 'bg-pf-warning-bg text-pf-warning'}`}>
                      {g.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <SubscriptionStatusBadge plan={g.subscriptionPlan} status={g.subscriptionStatus} currentPeriodEnd={g.subscriptionCurrentPeriodEnd} />
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-xs font-medium uppercase text-pf-muted">License</dt><dd className="mt-1 break-all text-pf-secondary">{g.licenseNumber || 'Not provided'}</dd></div>
                  <div><dt className="text-xs font-medium uppercase text-pf-muted">Expiry</dt><dd className="mt-1"><LicenseExpiryBadge expiresAt={g.licenseExpiry} /></dd></div>
                </dl>
                <ConfirmActionButton
                  actionUrl={`/admin/growers/${g.id}/verify`}
                  actionBody={{ verified: !g.isVerified, expectedUpdatedAt: g.updatedAt.toISOString() }}
                  successMessage={`${g.businessName} ${g.isVerified ? 'unverified' : 'verified'}.`}
                  confirmMessage={`${g.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${g.businessName}?`}
                  confirmTitle={g.isVerified ? 'Remove verification?' : 'Verify grower?'}
                  confirmLabel={g.isVerified ? 'Remove verification' : 'Verify'}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas ${g.isVerified ? 'border border-pf-line bg-pf-raised text-pf-secondary hover:bg-pf-hover' : 'bg-emerald-500 text-pf-canvas hover:bg-emerald-400'}`}
                >
                  {g.isVerified ? 'Unverify' : 'Verify grower'}
                </ConfirmActionButton>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[980px]">
              <thead className="bg-pf-canvas border-b border-pf-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Subscription</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-pf-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pf-line">
                {growers.map((g) => (
                  <tr key={g.id} className="hover:bg-pf-raised">
                    <td className="px-4 py-3">
                      <span className="font-medium text-pf-text">{g.businessName}</span>
                    </td>
                    <td className="px-4 py-3 text-pf-muted">
                      {g.user?.email ? (
                        <a
                          href={`mailto:${g.user.email}`}
                          className="font-medium text-pf-accent hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                        >
                          {g.user.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-pf-muted">{g.licenseNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <LicenseExpiryBadge expiresAt={g.licenseExpiry} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        g.isVerified
                          ? 'bg-pf-accent-bg text-pf-accent'
                          : 'bg-pf-warning-bg text-pf-warning'
                      )}>
                        {g.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SubscriptionStatusBadge
                        plan={g.subscriptionPlan}
                        status={g.subscriptionStatus}
                        currentPeriodEnd={g.subscriptionCurrentPeriodEnd}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-pf-muted">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmActionButton
                        actionUrl={`/admin/growers/${g.id}/verify`}
                  actionBody={{ verified: !g.isVerified, expectedUpdatedAt: g.updatedAt.toISOString() }}
                        successMessage={`${g.businessName} ${g.isVerified ? 'unverified' : 'verified'}.`}
                        confirmMessage={`${g.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${g.businessName}?`}
                        confirmTitle={g.isVerified ? 'Remove verification?' : 'Verify grower?'}
                        confirmLabel={g.isVerified ? 'Remove verification' : 'Verify'}
                        className={'inline-flex h-10 items-center rounded-md px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-60 ' + (
                          g.isVerified
                            ? 'border border-pf-line bg-pf-raised text-pf-secondary hover:bg-pf-hover'
                            : 'bg-emerald-500 text-pf-canvas hover:bg-emerald-400'
                        )}
                      >
                        {g.isVerified ? 'Unverify' : 'Verify'}
                      </ConfirmActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      {pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Grower pages">
          {page > 1 ? (
            <Link
              href={buildGrowersHref(query, status, page - 1)}
              className="inline-flex min-h-10 items-center rounded-md border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-raised"
            >
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-pf-muted">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link
              href={buildGrowersHref(query, status, page + 1)}
              className="inline-flex min-h-10 items-center rounded-md border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-raised"
            >
              Next
            </Link>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}
