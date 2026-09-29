'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderStatusLabel } from '@/lib/order-workflow';
export function OrderFilters({
  search,
  status,
  sort,
}: {
  search: string;
  status: string;
  sort: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const first = useRef(true);
  function update(value: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams({
      search: value.search ?? query,
      status: value.status ?? status,
      sort: value.sort ?? sort,
    });
    router.replace(`/dispensary/orders?${params}`, { scroll: false });
  }
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ search: query, status, sort });
      router.replace(`/dispensary/orders?${params}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, router, status, sort]);
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:flex">
      <input
        aria-label="Search orders"
        placeholder="Search orders"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="col-span-2 min-h-11 min-w-0 flex-1 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-base"
      />
      <select
        aria-label="Order status"
        value={status}
        onChange={(event) => update({ status: event.target.value })}
        className="min-h-11 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-sm"
      >
        <option value="">All statuses</option>
        {[
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
        ].map((value) => (
          <option key={value} value={value}>
            {getOrderStatusLabel(value)}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort all orders"
        value={sort}
        onChange={(event) => update({ sort: event.target.value })}
        className="min-h-11 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="total-desc">Total: high</option>
        <option value="total-asc">Total: low</option>
        <option value="status">Status</option>
      </select>
    </div>
  );
}
