import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/app/components/ui/PageHeader";
import type { Prisma } from "@prisma/client";

interface UserWithBusiness {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  grower: { businessName: string; isVerified: boolean } | null;
  dispensary: { businessName: string; isVerified: boolean; licenseStatus: string } | null;
}

type AdminUsersSearchParams = Promise<{
  q?: string | string[];
  role?: string | string[];
  page?: string | string[];
}>;

const PAGE_SIZE = 25;

type RoleFilterValue = "all" | "admin" | "grower" | "dispensary";

const roleFilters = [
  { label: "All", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Grower", value: "grower" },
  { label: "Dispensary", value: "dispensary" },
] as const;

const roleMap = {
  admin: "ADMIN",
  grower: "GROWER",
  dispensary: "DISPENSARY",
} as const;

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeRole(value: string): RoleFilterValue {
  return value === "admin" || value === "grower" || value === "dispensary" ? value : "all";
}

function getPageValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildUsersHref(role: RoleFilterValue, query: string, page = 1) {
  const params = new URLSearchParams();
  if (role !== "all") params.set("role", role);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/admin/users?${queryString}` : "/admin/users";
}

function getRoleLabel(role: string) {
  if (role === "GROWER") return "Grower";
  if (role === "DISPENSARY") return "Dispensary";
  return "Admin";
}

function RoleBadge({ role }: { role: string }) {
  const className =
    role === "ADMIN"
      ? "bg-pf-surface text-pf-secondary"
      : role === "GROWER"
        ? "bg-pf-accent-bg text-pf-accent"
        : "bg-pf-purple-bg text-pf-purple";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {getRoleLabel(role)}
    </span>
  );
}

function VerificationBadge({ user }: { user: UserWithBusiness }) {
  if (user.role === "ADMIN") {
    return null;
  }

  if (user.role === "GROWER") {
    return user.grower?.isVerified ? (
      <span className="inline-flex items-center rounded-full bg-pf-accent-bg px-2.5 py-1 text-xs font-medium text-pf-accent ring-1 ring-inset ring-pf-accent-line">
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-pf-warning-bg px-2.5 py-1 text-xs font-medium text-pf-warning ring-1 ring-inset ring-pf-warning-line">
        Pending
      </span>
    );
  }

  if (!user.dispensary) {
    return (
      <span className="inline-flex items-center rounded-full bg-pf-surface px-2.5 py-1 text-xs font-medium text-pf-secondary">
        No profile
      </span>
    );
  }

  if (user.dispensary.isVerified && user.dispensary.licenseStatus === "verified") {
    return (
      <span className="inline-flex items-center rounded-full bg-pf-accent-bg px-2.5 py-1 text-xs font-medium text-pf-accent ring-1 ring-inset ring-pf-accent-line">
        Verified
      </span>
    );
  }

  if (user.dispensary.licenseStatus === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-pf-danger-bg px-2.5 py-1 text-xs font-medium text-pf-danger ring-1 ring-inset ring-pf-danger-line">
        Rejected
      </span>
    );
  }

  if (user.dispensary.licenseStatus === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-pf-danger-bg px-2.5 py-1 text-xs font-medium text-pf-danger ring-1 ring-inset ring-pf-danger-line">
        Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-pf-warning-bg px-2.5 py-1 text-xs font-medium text-pf-warning ring-1 ring-inset ring-pf-warning-line">
      Pending
    </span>
  );
}

function BusinessLink({ user }: { user: UserWithBusiness }) {
  if (user.grower) {
    return (
      <Link
        href={`/admin/growers?q=${encodeURIComponent(user.grower.businessName)}`}
        className="inline-flex min-h-10 items-center font-medium text-pf-accent hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
      >
        {user.grower.businessName}
      </Link>
    );
  }

  if (user.dispensary) {
    return (
      <Link
        href={`/admin/dispensaries?q=${encodeURIComponent(user.dispensary.businessName)}`}
        className="inline-flex min-h-10 items-center font-medium text-pf-accent hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
      >
        {user.dispensary.businessName}
      </Link>
    );
  }

  return <span className="text-pf-muted">-</span>;
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: AdminUsersSearchParams }) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const query = getParamValue(params.q).trim();
  const role = normalizeRole(getParamValue(params.role));
  const page = getPageValue(params.page);
  const selectedRole = role === "all" ? undefined : roleMap[role];
  const hasFilters = query.length > 0 || role !== "all";

  const where: Prisma.UserWhereInput = {
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { grower: { businessName: { contains: query, mode: "insensitive" } } },
            { dispensary: { businessName: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Fetch users with error handling
  let users: UserWithBusiness[] = [];
  let totalUserCount = 0;
  try {
    [users, totalUserCount] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          grower: { select: { businessName: true, isVerified: true } },
          dispensary: { select: { businessName: true, isVerified: true, licenseStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.user.count({ where }),
    ]);
  } catch {
    users = [];
    totalUserCount = 0;
  }

  const resultCountLabel = hasFilters
    ? `${totalUserCount} ${totalUserCount === 1 ? "match" : "matches"}`
    : `${totalUserCount} ${totalUserCount === 1 ? "user" : "users"}`;
  const pageCount = Math.max(1, Math.ceil(totalUserCount / PAGE_SIZE));

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-4">
        <PageHeader
          compact
          title="Users"
          description="View accounts and verification."
          actions={
            <form method="GET" className="flex w-full flex-wrap gap-2 rounded-lg border border-pf-line bg-pf-surface p-3 shadow-sm sm:flex-row lg:max-w-xl">
              {role !== "all" ? <input type="hidden" name="role" value={role} /> : null}
              <label className="sr-only" htmlFor="admin-user-search">Search users</label>
              <input
                id="admin-user-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Email or name"
                className="min-h-10 min-w-0 flex-1 rounded-md border border-pf-line-strong px-3 text-base focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent/20 sm:text-sm"
              />
              <button
                type="submit"
                className="min-h-10 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-pf-canvas hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Search
              </button>
              {hasFilters ? (
                <Link
                  href="/admin/users"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-pf-line-strong px-4 text-sm font-medium text-pf-secondary hover:bg-pf-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                >
                  Clear
                </Link>
              ) : null}
            </form>
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2" aria-label="Filter users by role">
            {roleFilters.map((filter) => {
              const active = role === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={buildUsersHref(filter.value, query)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas ${
                    active
                      ? "bg-emerald-500 text-pf-canvas"
                      : "border border-pf-line bg-pf-surface text-pf-secondary hover:bg-pf-raised"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
          <p className="text-sm text-pf-muted">{resultCountLabel}</p>
        </div>
      </div>

      <div className="bg-pf-surface rounded-lg border border-pf-line overflow-hidden">
        {users.length === 0 ? (
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-pf-raised flex items-center justify-center">
              <svg className="w-5 h-5 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-pf-text mb-1">{hasFilters ? 'No matching users' : 'No users yet'}</h3>
            <p className="text-sm text-pf-muted mb-4 max-w-sm mx-auto">
              {hasFilters ? "Try a different role or search term." : "Registered accounts appear here."}
            </p>
            {hasFilters ? (
              <Link
                href="/admin/users"
                className="inline-flex items-center justify-center rounded-md border border-pf-line-strong px-4 py-2 text-sm font-medium text-pf-secondary hover:bg-pf-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        ) : (
          <>
          <div className="divide-y divide-pf-line md:hidden">
            {users.map((u) => (
              <article key={`mobile-${u.id}`} className="space-y-2 p-3">
                <a href={`mailto:${u.email}`} className="inline-flex min-h-10 min-w-0 items-center break-all text-sm font-medium text-pf-text hover:text-pf-accent hover:underline">{u.email}</a>
                {u.role !== "ADMIN" ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 text-pf-secondary"><BusinessLink user={u} /></div>
                    <VerificationBadge user={u} />
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-pf-muted">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                  <RoleBadge role={u.role} />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px]">
              <thead className="bg-pf-canvas border-b border-pf-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pf-line">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-pf-raised">
                    <td className="px-4 py-3 font-medium text-pf-text">
                      <a
                        href={`mailto:${u.email}`}
                        className="hover:text-pf-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                      >
                        {u.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-pf-muted">
                      <BusinessLink user={u} />
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge user={u} />
                    </td>
                    <td className="px-4 py-3 text-sm text-pf-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
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
        <nav className="flex items-center justify-between gap-3" aria-label="User pages">
          {page > 1 ? (
            <Link
              href={buildUsersHref(role, query, page - 1)}
              className="inline-flex min-h-10 items-center rounded-md border border-pf-line-strong px-3 text-sm font-medium text-pf-secondary hover:bg-pf-raised"
            >
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-pf-muted">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link
              href={buildUsersHref(role, query, page + 1)}
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
