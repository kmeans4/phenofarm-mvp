'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { BatchForm, type BatchData } from '../../components/BatchForm';
export default function AddBatchPage() {
  const params = useSearchParams(),
    router = useRouter(),
    [saved, setSaved] = useState<BatchData | null>(null);
  const requested = params?.get('returnTo');
  const back = requested?.startsWith('/grower/')
    ? requested
    : '/grower/batches';
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Batches
      </Link>
      <PageHeader title="Add batch" />
      {saved ? (
        <section className="space-y-3 rounded-xl border border-pf-accent-line bg-pf-surface p-4">
          <h2 className="font-semibold">Batch saved</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/grower/products/add?batchId=${saved.id}&strainId=${saved.strainId}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
            >
              Add product from this batch
            </Link>
            <Link
              href={back}
              className="inline-flex min-h-11 items-center px-3 text-sm"
            >
              Back to batches
            </Link>
          </div>
        </section>
      ) : (
        <BatchForm
          strainId={params?.get('strainId') || ''}
          onSaved={setSaved}
          onCancel={() => router.push(back)}
        />
      )}
    </div>
  );
}
