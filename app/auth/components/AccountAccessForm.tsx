'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PasswordField } from './PasswordField';
type Mode =
  | 'request-reset'
  | 'request-verification'
  | 'reset'
  | 'verify'
  | 'change-email'
  | 'confirm-email-change';
const endpoints: Record<Mode, string> = {
  'request-reset': '/api/auth/forgot-password',
  'request-verification': '/api/auth/verification/request',
  reset: '/api/auth/reset-password',
  verify: '/api/auth/verification/confirm',
  'change-email': '/api/auth/change-email',
  'confirm-email-change': '/api/auth/confirm-email-change',
};
const actions: Record<Mode, string> = {
  'request-reset': 'Send reset link',
  'request-verification': 'Send verification link',
  reset: 'Reset password and sign in',
  verify: 'Verify and sign in',
  'change-email': 'Send confirmation link',
  'confirm-email-change': 'Confirm new email',
};
export function AccountAccessForm({
  mode,
  currentEmail,
  sent = false,
  settingsHref = '/dashboard',
}: {
  mode: Mode;
  currentEmail?: string;
  sent?: boolean;
  settingsHref?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(sent);
  const [cooldown, setCooldown] = useState(sent ? 60 : 0);
  const [linkState, setLinkState] = useState<
    'checking' | 'valid' | 'invalid' | 'error'
  >('checking');
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const tokenRef = useRef('');
  const [linkAttempt, setLinkAttempt] = useState(0);
  const requestsEmail = [
    'request-reset',
    'request-verification',
    'change-email',
  ].includes(mode);
  const emailLink = (path: string) =>
    email.trim() ? `${path}?email=${encodeURIComponent(email.trim())}` : path;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let saved = '';
    try {
      saved = sessionStorage.getItem('phenoshop:verification-email') || '';
    } catch {}
    setEmail(
      params.get('email') || (mode === 'request-verification' ? saved : '')
    );
    if (requestsEmail) return;
    tokenRef.current ||=
      new URLSearchParams(location.hash.slice(1)).get('token') || '';
    history.replaceState(null, '', location.pathname + location.search);
    if (!/^[A-Za-z0-9_-]{43}$/.test(tokenRef.current)) {
      setLinkState('invalid');
      return;
    }
    let active = true;
    fetch('/api/auth/link-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: tokenRef.current,
        purpose:
          mode === 'verify'
            ? 'VERIFY_EMAIL'
            : mode === 'reset'
              ? 'RESET_PASSWORD'
              : 'CHANGE_EMAIL',
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw Error(data.error || 'Could not check this link.');
        if (active) {
          setLinkState(data.valid ? 'valid' : 'invalid');
          setNeedsNewPassword(Boolean(data.needsNewPassword));
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'Could not check this link. Check your connection and try again.'
          );
          setLinkState('error');
        }
      });
    return () => {
      active = false;
    };
  }, [mode, requestsEmail, linkAttempt]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || cooldown > 0) return;
    setError('');
    if (
      (mode === 'reset' || needsNewPassword) &&
      (password.length < 12 || new TextEncoder().encode(password).length > 72)
    ) {
      setError('Use at least 12 characters (up to 72 bytes).');
      document.getElementById('account-password')?.focus();
      return;
    }
    setBusy(true);
    try {
      const body = requestsEmail
        ? {
            email,
            ...(mode === 'change-email' ? { currentPassword: password } : {}),
          }
        : {
            token: tokenRef.current,
            ...(mode === 'reset' || needsNewPassword ? { password } : {}),
          };
      const response = await fetch(endpoints[mode], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.error || 'Could not continue. Try again.');
      if (data.redirect) {
        window.location.assign(data.redirect);
        return;
      }
      setDone(true);
      setPassword('');
      if (requestsEmail) setCooldown(60);
      else await signOut({ redirect: false });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not connect. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  if (!requestsEmail && linkState !== 'valid')
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-pf-secondary">
          {linkState === 'checking'
            ? 'Checking link…'
            : error || 'This link is invalid, already used, or expired.'}
        </p>
        {linkState === 'error' && (
          <button
            type="button"
            onClick={() => {
              setLinkState('checking');
              setError('');
              setLinkAttempt((value) => value + 1);
            }}
            className="min-h-11 rounded-lg border border-pf-line-strong px-4 text-sm"
          >
            Try again
          </button>
        )}
        {linkState === 'invalid' && (
          <Link
            className="inline-flex min-h-11 items-center text-pf-accent underline"
            href={
              mode === 'verify'
                ? '/auth/verify-email'
                : mode === 'reset'
                  ? '/auth/forgot-password'
                  : '/auth/change-email'
            }
          >
            Request a new link
          </Link>
        )}
      </div>
    );
  if (done && !requestsEmail)
    return (
      <div>
        <p role="status">
          Your email has changed. Sign in with your new email.
        </p>
        <Link
          className="inline-flex min-h-11 items-center text-pf-accent"
          href="/auth/sign_in"
        >
          Sign in
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      {done && (
        <p
          role="status"
          className="rounded-lg bg-pf-accent-bg p-3 text-sm text-pf-accent"
        >
          Check {email || 'your inbox'} for next steps. Check spam too.{' '}
          {mode === 'change-email' &&
            'Your current email works until you confirm the new one.'}
        </p>
      )}
      {currentEmail && (
        <p className="break-all text-sm text-pf-muted">
          Current email: {currentEmail}
        </p>
      )}
      {requestsEmail && (
        <div>
          <label
            htmlFor="account-email"
            className="mb-1 block text-sm font-medium"
          >
            {mode === 'change-email' ? 'New email' : 'Email'}
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base"
          />
        </div>
      )}
      {needsNewPassword && (
        <p className="text-sm text-pf-secondary">
          You opened this link in a different browser. Choose a password here to
          secure your account.
        </p>
      )}
      {(mode === 'reset' || mode === 'change-email' || needsNewPassword) && (
        <PasswordField
          id="account-password"
          label={mode === 'change-email' ? 'Current password' : 'New password'}
          newPassword={mode !== 'change-email'}
          value={password}
          onChange={setPassword}
          disabled={busy}
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-pf-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || cooldown > 0}
        className="min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-pf-canvas disabled:opacity-60"
      >
        {busy
          ? 'Please wait…'
          : cooldown > 0
            ? `Resend in ${cooldown}s`
            : actions[mode]}
      </button>
      <div className="flex flex-wrap gap-3 text-sm text-pf-accent">
        <Link
          className="inline-flex min-h-11 items-center underline"
          href={
            mode === 'change-email' ? settingsHref : emailLink('/auth/sign_in')
          }
        >
          {mode === 'change-email' ? 'Back to settings' : 'Sign in'}
        </Link>
        {mode === 'request-verification' && (
          <>
            <Link
              className="inline-flex min-h-11 items-center underline"
              href={emailLink('/auth/forgot-password')}
            >
              Reset password
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline"
              href="/auth/sign_up"
            >
              Wrong email? Sign up again
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
