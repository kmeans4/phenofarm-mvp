'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { ChevronDown, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = 'support@phenofarm.com';

const demoUsers = [
  { role: 'Admin', email: 'admin@phenofarm.com' },
  { role: 'Grower', email: 'grower@vtnurseries.com' },
  { role: 'Dispensary', email: 'dispensary@greenvermont.com' },
];

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
    <main className="min-h-screen bg-[#070908] text-gray-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#070908] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.09] blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-r from-transparent to-emerald-400/30" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              PF
            </span>
            <span className="text-lg font-semibold tracking-tight">PhenoFarm</span>
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Licensed marketplace operations
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Wholesale workflows, without payment confusion.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
            Manage catalog listings, buyer requests, order status, and subscription access. Settlement stays direct.
          </p>

          <div className="mt-10 grid gap-3">
            {['Direct grower to dispensary requests', 'Friendly order status tracking', 'Cultivator subscription billing only'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-gray-500">
          Need access help?{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-300 transition-colors hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:bg-gray-50 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                PF
              </span>
              <span className="text-lg font-semibold">PhenoFarm</span>
            </Link>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:border-gray-200 lg:shadow-sm">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-950">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Or{' '}
                <Link href="/auth/sign_up" className="inline-flex min-h-10 items-center font-medium text-green-700 transition-colors hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                  create a new account
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
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
                    className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="relative block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-base text-gray-900 placeholder:text-gray-500 transition-colors focus:z-10 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-x-4 text-sm font-medium text-green-700">
                <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center underline">Forgot password?</Link>
                <Link href="/auth/verify-email" className="inline-flex min-h-10 items-center underline">Resend verification</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-700/70"
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

            <details className="group mt-6 rounded-2xl border border-green-200 bg-green-50/70 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                Demo access
                <ChevronDown className="h-4 w-4 text-green-700 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-3 border-t border-green-200 pt-4">
                {demoUsers.map((user) => (
                  <div key={user.email} className="grid gap-1 rounded-xl bg-white/70 p-3 text-sm sm:grid-cols-[6rem_1fr] sm:items-center">
                    <span className="font-semibold text-green-950">{user.role}</span>
                    <span className="font-mono text-xs text-gray-700 sm:text-sm">{user.email}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-green-700" />
                  <span>Password: <span className="font-mono">password123</span></span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
