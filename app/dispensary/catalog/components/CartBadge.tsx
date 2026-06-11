'use client';

import { useSyncExternalStore } from 'react';

function getCartCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem('phenofarm-cart');
    if (saved) {
      const cart = JSON.parse(saved);
      return cart.items?.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0) || 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('cart-updated', callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener('cart-updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export default function CartBadge() {
  const count = useSyncExternalStore(subscribe, getCartCount, () => 0);

  if (count === 0) return null;

  return (
    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
