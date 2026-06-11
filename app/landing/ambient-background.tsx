'use client';

import { useEffect, useRef } from 'react';

const GRID_SIZE = '72px 72px';
const GRID_LINES = (color: string) =>
  `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`;

/**
 * Page-wide ambient layer: a near-invisible hairline grid with an emerald
 * spotlight that lazily drifts toward the cursor, brightening the grid
 * lines it passes over. Pure lighting — no objects, no displacement.
 *
 * Disabled (left static) for touch pointers and prefers-reduced-motion.
 */
export function AmbientBackground() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    const finePointer = window.matchMedia('(pointer: fine)');
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)');
    if (!finePointer.matches || !motionOk.matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.35;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let running = false;

    const tick = () => {
      // Long lag so the light drifts like ambience instead of chasing the cursor
      x += (targetX - x) * 0.055;
      y += (targetY - y) * 0.055;
      el.style.setProperty('--ambient-x', `${x.toFixed(1)}px`);
      el.style.setProperty('--ambient-y', `${y.toFixed(1)}px`);

      if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ '--ambient-x': '50vw', '--ambient-y': '35vh' } as React.CSSProperties}
    >
      {/* Base grid: just barely there, everywhere */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: GRID_LINES('rgba(255,255,255,0.016)'),
          backgroundSize: GRID_SIZE,
        }}
      />

      {/* Lit grid: brighter emerald-tinted lines, revealed only around the light */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: GRID_LINES('rgba(110,231,183,0.075)'),
          backgroundSize: GRID_SIZE,
          maskImage:
            'radial-gradient(360px circle at var(--ambient-x) var(--ambient-y), black, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(360px circle at var(--ambient-x) var(--ambient-y), black, transparent 72%)',
        }}
      />

      {/* Spotlight glow: large, dim, soft */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(640px circle at var(--ambient-x) var(--ambient-y), rgba(16,185,129,0.065), transparent 70%)',
        }}
      />
    </div>
  );
}
