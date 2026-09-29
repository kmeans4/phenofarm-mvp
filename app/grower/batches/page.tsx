'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { formatBatchMetric, formatHarvestDate } from '@/lib/batch-utils';
import { deleteUnusedRecord } from '../components/deleteUnusedRecord';
type Batch = {
  id: string;
  batchNumber: string;
  lotNumber: string | null;
  strainId: string;
  strain: { name: string };
  harvestDate: string;
  thc: string | null;
  cbd: string | null;
  labDocumentCount: number;
  hasFullCoa?: boolean;
  _count: { products: number };
};
const link =
  'inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm';
export default function BatchesPage() {
  const params = useSearchParams(),
    strainId = params?.get('strainId'),
    [batches, setBatches] = useState<Batch[]>([]),
    [search, setSearch] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/batches${strainId ? `?strainId=${encodeURIComponent(strainId)}` : ''}`
      );
      if (!response.ok) throw new Error('Could not load batches.');
      setBatches(await response.json());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost.');
    } finally {
      setLoading(false);
    }
  }, [strainId]);
  useEffect(() => {
    void load();
  }, [load]);
  const shown = batches.filter((batch) =>
    `${batch.batchNumber} ${batch.lotNumber || ''} ${batch.strain.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="Batches"
        actions={
          <Link
            href={`/grower/batches/add${strainId ? `?strainId=${encodeURIComponent(strainId)}` : ''}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
          >
            Add batch
          </Link>
        }
      />
      <label htmlFor="batches-search" className="sr-only">
        Search batches
      </label>
      <input
        id="batches-search"
        type="search"
        placeholder="Search batch, lot or strain"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm"
      />
      {strainId && (
        <Link href="/grower/batches" className={link}>
          Show all strains
        </Link>
      )}
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <LoadingState title="Loading batches" />
      ) : !shown.length ? (
        <EmptyState
          title={search ? 'No matching batches' : 'No batches yet'}
          action={{
            href: `/grower/batches/add${strainId ? `?strainId=${strainId}` : ''}`,
            label: 'Add batch',
          }}
        />
      ) : (
        <div className="divide-y divide-pf-line rounded-xl border border-pf-line bg-pf-surface">
          {shown.map((batch) => (
            <article
              key={batch.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div>
                <h2 className="font-semibold">
                  <Link
                    href={`/grower/batches/${batch.id}/edit`}
                    className="inline-flex min-h-11 items-center hover:underline"
                  >
                    {batch.batchNumber}
                  </Link>
                </h2>
                <p className="text-sm text-pf-secondary">
                  {batch.strain.name} · {formatHarvestDate(batch.harvestDate)}
                </p>
                <p className="mt-1 text-sm text-pf-muted">
                  THC {formatBatchMetric(batch.thc)} · CBD{' '}
                  {formatBatchMetric(batch.cbd)} ·{' '}
                  {batch.hasFullCoa
                    ? 'Full COA'
                    : batch.labDocumentCount
                      ? `${batch.labDocumentCount} lab ${batch.labDocumentCount === 1 ? 'report' : 'reports'}`
                      : 'No lab reports'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/grower/products/add?batchId=${batch.id}&strainId=${batch.strainId}`}
                  className={link}
                >
                  Add product
                </Link>
                <Link
                  href={`/grower/batches/${batch.id}/edit`}
                  className={link}
                >
                  Edit / labs
                </Link>
                {batch._count.products > 0 ? (
                  <Link
                    href={`/grower/products?batchId=${batch.id}`}
                    className={link}
                  >
                    Used by {batch._count.products}{' '}
                    {batch._count.products === 1 ? 'product' : 'products'} ·
                    View
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${link} text-pf-danger`}
                    onClick={() =>
                      deleteUnusedRecord('batches', batch.id, () => void load())
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
