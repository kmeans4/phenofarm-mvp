'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

/** Eased number counter that runs once when scrolled into view. */
export function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.6,
  className = '',
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    if (reduced) {
      el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, decimals, prefix, suffix, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Standard section heading: eyebrow + balanced headline + optional lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: 'center' | 'left';
}) {
  const alignCls = align === 'center' ? 'mx-auto text-center' : 'text-left';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`max-w-2xl ${alignCls}`}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-[1.15]">
        {title}
      </h2>
      {lede && <p className="mt-5 text-pretty leading-relaxed text-gray-400">{lede}</p>}
    </motion.div>
  );
}

/** Word-by-word masked reveal for hero headlines. */
export function StaggeredWords({
  text,
  accentFrom,
  className = '',
}: {
  text: string;
  /** Words from this index onward get the emerald gradient. */
  accentFrom?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className={`inline-block ${
              accentFrom !== undefined && i >= accentFrom
                ? 'bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent'
                : ''
            }`}
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
