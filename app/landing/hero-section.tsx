'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  Submitted: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Accepted: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Preparing: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Delivered: 'bg-white/[0.06] text-gray-300 ring-white/10',
};

const MOCK_REQUESTS = [
  { id: 'ORD-2481', buyer: 'Green Mountain Dispensary', value: '$4,250.00', status: 'Submitted' },
  { id: 'ORD-2479', buyer: 'Elevate Wellness', value: '$1,860.00', status: 'Accepted' },
  { id: 'ORD-2475', buyer: 'Herb House Collective', value: '$7,400.00', status: 'Preparing' },
  { id: 'ORD-2468', buyer: 'Pure Grow Retail', value: '$2,130.00', status: 'Delivered' },
];

function WorkspaceMockup() {
  return (
    <div className="relative">
      {/* Glow behind the frame */}
      <div aria-hidden className="absolute -inset-x-16 -top-16 -bottom-8 bg-[radial-gradient(60%_60%_at_50%_30%,rgba(16,185,129,0.14),transparent_70%)]" />

      <div className="relative rounded-2xl border border-white/10 bg-[#0c0f0d]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="mx-auto flex h-7 w-full max-w-sm items-center justify-center rounded-md bg-white/[0.04] text-[11px] tracking-wide text-gray-500">
            phenofarm.app/grower/orders
          </div>
          <div className="w-12" />
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-44 shrink-0 border-r border-white/[0.06] p-4 sm:block">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-[10px] font-bold text-white">PF</div>
              <span className="text-xs font-semibold text-gray-200">Grower Portal</span>
            </div>
            {['Dashboard', 'Catalog', 'Orders', 'Customers', 'Reports'].map((item) => (
              <div
                key={item}
                className={`mb-1 rounded-md px-2.5 py-1.5 text-xs ${
                  item === 'Orders' ? 'bg-emerald-500/10 font-medium text-emerald-300' : 'text-gray-500'
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-100">Order Requests</div>
                <div className="text-[11px] text-gray-500">4 active · settlement stays direct</div>
              </div>
              <div className="rounded-md bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white">Record Request</div>
            </div>

            {/* Stat row */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Needs review', value: '3' },
                { label: 'Active requests', value: '11' },
                { label: 'Est. request value', value: '$15.6k' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{stat.label}</div>
                  <div className="mt-0.5 text-base font-semibold text-gray-100">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Request table */}
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 sm:grid-cols-[auto_1fr_auto_auto]">
                <span className="hidden sm:block">Request</span>
                <span>Buyer</span>
                <span className="text-right">Est. value</span>
                <span className="text-right">Status</span>
              </div>
              {MOCK_REQUESTS.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/[0.04] px-4 py-2.5 text-xs last:border-0 sm:grid-cols-[auto_1fr_auto_auto]"
                >
                  <span className="hidden font-mono text-[11px] text-gray-500 sm:block">{row.id}</span>
                  <span className="truncate text-gray-300">{row.buyer}</span>
                  <span className="text-right font-medium text-gray-200">{row.value}</span>
                  <span className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_STYLES[row.status]}`}>
                      {row.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fade into the page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-32 bg-gradient-to-t from-[#070908] to-transparent" />
    </div>
  );
}

export function HeroSection() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Atmosphere: restrained static glow (the page-wide grid + cursor light
          live in AmbientBackground) */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[140px]" />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/[0.06] bg-[#070908]/85 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              PF
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">PhenoFarm</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {[
              { label: 'Platform', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/auth/sign_in"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign_up"
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-200 sm:px-4"
            >
              Create account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-36 md:pt-44">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-4 text-xs text-gray-300">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">New</span>
            License verification and quote workflows, built in
          </div>

          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-white md:text-[4.25rem]">
            The wholesale workspace for{' '}
            <span className="bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              licensed cannabis
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-400">
            One place for verified growers and dispensaries to publish catalogs, negotiate quotes,
            and track requests from submission to delivery — while settlement stays direct between businesses.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign_up"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_56px_rgba(16,185,129,0.4)]"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-gray-600">
            Free to evaluate · No wholesale payment processing · Cultivator subscriptions only
          </p>
        </motion.div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mx-auto mt-16 max-w-4xl md:mt-20"
        >
          <WorkspaceMockup />
        </motion.div>
      </div>

      {/* Trust strip */}
      <div className="relative border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-white/[0.06] px-6 py-10 text-center md:grid-cols-4 md:divide-x">
          {[
            { value: 'License-gated', label: 'Every buyer verified before ordering' },
            { value: 'Quote-native', label: 'Pricing requests and counters built in' },
            { value: 'Direct settlement', label: 'No platform fees on wholesale value' },
            { value: 'Metrc-ready', label: 'Compliance integration prepared' },
          ].map((item) => (
            <div key={item.value} className="px-4 py-3">
              <div className="text-base font-semibold tracking-tight text-white">{item.value}</div>
              <div className="mt-1 text-xs leading-relaxed text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
