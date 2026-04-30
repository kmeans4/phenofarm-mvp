'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
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

const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const TEXTAREA_CLASSES = "w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent";

export function BatchSelector({ strainId, batchId, onBatchChange }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
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

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const url = strainId ? `/api/batches?strainId=${strainId}` : '/api/batches';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [strainId]);

  useEffect(() => {
    if (strainId) {
      setFormData(prev => ({ ...prev, strainId }));
    }
  }, [strainId]);

  useEffect(() => {
    const fetchStrains = async () => {
      try {
        const response = await fetch('/api/strains');
        if (response.ok) {
          const data = await response.json();
          setStrains(data);
        }
      } catch (err) {
        console.error('Error fetching strains:', err);
      }
    };

    fetchStrains();
  }, []);

  const handleCreateBatch = async () => {
    if (!formData.batchNumber.trim() || !formData.harvestDate || !formData.strainId) {
      setError('Batch number, harvest date, and strain are required');
      return;
    }

    try {
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
          coaDocumentUrl: null,
          testResults: hasBatchLabDocuments(formData.labDocuments)
            ? { labDocuments: formData.labDocuments }
            : null,
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create batch');
      }

      const newBatch = await response.json();
      await fetchBatches();
      onBatchChange(newBatch.id);
      setShowCreateForm(false);
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
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={batchId}
          onChange={(e) => onBatchChange(e.target.value || null)}
          className={INPUT_CLASSES}
        >
          <option value="">Select a batch (optional)</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>
              {batch.batchNumber} - {batch.strain?.name} {batch.thc ? `(THC: ${batch.thc}%)` : ''}
            </option>
          ))}
        </select>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New
        </Button>
      </div>

      {batches.length === 0 && !showCreateForm && (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          No batches available yet. Create one below without leaving this page.
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create New Batch</h3>
                <p className="text-sm text-gray-600 mt-1">Add a batch without leaving product creation</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="e.g., OGK-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className={INPUT_CLASSES}
                    placeholder="Optional lot number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Harvest Date *</label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Strain *</label>
                  {strainId ? (
                    <div className="space-y-2">
                      <div className="w-full h-10 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 flex items-center">
                        {strains.find((strain) => strain.id === formData.strainId)?.name || 'Selected strain'}
                        {(() => {
                          const selected = strains.find((strain) => strain.id === formData.strainId);
                          return selected?.genetics ? ` (${selected.genetics})` : '';
                        })()}
                      </div>
                      <p className="text-xs text-gray-500">Batch strain is locked to the strain selected on this product.</p>
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

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Lab Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">THC (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.thc} onChange={(e) => setFormData(prev => ({ ...prev, thc: e.target.value }))} className={INPUT_CLASSES} placeholder="e.g., 18.5" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">CBD (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.cbd} onChange={(e) => setFormData(prev => ({ ...prev, cbd: e.target.value }))} className={INPUT_CLASSES} placeholder="e.g., 0.5" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Cannabinoids (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={formData.totalCannabinoids} onChange={(e) => setFormData(prev => ({ ...prev, totalCannabinoids: e.target.value }))} className={INPUT_CLASSES} placeholder="e.g., 22.0" />
                  </div>
                </div>
              </div>

              <BatchLabDocumentUploaders
                value={formData.labDocuments}
                onChange={(documents) => setFormData(prev => ({ ...prev, labDocuments: documents }))}
                onError={setError}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className={TEXTAREA_CLASSES} rows={3} placeholder="Additional notes about this batch..." />
              </div>
            </div>

            <div className="flex gap-4 px-6 py-4 border-t border-gray-200">
              <Button type="button" variant="primary" disabled={creating} onClick={handleCreateBatch}>
                {creating ? 'Creating...' : 'Create Batch'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {batchId && (
        <a 
          href={`/grower/batches/${batchId}/edit`} 
          target="_blank"
          className="text-sm text-green-600 hover:underline"
        >
          View batch details →
        </a>
      )}
    </div>
  );
}
