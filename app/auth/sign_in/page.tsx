'use client';

import { BrandLogo } from '@/app/components/ui/BrandLogo';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = 'support@phenoshop.app';

type SignInResult = Awaited<ReturnType<typeof signIn>>;

function getSignInErrorMessage(result?: SignInResult) {
  if (result?.error === 'EmailNotVerified') return 'Verify your email before signing in. Use Resend verification below to get a new link.';
  if (result?.status === 401 || result?.error === 'CredentialsSignin') {
    return 'Email or password is incorrect. Check the credentials and try again.';
  }

  return 'We could not sign you in right now. Try again, or contact support if the problem continues.';
}

export default function SignInSection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error || result.ok === false) {
        setError(getSignInErrorMessage(result));
        setLoading(false);
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;
      router.push(role === 'ADMIN' ? '/admin/dashboard' : role === 'DISPENSARY' ? '/dispensary/dashboard' : '/grower/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong while signing in. Try again, or contact support if it keeps happening.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-pf-canvas text-pf-text lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-dvh overflow-hidden bg-pf-canvas px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-r from-transparent to-emerald-400/30" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            <BrandLogo className="w-40" />
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-pf-accent">
            Licensed marketplace operations
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Wholesale workflows, without payment confusion.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-pf-muted">
            Manage catalog listings, buyer requests, order status, and subscription access. Settlement stays direct.
          </p>

          <div className="mt-10 grid gap-3">
            {['Direct grower to dispensary requests', 'Friendly order status tracking', 'Cultivator subscription billing only'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-pf-accent" />
                <span className="text-sm text-pf-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-pf-muted">
          Need access help?{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pf-accent transition-colors hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      <section className="flex min-h-dvh items-start justify-center px-4 py-5 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-5 text-center lg:hidden">
            <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
              <BrandLogo className="w-40" />
            </Link>
          </div>

          <div className="rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-pf-text sm:text-3xl">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-pf-muted">
                Or{' '}
                <Link href="/auth/sign_up" className="inline-flex min-h-10 items-center font-medium text-pf-accent transition-colors hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                  create a new account
                </Link>
              </p>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                    Email address
                  </label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    className="relative block w-full appearance-none rounded-xl border border-pf-line-strong px-3 py-2.5 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-pf-secondary">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      spellCheck="false"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                      className="relative block w-full appearance-none rounded-xl border border-pf-line-strong px-3 py-2.5 pr-12 text-base text-pf-text placeholder:text-pf-muted transition-colors focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:cursor-not-allowed disabled:bg-pf-surface disabled:text-pf-muted"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-pf-muted transition-colors hover:bg-pf-hover hover:text-pf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-pf-danger-line bg-pf-danger-bg px-4 py-3 text-sm text-pf-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-x-4 text-sm font-medium text-pf-accent">
                <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center underline">Forgot password?</Link>
                <Link href="/auth/verify-email" className="inline-flex min-h-10 items-center underline">Resend verification</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-pf-canvas transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas disabled:cursor-not-allowed disabled:bg-emerald-500/70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>


          </div>
        </div>
      </section>
    </main>
  );
}
