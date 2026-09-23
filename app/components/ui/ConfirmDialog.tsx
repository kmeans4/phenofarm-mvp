'use client';

import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  intent = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const initialFocusRef = intent === 'danger' ? cancelButtonRef : confirmButtonRef;

  useFocusTrap({
    active: open,
    containerRef: dialogRef,
    initialFocusRef,
    onEscape: () => { if (!loading) onCancel(); },
  });
  useBodyOverlay(open);

  if (!open || typeof document === 'undefined') return null;

  const confirmClasses = intent === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
    : 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600';

  return createPortal(
    <div
      className="pf-dialog-backdrop-in fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (!loading && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role={intent === 'danger' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="pf-dialog-panel-in w-full max-w-md rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${intent === 'danger' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            aria-label="Close confirmation dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
            className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClasses}`}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>, document.body
  );
}
