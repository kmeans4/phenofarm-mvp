'use client';

import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  variant?: 'default' | 'sidebar';
}

export function SignOutButton({ variant = 'default' }: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/sign_in' });
  };

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleSignOut}
        className="w-full flex items-center px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      >
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      aria-label="Sign Out"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
}
