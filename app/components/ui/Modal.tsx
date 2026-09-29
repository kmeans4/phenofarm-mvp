'use client';

import { useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

const subscribeToMount = () => () => {};
const getClientReady = () => true;
const getServerReady = () => false;

export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  preventBackdropClose = false,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  preventBackdropClose?: boolean;
  dismissible?: boolean;
}) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  // Portals must wait until hydration finishes when a deep link opens a modal on load.
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientReady,
    getServerReady
  );
  const visible = mounted && open;
  useFocusTrap({
    active: visible,
    containerRef,
    onEscape: () => {
      if (dismissible) onClose();
    },
  });
  useBodyOverlay(visible);
  if (!visible) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (
          dismissible &&
          !preventBackdropClose &&
          event.target === event.currentTarget
        )
          onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-pf-line bg-pf-surface p-4 shadow-xl sm:p-5',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-pf-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-lg p-2 text-pf-muted hover:bg-pf-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
