'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
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

const INPUT_CLASSES = "min-w-0 w-full h-10 px-3 py-2 text-base sm:px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const TEXTAREA_CLASSES = "w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function BatchSelector({ strainId, batchId, onBatchChange }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    lotNumber: '',
    harvestDate: new Date().toISOString().split('T')[0],
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
          testResults: hasBatchLabDocuments(formData.labDocuments)
            ? { labDocuments: formData.labDocuments }
            : null,
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create batch');
      }

      const newBatch = await response.json();
      setBatches((current) => [...current, newBatch]);
      onBatchChange(newBatch.id);
      closeCreateForm();
      setFormData({
        batchNumber: '',
        lotNumber: '',
        harvestDate: new Date().toISOString().split('T')[0],
        strainId: strainId || '',
        thc: '',
        cbd: '',
        totalCannabinoids: '',
        labDocuments: createEmptyBatchLabDocuments(),
        notes: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
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
        <div className="text-xs text-gray-500">
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
            className="w-full max-w-3xl rounded-xl bg-white shadow-2xl my-1 sm:my-8"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4">
              <div>
                <h3 id="create-batch-dialog-title" className="text-lg font-semibold sm:text-xl text-gray-900">New batch</h3>

              </div>
              <button
                ref={closeCreateButtonRef}
                type="button"
                onClick={closeCreateForm}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close batch creation"
              >
                ×
              </button>
            </div>

            <div className="p-3 space-y-3 sm:p-6 sm:space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Batch # *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="OGK-2026-001"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Lot #</label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="Optional lot number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Harvest date *</label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Strain *</label>
                  {strainId ? (
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="min-w-0 w-full h-10 px-3 py-2 text-base sm:px-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 flex items-center">
                        {strains.find((strain) => strain.id === formData.strainId)?.name || 'Selected strain'}
                        {(() => {
                          const selected = strains.find((strain) => strain.id === formData.strainId);
                          return selected?.genetics ? ` (${selected.genetics})` : '';
                        })()}
                      </div>
                      <p className="text-xs text-gray-500">Uses the product’s strain.</p>
                    </div>
                  ) : (
                    <select
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

              <div className="border-t border-gray-200 pt-3 sm:pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4">Lab Results</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm font-medium text-gray-700">THC (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.thc} onChange={(e) => setFormData(prev => ({ ...prev, thc: e.target.value }))} className={INPUT_CLASSES} placeholder="18.5" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm font-medium text-gray-700">CBD (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.cbd} onChange={(e) => setFormData(prev => ({ ...prev, cbd: e.target.value }))} className={INPUT_CLASSES} placeholder="0.5" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.totalCannabinoids} onChange={(e) => setFormData(prev => ({ ...prev, totalCannabinoids: e.target.value }))} className={INPUT_CLASSES} placeholder="22.0" />
                  </div>
                </div>
              </div>

              <BatchLabDocumentUploaders
                onUploadingChange={setUploadingDocuments}
                value={formData.labDocuments}
                onChange={(documents) => setFormData(prev => ({ ...prev, labDocuments: documents }))}
                onError={setError}
              />

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className={TEXTAREA_CLASSES} rows={3} placeholder="Batch notes" />
              </div>
            </div>

            <div className="flex gap-4 px-3 py-3 sm:px-6 sm:py-4 border-t border-gray-200">
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

      {batchId && batches.some(batch => batch.id === batchId) && (
        <a 
          href={`/grower/batches/${batchId}/edit`} 
          target="_blank"
          className="inline-flex min-h-10 items-center text-sm text-green-600 hover:underline"
        >
          Batch details →
        </a>
      )}
    </div>
  );
}
