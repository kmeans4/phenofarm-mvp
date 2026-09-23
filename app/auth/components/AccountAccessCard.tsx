import Link from 'next/link';
import type { ReactNode } from 'react';

export function AccountAccessCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="flex min-h-screen items-start justify-center bg-[#f3f0e7] px-4 py-8 text-gray-900 sm:items-center sm:py-12">
    <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <Link href="/" className="mb-5 inline-flex min-h-10 items-center font-serif text-xl font-semibold text-green-900">PhenoFarm</Link>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-gray-600">{description}</p>
      {children}
    </section>
  </main>;
}
