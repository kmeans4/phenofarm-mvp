'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';

interface ConfirmActionButtonProps {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  actionUrl?: string;
  actionBody?: Record<string, unknown>;
  successMessage?: string;
  confirmTitle?: string;
  confirmLabel?: string;
}

export function ConfirmActionButton({
  children,
  className,
  confirmMessage,
  actionUrl,
  actionBody,
  successMessage,
  confirmTitle = 'Confirm admin action',
  confirmLabel = 'Confirm',
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const open = actionUrl ? dialogOpen : Boolean(pendingForm);

  async function handleConfirm() {
    if (submittingRef.current) return;

    if (!actionUrl) {
      const form = pendingForm;
      setPendingForm(null);
      form?.requestSubmit();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', ...(actionBody ? { 'Content-Type': 'application/json' } : {}) },
        ...(actionBody ? { body: JSON.stringify(actionBody) } : {}),
      });
      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;

      if (!response.ok) {
        if (response.status === 409) {
          setDialogOpen(false);
          router.refresh();
        }
        throw new Error(payload?.error || 'Admin action failed');
      }

      setDialogOpen(false);
      toast.success(successMessage || payload?.message || 'Admin action completed');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Admin action failed');
    } finally {
      submittingRef.current = false;
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
        intent={actionBody?.verified === true ? 'default' : 'danger'}
        loading={submitting}
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
