import { requireAdmin } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { isLicenseExpired, startOfLicenseDay } from '@/lib/license';
import { licenseReviewKey } from '@/lib/admin-verification';
import { formatDate } from '@/lib/format';
import { Pagination } from '@/app/components/ui/Pagination';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { VerificationQueue, type VerificationRow } from './VerificationQueue';
import { DirectoryFilters } from './DirectoryFilters';
import { CopyToClipboardButton } from './CopyToClipboardButton';
export type DirectoryParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;
export async function BusinessDirectory({
  kind,
  searchParams,
  title,
}: {
  kind?: 'grower' | 'dispensary';
  searchParams?: DirectoryParams;
  title?: string;
}) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const q = (params.q || '').trim().slice(0, 200);
  const status = [
    'pending',
    'verified',
    'rejected',
    'expired',
    'expiring',
    'all',
  ].includes(params.status || '')
    ? params.status!
    : 'pending';
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(params.page || '1', 10) || 1)
  );
  const size = 25;
  const cutoff = startOfLicenseDay();
  const end = new Date(cutoff.getTime() + 30 * 86400000);
  const filters: Prisma.Sql[] = [];
  if (status === 'pending')
    filters.push(
      Prisma.sql`NOT b."isVerified" AND b."licenseStatus" = 'pending_review'`
    );
  if (status === 'verified')
    filters.push(
      Prisma.sql`b."isVerified" AND (b."licenseExpiry" IS NULL OR b."licenseExpiry" >= ${cutoff})`
    );
  if (status === 'rejected')
    filters.push(Prisma.sql`b."licenseStatus" = 'rejected'`);
  if (status === 'expired')
    filters.push(Prisma.sql`b."licenseExpiry" < ${cutoff}`);
  if (status === 'expiring')
    filters.push(
      Prisma.sql`b."licenseExpiry" >= ${cutoff} AND b."licenseExpiry" <= ${end}`
    );
  if (q) {
    const term = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    filters.push(
      Prisma.sql`(b."businessName" ILIKE ${term} OR b."licenseNumber" ILIKE ${term} OR b."contactName" ILIKE ${term} OR u.email ILIKE ${term} OR u.name ILIKE ${term})`
    );
  }
  const where = filters.length
    ? Prisma.join(
        filters.map((filter) => Prisma.sql`(${filter})`),
        ' AND '
      )
    : Prisma.sql`TRUE`;
  const sources: Prisma.Sql[] = [];
  if (kind !== 'dispensary')
    sources.push(
      Prisma.sql`SELECT b.id, 'grower' AS kind, COALESCE(b."licenseSubmittedAt", b."createdAt") AS submitted FROM growers b LEFT JOIN users u ON u.id = b."userId" WHERE ${where}`
    );
  if (kind !== 'grower')
    sources.push(
      Prisma.sql`SELECT b.id, 'dispensary' AS kind, COALESCE(b."licenseSubmittedAt", b."createdAt") AS submitted FROM dispensaries b LEFT JOIN users u ON u.id = b."userId" WHERE NOT b."isOffPlatform" AND ${where}`
    );
  const directory = Prisma.join(sources, ' UNION ALL ');
  // Page the combined queue in the database rather than loading every prior page.
  const [ids, totals] = await Promise.all([
    db.$queryRaw<Array<{ id: string; kind: 'grower' | 'dispensary' }>>(
      Prisma.sql`SELECT id, kind FROM (${directory}) businesses ORDER BY submitted, id LIMIT ${size} OFFSET ${(page - 1) * size}`
    ),
    db.$queryRaw<Array<{ count: number }>>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM (${directory}) businesses`
    ),
  ]);
  const select = {
    id: true,
    businessName: true,
    licenseNumber: true,
    licenseExpiry: true,
    state: true,
    isVerified: true,
    licenseStatus: true,
    licenseReviewNotes: true,
    updatedAt: true,
    previousLicenseNumber: true,
    user: { select: { email: true } },
  } as const;
  const [growers, dispensaries] = await Promise.all([
    db.grower.findMany({
      where: {
        id: {
          in: ids.filter((row) => row.kind === 'grower').map((row) => row.id),
        },
      },
      select,
    }),
    db.dispensary.findMany({
      where: {
        id: {
          in: ids
            .filter((row) => row.kind === 'dispensary')
            .map((row) => row.id),
        },
      },
      select: { ...select, licenseState: true },
    }),
  ]);
  const profiles = new Map(
    [...growers, ...dispensaries].map((value) => [value.id, value])
  );
  const rows: VerificationRow[] = ids.flatMap(({ id, kind: type }) => {
    const profile = profiles.get(id);
    if (!profile) return [];
    const state =
      'licenseState' in profile
        ? (profile.licenseState as string | null)
        : profile.state;
    const expired = isLicenseExpired(profile.licenseExpiry);
    return [
      {
        id,
        kind: type,
        businessName: profile.businessName,
        email: profile.user?.email || null,
        licenseNumber: profile.licenseNumber,
        licenseExpiry: profile.licenseExpiry
          ? formatDate(profile.licenseExpiry.toISOString().slice(0, 10))
          : '',
        state,
        status: expired
          ? 'Expired'
          : profile.isVerified
            ? type === 'dispensary'
              ? 'Approved — can order'
              : 'Approved — listings live'
            : profile.licenseStatus === 'rejected'
              ? 'Changes needed'
              : 'Waiting for review',
        canApprove:
          !profile.isVerified &&
          Boolean(profile.licenseExpiry && profile.licenseNumber && state) &&
          !expired,
        reviewKey: licenseReviewKey({
          ...profile,
          ...(type === 'dispensary' ? { licenseState: state } : {}),
        }),
        updatedAt: profile.updatedAt.toISOString(),
        previousLicenseNumber: profile.previousLicenseNumber,
      },
    ];
  });
  const total = totals[0]?.count || 0;
  const base = kind
    ? `/admin/${kind === 'grower' ? 'growers' : 'dispensaries'}`
    : '/admin/review';
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title || 'Review queue'}</h1>
      <DirectoryFilters
        key={`${q}-${status}`}
        basePath={base}
        q={q}
        status={status}
      />
      <p className="text-sm text-pf-muted">
        {total} {total === 1 ? 'business' : 'businesses'} · Oldest first
      </p>
      {rows.length ? (
        <VerificationQueue rows={rows} />
      ) : (
        <EmptyState
          title="No businesses match"
          actionButton={
            <CopyToClipboardButton
              value={`https://phenoshop.app/auth/sign_up${kind ? `?type=${kind}` : ''}`}
              label="Copy sign-up link"
            />
          }
        />
      )}
      <Pagination
        page={page}
        pageSize={size}
        total={total}
        basePath={base}
        query={{ q, status }}
        label="businesses"
      />
    </div>
  );
}
