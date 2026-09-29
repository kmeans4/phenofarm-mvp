import Link from 'next/link';

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  query = {},
  label = 'orders',
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: Record<string, string>;
  label?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (next: number) =>
    `${basePath}?${new URLSearchParams({ ...query, page: String(next) })}`;
  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-between gap-3 text-sm"
    >
      {page > 1 ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-4 py-2"
          href={href(page - 1)}
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pages} · {total} {label}
      </span>
      {page < pages ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-4 py-2"
          href={href(page + 1)}
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
