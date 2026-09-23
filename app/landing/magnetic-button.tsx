'use client';

import Link from 'next/link';
import { m as motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/** Primary CTA that leans gently toward the cursor (mouse only). */
export function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 12);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * 10);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div onPointerMove={onPointerMove} onPointerLeave={reset} className="inline-block p-2 -m-2">
      <motion.div style={{ x: sx, y: sy }}>
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-colors hover:bg-emerald-400"
        >
          {children}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </div>
  );
}

