'use client';

import { useState, useEffect } from 'react';

export default function CartBadge() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateCount();
    
    // Listen for cart updates
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const updateCount = () => {
    const saved = localStorage.getItem('phenofarm-cart');
    if (saved) {
      try {
        const cart = JSON.parse(saved);
        const totalItems = cart.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        setCount(totalItems);
      } catch {
        setCount(0);
      }
    } else {
      setCount(0);
    }
  };

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
