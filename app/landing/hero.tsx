'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CountUp, StaggeredWords } from './motion';

const STATUS_FLOW = ['Submitted', 'Accepted', 'Preparing', 'Ready', 'Delivered'] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_STYLES: Record<Status, string> = {
  Submitted: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Accepted: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Preparing: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Ready: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  Delivered: 'bg-white/[0.06] text-gray-300 ring-white/10',
};

interface DemoRow {
  id: string;
  buyer: string;
  value: string;
  step: number;
}

const INITIAL_ROWS: DemoRow[] = [
  { id: 'ORD-2481', buyer: 'Green Mountain Dispensary', value: '$4,250.00', step: 0 },
  { id: 'ORD-2479', buyer: 'Elevate Wellness', value: '$1,860.00', step: 1 },
  { id: 'ORD-2475', buyer: 'Herb House Collective', value: '$7,400.00', step: 2 },
  { id: 'ORD-2468', buyer: 'Pure Grow Retail', value: '$2,130.00', step: 4 },
];

/** Self-playing workspace: requests advance through the fulfillment
 *  lifecycle on a loop. Pauses on hover; static under reduced motion. */
function LiveWorkspace() {
  const reduced = useReducedMotion();
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => {
      if (paused || document.hidden) return;
      tickRef.current += 1;
      const target = tickRef.current % INITIAL_ROWS.length;
      setRows((prev) =>
        prev.map((row, i) =>
          i === target ? { ...row, step: (row.step + 1) % STATUS_FLOW.length } : row
        )
      );
    }, 2200);
    return () => clearInterval(interval);
  }, [paused, reduced]);

  const inFlight = rows.filter((r) => r.step < 4).length;

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-[#0c0f0d]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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
        <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400/80 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
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
              <div className="text-[11px] text-gray-500">
                {inFlight} in flight · settlement stays direct
              </div>
            </div>
            <div className="rounded-md bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white">
              Record Request
            </div>
          </div>

          {/* Request table with animating status pills */}
          <div className="overflow-hidden rounded-lg border border-white/[0.06]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 sm:grid-cols-[auto_1fr_auto_auto]">
              <span className="hidden sm:block">Request</span>
              <span>Buyer</span>
              <span className="text-right">Est. value</span>
              <span className="text-right">Status</span>
            </div>
            {rows.map((row) => {
              const status = STATUS_FLOW[row.step];
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/[0.04] px-4 py-2.5 text-xs last:border-0 sm:grid-cols-[auto_1fr_auto_auto]"
                >
                  <span className="hidden font-mono text-[11px] text-gray-500 sm:block">{row.id}</span>
                  <span className="truncate text-gray-300">{row.buyer}</span>
                  <span className="text-right font-medium text-gray-200">{row.value}</span>
                  <span className="flex justify-end">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={status}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`inline-flex w-[76px] justify-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Lifecycle strip mirrors the most recently advanced row */}
          <div className="mt-4 hidden items-center justify-between px-1 sm:flex">
            {STATUS_FLOW.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                    rows.some((r) => r.step >= i) ? 'bg-emerald-400' : 'bg-white/15'
                  }`}
                />
                <span className="text-[10px] text-gray-600">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pointer-tracked 3D tilt wrapper (subtle; disabled for touch + reduced motion). */
function TiltFrame({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 5);
    rx.set(py * -5);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <div style={{ perspective: 1200 }} onPointerMove={onPointerMove} onPointerLeave={reset}>
      <motion.div style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </div>
  );
}

const HERO_STATS = [
  { value: 0, suffix: '%', label: 'Take rate on wholesale value' },
  { value: 100, suffix: '%', label: 'Buyers license-verified before ordering' },
  { value: 5, suffix: '', label: 'Fulfillment stages tracked live' },
  { value: 1, suffix: '', label: 'Workspace for the whole deal' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Static glow (page-wide grid + cursor light live in AmbientBackground) */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-32 md:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-4 text-xs text-gray-300"
          >
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">New</span>
            Live quote negotiation and license-gated ordering
          </motion.div>

          <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-[4.25rem]">
            <StaggeredWords text="Licensed wholesale, engineered like software" accentFrom={2} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-400"
          >
            Verified partners, recorded quotes, and live request tracking from submission to
            delivery — while settlement moves directly between businesses. PhenoFarm never
            takes a cut.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/auth/sign_up"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_56px_rgba(16,185,129,0.4)]"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              Watch it work
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-5 text-xs text-gray-600"
          >
            Free to evaluate · No wholesale payment processing · Cultivator subscriptions only
          </motion.p>
        </div>

        {/* Live product demo */}
        <motion.div
          id="product"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative mx-auto mt-16 max-w-4xl scroll-mt-28 md:mt-20"
        >
          <div aria-hidden className="absolute -inset-x-16 -top-16 -bottom-8 bg-[radial-gradient(60%_60%_at_50%_30%,rgba(16,185,129,0.14),transparent_70%)]" />
          <TiltFrame>
            <LiveWorkspace />
          </TiltFrame>
          <p className="mt-4 text-center text-xs text-gray-600">
            Live simulation — every request advances through the same shared lifecycle both sides see.
          </p>
        </motion.div>
      </div>

      {/* Count-up stats strip */}
      <div className="relative border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-white/[0.06] px-6 py-10 text-center md:grid-cols-4 md:divide-x">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-3">
              <div className="text-2xl font-semibold tracking-tight text-white">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs leading-relaxed text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
