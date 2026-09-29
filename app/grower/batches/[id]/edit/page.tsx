'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { BatchForm, type BatchData } from '../../../components/BatchForm';
import { toast } from '@/app/hooks/useToast';
export default function EditBatchPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter(),
    params = useSearchParams();
  const [batch, setBatch] = useState<BatchData | null>(null),
    [error, setError] = useState('');
  const requested = params?.get('returnTo'),
    back = requested?.startsWith('/grower/') ? requested : '/grower/batches';
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/batches/${id}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'Batch not found.'
            : 'Could not load this batch.'
        );
      setBatch(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost.');
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Batches
      </Link>
      <PageHeader title="Edit batch" />
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : batch ? (
        <BatchForm
          initial={batch}
          onSaved={() => {
            toast.success('Batch saved');
            router.push(back);
          }}
          onCancel={() => router.push(back)}
        />
      ) : (
        <LoadingState title="Loading batch" />
      )}
    </div>
  );
}
