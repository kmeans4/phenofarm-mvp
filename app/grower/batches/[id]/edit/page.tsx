'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { toast } from '@/app/hooks/useToast';
import { getTodayDateInputValue, isFutureDateInput, suggestBatchNumber, toDateInputValue } from '@/lib/batch-utils';
import {
  BatchLabDocumentUploaders,
  BatchLabDocuments,
  createEmptyBatchLabDocuments,
} from '@/app/grower/components/BatchLabDocumentUploaders';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
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
  terpenes: unknown;
  coaDocumentUrl: string | null;
  testResults: { labDocuments?: BatchLabDocuments } | null;
  notes: string | null;
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

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params?.id as string;
  
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [existingBatches, setExistingBatches] = useState<BatchSummary[]>([]);
  const [terpeneRows, setTerpeneRows] = useState<{ id: string; name: string; percentage: string }[]>([]);
  const [terpenesEdited, setTerpenesEdited] = useState(false);
  const [unrecognizedTerpenes, setUnrecognizedTerpenes] = useState(false);
  const todayDate = getTodayDateInputValue();
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    lotNumber: '',
    harvestDate: '',
    strainId: '',
    thc: '',
    cbd: '',
    totalCannabinoids: '',
    labDocuments: createEmptyBatchLabDocuments(),
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [strainsRes, batchesRes, batchRes] = await Promise.all([
          fetch('/api/strains?summary=true'), fetch('/api/batches'), fetch('/api/batches/' + batchId),
        ]);
        if (!strainsRes.ok || !batchesRes.ok) throw new Error('Could not load batch options');
        const [strainsData, batchesData] = await Promise.all([strainsRes.json(), batchesRes.json()]);
        setStrains(Array.isArray(strainsData) ? strainsData : []);
        setExistingBatches(Array.isArray(batchesData) ? batchesData : []);
        if (batchRes.ok) {
          const data = await batchRes.json();
          setBatch(data);
          const entries = data.terpenes && typeof data.terpenes === 'object' && !Array.isArray(data.terpenes)
            ? Object.entries(data.terpenes) : [];
          const readable = !data.terpenes || (entries.length >= 0 && typeof data.terpenes === 'object' && !Array.isArray(data.terpenes) && entries.every(([, value]) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))));
          setUnrecognizedTerpenes(!readable);
          setTerpeneRows(readable ? entries.map(([name, value], index) => ({ id: String(index), name, percentage: String(value) })) : []);
          setFormData({
            batchNumber: data.batchNumber || '',
            lotNumber: data.lotNumber || '',
            harvestDate: toDateInputValue(data.harvestDate),
            strainId: data.strainId || '',
            thc: data.thc?.toString() || '',
            cbd: data.cbd?.toString() || '',
            totalCannabinoids: data.totalCannabinoids?.toString() || '',
            labDocuments: data.testResults?.labDocuments || createEmptyBatchLabDocuments(),
            notes: data.notes || ''
          });
        } else {
          setError('Batch not found');
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setFetching(false);
      }
    };

    if (batchId) {
      fetchData();
    }
  }, [batchId]);

  const handleChange = <K extends keyof BatchFormData>(field: K, value: BatchFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const canSubmit = !uploadingDocuments && !loading && !fetching && Boolean(formData.batchNumber.trim() && formData.harvestDate && formData.strainId);

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

      let terpenesParsed = batch?.terpenes ?? null;
      if (terpenesEdited) {
        const names = terpeneRows.map((row) => row.name.trim().toLowerCase());
        if (terpeneRows.some((row) => !row.name.trim() || !row.percentage.trim() || !Number.isFinite(Number(row.percentage)) || Number(row.percentage) < 0 || Number(row.percentage) > 100)) {
          throw new Error('Enter a terpene name and a percentage from 0 to 100 for each row.');
        }
        if (new Set(names).size !== names.length) throw new Error('Use each terpene name only once.');
        terpenesParsed = terpeneRows.length ? Object.fromEntries(terpeneRows.map((row) => [row.name.trim(), Number(row.percentage)])) : null;
      }

      const response = await fetch('/api/batches/' + batchId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: formData.batchNumber.trim(),
          lotNumber: formData.lotNumber.trim() || null,
          harvestDate: formData.harvestDate,
          strainId: formData.strainId,
          thc: formData.thc.trim() || null,
          cbd: formData.cbd.trim() || null,
          totalCannabinoids: formData.totalCannabinoids.trim() || null,
          terpenes: terpenesParsed,
          testResults: { ...batch?.testResults, labDocuments: formData.labDocuments },
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update batch');
      }

      toast.success('Batch updated');
      router.push('/grower/batches');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestedBatchNumber = () => {
    handleChange(
      'batchNumber',
      suggestBatchNumber(
        existingBatches
          .filter((existingBatch) => existingBatch.id !== batchId)
          .map((existingBatch) => existingBatch.batchNumber),
        formData.harvestDate || todayDate
      )
    );
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pf-accent"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-8 sm:py-12">
        <h2 className="text-2xl font-bold text-pf-text">Batch not found</h2>
        <Button variant="primary" className="mt-4" onClick={() => router.push('/grower/batches')}>
          Back to Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-6">
      <PageHeader title="Edit batch" />

      {error && (
        <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg">
          <p className="text-pf-danger">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
              <div className="min-w-0 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-pf-secondary">
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
                  className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                  placeholder="Batch number"
                />
              </div>

              <div className="min-w-0 space-y-1.5 sm:space-y-2">
                <label htmlFor="lotNumber" className="block text-sm font-medium text-pf-secondary">
                  Lot #
                </label>
                <input
                  id="lotNumber"
                  type="text"
                  value={formData.lotNumber}
                  onChange={(e) => handleChange('lotNumber', e.target.value)}
                  className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                  placeholder="Internal or lab lot"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
              <div className="min-w-0 space-y-1.5 sm:space-y-2">
                <label htmlFor="harvestDate" className="block text-sm font-medium text-pf-secondary">
                  Harvest date *
                </label>
                <input
                  id="harvestDate"
                  type="date"
                  required
                  max={todayDate}
                  value={formData.harvestDate}
                  onChange={(e) => handleChange('harvestDate', e.target.value)}
                  className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                />
              </div>

              <div className="min-w-0 space-y-1.5 sm:space-y-2">
                <label htmlFor="strainId" className="block text-sm font-medium text-pf-secondary">
                  Strain *
                </label>
                <select
                  id="strainId"
                  required
                  value={formData.strainId}
                  onChange={(e) => handleChange('strainId', e.target.value)}
                  className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
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
            <div className="border-t border-pf-line pt-4 sm:pt-6">
              <h3 className="text-base font-semibold text-pf-text mb-3 sm:text-lg sm:mb-4">Lab results</h3>
              <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
                <div className="min-w-0 space-y-1.5 sm:space-y-2">
                  <label htmlFor="thc" className="block text-sm font-medium text-pf-secondary">
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
                    className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                    placeholder="18.5"
                  />
                </div>

                <div className="min-w-0 space-y-1.5 sm:space-y-2">
                  <label htmlFor="cbd" className="block text-sm font-medium text-pf-secondary">
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
                    className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                    placeholder="0.5"
                  />
                </div>

                <div className="min-w-0 space-y-1.5 sm:space-y-2">
                  <label htmlFor="totalCannabinoids" className="block text-sm font-medium text-pf-secondary">
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
                    className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                    placeholder="22.0"
                  />
                </div>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-pf-secondary">Terpenes</legend>
              {unrecognizedTerpenes && !terpenesEdited ? (
                <div className="space-y-2 rounded-lg bg-pf-warning-bg p-3 text-sm text-pf-warning">
                  <p>Existing terpene details will be kept. Replace them to enter percentages here.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setTerpenesEdited(true); setTerpeneRows([]); }}>Replace terpene details</Button>
                </div>
              ) : <>
                {terpeneRows.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-end gap-2">
                    <label className="min-w-0 text-sm text-pf-secondary">Terpene
                      <input value={row.name} required placeholder="Myrcene" onChange={(event) => { setTerpenesEdited(true); setTerpeneRows((rows) => rows.map((item) => item.id === row.id ? { ...item, name: event.target.value } : item)); }} className="mt-1 h-10 w-full rounded-lg border border-pf-line-strong px-3 text-base" />
                    </label>
                    <label className="text-sm text-pf-secondary">%
                      <input type="number" value={row.percentage} required min="0" max="100" step="0.01" onChange={(event) => { setTerpenesEdited(true); setTerpeneRows((rows) => rows.map((item) => item.id === row.id ? { ...item, percentage: event.target.value } : item)); }} className="mt-1 h-10 w-full rounded-lg border border-pf-line-strong px-2 text-base" />
                    </label>
                    <Button type="button" variant="ghost" aria-label={`Remove terpene ${index + 1}`} onClick={() => { setTerpenesEdited(true); setTerpeneRows((rows) => rows.filter((item) => item.id !== row.id)); }}>×</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => { setTerpenesEdited(true); setTerpeneRows((rows) => [...rows, { id: crypto.randomUUID(), name: '', percentage: '' }]); }}>Add terpene</Button>
              </>}
            </fieldset>

            <BatchLabDocumentUploaders
                onUploadingChange={setUploadingDocuments}
              value={formData.labDocuments}
              onChange={(documents) => handleChange('labDocuments', documents)}
              onError={setError}
            />

            <div className="min-w-0 space-y-1.5 sm:space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-pf-secondary">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="min-h-10 min-w-0 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                placeholder="Batch notes"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-pf-line">
              <Button type="submit" variant="primary" className="flex-1 sm:flex-none" disabled={!canSubmit}>
                {loading ? 'Saving...' : 'Save Changes'}
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
