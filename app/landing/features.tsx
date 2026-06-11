'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, FileSpreadsheet, Leaf, ShieldCheck } from 'lucide-react';

function CardShell({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay }}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-emerald-500/20 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardCopy({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 pt-5">
      <h3 className="text-[15px] font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

/* --- Vignettes: small product moments rendered in pure markup --- */

function VerificationVignette() {
  return (
    <div className="px-6 pt-6">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-100">Green Mountain Dispensary</div>
              <div className="text-[11px] text-gray-500">VT-RTL-2024-001 · expires 12/2027</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
            <BadgeCheck className="h-3 w-3" />
            License verified
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3 text-center">
          {['Identity', 'License', 'Ordering'].map((step, i) => (
            <div key={step} className="rounded-md bg-white/[0.03] px-2 py-1.5">
              <div className={`text-[10px] uppercase tracking-wider ${i < 3 ? 'text-emerald-400/80' : 'text-gray-500'}`}>
                {step}
              </div>
              <div className="text-[11px] font-medium text-gray-300">Cleared</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuoteVignette() {
  return (
    <div className="space-y-2 px-6 pt-6">
      <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-emerald-500/90 px-3 py-2 text-xs text-white">
        Quote: 50 × $60.00/g · Net 30
      </div>
      <div className="w-fit max-w-[85%] rounded-xl rounded-bl-sm border border-white/[0.07] bg-[#0c0f0d] px-3 py-2 text-xs text-gray-300">
        Counter: 50 × $55.00/g · ACH
      </div>
      <div className="ml-auto flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
        <BadgeCheck className="h-3 w-3" />
        Terms accepted
      </div>
    </div>
  );
}

function TimelineVignette() {
  const steps = ['Submitted', 'Accepted', 'Preparing', 'Ready', 'Delivered'];
  return (
    <div className="px-6 pt-7">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-2 top-[5px] h-px bg-white/10" aria-hidden />
        <div className="absolute left-2 top-[5px] h-px w-[58%] bg-emerald-400/70" aria-hidden />
        {steps.map((step, i) => (
          <div key={step} className="relative flex flex-col items-center gap-2">
            <span
              className={`h-[11px] w-[11px] rounded-full ring-4 ring-[#0a0d0b] ${
                i <= 2 ? 'bg-emerald-400' : 'bg-white/15'
              }`}
            />
            <span className={`text-[10px] ${i <= 2 ? 'text-gray-300' : 'text-gray-600'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogVignette() {
  return (
    <div className="space-y-2 px-6 pt-6">
      {[
        { name: 'Purple Haze · Flower', stock: '93 g in stock', price: '$25.00/g' },
        { name: 'Silver Haze · Bulk Extract', stock: '50 g in stock', price: 'Quote only' },
      ].map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-3.5 py-2.5"
        >
          <div>
            <div className="text-xs font-medium text-gray-200">{item.name}</div>
            <div className="text-[10px] text-gray-500">{item.stock}</div>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
              item.price === 'Quote only'
                ? 'bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20'
                : 'text-gray-200'
            }`}
          >
            {item.price}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsVignette() {
  const bars = [32, 58, 44, 72, 60, 88, 76];
  return (
    <div className="px-6 pt-7">
      <div className="flex h-24 items-end justify-between gap-2">
        {bars.map((height, i) => (
          <div key={i} className="flex-1 rounded-t-[3px] bg-gradient-to-t from-emerald-500/25 to-emerald-400/70" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-600">
        <span>Delivered request value</span>
        <span className="text-emerald-400">+38% QoQ</span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative border-t border-white/[0.06] py-28 md:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Platform</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
            Everything between discovery and delivery
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-gray-400">
            Purpose-built for the parts of wholesale that actually slow teams down — verification,
            quoting, request tracking, and the records behind them.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardShell className="lg:col-span-2" delay={0}>
            <VerificationVignette />
            <CardCopy
              title="License-verified network"
              description="Admins review every license before a buyer can order. Verification isn't a badge — it's the gate on the request pipeline itself."
            />
          </CardShell>

          <CardShell delay={0.06}>
            <QuoteVignette />
            <CardCopy
              title="Native quote workflows"
              description="Hide list pricing, field quote requests, counter, and accept — every term is on the record."
            />
          </CardShell>

          <CardShell delay={0.12}>
            <TimelineVignette />
            <CardCopy
              title="Request lifecycle tracking"
              description="Both sides watch the same timeline from submitted to delivered. Cancellations return reserved stock automatically."
            />
          </CardShell>

          <CardShell delay={0.18}>
            <CatalogVignette />
            <CardCopy
              title="Catalog, batches, and stock"
              description="Strain-aware listings with live inventory, COA documents, and per-product price visibility."
            />
          </CardShell>

          <CardShell delay={0.24}>
            <AnalyticsVignette />
            <CardCopy
              title="Operational analytics"
              description="Delivered value trends, top products, and top customers — computed from real fulfillment, not vanity counts."
            />
          </CardShell>

          <CardShell className="lg:col-span-3" delay={0.3}>
            <div className="grid items-center gap-8 p-8 md:grid-cols-[minmax(0,1fr)_auto] md:p-10">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  Software subscription. Never a cut of your wholesale.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                  Cultivators pay PhenoFarm a flat software subscription. Order value is tracked for
                  your records only — invoicing and settlement stay direct between buyer and grower,
                  with zero platform fees on the transaction.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                {[
                  { icon: FileSpreadsheet, label: 'CSV bulk import' },
                  { icon: Leaf, label: 'Metrc-ready compliance' },
                  { icon: ShieldCheck, label: 'Role-scoped access' },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300"
                  >
                    <chip.icon className="h-3.5 w-3.5 text-emerald-400" />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    </section>
  );
}
