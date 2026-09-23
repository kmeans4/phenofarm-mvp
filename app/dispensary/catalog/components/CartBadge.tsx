'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { readCart } from '@/lib/cart';

function getCartCount() { return readCart().items.reduce((sum, item) => sum + item.quantity, 0); }

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('cart-updated', callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener('cart-updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export default function CartBadge({ showLink = false }: { showLink?: boolean } = {}) {
  const count = useSyncExternalStore(subscribe, getCartCount, () => 0);

  if (count === 0) return null;

  const badge = <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pf-accent-bg px-1.5 text-xs font-bold leading-none text-pf-accent">{count > 99 ? '99+' : count}</span>;
  return showLink ? (
    <Link href="/dispensary/cart" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-pf-accent-line px-3 text-sm font-semibold text-pf-accent hover:bg-pf-accent-bg">View draft {badge}</Link>
  ) : badge;
}
