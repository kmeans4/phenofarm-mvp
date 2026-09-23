import Link from 'next/link';

export function Pagination({ page, pageSize, total, basePath, query = {}, label = 'requests' }: {
  page: number; pageSize: number; total: number; basePath: string; query?: Record<string, string>; label?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (next: number) => `${basePath}?${new URLSearchParams({ ...query, page: String(next) })}`;
  return <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 text-sm">
    {page > 1 ? <Link className="rounded-lg border px-4 py-2" href={href(page - 1)}>Previous</Link> : <span />}
    <span>Page {page} of {pages} · {total} {label}</span>
    {page < pages ? <Link className="rounded-lg border px-4 py-2" href={href(page + 1)}>Next</Link> : <span />}
  </nav>;
}
