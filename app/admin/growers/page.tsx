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
    <div className="space-y-6">
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {growers.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{hasFilters ? 'No matching growers' : 'No growers yet'}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {hasFilters ? 'Try a different search or status filter.' : 'Growers will appear here once they register on the platform.'}
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
          <div className="divide-y divide-gray-200 xl:hidden">
            {growers.map((g) => (
              <article key={`mobile-${g.id}`} className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900">{g.businessName}</h2>
                    {g.user?.email ? (
                      <a href={`mailto:${g.user.email}`} className="inline-flex min-h-10 items-center break-all text-sm font-medium text-green-700 hover:underline">
                        {g.user.email}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${g.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {g.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <SubscriptionStatusBadge plan={g.subscriptionPlan} status={g.subscriptionStatus} currentPeriodEnd={g.subscriptionCurrentPeriodEnd} />
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-xs font-medium uppercase text-gray-500">License</dt><dd className="mt-1 text-gray-800">{g.licenseNumber || 'Not provided'}</dd></div>
                  <div><dt className="text-xs font-medium uppercase text-gray-500">Expiry</dt><dd className="mt-1"><LicenseExpiryBadge expiresAt={g.licenseExpiry} /></dd></div>
                </dl>
                <ConfirmActionButton
                  actionUrl={`/admin/growers/${g.id}/verify`}
                  successMessage={`${g.businessName} ${g.isVerified ? 'unverified' : 'verified'}.`}
                  confirmMessage={`${g.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${g.businessName}?`}
                  confirmTitle={g.isVerified ? 'Remove verification?' : 'Verify grower?'}
                  confirmLabel={g.isVerified ? 'Remove verification' : 'Verify'}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${g.isVerified ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {g.isVerified ? 'Unverify' : 'Verify grower'}
                </ConfirmActionButton>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {growers.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{g.businessName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {g.user?.email ? (
                        <a
                          href={`mailto:${g.user.email}`}
                          className="font-medium text-green-700 hover:text-green-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                        >
                          {g.user.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.licenseNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <LicenseExpiryBadge expiresAt={g.licenseExpiry} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        g.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmActionButton
                        actionUrl={`/admin/growers/${g.id}/verify`}
                        successMessage={`${g.businessName} ${g.isVerified ? 'unverified' : 'verified'}.`}
                        confirmMessage={`${g.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${g.businessName}?`}
                        confirmTitle={g.isVerified ? 'Remove verification?' : 'Verify grower?'}
                        confirmLabel={g.isVerified ? 'Remove verification' : 'Verify'}
                        className={'inline-flex h-10 items-center rounded-md px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ' + (
                          g.isVerified
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
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
              className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-gray-600">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link
              href={buildGrowersHref(query, status, page + 1)}
              className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}
