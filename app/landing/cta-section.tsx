'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const assurances = [
  'No wholesale payment processing',
  'Cultivator subscriptions only',
  'Demo access available',
];

export function CTASection() {
  return (
    <section className="relative border-t border-white/[0.06] bg-[#070908] px-6 py-28 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-emerald-500/15 bg-[#0a0d0b] px-6 py-20 text-center md:py-24"
      >
        {/* Inner glow */}
        <div aria-hidden className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.12] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 0%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 0%, black 20%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.1]">
            Run wholesale like the rest of your business
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-gray-400">
            Catalog, verification, quotes, and fulfillment in one workspace — with settlement
            exactly where it belongs: between you and your partners.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign_up"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_56px_rgba(16,185,129,0.45)]"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              Talk to us
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {assurances.map((item) => (
              <span key={item} className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
