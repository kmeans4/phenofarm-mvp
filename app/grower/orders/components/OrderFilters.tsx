'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
export function OrderFilters({
  history = false,
  initialSearch = '',
}: {
  history?: boolean;
  initialSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const previous = useRef(initialSearch);
  useEffect(() => {
    if (search === previous.current) return;
    const timer = setTimeout(() => {
      previous.current = search;
      const next = new URLSearchParams(params.toString());
      if (search) next.set('q', search);
      else next.delete('q');
      next.delete('page');
      router.replace(`${pathname}?${next}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, pathname, router]);
  const changeDate = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.replace(`${pathname}?${next}`);
  };
  return (
    <div className="flex flex-wrap gap-3">
      <label className="min-w-0 flex-1 text-sm">
        Search orders
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Customer, order number or product"
          className="mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3"
        />
      </label>
      {history && (
        <>
          <label className="text-sm">
            From
            <input
              className="mt-1 block min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
              type="date"
              defaultValue={params.get('from') || ''}
              onChange={(e) => changeDate('from', e.target.value)}
            />
          </label>
          <label className="text-sm">
            To
            <input
              className="mt-1 block min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised p-2"
              type="date"
              defaultValue={params.get('to') || ''}
              onChange={(e) => changeDate('to', e.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}
