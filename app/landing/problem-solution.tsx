'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const comparisons = [
  {
    before: 'Spreadsheets, texts, and voicemail for every wholesale request',
    after: 'A single request pipeline from submission to delivery, with status everyone can see',
  },
  {
    before: 'License checks handled over email, partner by partner',
    after: 'Verification gates ordering itself — unverified buyers cannot submit requests',
  },
  {
    before: 'Pricing negotiated in scattered threads with no record',
    after: 'Quote requests, counters, and acceptances captured in one conversation per partner',
  },
  {
    before: 'Marketplace platforms that intermediate your payments and your relationships',
    after: 'Your terms, your invoices, your relationships — settlement never touches the platform',
  },
];

export function ProblemSolution() {
  return (
    <section className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Editorial intro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Why teams switch
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
              Wholesale runs on trust. The tools should keep up.
            </h2>
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-gray-400">
              Licensed operators don&apos;t need another intermediary — they need shared context.
              PhenoFarm replaces the patchwork around discovery, verification, and request
              follow-up without inserting itself into the money.
            </p>
          </motion.div>

          {/* Before / after rows */}
          <div className="space-y-3">
            {comparisons.map((row, index) => (
              <motion.div
                key={row.before}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-emerald-500/20 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
              >
                <p className="text-sm leading-relaxed text-gray-500">{row.before}</p>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-emerald-500/60 sm:block" aria-hidden />
                <p className="text-sm font-medium leading-relaxed text-gray-200">{row.after}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
