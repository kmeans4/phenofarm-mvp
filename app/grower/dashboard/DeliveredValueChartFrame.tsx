'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface DeliveredValueChartFrameProps {
  children: ReactNode;
}

export function DeliveredValueChartFrame({ children }: DeliveredValueChartFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateOverflow = () => {
      setHasOverflow(element.scrollWidth > element.clientWidth + 1);
    };

    updateOverflow();
    element.scrollLeft = element.scrollWidth;

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(element);
    window.addEventListener('resize', updateOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      {hasOverflow && (
        <div className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-gradient-to-r from-white via-white/80 to-transparent pl-1 pr-4 sm:hidden">
          <span className="sr-only">Scroll chart horizontally</span>
          <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 shadow-sm">
            ← Earlier
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        className="min-w-0 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
