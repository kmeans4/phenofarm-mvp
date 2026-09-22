'use client';

import { useRef, useState } from 'react';
import { signOut } from 'next-auth/react';

export function useSignOut() {
  const pending = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsSigningOut(true);
    try { await signOut({ callbackUrl: '/auth/sign_in' }); }
    finally { pending.current = false; setIsSigningOut(false); }
  };
  return { handleSignOut, isSigningOut };
}
