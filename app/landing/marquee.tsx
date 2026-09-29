import { FileCheck2, Heart, MessagesSquare, Package, Search, Timer } from 'lucide-react';

const ITEMS = [
  { icon: Package, label: 'List products and stock' },
  { icon: Search, label: 'Browse wholesale products' },
  { icon: MessagesSquare, label: 'Ask for a price' },
  { icon: Timer, label: 'Track order requests' },
  { icon: FileCheck2, label: 'Keep lab files with listings' },
  { icon: Heart, label: 'Save products for later' },
];

/** Infinite principle marquee — CSS-driven, pauses on hover, masked edges. */
export function Marquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="PhenoShop principles" className="relative border-t border-white/[0.06] py-6">
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
