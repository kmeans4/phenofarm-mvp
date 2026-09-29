import { UserActions } from '../components/UserActions';
import { requireAdmin } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { Pagination } from '@/app/components/ui/Pagination';
import { formatDate } from '@/lib/format';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 25;
const roles = [
  { label: 'All', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Grower', value: 'GROWER' },
  { label: 'Dispensary', value: 'DISPENSARY' },
];
const first = (value?: string | string[]) =>
  (Array.isArray(value) ? value[0] : value) || '';

type Params = Promise<{
  q?: string | string[];
  role?: string | string[];
  page?: string | string[];
}>;
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = first(params.q).trim();
  const selectedRole = first(params.role).toUpperCase();
  const role = roles.some((item) => item.value === selectedRole)
    ? selectedRole
    : '';
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(first(params.page), 10) || 1)
  );
  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as 'ADMIN' | 'GROWER' | 'DISPENSARY' } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            {
              grower: {
                businessName: { contains: query, mode: 'insensitive' },
              },
            },
            {
              dispensary: {
                businessName: { contains: query, mode: 'insensitive' },
              },
            },
          ],
        }
      : {}),
  };
  // Let the portal error boundary show Retry; a database failure is not an empty account list.
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        grower: { select: { id: true, businessName: true } },
        dispensary: { select: { id: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader compact title="Users" />
      <form method="GET" className="flex flex-wrap gap-2">
        {role && <input type="hidden" name="role" value={role} />}
        <label className="sr-only" htmlFor="admin-user-search">
          Search email, contact or business name
        </label>
        <input
          id="admin-user-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Email, contact or business name"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-pf-line-strong px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-pf-canvas"
        >
          Search
        </button>
        {(query || role) && (
          <Link
            href="/admin/users"
            className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm"
          >
            Clear
          </Link>
        )}
      </form>
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Filter users by role"
      >
        {roles.map((item) => (
          <Link
            key={item.label}
            aria-current={role === item.value ? 'page' : undefined}
            href={`/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(item.value ? { role: item.value } : {}) })}`}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${role === item.value ? 'border-pf-accent bg-pf-accent-bg text-pf-accent' : 'border-pf-line-strong'}`}
          >
            {item.label}
          </Link>
        ))}
        <span className="ml-auto text-sm text-pf-muted">{total} users</span>
      </div>
      <section
        className="overflow-hidden rounded-xl border border-pf-line bg-pf-surface"
        aria-label="User accounts"
      >
        {!users.length ? (
          <EmptyState
            title={query || role ? 'No matching users' : 'No users yet'}
            description={
              query || role
                ? 'Try another name or role.'
                : 'Registered accounts appear here.'
            }
            action={
              query || role
                ? { label: 'Clear filters', href: '/admin/users' }
                : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-pf-line">
            {users.map((user) => {
              const business = user.grower || user.dispensary;
              const businessHref = user.grower
                ? `/admin/review/grower/${user.grower.id}`
                : user.dispensary
                  ? `/admin/review/dispensary/${user.dispensary.id}`
                  : '';
              return (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1 basis-64 space-y-1">
                    <a
                      className="inline-flex min-h-11 max-w-full items-center break-all font-medium text-pf-text hover:text-pf-accent"
                      href={`mailto:${user.email}`}
                    >
                      {user.email}
                    </a>
                    <p className="text-sm text-pf-muted">
                      {user.name || 'No contact name'} ·{' '}
                      {roles.find((item) => item.value === user.role)?.label}
                    </p>
                    {business && (
                      <Link
                        href={businessHref}
                        className="inline-flex min-h-11 items-center text-sm text-pf-accent underline"
                      >
                        {business.businessName}
                      </Link>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <div className="space-y-1 text-sm">
                      <p
                        className={
                          user.suspendedAt
                            ? 'text-pf-danger'
                            : user.emailVerifiedAt
                              ? 'text-pf-accent'
                              : 'text-pf-warning'
                        }
                      >
                        {user.suspendedAt
                          ? 'Account paused'
                          : user.emailVerifiedAt
                            ? 'Email verified'
                            : 'Email not verified'}
                      </p>
                      <p className="text-pf-muted">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <UserActions
                      id={user.id}
                      verified={Boolean(user.emailVerifiedAt)}
                      suspended={Boolean(user.suspendedAt)}
                      admin={user.role === 'ADMIN'}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        basePath="/admin/users"
        query={{ ...(query ? { q: query } : {}), ...(role ? { role } : {}) }}
        label="users"
      />
    </div>
  );
}
