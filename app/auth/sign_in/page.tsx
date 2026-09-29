'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AccountAccessCard } from '../components/AccountAccessCard';
import { PasswordField } from '../components/PasswordField';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [cooldownEmail, setCooldownEmail] = useState('');
  const waitingToResend =
    cooldown > 0 && cooldownEmail === email.trim().toLowerCase();

  useEffect(() => {
    const remembered = new URLSearchParams(window.location.search).get('email');
    if (remembered) setEmail(remembered);
  }, []);
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
    if (busy || resending) return;
    setBusy(true);
    setError('');
    setUnverified(false);
    setVerificationNotice('');
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!result?.ok || result.error) {
        setUnverified(result?.error === 'EmailNotVerified');
        setError(
          result?.error === 'RateLimited'
            ? 'Too many attempts. Wait 15 minutes or reset your password.'
            : result?.error === 'AccountSuspended'
              ? 'Your account is paused. Contact support@phenoshop.app.'
              : result?.error === 'EmailNotVerified'
                ? 'Check your inbox to verify your email.'
                : 'Email or password is incorrect.'
        );
        setBusy(false);
        return;
      }
      const callback = new URLSearchParams(window.location.search).get(
        'callbackUrl'
      );
      let path = callback;
      if (callback) {
        try {
          const url = new URL(callback, window.location.origin);
          path =
            url.origin === window.location.origin
              ? url.pathname + url.search + url.hash
              : null;
        } catch {
          path = null;
        }
      }
      const destination = safeInternalPath(path, '/dashboard');
      const isAccountChange =
        destination.split(/[?#]/)[0] === '/auth/change-email';
      window.location.assign(
        destination.startsWith('/auth') && !isAccountChange
          ? '/dashboard'
          : destination
      );
    } catch {
      setError('Could not connect. Please try again.');
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (resending || busy || waitingToResend) return;
    const recipient = email.trim().toLowerCase();
    setResending(true);
    setError('');
    setVerificationNotice('');
    try {
      const response = await fetch('/api/auth/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recipient }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 429) {
          setCooldownEmail(recipient);
          setCooldown(3600);
        }
        throw Error(
          typeof data?.error === 'string'
            ? data.error
            : 'Could not send a link. Try again.'
        );
      }
      setVerificationNotice(
        `Check ${recipient} for your verification link. Check spam too.`
      );
      setCooldownEmail(recipient);
      setCooldown(60);
    } catch (reason) {
      setError(
        reason instanceof Error && !(reason instanceof TypeError)
          ? reason.message
          : 'Could not send a link. Check your connection and try again.'
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AccountAccessCard title="Sign in" description="Welcome back to PhenoShop.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            disabled={busy || resending}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setUnverified(false);
              setVerificationNotice('');
              setError('');
            }}
            className="w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base"
          />
        </div>
        <PasswordField
          value={password}
          onChange={setPassword}
          disabled={busy || resending}
        />
        {error && (
          <p role="alert" className="text-sm text-pf-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || resending}
          className="min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-pf-canvas"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {unverified && (
          <div className="space-y-2">
            {verificationNotice && (
              <p role="status" className="break-words text-sm text-pf-accent">
                {verificationNotice}
              </p>
            )}
            <button
              type="button"
              onClick={resendVerification}
              disabled={busy || resending || waitingToResend}
              className="min-h-11 w-full break-words rounded-lg border border-pf-line-strong px-3 py-2 text-sm text-pf-accent disabled:opacity-60"
            >
              {resending
                ? 'Sending link…'
                : waitingToResend
                  ? `Resend in ${cooldown > 60 ? `${Math.ceil(cooldown / 60)}m` : `${cooldown}s`}`
                  : `Send a new link to ${email.trim()}`}
            </button>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <Link
            className="inline-flex min-h-11 items-center text-pf-accent underline"
            href={`/auth/forgot-password?email=${encodeURIComponent(email.trim())}`}
          >
            Forgot password?
          </Link>
          <Link
            className="inline-flex min-h-11 items-center text-pf-accent underline"
            href="/auth/sign_up"
          >
            Create account
          </Link>
        </div>
      </form>
    </AccountAccessCard>
  );
}
