import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { AdminVerificationFilters } from "@/app/admin/components/AdminVerificationFilters";
import { ConfirmActionButton } from "@/app/admin/components/ConfirmActionButton";
import { LicenseExpiryBadge } from "@/app/admin/components/LicenseExpiryBadge";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { startOfLicenseDay } from "@/lib/license";
import type { Prisma } from "@prisma/client";

interface DispensaryWithUser {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  licenseExpiry: Date | null;
  licenseReviewNotes: string | null;
  isVerified: boolean;
  licenseStatus: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string | null;
    name: string | null;
  } | null;
}

type AdminDispensarySearchParams = Promise<{
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

function buildDispensariesHref(query: string, status: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status !== 'all') params.set('status', status);
  if (page > 1) params.set('page', String(page));
  const queryString = params.toString();
  return queryString ? `/admin/dispensaries?${queryString}` : '/admin/dispensaries';
}

export default async function AdminDispensariesPage({ searchParams }: { searchParams?: AdminDispensarySearchParams }) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const query = getParamValue(params.q).trim();
  const rawStatus = getParamValue(params.status);
  const page = getPageValue(params.page);
  const status: 'all' | 'pending' | 'verified' | 'expiring' | 'expired' = ['verified', 'pending', 'expiring', 'expired'].includes(rawStatus) ? rawStatus as 'pending' | 'verified' | 'expiring' | 'expired' : 'all';
  const now = startOfLicenseDay();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const where: Prisma.DispensaryWhereInput = {
    isOffPlatform: false,
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

  // Fetch dispensaries with error handling
  let dispensaries: DispensaryWithUser[] = [];
  let totalDispensaryCount = 0;
  try {
    [dispensaries, totalDispensaryCount] = await Promise.all([
      db.dispensary.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.dispensary.count({ where }),
    ]);
  } catch {
    dispensaries = [];
    totalDispensaryCount = 0;
  }

  dispensaries.sort((a, b) => {
    const aExpired = a.licenseExpiry ? a.licenseExpiry < now : false;
    const bExpired = b.licenseExpiry ? b.licenseExpiry < now : false;
    return aExpired === bExpired ? b.createdAt.getTime() - a.createdAt.getTime() : aExpired ? -1 : 1;
  });
  const hasFilters = query.length > 0 || status !== 'all';
  const resultCountLabel = hasFilters
    ? `${totalDispensaryCount} ${totalDispensaryCount === 1 ? "match" : "matches"}`
    : `${totalDispensaryCount} ${totalDispensaryCount === 1 ? "dispensary" : "dispensaries"}`;
  const pageCount = Math.max(1, Math.ceil(totalDispensaryCount / PAGE_SIZE));

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <PageHeader
          compact
          title="Dispensaries"
          description="View dispensary licenses and access."
          className="md:max-xl:flex-col md:max-xl:items-start"
          actions={
            <AdminVerificationFilters
              key={`dispensaries-${query}-${status}`}
              basePath="/admin/dispensaries"
              entityLabel="dispensaries"
              inputId="dispensary-search"
              query={query}
              status={status}
              hasFilters={hasFilters}
              resultLabel={resultCountLabel}
            />
          }
        />
      </div>

      <div className="bg-pf-surface rounded-lg border border-pf-line overflow-hidden">
        {dispensaries.length === 0 ? (
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-pf-raised flex items-center justify-center">
              <svg className="w-5 h-5 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1-1h2 0 011a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-pf-text mb-1">{hasFilters ? 'No matching dispensaries' : 'No dispensaries yet'}</h3>
            <p className="text-sm text-pf-muted mb-4 max-w-sm mx-auto">
              {hasFilters ? 'Try a different search or status filter.' : 'Registered dispensaries appear here.'}
            </p>
            {hasFilters ? (
              <Button variant="secondary" asChild>
                <Link href="/admin/dispensaries">Clear filters</Link>
              </Button>
            ) : (
              <Button variant="primary" asChild>
                <Link href="/auth/sign_up">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add a dispensary
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
          <div className="divide-y divide-pf-line xl:hidden">
            {dispensaries.map((d) => (
              <article key={`mobile-${d.id}`} className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold text-pf-text">{d.businessName}</h2>
                    {d.user?.email ? (
                      <a href={`mailto:${d.user.email}`} className="inline-flex min-h-10 items-center break-all text-sm font-medium text-pf-accent hover:underline">{d.user.email}</a>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${d.isVerified ? 'bg-pf-accent-bg text-pf-accent' : 'bg-pf-warning-bg text-pf-warning'}`}>
                    {d.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs font-medium uppercase text-pf-muted">License</dt><dd className="mt-1 break-all text-pf-secondary">{d.licenseNumber || 'Not provided'}</dd></div>
                  <div><dt className="text-xs font-medium uppercase text-pf-muted">Expiry</dt><dd className="mt-1"><LicenseExpiryBadge expiresAt={d.licenseExpiry} /></dd></div>
                  <div className="col-span-2"><dt className="text-xs font-medium uppercase text-pf-muted">Ordering</dt><dd className="mt-1 text-pf-secondary">{d.licenseStatus === 'verified' ? 'Can order' : 'License review'}</dd></div>
                </dl>
                {d.licenseReviewNotes ? (
                  <details className="rounded-lg bg-pf-warning-bg px-3 py-2 text-sm text-pf-warning">
                    <summary className="min-h-10 cursor-pointer py-2 font-semibold">Review notes</summary>
                    <p className="break-words pb-2 leading-5">{d.licenseReviewNotes}</p>
                  </details>
                ) : null}
                <ConfirmActionButton
                  actionUrl={`/admin/dispensaries/${d.id}/verify`}
                  actionBody={{ verified: !d.isVerified, expectedUpdatedAt: d.updatedAt.toISOString() }}
                  successMessage={`${d.businessName} ${d.isVerified ? 'unverified' : 'verified'}.`}
                  confirmMessage={`${d.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${d.businessName}?`}
                  confirmTitle={d.isVerified ? 'Remove verification?' : 'Verify dispensary?'}
                  confirmLabel={d.isVerified ? 'Remove verification' : 'Verify'}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas ${d.isVerified ? 'border border-pf-line bg-pf-raised text-pf-secondary hover:bg-pf-hover' : 'bg-emerald-500 text-pf-canvas hover:bg-emerald-400'}`}
                >
                  {d.isVerified ? 'Unverify' : 'Verify dispensary'}
                </ConfirmActionButton>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[900px]">
              <thead className="bg-pf-canvas border-b border-pf-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-pf-muted">Ordering</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-pf-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pf-line">
                {dispensaries.map((d) => (
                  <tr key={d.id} className="hover:bg-pf-raised">
                    <td className="px-4 py-3">
                      <span className="font-medium text-pf-text">{d.businessName}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-pf-muted">
                      {d.user?.email ? (
                        <a
                          href={`mailto:${d.user.email}`}
                          className="font-medium text-pf-accent hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                        >
                          {d.user.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-pf-muted">
                      <div>{d.licenseNumber || '-'}</div>
                      {d.licenseReviewNotes ? (
                        <details className="group mt-1">
                          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded text-xs font-medium text-pf-warning hover:text-pf-warning focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                            Review notes
                          </summary>
                          <p className="mt-1 max-w-xs whitespace-normal break-words rounded-md bg-pf-warning-bg p-2 text-xs leading-5 text-pf-warning ring-1 ring-inset ring-pf-warning-line">
                            {d.licenseReviewNotes}
                          </p>
                        </details>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <LicenseExpiryBadge expiresAt={d.licenseExpiry} />
                    </td>
                    <td className="px-4 py-3">
                        <span className={'inline-flex whitespace-nowrap items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        d.isVerified
                          ? 'bg-pf-accent-bg text-pf-accent'
                          : 'bg-pf-warning-bg text-pf-warning'
                      )}>
                        {d.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Ordering ability is gated by licenseStatus, not isVerified */}
                      <span className={'inline-flex whitespace-nowrap items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        d.licenseStatus === 'verified'
                          ? 'bg-pf-accent-bg text-pf-accent'
                          : 'bg-pf-warning-bg text-pf-warning'
                      )}>
                        {d.licenseStatus === 'verified' ? 'Can order' : 'License review'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-pf-muted">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmActionButton
                        actionUrl={`/admin/dispensaries/${d.id}/verify`}
                  actionBody={{ verified: !d.isVerified, expectedUpdatedAt: d.updatedAt.toISOString() }}
                        successMessage={`${d.businessName} ${d.isVerified ? 'unverified' : 'verified'}.`}
                        confirmMessage={`${d.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${d.businessName}?`}
                        confirmTitle={d.isVerified ? 'Remove verification?' : 'Verify dispensary?'}
                        confirmLabel={d.isVerified ? 'Remove verification' : 'Verify'}
                        className={'inline-flex h-10 items-center rounded-md px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-60 ' + (
                          d.isVerified
                            ? 'border border-pf-line bg-pf-raised text-pf-secondary hover:bg-pf-hover'
                            : 'bg-emerald-500 text-pf-canvas hover:bg-emerald-400'
                        )}
                      >
                        {d.isVerified ? 'Unverify' : 'Verify'}
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
        <nav className="flex items-center justify-between gap-3" aria-label="Dispensary pages">
          {page > 1 ? (
            <Link
              href={buildDispensariesHref(query, status, page - 1)}
              className="inline-flex min-h-10 items-center rounded-md border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-raised"
            >
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-pf-muted">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link
              href={buildDispensariesHref(query, status, page + 1)}
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
