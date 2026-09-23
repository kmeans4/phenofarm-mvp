'use client';

import { safeInternalPath } from '@/app/components/ui/safeNavigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { toast } from '@/app/hooks/useToast';
import {
  COMMON_STRAIN_NAMES,
  STRAIN_TYPES,
  STRAIN_TYPE_DESCRIPTIONS,
  STRAIN_TYPE_FULL_LABELS,
  STRAIN_TYPE_LABELS,
  StrainTypeValue,
} from '@/lib/strain-types';

interface StrainFormData {
  name: string;
  strainType: StrainTypeValue | '';
  genetics: string;
  description: string;
  growerNotes: string;
}

export default function AddStrainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeInternalPath(searchParams?.get('returnUrl'), '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StrainFormData>({
    name: '',
    strainType: '',
    genetics: '',
    description: '',
    growerNotes: ''
  });

  const handleChange = (field: keyof StrainFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const canSubmit = !loading && formData.name.trim().length > 0 && Boolean(formData.strainType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      if (!formData.name.trim()) {
        setError('Strain name is required');
      } else if (!formData.strainType) {
        setError('Strain type is required');
      }
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
          strainType: formData.strainType,
          genetics: formData.genetics.trim() || null,
          description: formData.description.trim() || null,
          growerNotes: formData.growerNotes.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create strain');
      }

      const newStrain = await response.json();
      toast.success('Strain created');
      if (returnUrl) {
        try { sessionStorage.setItem('newlyCreatedStrainId', newStrain.id || ''); } catch { /* Storage is optional. */ }
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
    <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-6">
      <PageHeader title="Add strain" />

      {error && (
        <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg">
          <p className="text-pf-danger">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-pf-secondary">
                Name *
              </label>
              <input
                id="name"
                type="text"
                list="common-strain-names"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                placeholder="e.g., OG Kush"
              />
              <datalist id="common-strain-names">
                {COMMON_STRAIN_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="strainType" className="block text-sm font-medium text-pf-secondary">
                Type *
              </label>
              <select
                id="strainType"
                required
                value={formData.strainType}
                onChange={(e) => handleChange('strainType', e.target.value as StrainTypeValue)}
                className="min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
              >
                <option value="">Select strain type</option>
                {STRAIN_TYPES.map((type) => (
                  <option key={type} value={type}>{STRAIN_TYPE_LABELS[type]}</option>
                ))}
              </select>
              <details className="text-xs text-pf-muted"><summary className="min-h-10 cursor-pointer py-2.5 text-sm text-pf-accent">About strain types</summary><div className="mt-2 grid gap-2 rounded-lg bg-pf-canvas p-3 sm:grid-cols-2">
                {STRAIN_TYPES.map((type) => (
                  <p key={type}>
                    <span className="font-semibold text-pf-secondary" title={STRAIN_TYPE_FULL_LABELS[type]}>
                      {STRAIN_TYPE_LABELS[type]}
                    </span>
                    <span className="text-pf-muted"> — </span>
                    {STRAIN_TYPE_DESCRIPTIONS[type]}
                  </p>
                ))}
              </div></details>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="genetics" className="block text-sm font-medium text-pf-secondary">
                Genetics
              </label>
              <input
                id="genetics"
                type="text"
                value={formData.genetics}
                onChange={(e) => handleChange('genetics', e.target.value)}
                className="min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                placeholder="e.g., Chemdawg × Diesel"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-pf-secondary">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                placeholder="Aroma, flavor and effects"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="growerNotes" className="block text-sm font-medium text-pf-secondary">
                Growing notes
              </label>
              <textarea
                id="growerNotes"
                rows={3}
                value={formData.growerNotes}
                onChange={(e) => handleChange('growerNotes', e.target.value)}
                className="min-h-10 w-full rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:px-4 focus:ring-2 focus:ring-pf-accent focus:border-transparent"
                placeholder="Cultivation observations, yields and conditions"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-pf-line">
              <Button type="submit" variant="primary" className="flex-1 sm:flex-none" disabled={!canSubmit}>
                {loading ? 'Creating...' : 'Add strain'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => router.push('/grower/strains')}
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
