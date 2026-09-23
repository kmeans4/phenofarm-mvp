'use client';

import { useSignOut } from '@/app/hooks/useSignOut';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  variant?: 'default' | 'sidebar';
}

export function SignOutButton({ variant = 'default' }: SignOutButtonProps) {
  const { handleSignOut, isSigningOut } = useSignOut();

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
        className="flex w-full items-center rounded-lg px-3 py-2 text-pf-danger transition-colors hover:bg-pf-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <LogOut className="mr-3 h-4 w-4" />
        {isSigningOut ? 'Signing out...' : 'Sign out'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
      className="rounded-lg p-2 text-pf-muted transition-colors hover:bg-pf-danger-bg hover:text-pf-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      aria-label="Sign Out"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
