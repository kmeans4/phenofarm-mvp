'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function DirectoryFilters({
  basePath,
  q,
  status,
}: {
  basePath: string;
  q: string;
  status: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  function navigate(nextStatus: string, nextQuery = search) {
    router.replace(
      `${basePath}?${new URLSearchParams({ q: nextQuery, status: nextStatus })}`
    );
  }
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(
      () =>
        router.replace(
          `${basePath}?${new URLSearchParams({ q: search, status })}`
        ),
      350
    );
    return () => clearTimeout(timer);
  }, [search, q, status, basePath, router]);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">Search businesses</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Business, contact, email or license number"
          className="w-full rounded-lg border px-3 py-2.5 text-base"
        />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="License status">
        {[
          ['pending', 'Pending'],
          ['verified', 'Approved'],
          ['rejected', 'Changes needed'],
          ['expired', 'Expired'],
          ['expiring', 'Expiring'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => navigate(value)}
            className={`min-h-11 rounded-lg border px-3 text-sm ${status === value ? 'border-pf-accent bg-pf-accent-bg text-pf-accent' : 'border-pf-line-strong'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
