'use client';

import { useEffect, useRef, useState } from 'react';
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
const fieldClass = 'w-full rounded-xl border border-pf-line-strong bg-pf-surface px-3 py-2.5 text-base text-pf-text focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:opacity-60';

export function AccountAccessForm({ mode, currentEmail, sent = false }: { mode: Mode; currentEmail?: string; sent?: boolean }) {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (mode !== 'request-verification') return;
    try {
      const saved = window.sessionStorage.getItem('phenoshop:verification-email') || '';
      if (saved) setEmail(saved);
    } catch { /* Storage is optional. */ }
  }, [mode]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
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
    if (pendingRef.current || (mode === 'request-verification' && cooldown > 0)) return;
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
      if (mode === 'request-verification') {
        setCooldown(60);
        try { window.sessionStorage.setItem('phenoshop:verification-email', email.trim()); } catch { /* Storage is optional. */ }
      }
      if (mode === 'verify') { try { window.sessionStorage.removeItem('phenoshop:verification-email'); } catch { /* Storage is optional. */ } }
      if (!requestsEmail) await signOut({ redirect: false }).catch(() => undefined);
    } catch { setError('Unable to connect. Please try again.'); }
    finally { pendingRef.current = false; setPending(false); }
  }

  if (done && mode !== 'request-verification') return (
    <div className="space-y-4">
      <div role="status" className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-3 text-sm leading-5 text-pf-accent">
        {requestsEmail
          ? <>If we can send a link to this address, it should arrive in a few minutes. Check your spam folder too. {mode === 'change-email' && 'Your login email stays the same until you confirm the new address.'}</>
          : mode === 'reset' ? 'Your password has been reset and your email verified. Sign in with your new password. You have been signed out on other devices.'
          : mode === 'verify' ? 'Your email is verified. You can now sign in.'
          : 'Your login email has changed. Sign in with your new email and existing password. You have been signed out on other devices.'}
      </div>
      {requestsEmail && <button type="button" onClick={() => setDone(false)} className="inline-flex min-h-10 items-center text-sm font-medium text-pf-accent underline">Try again or use another email</button>}
      <Link href="/auth/sign_in" className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-pf-canvas hover:bg-emerald-400">Back to sign in</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {sent && <p role="status" className="rounded-xl bg-pf-accent-bg p-3 text-sm leading-5 text-pf-accent">Check {email ? <strong className="break-all">{email}</strong> : 'your inbox'} for a verification link. Open it and enter your account password. Delivery may take a few minutes; check your spam folder too.</p>}
      {done && mode === 'request-verification' && <p role="status" className="text-sm text-pf-accent">If {email} can receive a verification link, the email should arrive in a few minutes. Check your spam folder before trying again.</p>}
      {mode === 'request-verification' && <button type="button" className="min-h-10 text-sm text-pf-accent underline" onClick={() => { setDone(false); document.getElementById('account-email')?.focus(); }}>Use a different email</button>}
      {currentEmail && <p className="break-words text-sm text-pf-muted">Current login: <strong>{currentEmail}</strong></p>}
      {requestsEmail && <div>
        <label htmlFor="account-email" className="mb-1 block text-sm font-medium">{mode === 'change-email' ? 'New email' : 'Email'}</label>
        <input id="account-email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" maxLength={254} required value={email} onChange={e => { setEmail(e.target.value); setDone(false); }} disabled={pending} className={fieldClass} />
      </div>}
      {needsPassword && <div>
        <label htmlFor="account-password" className="mb-1 block text-sm font-medium">{mode === 'reset' ? 'New password' : 'Current password'}</label>
        <input id="account-password" type="password" autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} disabled={pending} className={fieldClass} aria-describedby="account-password-help" />
        <p id="account-password-help" className="mt-1 text-xs leading-5 text-pf-muted">{mode === 'reset' ? 'At least 12 characters.' : mode === 'verify' ? 'Use the password you chose for this account.' : 'Enter your current password to confirm this change.'}</p>
      </div>}
      {mode === 'reset' && <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={pending} className={fieldClass} />
      </div>}
      {error && <p role="alert" className="rounded-xl border border-pf-danger-line bg-pf-danger-bg p-3 text-sm leading-5 text-pf-danger">{error}</p>}
      <button disabled={pending || (mode === 'request-verification' && cooldown > 0)} type="submit" className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-pf-canvas hover:bg-emerald-400 disabled:opacity-60">{pending ? 'Please wait…' : mode === 'request-verification' && cooldown > 0 ? `Resend available in ${cooldown}s` : actions[mode]}</button>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-pf-accent">
        {['reset', 'verify', 'change-email'].includes(mode) && <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center underline">{mode === 'reset' ? 'Request a new link' : 'Forgot password?'}</Link>}
        {mode === 'verify' && <Link href="/auth/verify-email" className="inline-flex min-h-10 items-center underline">Resend verification email</Link>}
        {mode === 'confirm-email-change' && <Link href="/auth/change-email" className="inline-flex min-h-10 items-center underline">Change email again</Link>}
        <Link href="/auth/sign_in" className="inline-flex min-h-10 items-center underline">Back to sign in</Link>
      </div>
    </form>
  );
}
