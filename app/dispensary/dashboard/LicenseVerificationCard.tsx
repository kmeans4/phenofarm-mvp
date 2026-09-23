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
    return <section className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-4"><p className="flex items-center gap-2 font-semibold text-pf-accent"><BadgeCheck className="h-5 w-5" /> Submitted for review</p><p className="mt-1 text-sm text-pf-accent">PhenoFarm verifies license details within 1 business day.</p></section>;
  }

  return (
    <section className="rounded-xl border border-pf-warning-line bg-pf-warning-bg p-4">
      <h2 className="text-base font-semibold text-pf-warning">Verify your license</h2>
      <p className="mt-1 text-sm text-pf-warning">Requests unlock after we verify your Vermont license.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <label className="text-sm font-medium text-pf-secondary">License number<input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
        <label className="text-sm font-medium text-pf-secondary">Expiry<input type="date" min={startOfLicenseDay().toISOString().slice(0, 10)} value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} required className="mt-1 h-10 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" /></label>
        <button disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit</button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-pf-danger">{error}</p> : null}
      <Link href="/dispensary/settings#license" className="mt-3 inline-flex text-sm font-semibold text-pf-warning underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">License settings</Link>
    </section>
  );
}
