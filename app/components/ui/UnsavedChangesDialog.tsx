'use client';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

type ConfirmationOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};
type NavigationRequest = ConfirmationOptions & {
  message: string;
  resolve: (leave: boolean) => void;
};
let pending: NavigationRequest | null = null;
export function askToLeave(
  message: string,
  options: ConfirmationOptions = {}
): Promise<boolean> {
  if (pending) return Promise.resolve(false);
  return new Promise((resolve) => {
    pending = { message, resolve, ...options };
    window.dispatchEvent(new Event('phenoshop:unsaved-navigation'));
  });
}
export function UnsavedChangesDialog() {
  const [request, setRequest] = useState<NavigationRequest | null>(null);
  useEffect(() => {
    const listener = () => setRequest(pending);
    window.addEventListener('phenoshop:unsaved-navigation', listener);
    return () => {
      window.removeEventListener('phenoshop:unsaved-navigation', listener);
    };
  }, []);
  const finish = (leave: boolean) => {
    const current = pending;
    pending = null;
    setRequest(null);
    current?.resolve(leave);
  };
  return (
    <ConfirmDialog
      open={Boolean(request)}
      title={request?.title || 'Leave without saving?'}
      description={request?.message || ''}
      confirmLabel={request?.confirmLabel || 'Discard changes'}
      cancelLabel={request?.cancelLabel || 'Keep editing'}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  );
}
