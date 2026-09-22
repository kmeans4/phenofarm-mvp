'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';

interface ConfirmActionButtonProps {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  actionUrl?: string;
  successMessage?: string;
  confirmTitle?: string;
  confirmLabel?: string;
}

export function ConfirmActionButton({
  children,
  className,
  confirmMessage,
  actionUrl,
  successMessage,
  confirmTitle = 'Confirm admin action',
  confirmLabel = 'Confirm',
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const open = actionUrl ? dialogOpen : Boolean(pendingForm);

  async function handleConfirm() {
    if (submitting) return;

    if (!actionUrl) {
      const form = pendingForm;
      setPendingForm(null);
      form?.requestSubmit();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || 'Admin action failed');
      }

      setDialogOpen(false);
      toast.success(successMessage || payload?.message || 'Admin action completed');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Admin action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type={actionUrl ? 'button' : 'submit'}
        disabled={submitting}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          if (actionUrl) {
            setDialogOpen(true);
          } else {
            setPendingForm(event.currentTarget.form);
          }
        }}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={submitting ? 'Working...' : confirmLabel}
        intent="danger"
        onCancel={() => {
          if (submitting) return;
          setPendingForm(null);
          setDialogOpen(false);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}
