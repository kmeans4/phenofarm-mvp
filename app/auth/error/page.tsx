import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';

const errorMessages: Record<string, { title: string; message: string }> = {
  CredentialsSignin: {
    title: 'Sign-in failed',
    message: 'Email or password is incorrect. Check your credentials and try again.',
  },
  AccessDenied: {
    title: 'Access denied',
    message: 'This account does not have access to the requested PhenoFarm workspace.',
  },
  Configuration: {
    title: 'Authentication is not configured',
    message: 'The sign-in service is not configured correctly. Contact support if this continues.',
  },
  Verification: {
    title: 'Verification link issue',
    message: 'The sign-in verification link is invalid or expired. Request a new link or contact support.',
  },
};

function getErrorMessage(errorCode: string | undefined) {
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  return {
    title: 'Authentication error',
    message: 'Something went wrong while signing in. Try again, or contact support if the problem continues.',
  };
}

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const error = getErrorMessage(rawError);

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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              PF
            </span>
            <span className="text-lg font-semibold tracking-tight">PhenoFarm</span>
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-pf-accent">
            Account access
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Need access? We can help.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-pf-muted">
            PhenoFarm support can help account owners recover access.
          </p>

          <div className="mt-10 grid gap-3">
            {['Role-based grower and dispensary access', 'License-aware buyer ordering gates', 'Support-assisted password recovery'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-pf-accent" />
                <span className="text-sm text-pf-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-pf-muted">
          Need help?{' '}
          <a href="mailto:support@phenoshop.app" className="text-pf-accent transition-colors hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
            support@phenoshop.app
          </a>
        </p>
      </section>

      <section className="flex min-h-dvh items-start justify-center px-4 py-5 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-5 text-center lg:hidden">
            <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                PF
              </span>
              <span className="text-lg font-semibold">PhenoFarm</span>
            </Link>
          </div>

          <div className="rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pf-danger-bg text-pf-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-pf-text sm:text-3xl">
              {error.title}
            </h2>
            <div className="mt-3 rounded-lg border border-pf-danger-line bg-pf-danger-bg px-4 py-3 text-sm leading-5 text-pf-danger" role="alert">
              {error.message}
            </div>
            <p className="mt-3 text-sm leading-5 text-pf-muted">
              If this keeps happening, email support from the account owner address and include your business name.
            </p>

            <div className="mt-5 grid gap-2">
              <Link href="/auth/sign_in" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-pf-canvas transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
              <a href="mailto:support@phenoshop.app" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-pf-line-strong px-4 py-3 text-sm font-semibold text-pf-secondary transition-colors hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas">
                Contact support
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
