'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BrandLogo } from '@/app/components/ui/BrandLogo';
import { PolicyCheckbox } from '@/app/components/PolicyCheckbox';
import { CURRENT_POLICIES } from '@/lib/policies/current';

export function AcceptanceForm() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !accepted) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account/policy-acceptance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptTerms: true, termsVersion: CURRENT_POLICIES.termsVersion, privacyVersion: CURRENT_POLICIES.privacyVersion }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Unable to save. Please try again.'); }
      router.replace('/dashboard');
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Please try again.'); setBusy(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-pf-canvas p-4 text-pf-text">
    <section className="w-full max-w-md rounded-2xl border border-pf-line bg-pf-surface p-5 sm:p-7">
      <BrandLogo className="mb-6 w-40" />
      <h1 className="text-2xl font-semibold">Review our Terms</h1>
      <p className="mt-3 text-sm leading-6 text-pf-muted">Before continuing, please review our Terms of Service and Privacy Policy. We’ll save your agreement with your account.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <PolicyCheckbox checked={accepted} onChange={setAccepted} disabled={busy} />
        {error && <p role="alert" className="text-sm text-pf-danger">{error}</p>}
        <button disabled={busy || !accepted} className="min-h-11 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-pf-canvas disabled:opacity-50">{busy ? 'Saving…' : 'Agree and continue'}</button>
      </form>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button onClick={() => signOut({ callbackUrl: '/' })} disabled={busy} className="min-h-11 text-pf-muted">Sign out</button>
        <a href="mailto:support@phenoshop.app" className="min-h-11 content-center text-pf-accent">Contact support</a>
      </div>
    </section>
  </main>;
}
