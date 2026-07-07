'use client';

import { BadgeCheck, FileCheck2, Handshake, Leaf, MessagesSquare, ShieldCheck, Timer, Wallet } from 'lucide-react';

const ITEMS = [
  { icon: ShieldCheck, label: 'License-gated ordering' },
  { icon: Wallet, label: '0% take rate' },
  { icon: MessagesSquare, label: 'Recorded quote terms' },
  { icon: Handshake, label: 'Direct settlement' },
  { icon: FileCheck2, label: 'COA & lab docs on file' },
  { icon: Timer, label: 'Live fulfillment status' },
  { icon: Leaf, label: 'Metrc-ready compliance' },
  { icon: BadgeCheck, label: 'Verified growers & buyers' },
];

/** Infinite principle marquee — CSS-driven, pauses on hover, masked edges. */
export function Marquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="PhenoFarm principles" className="relative border-t border-white/[0.06] py-6">
      <div
        className="group overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="flex w-max animate-[pf-marquee_36s_linear_infinite] gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {track.map((item, i) => (
            <span
              key={`${item.label}-${i}`}
              aria-hidden={i >= ITEMS.length}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-xs text-gray-400"
            >
              <item.icon className="h-3.5 w-3.5 text-emerald-400/80" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
