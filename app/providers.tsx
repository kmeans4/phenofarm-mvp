'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </SessionProvider>
  );
}
