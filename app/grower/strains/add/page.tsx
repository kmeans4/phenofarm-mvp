'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { StrainForm, type StrainData } from '../../components/StrainForm';
export default function AddStrainPage() {
  const router = useRouter(),
    params = useSearchParams(),
    [saved, setSaved] = useState<StrainData | null>(null);
  const requested = params?.get('returnTo'),
    back = requested?.startsWith('/grower/') ? requested : '/grower/strains';
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Strains
      </Link>
      <PageHeader title="Add strain" />
      {saved ? (
        <section className="space-y-3 rounded-xl border border-pf-accent-line p-4">
          <h2 className="font-semibold">Strain saved</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/grower/batches/add?strainId=${saved.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
            >
              Add batch
            </Link>
            <Link
              href={`/grower/products/add?strainId=${saved.id}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-sm"
            >
              Add product
            </Link>
            <Link
              href={back}
              className="inline-flex min-h-11 items-center text-sm"
            >
              Back to strains
            </Link>
          </div>
        </section>
      ) : (
        <StrainForm onSaved={setSaved} onCancel={() => router.push(back)} />
      )}
    </div>
  );
}
