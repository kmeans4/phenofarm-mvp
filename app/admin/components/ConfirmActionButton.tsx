'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';

interface ConfirmActionButtonProps {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
}

export function ConfirmActionButton({ children, className, confirmMessage }: ConfirmActionButtonProps) {
  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="submit"
        className={className}
        onClick={(event) => {
          event.preventDefault();
          setPendingForm(event.currentTarget.form);
        }}
      >
        {children}
      </button>
      <ConfirmDialog
        open={Boolean(pendingForm)}
        title="Confirm admin action"
        description={confirmMessage}
        confirmLabel="Confirm"
        intent="danger"
        onCancel={() => setPendingForm(null)}
        onConfirm={() => {
          const form = pendingForm;
          setPendingForm(null);
          form?.requestSubmit();
        }}
      />
    </>
  );
}
