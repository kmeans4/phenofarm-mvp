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
        className="flex w-full items-center rounded-lg px-3 py-2 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
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
      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
      aria-label="Sign Out"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
