'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { toast } from '@/app/hooks/useToast';
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
  harvestDate: string;
  strainId: string;
  thc: string;
  cbd: string;
  totalCannabinoids: string;
  terpenes: string;
  labDocuments: BatchLabDocuments;
  notes: string;
}

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    harvestDate: '',
    strainId: '',
    thc: '',
    cbd: '',
    totalCannabinoids: '',
    terpenes: '',
    labDocuments: createEmptyBatchLabDocuments(),
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        // Fetch strains
        const strainsRes = await fetch('/api/strains');
        if (strainsRes.ok) {
          const strainsData = await strainsRes.json();
          setStrains(strainsData);
        }
        
        // Fetch batch
        const batchRes = await fetch('/api/batches/' + batchId);
        if (batchRes.ok) {
          const data = await batchRes.json();
          setBatch(data);
          setFormData({
            batchNumber: data.batchNumber || '',
            harvestDate: data.harvestDate ? data.harvestDate.split('T')[0] : '',
            strainId: data.strainId || '',
            thc: data.thc?.toString() || '',
            cbd: data.cbd?.toString() || '',
            totalCannabinoids: data.totalCannabinoids?.toString() || '',
            terpenes: data.terpenes ? JSON.stringify(data.terpenes, null, 2) : '',
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

  const canSubmit = !loading && !fetching && Boolean(formData.batchNumber.trim() && formData.harvestDate && formData.strainId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError('Batch number, harvest date, and strain are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let terpenesParsed = null;
      if (formData.terpenes.trim()) {
        try {
          terpenesParsed = JSON.parse(formData.terpenes.trim());
        } catch {
          setError('Invalid JSON format for terpenes');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/batches/' + batchId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: formData.batchNumber.trim(),
          harvestDate: formData.harvestDate,
          strainId: formData.strainId,
          thc: formData.thc.trim() || null,
          cbd: formData.cbd.trim() || null,
          totalCannabinoids: formData.totalCannabinoids.trim() || null,
          terpenes: terpenesParsed,
          coaDocumentUrl: null,
          testResults: hasBatchLabDocuments(formData.labDocuments)
            ? { labDocuments: formData.labDocuments }
            : null,
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Batch not found</h2>
        <Button variant="primary" className="mt-4" onClick={() => router.push('/grower/batches')}>
          Back to Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Batch</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Update batch details and lab results</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">
                Batch Number *
              </label>
              <input
                id="batchNumber"
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) => handleChange('batchNumber', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., OGK-2024-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700">
                  Harvest Date *
                </label>
                <input
                  id="harvestDate"
                  type="date"
                  required
                  value={formData.harvestDate}
                  onChange={(e) => handleChange('harvestDate', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="strainId" className="block text-sm font-medium text-gray-700">
                  Strain *
                </label>
                <select
                  id="strainId"
                  required
                  value={formData.strainId}
                  onChange={(e) => handleChange('strainId', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lab Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 18.5"
                  />
                </div>

                <div className="space-y-2">
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 0.5"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="totalCannabinoids" className="block text-sm font-medium text-gray-700">
                    Total Cannabinoids (%)
                  </label>
                  <input
                    id="totalCannabinoids"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.totalCannabinoids}
                    onChange={(e) => handleChange('totalCannabinoids', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 22.0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="terpenes" className="block text-sm font-medium text-gray-700">
                Terpenes (JSON)
              </label>
              <textarea
                id="terpenes"
                rows={3}
                value={formData.terpenes}
                onChange={(e) => handleChange('terpenes', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                placeholder='{"myrcene": 0.5, "limonene": 0.3}'
              />
            </div>

            <BatchLabDocumentUploaders
              value={formData.labDocuments}
              onChange={(documents) => handleChange('labDocuments', documents)}
              onError={setError}
            />

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes about this batch..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={!canSubmit}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
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
