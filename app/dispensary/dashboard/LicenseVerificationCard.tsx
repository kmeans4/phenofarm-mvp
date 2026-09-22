'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { startOfLicenseDay } from '@/lib/license';

export function LicenseVerificationCard() {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const response = await fetch('/api/dispensary/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseNumber, licenseExpiry }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) return setError(data.error || 'Unable to submit license details');
    setSubmitted(true);
  }

  if (submitted) {
    return <section className="rounded-xl border border-green-200 bg-green-50 p-5"><p className="flex items-center gap-2 font-semibold text-green-900"><BadgeCheck className="h-5 w-5" /> Submitted for review</p><p className="mt-1 text-sm text-green-800">PhenoFarm verifies license details within 1 business day.</p></section>;
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-950">Get verified to start ordering</h2>
      <p className="mt-1 text-sm text-amber-900">Submit your Vermont license details. Ordering unlocks after PhenoFarm reviews them.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <label className="text-sm font-medium text-gray-800">License number<input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600" /></label>
        <label className="text-sm font-medium text-gray-800">Expiry<input type="date" min={startOfLicenseDay().toISOString().slice(0, 10)} value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600" /></label>
        <button disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit</button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      <Link href="/dispensary/settings#license" className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">Complete all license details in Settings</Link>
    </section>
  );
}
