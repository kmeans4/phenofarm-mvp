import { BrandLogo } from '@/app/components/ui/BrandLogo';
import Link from 'next/link';

export default function NotFound() {
  return <main className="flex min-h-[70dvh] items-center justify-center px-5 py-16">
    <div className="max-w-md text-center">
      <Link href="/" className="inline-flex"><BrandLogo /></Link>
      <h1 className="mt-5 text-3xl font-semibold text-pf-text">Page not found</h1>
      <p className="mt-3 text-pf-muted">This page may have moved or is no longer available.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white">Dashboard</Link>
        <Link href="/" className="rounded-lg border border-pf-line-strong px-4 py-3 text-sm font-semibold">Home</Link>
      </div>
    </div>
  </main>;
}
