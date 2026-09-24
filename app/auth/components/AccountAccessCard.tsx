import { BrandLogo } from '@/app/components/ui/BrandLogo';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function AccountAccessCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="flex min-h-dvh items-start justify-center bg-pf-canvas px-4 py-5 text-pf-text sm:items-center sm:py-10">
    <section className="w-full max-w-md rounded-xl border border-pf-line bg-pf-surface p-4 sm:p-6">
      <Link href="/" className="mb-5 inline-flex min-h-10 items-center gap-2.5 text-lg font-semibold tracking-tight">
        <BrandLogo />
      </Link>
      <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
      <p className="mb-5 mt-2 text-sm leading-5 text-pf-muted">{description}</p>
      {children}
    </section>
  </main>;
}
