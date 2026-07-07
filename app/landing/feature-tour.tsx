'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, BarChart3, FileCheck2, MessagesSquare, ShieldCheck, Timer } from 'lucide-react';
import { SectionHeading } from './motion';

/* ---------- Animated vignettes (product moments in pure markup) ---------- */

function VerificationVignette() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-100">Green Mountain Dispensary</div>
              <div className="text-[11px] text-gray-500">VT-RTL-2024-001 · expires 12/2027</div>
            </div>
          </div>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/20"
          >
            <BadgeCheck className="h-3 w-3" />
            License verified
          </motion.span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3 text-center">
          {['Identity', 'License', 'Ordering'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.15 }}
              className="rounded-md bg-white/[0.03] px-2 py-1.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/80">{step}</div>
              <div className="text-[11px] font-medium text-gray-300">Cleared</div>
            </motion.div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Unverified buyers physically cannot submit a request — the gate is enforced in the order pipeline, not on a badge.
      </p>
    </div>
  );
}

function QuoteVignette() {
  const bubbles = [
    { side: 'right', text: 'Quote: 50 × $60.00/g · Net 30', style: 'bg-emerald-500/90 text-white rounded-br-sm ml-auto' },
    { side: 'left', text: 'Counter: 50 × $55.00/g · ACH', style: 'border border-white/[0.07] bg-[#0c0f0d] text-gray-300 rounded-bl-sm' },
    { side: 'right', text: 'Accepted — terms locked to the record', style: 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20 ml-auto' },
  ];
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={bubble.text}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.45, duration: 0.35, ease: 'easeOut' }}
            className={`w-fit max-w-[85%] rounded-xl px-3 py-2 text-xs ${bubble.style}`}
          >
            {bubble.text}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Hide list pricing per product, field quote requests, counter, accept — every term stays on the record.
      </p>
    </div>
  );
}

function TimelineVignette() {
  const steps = ['Submitted', 'Accepted', 'Preparing', 'Ready', 'Delivered'];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-4 py-6">
        <div className="relative flex items-center justify-between">
          <div className="absolute inset-x-2 top-[5px] h-px bg-white/10" aria-hidden />
          <motion.div
            aria-hidden
            className="absolute left-2 top-[5px] h-px bg-emerald-400/80"
            initial={{ width: '0%' }}
            animate={{ width: '96%' }}
            transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
          />
          {steps.map((step, i) => (
            <div key={step} className="relative flex flex-col items-center gap-2">
              <motion.span
                className="h-[11px] w-[11px] rounded-full ring-4 ring-[#0c0f0d]"
                initial={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                animate={{ backgroundColor: 'rgb(52,211,153)' }}
                transition={{ delay: 0.3 + i * 0.55 }}
              />
              <span className="text-[10px] text-gray-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Both sides watch the same timeline. Cancel a request and the reserved stock returns automatically.
      </p>
    </div>
  );
}

function CoaVignette() {
  const docs = ['Potency test', 'Pesticide test', 'Microbial test'];
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {docs.map((doc, i) => (
          <motion.div
            key={doc}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.2 }}
            className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-gray-200">{doc}</span>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2 }}
              className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/20"
            >
              On file
            </motion.span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strain-aware listings with batches, THC/CBD ranges, per-product price visibility, and lab documents buyers can trust.
      </p>
    </div>
  );
}

function AnalyticsVignette() {
  const bars = [32, 58, 44, 72, 60, 88, 76];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4">
        <div className="flex h-28 items-end justify-between gap-2">
          {bars.map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-[3px] bg-gradient-to-t from-emerald-500/25 to-emerald-400/70"
              initial={{ height: '4%' }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-gray-600">
          <span>Delivered request value</span>
          <span className="text-emerald-400">+38% QoQ</span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Rankings and trends computed from delivered fulfillment — not vanity counts.
      </p>
    </div>
  );
}

/* ------------------------------ The tour ------------------------------ */

const FEATURES = [
  {
    id: 'verification',
    icon: ShieldCheck,
    title: 'License verification that gates ordering',
    blurb: 'Admins review every license before a buyer can order. Trust is enforced, not implied.',
    Vignette: VerificationVignette,
  },
  {
    id: 'quotes',
    icon: MessagesSquare,
    title: 'Native quote negotiation',
    blurb: 'Request pricing, counter, accept — the whole negotiation lives in one recorded thread.',
    Vignette: QuoteVignette,
  },
  {
    id: 'lifecycle',
    icon: Timer,
    title: 'Live request lifecycle',
    blurb: 'One shared status from submission to delivery, with automatic stock reconciliation.',
    Vignette: TimelineVignette,
  },
  {
    id: 'catalog',
    icon: FileCheck2,
    title: 'Compliance-grade catalog',
    blurb: 'Strains, batches, COAs, and price-visibility control on every listing.',
    Vignette: CoaVignette,
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Operational analytics',
    blurb: 'Delivered value trends, top products, and top customers from real fulfillment data.',
    Vignette: AnalyticsVignette,
  },
] as const;

const ADVANCE_MS = 5200;

export function FeatureTour() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % FEATURES.length), ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, reduced]);

  const ActiveVignette = FEATURES[index].Vignette;

  return (
    <section id="workflow" className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Platform tour"
          title="Everything between discovery and delivery"
          lede="Five systems working as one workspace. The tour plays itself — or click any step."
        />

        <div
          className="mt-14 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Step list */}
          <div className="space-y-2" role="tablist" aria-label="Platform features">
            {FEATURES.map((feature, i) => {
              const isActive = i === index;
              return (
                <button
                  key={feature.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setIndex(i)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  className={`relative w-full overflow-hidden rounded-xl border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-emerald-500/25 bg-emerald-500/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <feature.icon className={`mt-0.5 h-5 w-5 shrink-0 ${isActive ? 'text-emerald-300' : 'text-gray-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {feature.title}
                      </div>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden pt-1 text-xs leading-relaxed text-gray-400"
                          >
                            {feature.blurb}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* Auto-advance progress */}
                  {isActive && !reduced && (
                    <motion.span
                      key={`progress-${index}-${paused}`}
                      className="absolute bottom-0 left-0 h-[2px] bg-emerald-400/70"
                      initial={{ width: '0%' }}
                      animate={{ width: paused ? '0%' : '100%' }}
                      transition={{ duration: paused ? 0 : ADVANCE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Vignette stage */}
          <div className="relative min-h-[280px] rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={FEATURES[index].id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ActiveVignette />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
