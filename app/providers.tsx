'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Toaster } from 'sonner';
import { ReactNode, useEffect, useState } from 'react';
import { UnsavedChangesDialog } from '@/app/components/ui/UnsavedChangesDialog';

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return (
    <SessionProvider session={session}>
      {children}
      <UnsavedChangesDialog />
      <Toaster
        position={mobile ? 'top-center' : 'bottom-right'}
        closeButton
        duration={8000}
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
