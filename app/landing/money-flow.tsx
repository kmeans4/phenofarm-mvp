'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Building2, Landmark, Sprout } from 'lucide-react';
import { SectionHeading } from './motion';

type Mode = 'marketplace' | 'phenofarm';

function Node({
  icon: Icon,
  label,
  sublabel,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  tone?: 'neutral' | 'emerald' | 'red';
}) {
  const ring =
    tone === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
      : tone === 'red'
        ? 'border-red-500/25 bg-red-500/[0.05]'
        : 'border-white/[0.08] bg-white/[0.03]';
  return (
    <div className={`flex w-[104px] flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center sm:w-36 ${ring}`}>
      <Icon className={`h-5 w-5 ${tone === 'emerald' ? 'text-emerald-300' : tone === 'red' ? 'text-red-300' : 'text-gray-300'}`} />
      <div className="text-xs font-semibold text-gray-100 sm:text-sm">{label}</div>
      <div className="text-[10px] leading-snug text-gray-500 sm:text-[11px]">{sublabel}</div>
    </div>
  );
}

/** A dollar (or data) dot travelling along the lane. */
function FlowDot({
  delay = 0,
  duration = 3,
  color,
  size = 10,
  path,
  reverse = false,
}: {
  delay?: number;
  duration?: number;
  color: string;
  size?: number;
  path: 'top' | 'bottom';
  reverse?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  const from = reverse ? '92%' : '2%';
  const to = reverse ? '2%' : '92%';
  return (
    <motion.span
      aria-hidden
      className={`absolute rounded-full ${color}`}
      style={{
        width: size,
        height: size,
        top: path === 'top' ? -size / 2 + 1 : undefined,
        bottom: path === 'bottom' ? -size / 2 + 1 : undefined,
      }}
      initial={{ left: from, opacity: 0 }}
      animate={{ left: [from, to], opacity: [0, 1, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear', times: [0, 0.1, 0.9, 1] }}
    />
  );
}

export function MoneyFlow() {
  const [mode, setMode] = useState<Mode>('phenofarm');
  const isPheno = mode === 'phenofarm';

  return (
    <section id="money-flow" className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Why PhenoFarm"
          title="Your money never routes through us"
          lede="Typical marketplaces sit in the middle of the transaction and take a percentage. PhenoFarm carries the workflow — verification, quotes, fulfillment records — and leaves settlement exactly where it belongs."
        />

        {/* Mode toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="tablist" aria-label="Compare money flow">
            {(
              [
                { id: 'marketplace', label: 'Typical marketplace' },
                { id: 'phenofarm', label: 'PhenoFarm' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  mode === tab.id ? 'text-gray-950' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === tab.id && (
                  <motion.span
                    layoutId="flow-toggle"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diagram */}
        <div className="relative mx-auto mt-12 max-w-3xl rounded-3xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-10">
          <div className="flex items-start justify-between gap-2 sm:gap-6">
            <Node icon={Building2} label="Dispensary" sublabel="Buys wholesale" />
            <div className="relative mt-2 flex-1">
              {/* Money lane (top) */}
              <div className="relative h-px w-full bg-white/10">
                <AnimatePresence mode="wait">
                  {isPheno ? (
                    <motion.div key="direct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <FlowDot color="bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" duration={2.6} path="top" />
                      <FlowDot color="bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" duration={2.6} delay={1.3} path="top" />
                    </motion.div>
                  ) : (
                    <motion.div key="cut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <FlowDot color="bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" duration={3.4} path="top" />
                      {/* The platform's cut peels off mid-lane */}
                      <motion.span
                        aria-hidden
                        className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)] motion-reduce:hidden"
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: [0, 26], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, delay: 1.55, repeat: Infinity, repeatDelay: 2.2, ease: 'easeIn' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-1 hidden text-center text-[10px] uppercase tracking-wider text-gray-600 sm:block">
                {isPheno ? 'Invoices settle direct · 100% to the grower' : 'Payment routes through the platform'}
              </div>

              {/* Middle platform node */}
              <div className="mt-5 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isPheno ? (
                      <Node icon={Landmark} label="PhenoFarm" sublabel="Records only — verification, quotes, status" tone="emerald" />
                    ) : (
                      <Node icon={Landmark} label="Marketplace" sublabel="Intermediates payment · 10–20% take rate" tone="red" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Data lane (bottom, PhenoFarm mode only) */}
              <div className="relative mt-5 h-px w-full bg-white/10">
                {isPheno && (
                  <>
                    <FlowDot color="bg-sky-400/90" size={6} duration={3.2} path="bottom" />
                    <FlowDot color="bg-sky-400/90" size={6} duration={3.2} delay={1.6} path="bottom" reverse />
                  </>
                )}
              </div>
              <div className="mt-1 hidden text-center text-[10px] uppercase tracking-wider text-gray-600 sm:block">
                {isPheno ? 'Both sides sync the same request record' : 'Your customer relationship is intermediated'}
              </div>
            </div>
            <Node icon={Sprout} label="Grower" sublabel="Sells wholesale" />
          </div>

          {/* Mode summary */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`mt-8 rounded-xl border px-4 py-3 text-center text-sm ${
                isPheno
                  ? 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-200'
                  : 'border-red-500/20 bg-red-500/[0.04] text-red-200'
              }`}
            >
              {isPheno
                ? 'Flat software subscription. On $1M of wholesale volume, PhenoFarm costs the same as on $10k — $0 of it is ours.'
                : 'A 15% take rate on $1M of wholesale volume is $150,000 — paid for standing between you and your customer.'}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
