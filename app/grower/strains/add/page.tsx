'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

interface StrainFormData {
  name: string;
  genetics: string;
  description: string;
  growerNotes: string;
}

export default function AddStrainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StrainFormData>({
    name: '',
    genetics: '',
    description: '',
    growerNotes: ''
  });

  const handleChange = (field: keyof StrainFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Strain name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/strains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          genetics: formData.genetics.trim() || null,
          description: formData.description.trim() || null,
          growerNotes: formData.growerNotes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create strain');
      }

      const newStrain = await response.json();
      alert('Strain created successfully!');
      if (returnUrl) {
        sessionStorage.setItem('newlyCreatedStrainId', newStrain.id || '');
        router.push(returnUrl);
      } else {
        router.push('/grower/strains');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Strain</h1>
        <p className="text-gray-600 mt-1">Create a new cannabis genetics entry</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Strain Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Strain Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Blueberries NF, OG Kush, Sour Diesel"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="genetics" className="block text-sm font-medium text-gray-700">
                Genetics / Lineage
              </label>
              <input
                id="genetics"
                type="text"
                value={formData.genetics}
                onChange={(e) => handleChange('genetics', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Blueberries x Nevada, Chemdawg x Diesel"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="General description of the strain..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="growerNotes" className="block text-sm font-medium text-gray-700">
                Grower Notes
              </label>
              <textarea
                id="growerNotes"
                rows={4}
                value={formData.growerNotes}
                onChange={(e) => handleChange('growerNotes', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Notes about growing characteristics, flavor profile, effects, etc."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Strain'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/grower/strains')}
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
