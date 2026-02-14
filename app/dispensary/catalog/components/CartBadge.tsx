'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

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

const emptySubscribe = () => () => {};

export default function CartBadge() {
  const count = useSyncExternalStore(emptySubscribe, getCartCount, () => 0);

  const handleUpdate = useCallback(() => {
    // Force re-render when cart changes
    window.dispatchEvent(new Event('cart-badge-update'));
  }, []);

  useEffect(() => {
    handleUpdate();
    
    // Listen for cart updates
    window.addEventListener('cart-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('cart-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [handleUpdate]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
