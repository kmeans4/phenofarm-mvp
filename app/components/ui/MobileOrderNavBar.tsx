'use client';

import Link from 'next/link';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';

interface MobileOrderNavBarProps {
  ordersHref: string;
  ordersLabel: string;
  targetId: string;
  targetLabel: string;
  targetHref?: string;
}

export function MobileOrderNavBar({ ordersHref, ordersLabel, targetId, targetLabel, targetHref }: MobileOrderNavBarProps) {
  return (
    <StickyMobileActionBar
      primaryLabel={targetLabel}
      onPrimary={() => {
        if (targetHref) {
          window.location.assign(targetHref);
          return;
        }
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
      secondary={(
        <Link href={ordersHref} className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg border border-gray-300 px-3 text-center text-sm font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
          {ordersLabel}
        </Link>
      )}
    />
  );
}
