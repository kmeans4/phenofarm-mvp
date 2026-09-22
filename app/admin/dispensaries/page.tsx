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
    <div className="space-y-6">
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {dispensaries.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1-1h2 0 011a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{hasFilters ? 'No matching dispensaries' : 'No dispensaries yet'}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {hasFilters ? 'Try a different search or status filter.' : 'Dispensaries will appear here once they register on the platform.'}
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
          <div className="divide-y divide-gray-200 xl:hidden">
            {dispensaries.map((d) => (
              <article key={`mobile-${d.id}`} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900">{d.businessName}</h2>
                    {d.user?.email ? (
                      <a href={`mailto:${d.user.email}`} className="inline-flex min-h-10 items-center break-all text-sm font-medium text-green-700 hover:underline">{d.user.email}</a>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${d.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {d.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs font-medium uppercase text-gray-500">License</dt><dd className="mt-1 text-gray-800">{d.licenseNumber || 'Not provided'}</dd></div>
                  <div><dt className="text-xs font-medium uppercase text-gray-500">Expiry</dt><dd className="mt-1"><LicenseExpiryBadge expiresAt={d.licenseExpiry} /></dd></div>
                  <div className="col-span-2"><dt className="text-xs font-medium uppercase text-gray-500">Ordering</dt><dd className="mt-1 text-gray-800">{d.licenseStatus === 'verified' ? 'Can order' : 'License review'}</dd></div>
                </dl>
                {d.licenseReviewNotes ? (
                  <details className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <summary className="min-h-10 cursor-pointer py-2 font-semibold">Review notes</summary>
                    <p className="pb-2">{d.licenseReviewNotes}</p>
                  </details>
                ) : null}
                <ConfirmActionButton
                  actionUrl={`/admin/dispensaries/${d.id}/verify`}
                  successMessage={`${d.businessName} ${d.isVerified ? 'unverified' : 'verified'}.`}
                  confirmMessage={`${d.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${d.businessName}?`}
                  confirmTitle={d.isVerified ? 'Remove verification?' : 'Verify dispensary?'}
                  confirmLabel={d.isVerified ? 'Remove verification' : 'Verify'}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${d.isVerified ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {d.isVerified ? 'Unverify' : 'Verify dispensary'}
                </ConfirmActionButton>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Ordering</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dispensaries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{d.businessName}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {d.user?.email ? (
                        <a
                          href={`mailto:${d.user.email}`}
                          className="font-medium text-green-700 hover:text-green-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                        >
                          {d.user.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      <div>{d.licenseNumber || '-'}</div>
                      {d.licenseReviewNotes ? (
                        <details className="group mt-1">
                          <summary className="inline-flex cursor-pointer list-none items-center rounded text-xs font-medium text-amber-700 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                            Review notes
                          </summary>
                          <p className="mt-1 max-w-xs rounded-md bg-amber-50 p-2 text-xs leading-5 text-amber-900 ring-1 ring-inset ring-amber-200">
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
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      )}>
                        {d.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Ordering ability is gated by licenseStatus, not isVerified */}
                      <span className={'inline-flex whitespace-nowrap items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        d.licenseStatus === 'verified'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-amber-50 text-amber-800'
                      )}>
                        {d.licenseStatus === 'verified' ? 'Can order' : 'License review'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmActionButton
                        actionUrl={`/admin/dispensaries/${d.id}/verify`}
                        successMessage={`${d.businessName} ${d.isVerified ? 'unverified' : 'verified'}.`}
                        confirmMessage={`${d.isVerified ? 'Remove marketplace verification from' : 'Verify marketplace access for'} ${d.businessName}?`}
                        confirmTitle={d.isVerified ? 'Remove verification?' : 'Verify dispensary?'}
                        confirmLabel={d.isVerified ? 'Remove verification' : 'Verify'}
                        className={'inline-flex h-10 items-center rounded-md px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ' + (
                          d.isVerified
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
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
              className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-gray-600">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link
              href={buildDispensariesHref(query, status, page + 1)}
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
