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
        theme="dark"
        toastOptions={{
          style: {
            background: '#16201b',
            border: '1px solid #41564a',
            color: '#f1f5f2',
          },
        }}
      />
    </SessionProvider>
  );
}
