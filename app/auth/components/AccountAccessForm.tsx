'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

type Mode = 'request-reset' | 'request-verification' | 'reset' | 'verify' | 'change-email' | 'confirm-email-change';
const endpoints: Record<Mode, string> = {
  'request-reset': '/api/auth/forgot-password', 'request-verification': '/api/auth/verification/request',
  reset: '/api/auth/reset-password', verify: '/api/auth/verification/confirm',
  'change-email': '/api/auth/change-email', 'confirm-email-change': '/api/auth/confirm-email-change',
};
const actions: Record<Mode, string> = {
  'request-reset': 'Send reset link', 'request-verification': 'Send verification link', reset: 'Reset password',
  verify: 'Verify email', 'change-email': 'Send confirmation link', 'confirm-email-change': 'Confirm new email',
};
const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-60';

export function AccountAccessForm({ mode, currentEmail, sent = false }: { mode: Mode; currentEmail?: string; sent?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const pendingRef = useRef(false);
  const tokenRef = useRef('');
  const requestsEmail = ['request-reset', 'request-verification', 'change-email'].includes(mode);
  const needsPassword = ['reset', 'verify', 'change-email'].includes(mode);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    setError('');
    if (mode === 'reset' && (password.length < 12 || new TextEncoder().encode(password).length > 72)) {
      setError(new TextEncoder().encode(password).length > 72 ? 'Password is too long. Use fewer characters.' : 'Use at least 12 characters.'); return;
    }
    if (mode === 'reset' && password !== confirmation) { setError('Passwords do not match.'); return; }
    let body: Record<string, string>;
    if (requestsEmail) {
      body = { email, ...(mode === 'change-email' ? { currentPassword: password } : {}) };
    } else {
      tokenRef.current ||= new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
      // Fragments are never sent to the server; remove the secret from browser history before posting it.
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!/^[A-Za-z0-9_-]{43}$/.test(tokenRef.current)) {
        setError('This link is invalid or has expired. Request a new email and try again.'); return;
      }
      body = { token: tokenRef.current, ...(needsPassword ? { password } : {}) };
    }
    pendingRef.current = true;
    setPending(true);
    try {
      const response = await fetch(endpoints[mode], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error || 'Unable to continue. Please try again.'); return; }
      setPassword(''); setConfirmation(''); tokenRef.current = ''; setDone(true);
      if (!requestsEmail) await signOut({ redirect: false }).catch(() => undefined);
    } catch { setError('Unable to connect. Please try again.'); }
    finally { pendingRef.current = false; setPending(false); }
  }

  if (done) return (
    <div className="space-y-4">
      <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-950">
        {requestsEmail
          ? <>If this address is eligible, an email will arrive shortly. Check your spam folder. {mode === 'change-email' && 'Your login email stays the same until you confirm the new address.'}</>
          : mode === 'reset' ? 'Your password was reset and your email is verified. Sign in with your new password. All previous sessions are signed out.'
          : mode === 'verify' ? 'Your email is verified. You can now sign in.'
          : 'Your login email has changed. Sign in with your new email and existing password. Previous sessions are signed out.'}
      </div>
      {requestsEmail && <button type="button" onClick={() => setDone(false)} className="inline-flex min-h-10 items-center text-sm font-medium text-green-700 underline">Try again or use another email</button>}
      <Link href="/auth/sign_in" className="flex min-h-11 items-center justify-center rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white">Back to sign in</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {sent && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm leading-6 text-green-950">Check your inbox for a verification link. You will need the password you chose. Enter your email below if you need another link.</p>}
      {currentEmail && <p className="break-words text-sm text-gray-600">Current login: <strong>{currentEmail}</strong></p>}
      {requestsEmail && <div>
        <label htmlFor="account-email" className="mb-1 block text-sm font-medium">{mode === 'change-email' ? 'New email' : 'Email'}</label>
        <input id="account-email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} disabled={pending} className={fieldClass} />
      </div>}
      {needsPassword && <div>
        <label htmlFor="account-password" className="mb-1 block text-sm font-medium">{mode === 'reset' ? 'New password' : 'Current password'}</label>
        <input id="account-password" type="password" autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} disabled={pending} className={fieldClass} aria-describedby="account-password-help" />
        <p id="account-password-help" className="mt-1 text-sm text-gray-600">{mode === 'reset' ? 'At least 12 characters.' : mode === 'verify' ? 'Use the password you chose for this account.' : 'Confirm it is you before changing your login.'}</p>
      </div>}
      {mode === 'reset' && <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={pending} className={fieldClass} />
      </div>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
      <button disabled={pending} type="submit" className="flex min-h-11 w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">{pending ? 'Please wait…' : actions[mode]}</button>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-green-700">
        {['reset', 'verify', 'change-email'].includes(mode) && <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center underline">{mode === 'reset' ? 'Request a new link' : 'Forgot password?'}</Link>}
        {mode === 'verify' && <Link href="/auth/verify-email" className="inline-flex min-h-10 items-center underline">Resend verification</Link>}
        {mode === 'confirm-email-change' && <Link href="/auth/change-email" className="inline-flex min-h-10 items-center underline">Request a new change</Link>}
        <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center underline">Back to sign in</Link>
      </div>
    </form>
  );
}
