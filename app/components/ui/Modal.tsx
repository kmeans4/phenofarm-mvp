'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

export function Modal({ open, onClose, title, children, className = '' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: open, containerRef, onEscape: onClose });
  useBodyOverlay(open);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn('max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-pf-line bg-pf-surface p-4 shadow-xl sm:p-5', className)}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-pf-text">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="rounded-lg p-2 text-pf-muted hover:bg-pf-surface"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}
