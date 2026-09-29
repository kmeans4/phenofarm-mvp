'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { getTodayDateInputValue } from '@/lib/batch-utils';
import {
  BatchLabDocumentUploaders,
  BatchLabDocuments,
  createEmptyBatchLabDocuments,
  hasBatchLabDocuments
} from '@/app/grower/components/BatchLabDocumentUploaders';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
}

interface Batch {
  id: string;
  batchNumber: string;
  strainId: string;
  strain: Strain;
  thc: number | null;
  cbd: number | null;
  harvestDate: string;
}

interface BatchSelectorProps {
  strainId?: string;
  batchId: string;
  onBatchChange: (batchId: string | null) => void;
}

interface BatchFormData {
  batchNumber: string;
  lotNumber: string;
  harvestDate: string;
  strainId: string;
  thc: string;
  cbd: string;
  totalCannabinoids: string;
  labDocuments: BatchLabDocuments;
  notes: string;
}

const INPUT_CLASSES = "min-w-0 w-full h-10 px-3 py-2 text-base sm:px-4 border border-pf-line-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const TEXTAREA_CLASSES = "w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function BatchSelector({ strainId, batchId, onBatchChange }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [terpenes, setTerpenes] = useState<Array<{ id: string; name: string; percentage: string }>>([]);
  const selectedBatch = batches.find(batch => batch.id === batchId);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    lotNumber: '',
    harvestDate: getTodayDateInputValue(),
    strainId: strainId || '',
    thc: '',
    cbd: '',
    totalCannabinoids: '',
    labDocuments: createEmptyBatchLabDocuments(),
    notes: ''
  });
  const newBatchButtonRef = useRef<HTMLButtonElement>(null);
  const closeCreateButtonRef = useRef<HTMLButtonElement>(null);
  const createDialogRef = useRef<HTMLDivElement>(null);

  const openCreateForm = useCallback(() => {
    setShowCreateForm(true);
  }, []);

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  useFocusTrap({
    active: showCreateForm,
    containerRef: createDialogRef,
    initialFocusRef: closeCreateButtonRef,
    returnFocusRef: newBatchButtonRef,
    onEscape: closeCreateForm,
  });

  const fetchBatches = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const url = strainId ? `/api/batches?strainId=${strainId}` : '/api/batches';
      const response = await fetch(url, { signal });
      if (response.ok) {
        const data = await response.json();
        if (!signal?.aborted) setBatches(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!signal?.aborted) console.error('Error fetching batches:', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [strainId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBatches(controller.signal);
    return () => controller.abort();
  }, [fetchBatches]);

  useEffect(() => {
    if (strainId) {
      setFormData(prev => ({ ...prev, strainId }));
    }
  }, [strainId]);

  useBodyOverlay(showCreateForm);

  useEffect(() => {
    if (!showCreateForm) return;
    const fetchStrains = async () => {
      try {
        const response = await fetch('/api/strains?summary=true');
        if (response.ok) {
          const data = await response.json();
          setStrains(data);
        }
      } catch (err) {
        console.error('Error fetching strains:', err);
      }
    };

    fetchStrains();
  }, [showCreateForm]);

  const createRef = useRef(false);
  const handleCreateBatch = async () => {
    if (createRef.current || uploadingDocuments) return;
    if (!formData.batchNumber.trim() || !formData.harvestDate || !formData.strainId) {
      setError('Batch number, harvest date, and strain are required');
      return;
    }

    if (terpenes.some(row => !row.name.trim() || !row.percentage.trim() || !Number.isFinite(Number(row.percentage)) || Number(row.percentage) < 0 || Number(row.percentage) > 100)
      || new Set(terpenes.map(row => row.name.trim().toLowerCase())).size !== terpenes.length) {
      setError('Enter unique terpene names and percentages from 0 to 100.'); return;
    }
    try {
      createRef.current = true;
      setCreating(true);
      setError(null);

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: formData.batchNumber.trim(),
          lotNumber: formData.lotNumber.trim() || null,
          harvestDate: formData.harvestDate,
          strainId: formData.strainId,
          thc: formData.thc.trim() || null,
          cbd: formData.cbd.trim() || null,
          totalCannabinoids: formData.totalCannabinoids.trim() || null,
          terpenes: terpenes.length ? Object.fromEntries(terpenes.map(row => [row.name.trim(), Number(row.percentage)])) : null,
          testResults: hasBatchLabDocuments(formData.labDocuments)
            ? { labDocuments: formData.labDocuments }
            : null,
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'We could not create batch. Please try again.');
      }

      const newBatch = await response.json();
      setBatches((current) => [...current, newBatch]);
      onBatchChange(newBatch.id);
      closeCreateForm();
      setTerpenes([]);
      setFormData({
        batchNumber: '',
        lotNumber: '',
        harvestDate: getTodayDateInputValue(),
        strainId: strainId || '',
        thc: '',
        cbd: '',
        totalCannabinoids: '',
        labDocuments: createEmptyBatchLabDocuments(),
        notes: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create batch. Please try again.');
    } finally {
      createRef.current = false;
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center gap-2">
        <select
          id="batchId"
          disabled={loading}
          value={batchId}
          onChange={(e) => onBatchChange(e.target.value || null)}
          className={INPUT_CLASSES}
        >
          <option value="">{loading ? 'Loading batches...' : 'Choose batch'}</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>
              {batch.batchNumber} - {batch.strain?.name} {batch.thc ? `(THC: ${batch.thc}%)` : ''}
            </option>
          ))}
        </select>
        <Button 
          ref={newBatchButtonRef}
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => (showCreateForm ? closeCreateForm() : openCreateForm())}
        >
          + New
        </Button>
      </div>

      {batches.length === 0 && !showCreateForm && (
        <div className="text-xs text-pf-muted">
          No batches for this strain.
        </div>
      )}

      {showCreateForm && createPortal(
        <div
          className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeCreateForm();
          }}
        >
          <div
            ref={createDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-batch-dialog-title"
            className="w-full max-w-3xl rounded-xl bg-pf-surface shadow-2xl my-1 sm:my-8"
          >
            <div className="flex items-center justify-between border-b border-pf-line px-3 py-3 sm:px-6 sm:py-4">
              <div>
                <h3 id="create-batch-dialog-title" className="text-lg font-semibold sm:text-xl text-pf-text">New batch</h3>

              </div>
              <button
                ref={closeCreateButtonRef}
                type="button"
                onClick={closeCreateForm}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary text-2xl leading-none"
                aria-label="Close batch creation"
              >
                ×
              </button>
            </div>

            <div className="p-3 space-y-3 sm:p-6 sm:space-y-6">
              {error && (
                <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg text-pf-danger">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="inline-batch-batchNumber" className="block text-sm font-medium text-pf-secondary">Batch # *</label>
                  <input
                    type="text"
                    id="inline-batch-batchNumber" value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="OGK-2026-001"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="inline-batch-lotNumber" className="block text-sm font-medium text-pf-secondary">Lot #</label>
                  <input
                    type="text"
                    id="inline-batch-lotNumber" value={formData.lotNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="Optional lot number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="inline-batch-harvest-date" className="block text-sm font-medium text-pf-secondary">Harvest date *</label>
                  <input
                    id="inline-batch-harvest-date"
                    type="date"
                    max={getTodayDateInputValue()}
                    value={formData.harvestDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor={strainId ? undefined : "inline-batch-strain"} className="block text-sm font-medium text-pf-secondary">Strain *</label>
                  {strainId ? (
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="min-w-0 w-full h-10 px-3 py-2 text-base sm:px-4 border border-pf-line rounded-lg bg-pf-canvas text-pf-secondary flex items-center">
                        {strains.find((strain) => strain.id === formData.strainId)?.name || 'Selected strain'}
                        {(() => {
                          const selected = strains.find((strain) => strain.id === formData.strainId);
                          return selected?.genetics ? ` (${selected.genetics})` : '';
                        })()}
                      </div>
                      <p className="text-xs text-pf-muted">Uses the product’s strain.</p>
                    </div>
                  ) : (
                    <select
                      id="inline-batch-strain"
                      value={formData.strainId}
                      onChange={(e) => setFormData(prev => ({ ...prev, strainId: e.target.value }))}
                      className={INPUT_CLASSES}
                    >
                      <option value="">Select a strain</option>
                      {strains.map(strain => (
                        <option key={strain.id} value={strain.id}>
                          {strain.name} {strain.genetics ? `(${strain.genetics})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="border-t border-pf-line pt-3 sm:pt-6">
                <h4 className="text-base font-semibold text-pf-text mb-3 sm:text-lg sm:mb-4">Lab results</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="inline-batch-thc" className="block text-sm font-medium text-pf-secondary">THC (%)</label>
                    <input type="number" step="0.01" min="0" max="100" id="inline-batch-thc" value={formData.thc} onChange={(e) => setFormData(prev => ({ ...prev, thc: e.target.value }))} className={INPUT_CLASSES} placeholder="18.5" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="inline-batch-cbd" className="block text-sm font-medium text-pf-secondary">CBD (%)</label>
                    <input type="number" step="0.01" min="0" max="100" id="inline-batch-cbd" value={formData.cbd} onChange={(e) => setFormData(prev => ({ ...prev, cbd: e.target.value }))} className={INPUT_CLASSES} placeholder="0.5" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="inline-batch-totalCannabinoids" className="block text-sm font-medium text-pf-secondary">Total cannabinoids (%)</label>
                    <input type="number" step="0.01" min="0" max="100" id="inline-batch-totalCannabinoids" value={formData.totalCannabinoids} onChange={(e) => setFormData(prev => ({ ...prev, totalCannabinoids: e.target.value }))} className={INPUT_CLASSES} placeholder="22.0" />
                  </div>
                </div>
              </div>

              <details className="rounded-lg border border-pf-line p-3">
                <summary className="cursor-pointer py-2 text-sm font-medium">Terpenes (optional)</summary>
                {terpenes.map((row, index) => <div key={row.id} className="my-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <label className="min-w-0 text-sm">Terpene {index + 1}<input className={INPUT_CLASSES} value={row.name} onChange={event => setTerpenes(rows => rows.map(item => item.id === row.id ? { ...item, name: event.target.value } : item))} /></label>
                  <label className="min-w-0 text-sm">Percentage {index + 1}<input type="number" min="0" max="100" step="0.01" className={INPUT_CLASSES} value={row.percentage} onChange={event => setTerpenes(rows => rows.map(item => item.id === row.id ? { ...item, percentage: event.target.value } : item))} /></label>
                  <Button type="button" variant="ghost" aria-label={`Remove terpene ${index + 1}`} onClick={() => setTerpenes(rows => rows.filter(item => item.id !== row.id))}>×</Button>
                </div>)}
                <Button type="button" variant="outline" onClick={() => setTerpenes(rows => [...rows, { id: crypto.randomUUID(), name: '', percentage: '' }])}>Add terpene</Button>
              </details>
              <BatchLabDocumentUploaders
                onUploadingChange={setUploadingDocuments}
                value={formData.labDocuments}
                onChange={(documents) => setFormData(prev => ({ ...prev, labDocuments: documents }))}
                onError={setError}
              />

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="inline-batch-notes" className="block text-sm font-medium text-pf-secondary">Notes</label>
                <textarea id="inline-batch-notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className={TEXTAREA_CLASSES} rows={3} placeholder="Batch notes" />
              </div>
            </div>

            <div className="flex gap-4 px-3 py-3 sm:px-6 sm:py-4 border-t border-pf-line">
              <Button type="button" variant="primary" disabled={creating || uploadingDocuments} onClick={handleCreateBatch}>
                {creating ? 'Creating...' : 'Add batch'}
              </Button>
              <Button type="button" variant="outline" onClick={closeCreateForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedBatch && <div className="rounded-lg bg-pf-canvas p-3 text-sm" role="status">
        <p className="font-medium">From batch {selectedBatch.batchNumber}</p>
        <p>Harvest: {selectedBatch.harvestDate?.slice(0, 10) || 'Not entered'} · THC: {selectedBatch.thc == null ? 'Not entered' : `${Number(selectedBatch.thc)}%`} · CBD: {selectedBatch.cbd == null ? 'Not entered' : `${Number(selectedBatch.cbd)}%`}</p>
        <p className="mt-1 text-xs text-pf-muted">Buyers see this batch’s lab results when available. Otherwise, they see the product’s THC and CBD ranges. Update lab results in Batch details. The product’s harvest date is entered separately.</p>
      </div>}
      {batchId && batches.some(batch => batch.id === batchId) && (
        <a 
          href={`/grower/batches/${batchId}/edit`} 
          target="_blank"
          className="inline-flex min-h-10 items-center text-sm text-pf-accent hover:underline"
        >
          Batch details →
        </a>
      )}
    </div>
  );
}
