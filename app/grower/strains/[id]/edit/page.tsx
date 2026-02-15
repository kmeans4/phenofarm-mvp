'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

interface Strain {
  id: string;
  name: string;
  genetics: string | null;
  description: string | null;
  growerNotes: string | null;
}

interface StrainFormData {
  name: string;
  genetics: string;
  description: string;
  growerNotes: string;
}

export default function EditStrainPage() {
  const router = useRouter();
  const params = useParams();
  const strainId = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strain, setStrain] = useState<Strain | null>(null);
  const [formData, setFormData] = useState<StrainFormData>({
    name: '',
    genetics: '',
    description: '',
    growerNotes: ''
  });

  useEffect(() => {
    const fetchStrain = async () => {
      try {
        setFetching(true);
        const response = await fetch('/api/strains/' + strainId);
        if (response.ok) {
          const data = await response.json();
          setStrain(data);
          setFormData({
            name: data.name || '',
            genetics: data.genetics || '',
            description: data.description || '',
            growerNotes: data.growerNotes || ''
          });
        } else {
          setError('Strain not found');
        }
      } catch {
        setError('Failed to load strain');
      } finally {
        setFetching(false);
      }
    };

    if (strainId) {
      fetchStrain();
    }
  }, [strainId]);

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

      const response = await fetch('/api/strains/' + strainId, {
        method: 'PUT',
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
        throw new Error(data.error || 'Failed to update strain');
      }

      alert('Strain updated successfully!');
      router.push('/grower/strains');
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

  if (!strain) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Strain not found</h2>
        <Button variant="primary" className="mt-4" onClick={() => router.push('/grower/strains')}>
          Back to Strains
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Strain</h1>
        <p className="text-gray-600 mt-1">Update strain details</p>
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
                placeholder="e.g., Blueberries NF, OG Kush"
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
                placeholder="e.g., Blueberries x Nevada"
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
                {loading ? 'Saving...' : 'Save Changes'}
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
