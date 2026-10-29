'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from '@/app/components/ui/Modal';

export function ProductActions({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Actions for ${name}`}
        className="flex min-h-11 items-center rounded-lg px-3 text-sm"
        onClick={() => setOpen(true)}
      >
        Actions
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Actions for ${name}`}
        className="max-w-sm"
      >
        <div
          className="space-y-1"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a, button'))
              setOpen(false);
          }}
        >
          {children}
        </div>
      </Modal>
    </>
  );
}
