'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { resetAccountCart, syncAccountCart } from '@/lib/cart';
export function CartSync() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (session?.user?.id && session.user.role === 'DISPENSARY')
      void syncAccountCart(session.user.id);
    else if (status !== 'loading') resetAccountCart();
  }, [session?.user?.id, session?.user?.role, status]);
  useEffect(() => {
    if (!session?.user.id) return;
    const refresh = () => {
      if (document.visibilityState === 'visible')
        void syncAccountCart(session.user.id);
    };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [session?.user.id]);
  return null;
}
