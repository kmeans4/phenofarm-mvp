'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type VerificationStatus = 'all' | 'pending' | 'verified' | 'expiring' | 'expired';

interface AdminVerificationFiltersProps {
  basePath: string;
  entityLabel: string;
  inputId: string;
  query: string;
  status: VerificationStatus;
  hasFilters: boolean;
  resultLabel?: string;
}

function normalizeStatus(value: string | null): VerificationStatus {
  return ['pending', 'verified', 'expiring', 'expired'].includes(value || '') ? value as VerificationStatus : 'all';
}

export function AdminVerificationFilters({
  basePath,
  entityLabel,
  inputId,
  query,
  status,
  hasFilters,
  resultLabel,
}: AdminVerificationFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus>(status);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextParams = new URLSearchParams();
    const trimmedSearch = search.trim();
    if (trimmedSearch) nextParams.set('q', trimmedSearch);
    if (selectedStatus !== 'all') nextParams.set('status', selectedStatus);

    const queryString = nextParams.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 rounded-lg border border-pf-line bg-pf-surface p-2.5 sm:min-w-[22rem] lg:max-w-2xl"
    >
      <div className="flex min-w-0 flex-1 gap-2">
        <label className="sr-only" htmlFor={inputId}>
          Search {entityLabel}
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Business or license"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-pf-line-strong px-3 text-base focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent/20 sm:text-sm"
        />
        <button
          type="submit"
          className="min-h-10 shrink-0 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-pf-canvas hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
        >
          Search
        </button>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${inputId}-status`}>
          Verification status
        </label>
        <select
          id={`${inputId}-status`}
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(normalizeStatus(event.target.value))}
          className="min-h-10 min-w-0 flex-1 rounded-md border border-pf-line-strong px-3 text-base focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent/20 sm:text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="expiring">Expires in 30 days</option>
          <option value="expired">Expired</option>
        </select>
        {resultLabel && <span className="hidden shrink-0 text-xs text-pf-muted sm:inline">{resultLabel}</span>}
        {hasFilters ? (
          <Link
            href={basePath}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-pf-line-strong px-4 text-sm font-medium text-pf-secondary hover:bg-pf-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
          >
            Clear
          </Link>
        ) : null}
      </div>
      {resultLabel && <p className="text-xs text-pf-muted sm:hidden">{resultLabel}</p>}
    </form>
  );
}
