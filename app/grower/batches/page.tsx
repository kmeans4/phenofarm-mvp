'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '@/app/grower/components/OperationsSummary';
import { RecordActions } from '@/app/grower/components/RecordActions';
import { deleteRecord } from '@/app/components/ui/deleteRecord';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { toast } from '@/app/hooks/useToast';
import { pluralize } from '@/lib/utils';
import { formatBatchMetric, formatHarvestDate, parseOptionalBatchMetric } from '@/lib/batch-utils';

interface Strain {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  lotNumber: string | null;
  harvestDate: string;
  strainId: string;
  strain: Strain;
  thc: number | null;
  cbd: number | null;
  totalCannabinoids: number | null;
  coaDocumentUrl: string | null;
  labDocumentCount: number;
  _count: {
    products: number;
  };
}

export default function BatchesPage() {
  const searchParams = useSearchParams();
  const strainFilterParam = searchParams?.get('strain') || searchParams?.get('strainId') || '';
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterStrain = strainFilterParam;
  const [deleteCandidate, setDeleteCandidate] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef(false);

  const fetchBatches = useCallback(async (strainId = '') => {
    try {
      setLoading(true);
      setError(null);
      const url = strainId ? `/api/batches?strainId=${encodeURIComponent(strainId)}` : '/api/batches';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setBatches(data.map((batch: Batch) => ({
            ...batch,
            thc: parseOptionalBatchMetric(batch.thc),
            cbd: parseOptionalBatchMetric(batch.cbd),
            totalCannabinoids: parseOptionalBatchMetric(batch.totalCannabinoids),
          })));
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch batches');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches(strainFilterParam);
  }, [strainFilterParam, fetchBatches]);

  const deleteBatch = async (batchId: string) => {
    if (deleteRef.current) return;
    deleteRef.current = true;
    setDeleting(true);
    try {
      await deleteRecord('/api/batches/' + batchId, 'Failed to delete batch');
      setBatches((current) => current.filter(item => item.id !== batchId));
      toast.success('Batch deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error deleting batch');
    } finally {
      deleteRef.current = false;
      setDeleting(false);
      setDeleteCandidate(null);
    }
  };

  const activeStrainFilterName = filterStrain ? batches[0]?.strain?.name || 'selected strain' : '';
  const batchesWithThc = batches.filter((batch) => typeof batch.thc === 'number' && Number.isFinite(batch.thc));
  const productsHref = (batchId: string) => `/grower/products?batch=${encodeURIComponent(batchId)}`;
  const labDocumentSummary = (batch: Batch) => `${(batch.labDocumentCount || 0)}/3 lab docs`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        mobileInlineActions
        title="Batches"
        actions={
          <Button variant="primary" asChild className="shrink-0">
            <Link href="/grower/batches/add" className="inline-flex w-full sm:w-auto justify-center">Add batch</Link>
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={() => fetchBatches(filterStrain)} className="mt-2">Retry</Button>
        </div>
      )}

      <OperationsSummary items={[
        { label: 'Batches', value: batches.length },
        { label: 'Products', value: batches.reduce((sum, batch) => sum + batch._count.products, 0) },
        { label: 'Avg. THC', value: batchesWithThc.length
          ? formatBatchMetric(batchesWithThc.reduce((sum, batch) => sum + (batch.thc ?? 0), 0) / batchesWithThc.length)
          : '—' },
      ]} />

      {filterStrain && (
        <div className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing batches for <span className="font-semibold">{activeStrainFilterName}</span>.
          </p>
          <Button variant="outline" size="sm" asChild className="bg-white">
            <Link href="/grower/batches">Clear strain filter</Link>
          </Button>
        </div>
      )}

      {/* Batches Display */}
      {batches.length > 0 ? (
        <>
          <div className="sm:hidden space-y-3">
            {batches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{batch.batchNumber}</p>
                    {batch.lotNumber && <p className="text-xs text-gray-500">Lot {batch.lotNumber}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{formatHarvestDate(batch.harvestDate)}</span>
                </div>

                <p className="text-sm text-gray-600">{batch.strain?.name || 'No strain'}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <p className="text-green-700">THC <span className="font-semibold">{formatBatchMetric(batch.thc)}</span></p>
                  <p className="text-blue-700">CBD <span className="font-semibold">{formatBatchMetric(batch.cbd)}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link
                      href={productsHref(batch.id)}
                      className="inline-flex min-h-10 items-center text-gray-900 underline-offset-4 hover:text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                      {pluralize(batch._count.products, 'product')}
                    </Link>
                <p className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  (batch.labDocumentCount || 0) === 3
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  {labDocumentSummary(batch)}
                </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={'/grower/batches/' + batch.id + '/edit'}>Edit</Link>
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <Link href={'/grower/products/add?strainId=' + batch.strainId + '&batchId=' + batch.id}>
                      Add product
                    </Link>
                  </Button>
                  <RecordActions name={batch.batchNumber} actions={[{ label: 'Delete batch', destructive: true, onSelect: () => setDeleteCandidate(batch) }]} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">Batch #</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">Strain</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">Harvest Date</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">THC</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">CBD</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">Products</th>
                    <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className="font-medium text-sm sm:text-base text-gray-900">{batch.batchNumber}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{batch.strain?.name || 'N/A'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{formatHarvestDate(batch.harvestDate)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        <span className="text-green-600 font-medium">{formatBatchMetric(batch.thc)}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        <span className="text-blue-600 font-medium">{formatBatchMetric(batch.cbd)}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                        <Link
                          href={productsHref(batch.id)}
                          className="underline-offset-4 hover:text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                        >
                          {pluralize(batch._count.products, 'product')}
                        </Link>
                        <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          (batch.labDocumentCount || 0) === 3
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          {labDocumentSummary(batch)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={'/grower/batches/' + batch.id + '/edit'}>Edit</Link>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            asChild
                          >
                            <Link href={'/grower/products/add?strainId=' + batch.strainId + '&batchId=' + batch.id}>
                              Add product
                            </Link>
                          </Button>
                          <RecordActions name={batch.batchNumber} actions={[{ label: 'Delete batch', destructive: true, onSelect: () => setDeleteCandidate(batch) }]} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No batches yet</h3>
          <p className="text-gray-500 mb-2 max-w-sm mx-auto">
            Create your first batch to track harvest data and lab results.
          </p>
          <p className="text-sm text-gray-500 mb-6">Next step: attach products to the batch so inventory can be listed.</p>
          <Button variant="primary" asChild>
            <Link href="/grower/batches/add">Create your first batch</Link>
          </Button>
        </div>
      )}

      <ConfirmDialog
        loading={deleting}
        open={Boolean(deleteCandidate)}
        title="Delete batch?"
        description={`Delete ${deleteCandidate?.batchNumber || 'this batch'}. Products attached to this batch should be reviewed before removing it.`}
        confirmLabel="Delete batch"
        intent="danger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteBatch(deleteCandidate.id);
          }
        }}
      />
    </div>
  );
}
