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
            Account access
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Need access? We can help.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
            PhenoFarm support can help account owners recover access.
          </p>

          <div className="mt-10 grid gap-3">
            {['Role-based grower and dispensary access', 'License-aware buyer ordering gates', 'Support-assisted password recovery'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-gray-500">
          Need help?{' '}
          <a href="mailto:support@phenofarm.com" className="text-emerald-300 transition-colors hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070908]">
            support@phenofarm.com
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-950">
              {error.title}
            </h2>
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">
              {error.message}
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              If this keeps happening, email support from the account owner address and include your business name.
            </p>

            <div className="mt-8 grid gap-3">
              <Link href="/auth/sign_in" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
              <a href="mailto:support@phenofarm.com" className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                Contact support
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
