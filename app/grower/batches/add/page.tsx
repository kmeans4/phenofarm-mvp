'use client';

import Link from 'next/link';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { toast } from '@/app/hooks/useToast';
import { getTodayDateInputValue, isFutureDateInput, suggestBatchNumber } from '@/lib/batch-utils';
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

interface BatchSummary {
  id: string;
  batchNumber: string;
}

export default function AddBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeInternalPath(searchParams?.get('returnUrl'), '');
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingStrains, setFetchingStrains] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [existingBatches, setExistingBatches] = useState<BatchSummary[]>([]);
  const todayDate = getTodayDateInputValue();
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    lotNumber: '',
    harvestDate: getTodayDateInputValue(),
    strainId: '',
    thc: '',
    cbd: '',
    totalCannabinoids: '',
    labDocuments: createEmptyBatchLabDocuments(),
    notes: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [strainsResponse, batchesResponse] = await Promise.all([
          fetch('/api/strains'),
          fetch('/api/batches')
        ]);

        if (strainsResponse.ok) {
          const data = await strainsResponse.json();
          setStrains(Array.isArray(data) ? data : []);
        }

        if (batchesResponse.ok) {
          const data = await batchesResponse.json();
          setExistingBatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching batch form data:', err);
      } finally {
        setFetchingStrains(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = <K extends keyof BatchFormData>(field: K, value: BatchFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const canSubmit = !uploadingDocuments && !loading && !fetchingStrains && Boolean(formData.batchNumber.trim() && formData.harvestDate && formData.strainId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError('Batch number, harvest date, and strain are required');
      return;
    }

    if (isFutureDateInput(formData.harvestDate, todayDate)) {
      setError('Harvest date cannot be in the future');
      return;
    }

    try {
      setLoading(true);
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
      toast.success('Batch created');
      if (returnUrl) {
        try { sessionStorage.setItem('newlyCreatedBatchId', newBatch.id || ''); } catch { /* Storage is optional. */ }
        router.push(returnUrl);
      } else {
        router.push('/grower/batches');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestedBatchNumber = () => {
    handleChange(
      'batchNumber',
      suggestBatchNumber(existingBatches.map((batch) => batch.batchNumber), formData.harvestDate)
    );
  };

  if (fetchingStrains) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (strains.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No strains available</h2>
        <p className="text-gray-600 mb-6">You need to create at least one strain before creating a batch.</p>
        <Button variant="primary" asChild>
          <Link href={`/grower/strains/add?returnUrl=${encodeURIComponent(`/grower/batches/add${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)}`}>Create your first strain</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-6">
      <PageHeader title="Add batch" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">
                    Batch # *
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={applySuggestedBatchNumber}>
                    Generate
                  </Button>
                </div>
                <input
                  id="batchNumber"
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => handleChange('batchNumber', e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Batch number"
                />
                <p className="text-xs text-gray-500">Example: BATCH-20260917-01</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="lotNumber" className="block text-sm font-medium text-gray-700">
                  Lot #
                </label>
                <input
                  id="lotNumber"
                  type="text"
                  value={formData.lotNumber}
                  onChange={(e) => handleChange('lotNumber', e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Internal or lab lot"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700">
                  Harvest date *
                </label>
                <input
                  id="harvestDate"
                  type="date"
                  required
                  max={todayDate}
                  value={formData.harvestDate}
                  onChange={(e) => handleChange('harvestDate', e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="strainId" className="block text-sm font-medium text-gray-700">
                  Strain *
                </label>
                <select
                  id="strainId"
                  required
                  value={formData.strainId}
                  onChange={(e) => handleChange('strainId', e.target.value)}
                  className="w-full h-[42px] rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a strain</option>
                  {strains.map(strain => (
                    <option key={strain.id} value={strain.id}>
                      {strain.name} {strain.genetics ? `(${strain.genetics})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lab Results */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4">Lab Results</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="thc" className="block text-sm font-medium text-gray-700">
                    THC (%)
                  </label>
                  <input
                    id="thc"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.thc}
                    onChange={(e) => handleChange('thc', e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="18.5"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="cbd" className="block text-sm font-medium text-gray-700">
                    CBD (%)
                  </label>
                  <input
                    id="cbd"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.cbd}
                    onChange={(e) => handleChange('cbd', e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.5"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="totalCannabinoids" className="block text-sm font-medium text-gray-700">
                    Total (%)
                  </label>
                  <input
                    id="totalCannabinoids"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.totalCannabinoids}
                    onChange={(e) => handleChange('totalCannabinoids', e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="22.0"
                  />
                </div>
              </div>
            </div>

            <BatchLabDocumentUploaders
                onUploadingChange={setUploadingDocuments}
              value={formData.labDocuments}
              onChange={(documents) => handleChange('labDocuments', documents)}
              onError={setError}
            />

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Batch notes"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <Button type="submit" variant="primary" className="flex-1 sm:flex-none" disabled={!canSubmit}>
                {loading ? 'Creating...' : 'Add batch'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => router.push('/grower/batches')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
