'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../components/OperationsSummary';
import { RecordActions } from '../components/RecordActions';
import { deleteRecord } from '@/app/components/ui/deleteRecord';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { toast } from '@/app/hooks/useToast';
import { STRAIN_TYPE_LABELS, StrainTypeValue } from '@/lib/strain-types';
import { pluralize } from '@/lib/utils';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
  strainType: StrainTypeValue | null;
  description: string | null;
  growerNotes: string | null;
  createdAt: string;
  _count: {
    products: number;
    batches: number;
  };
}

export default function StrainsPage() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [deleteCandidate, setDeleteCandidate] = useState<Strain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef(false);

  const fetchStrains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/strains');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setStrains(data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch strains');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('strainViewMode');
    if (saved === 'card' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('strainViewMode', mode);
  };

  useEffect(() => {
    fetchStrains();
  }, [fetchStrains]);

  const deleteStrain = async (strainId: string) => {
    if (deleteRef.current) return;
    deleteRef.current = true;
    setDeleting(true);
    try {
      await deleteRecord('/api/strains/' + strainId, 'Failed to delete strain');
      setStrains((current) => current.filter(item => item.id !== strainId));
      toast.success('Strain deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error deleting strain');
    } finally {
      deleteRef.current = false;
      setDeleting(false);
      setDeleteCandidate(null);
    }
  };

  const batchesHref = (strainId: string) => `/grower/batches?strain=${encodeURIComponent(strainId)}`;
  const productsHref = (strainId: string) => `/grower/products?strain=${encodeURIComponent(strainId)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pf-accent mx-auto mb-4"></div>
          <p className="text-pf-muted">Loading strains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        mobileInlineActions
        title="Strains"
        actions={
          <Button variant="primary" asChild className="shrink-0">
            <Link href="/grower/strains/add" className="inline-flex w-full sm:w-auto justify-center">Add strain</Link>
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg">
          <p className="text-pf-danger">{error}</p>
          <Button variant="secondary" onClick={fetchStrains} className="mt-2">Retry</Button>
        </div>
      )}

      <OperationsSummary items={[{label: 'Strains', value: strains.length}, {label: 'Batches', value: strains.reduce((sum, item) => sum + item._count.batches, 0)}, {label: 'Products', value: strains.reduce((sum, item) => sum + item._count.products, 0)}]} />

      {/* View Toggle */}
      <div className="flex justify-start sm:justify-end">
        <div className="flex items-center gap-1 bg-pf-surface p-1 rounded-lg">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`flex min-h-10 min-w-10 items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'card'
                ? 'bg-pf-accent-bg text-pf-accent ring-1 ring-inset ring-pf-accent-line'
                : 'text-pf-muted hover:text-pf-text'
            }`}
            title="Card View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex min-h-10 min-w-10 items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-pf-accent-bg text-pf-accent ring-1 ring-inset ring-pf-accent-line'
                : 'text-pf-muted hover:text-pf-text'
            }`}
            title="List View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Strains Display */}
      {strains.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {strains.map((strain) => (
              <div key={strain.id} className="bg-pf-surface rounded-xl shadow-sm border border-pf-line overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-pf-text">{strain.name}</h3>
                      {strain.strainType && (
                        <p className="text-xs text-pf-muted mt-1">{STRAIN_TYPE_LABELS[strain.strainType]}</p>
                      )}
                      {strain.genetics && (
                        <p className="text-sm text-pf-muted mt-1">{strain.genetics}</p>
                      )}
                    </div>
                  </div>

                  {strain.description && (
                    <p className="text-sm text-pf-muted mt-3 line-clamp-2">{strain.description}</p>
                  )}

                  {strain.growerNotes && (
                    <p className="text-sm text-pf-muted mt-2 italic line-clamp-2">{strain.growerNotes}</p>
                  )}

                  <div className="flex items-center gap-3 mt-1 text-sm sm:mt-4">
                    <Link
                      href={batchesHref(strain.id)}
                      className="inline-flex min-h-10 items-center rounded-md text-pf-muted underline-offset-4 hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                    >
                      {pluralize(strain._count.batches, 'batch', 'batches')}
                    </Link>
                    <Link
                      href={productsHref(strain.id)}
                      className="inline-flex min-h-10 items-center rounded-md text-pf-muted underline-offset-4 hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                    >
                      {pluralize(strain._count.products, 'product')}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 pt-2 border-t sm:mt-3 sm:pt-3 border-pf-line">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={'/grower/strains/' + strain.id + '/edit'} className="inline-flex w-full justify-center">Edit</Link>
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={'/grower/products/add?strainId=' + strain.id} className="inline-flex w-full justify-center">
                        Add product
                      </Link>
                    </Button>
                    <RecordActions name={strain.name} actions={[{label: 'Delete strain', destructive: true, onSelect: () => setDeleteCandidate(strain)}]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[620px]">
                <thead className="bg-pf-canvas border-b border-pf-line">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wider">Strain</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wider">Genetics</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wider">Batches</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wider">Products</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-pf-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pf-line">
                  {strains.map((strain) => (
                    <tr key={strain.id} className="hover:bg-pf-canvas transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="font-medium text-sm sm:text-base text-pf-text">{strain.name}</div>
                        {strain.strainType && (
                          <div className="text-xs text-pf-muted">{STRAIN_TYPE_LABELS[strain.strainType]}</div>
                        )}
                        {strain.description && (
                          <div className="text-xs sm:text-sm text-pf-muted line-clamp-1">{strain.description}</div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-pf-muted">
                        {strain.genetics || '-'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-pf-muted">
                        <Link
                          href={batchesHref(strain.id)}
                          className="inline-flex min-h-10 items-center rounded-md underline-offset-4 hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                        >
                          {strain._count.batches}
                        </Link>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-pf-muted">
                        <Link
                          href={productsHref(strain.id)}
                          className="inline-flex min-h-10 items-center rounded-md underline-offset-4 hover:text-pf-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                        >
                          {strain._count.products}
                        </Link>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={'/grower/strains/' + strain.id + '/edit'} className="whitespace-nowrap">Edit</Link>
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            asChild
                          >
                            <Link href={'/grower/products/add?strainId=' + strain.id} className="whitespace-nowrap">
                              Add product
                            </Link>
                          </Button>
                          <RecordActions name={strain.name} actions={[{label: 'Delete strain', destructive: true, onSelect: () => setDeleteCandidate(strain)}]} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center px-4 py-8 sm:py-12 border border-pf-line rounded-xl bg-pf-surface">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pf-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-pf-text mb-2">No strains yet</h3>
          <p className="text-sm text-pf-muted mb-4 max-w-sm mx-auto">
            Add strains to organize your batches and products.
          </p>
          <Button variant="primary" asChild>
            <Link href="/grower/strains/add">Add your first strain</Link>
          </Button>
        </div>
      )}

      <ConfirmDialog
        loading={deleting}
        open={Boolean(deleteCandidate)}
        title="Delete strain?"
        description={`Delete ${deleteCandidate?.name || 'this strain'}. Review attached batches and products before removing it.`}
        confirmLabel="Delete strain"
        intent="danger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteStrain(deleteCandidate.id);
          }
        }}
      />
    </div>
  );
}
