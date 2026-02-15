'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

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
  terpenes: string;
  coaDocumentUrl: string;
  notes: string;
}

export default function AddBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingStrains, setFetchingStrains] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    lotNumber: '',
    harvestDate: new Date().toISOString().split('T')[0],
    strainId: '',
    thc: '',
    cbd: '',
    totalCannabinoids: '',
    terpenes: '',
    coaDocumentUrl: '',
    notes: ''
  });

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
      } finally {
        setFetchingStrains(false);
      }
    };

    fetchStrains();
  }, []);

  const handleChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.batchNumber.trim() || !formData.harvestDate || !formData.strainId) {
      setError('Batch number, harvest date, and strain are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse terpenes JSON if provided
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
          terpenes: terpenesParsed,
          coaDocumentUrl: formData.coaDocumentUrl.trim() || null,
          notes: formData.notes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create batch');
      }

      alert('Batch created successfully!');
      router.push('/grower/batches');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
          <a href="/grower/strains/add">Create your first strain</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Batch</h1>
        <p className="text-gray-600 mt-1">Create a harvest batch with lab results</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <label htmlFor="lotNumber" className="block text-sm font-medium text-gray-700">
                  Lot Number
                </label>
                <input
                  id="lotNumber"
                  type="text"
                  value={formData.lotNumber}
                  onChange={(e) => handleChange('lotNumber', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional lot number"
                />
              </div>
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
                    step="0.1"
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
                    step="0.1"
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
                    step="0.1"
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
                placeholder='{"myrcene": 0.5, "limonene": 0.3, "caryophyllene": 0.2}'
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="coaDocumentUrl" className="block text-sm font-medium text-gray-700">
                COA Document URL
              </label>
              <input
                id="coaDocumentUrl"
                type="url"
                value={formData.coaDocumentUrl}
                onChange={(e) => handleChange('coaDocumentUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

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

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Batch'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/grower/batches')}
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
