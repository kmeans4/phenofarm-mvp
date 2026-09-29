'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { STRAIN_TYPE_LABELS, isStrainType } from '@/lib/strain-types';
import { deleteUnusedRecord } from '../components/deleteUnusedRecord';
type Strain = {
  id: string;
  name: string;
  strainType: string | null;
  genetics: string | null;
  _count: { products: number; batches: number };
};
const link =
  'inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm';
export default function StrainsPage() {
  const params = useSearchParams(),
    [strains, setStrains] = useState<Strain[]>([]),
    [search, setSearch] = useState(params?.get('search') || ''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/strains');
      if (!response.ok) throw new Error('Could not load strains.');
      setStrains(await response.json());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const shown = strains.filter((strain) =>
    `${strain.name} ${strain.genetics || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="Strains"
        actions={
          <Link
            href="/grower/strains/add"
            className="inline-flex min-h-11 items-center rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
          >
            Add strain
          </Link>
        }
      />
      <label htmlFor="strains-search" className="sr-only">
        Search strains
      </label>
      <input
        id="strains-search"
        type="search"
        placeholder="Search strains or genetics"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm"
      />
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <LoadingState title="Loading strains" />
      ) : !shown.length ? (
        <EmptyState
          title={search ? 'No matching strains' : 'No strains yet'}
          action={{ href: '/grower/strains/add', label: 'Add strain' }}
        />
      ) : (
        <div className="divide-y divide-pf-line rounded-xl border border-pf-line bg-pf-surface">
          {shown.map((strain) => (
            <article
              key={strain.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <h2 className="font-semibold">
                  <Link
                    className="inline-flex min-h-11 items-center hover:underline"
                    href={`/grower/strains/${strain.id}/edit`}
                  >
                    {strain.name}
                  </Link>
                </h2>
                <p className="text-sm text-pf-muted">
                  {[
                    isStrainType(strain.strainType)
                      ? STRAIN_TYPE_LABELS[strain.strainType]
                      : null,
                    strain.genetics,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/grower/batches/add?strainId=${strain.id}`}
                  className={link}
                >
                  Add batch
                </Link>
                <Link
                  href={`/grower/products/add?strainId=${strain.id}`}
                  className={link}
                >
                  Add product
                </Link>
                {strain._count.products > 0 && (
                  <Link
                    className={link}
                    href={`/grower/products?strainId=${strain.id}`}
                  >
                    Used by {strain._count.products}{' '}
                    {strain._count.products === 1 ? 'product' : 'products'} ·
                    View
                  </Link>
                )}
                {strain._count.batches > 0 && (
                  <Link
                    className={link}
                    href={`/grower/batches?strainId=${strain.id}`}
                  >
                    {strain._count.batches}{' '}
                    {strain._count.batches === 1 ? 'batch' : 'batches'} · View
                  </Link>
                )}
                {!strain._count.products && !strain._count.batches && (
                  <button
                    type="button"
                    className={`${link} text-pf-danger`}
                    onClick={() =>
                      deleteUnusedRecord(
                        'strains',
                        strain.id,
                        () => void load()
                      )
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
