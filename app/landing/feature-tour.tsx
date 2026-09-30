'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import {
  BadgeCheck,
  BarChart3,
  FileCheck2,
  MessagesSquare,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { SectionHeading } from './motion';

/* ---------- Animated vignettes (product moments in pure markup) ---------- */

function VerificationVignette() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-100">
                Example dispensary
              </div>
              <div className="text-xs text-gray-400">Business license</div>
            </div>
          </div>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20"
          >
            <BadgeCheck className="h-3 w-3" />
            Approved to order
          </motion.span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-white/[0.05] pt-3 text-center min-[380px]:grid-cols-3">
          {['Profile', 'License', 'Ordering'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.15 }}
              className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 min-[380px]:block"
            >
              <div className="text-xs text-emerald-400/80">
                {step}
              </div>
              <div className="text-xs font-medium text-gray-300">
                {['Reviewed', 'Approved', 'Enabled'][i]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        View contact and license details in one place.
      </p>
    </div>
  );
}

function QuoteVignette() {
  const bubbles = [
    {
      side: 'right',
      text: 'Buyer asks for a price',
      style: 'bg-emerald-500/90 text-white rounded-br-sm ml-auto',
    },
    {
      side: 'left',
      text: 'Grower offers $4.50 per gram',
      style:
        'border border-white/[0.07] bg-[#0c0f0d] text-gray-300 rounded-bl-sm',
    },
    {
      side: 'right',
      text: 'Buyer suggests $4.00 per gram',
      style:
        'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20 ml-auto',
    },
  ];
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={bubble.text}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.25 + i * 0.45,
              duration: 0.35,
              ease: 'easeOut',
            }}
            className={`w-fit max-w-[85%] rounded-xl px-3 py-2 text-xs ${bubble.style}`}
          >
            {bubble.text}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Buyers and growers can discuss a price and accept an offer in the same
        conversation.
      </p>
    </div>
  );
}

function TimelineVignette() {
  const steps = ['Submitted', 'Accepted', 'Preparing', 'Ready', 'Delivered'];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-4 py-6">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <div
            className="absolute inset-x-2 top-[5px] hidden h-px bg-white/10 sm:block"
            aria-hidden
          />
          <motion.div
            aria-hidden
            className="absolute left-2 top-[5px] hidden h-px bg-emerald-400/80 sm:block"
            initial={{ width: '0%' }}
            animate={{ width: '96%' }}
            transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
          />
          {steps.map((step, i) => (
            <div
              key={step}
              className="relative flex items-center gap-2 sm:min-w-0 sm:flex-1 sm:flex-col sm:text-center"
            >
              <motion.span
                className="h-[11px] w-[11px] rounded-full ring-4 ring-[#0c0f0d]"
                initial={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                animate={{ backgroundColor: 'rgb(52,211,153)' }}
                transition={{ delay: 0.3 + i * 0.55 }}
              />
              <span className="text-xs text-gray-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Both sides can see the request status. Stock is deducted only when the
        grower accepts. Sending or withdrawing a request does not reserve stock.
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
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-gray-200">{doc}</span>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2 }}
              className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20"
            >
              On file
            </motion.span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Growers can add batch details and lab reports. Buyers can download
        available reports from listings.
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
              transition={{
                delay: 0.2 + i * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>Delivered order values</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Growers can see delivered request totals, top products, and top
        customers. These are order values, not payments.
      </p>
    </div>
  );
}

/* ------------------------------ The tour ------------------------------ */

const FEATURES = [
  {
    id: 'verification',
    icon: ShieldCheck,
    title: 'Review buyer licenses',
    blurb: 'Review business details and keep the approval status visible.',
    Vignette: VerificationVignette,
  },
  {
    id: 'quotes',
    icon: MessagesSquare,
    title: 'Agree on prices',
    blurb:
      'Buyers can ask for a price, growers can reply, and both sides can see the conversation.',
    Vignette: QuoteVignette,
  },
  {
    id: 'lifecycle',
    icon: Timer,
    title: 'Track each order request',
    blurb:
      'Both sides can see the status as the grower prepares and delivers an order.',
    Vignette: TimelineVignette,
  },
  {
    id: 'catalog',
    icon: FileCheck2,
    title: 'Keep product details together',
    blurb:
      'Growers can add batch details, stock, prices, and lab files to their listings.',
    Vignette: CoaVignette,
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Review delivered orders',
    blurb:
      'Growers can see order totals, top products, and customers for delivered requests.',
    Vignette: AnalyticsVignette,
  },
] as const;

const ADVANCE_MS = 5200;

export function FeatureTour() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (
      paused ||
      touched ||
      reduced ||
      window.matchMedia('(hover: none)').matches
    )
      return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % FEATURES.length),
      ADVANCE_MS
    );
    return () => clearTimeout(timer);
  }, [index, paused, touched, reduced]);

  const ActiveVignette = FEATURES[index].Vignette;

  return (
    <section
      id="workflow"
      className="relative scroll-mt-20 border-t border-white/[0.06] py-28 md:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="What you can do"
          title="Tools for each step of a wholesale order"
          lede="Choose a feature to see how it works."
        />

        <div
          className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          onPointerDown={() => setTouched(true)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Step list */}
          <div
            className="min-w-0 space-y-2"
            role="group"
            aria-label="PhenoShop features"
          >
            {FEATURES.map((feature, i) => {
              const isActive = i === index;
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={isActive}
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
                    <feature.icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${isActive ? 'text-emerald-300' : 'text-gray-400'}`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}
                      >
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
                  {isActive && (
                    <motion.span
                      key={`progress-${index}-${paused}`}
                      aria-hidden
                      className="absolute bottom-0 left-0 h-[2px] bg-emerald-400/70 motion-reduce:hidden"
                      initial={{ width: '0%' }}
                      animate={{ width: paused ? '0%' : '100%' }}
                      transition={{
                        duration: paused ? 0 : ADVANCE_MS / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Vignette stage */}
          <div className="relative min-h-[280px] min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
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
