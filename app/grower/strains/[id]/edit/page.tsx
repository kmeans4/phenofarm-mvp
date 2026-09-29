'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { StrainForm, type StrainData } from '../../../components/StrainForm';
import { toast } from '@/app/hooks/useToast';
export default function EditStrainPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter(),
    params = useSearchParams();
  const [strain, setStrain] = useState<StrainData | null>(null),
    [error, setError] = useState('');
  const requested = params?.get('returnTo'),
    back = requested?.startsWith('/grower/') ? requested : '/grower/strains';
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/strains/${id}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'Strain not found.'
            : 'Could not load this strain.'
        );
      setStrain(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost.');
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Strains
      </Link>
      <PageHeader title="Edit strain" />
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : strain ? (
        <StrainForm
          initial={strain}
          onSaved={() => {
            toast.success('Strain saved');
            router.push(back);
          }}
          onCancel={() => router.push(back)}
        />
      ) : (
        <LoadingState title="Loading strain" />
      )}
    </div>
  );
}
