'use client';

import { RefObject, useEffect, useRef } from 'react';

const activeTraps: symbol[] = [];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseFocusTrapOptions {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onEscape?: () => void;
}

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0 && !element.closest('[inert], [aria-hidden="true"]');
  });
}

export function useFocusTrap({
  active,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  onEscape,
}: UseFocusTrapOptions) {
  const escapeRef = useRef(onEscape);
  useEffect(() => { escapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    const trapId = Symbol('focus-trap');
    activeTraps.push(trapId);
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnTarget = returnFocusRef?.current || previousFocus;
    const animationFrame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const preferred = initialFocusRef?.current;
      const initialTarget = preferred?.getClientRects().length ? preferred : getFocusable(container)[0] || container;
      initialTarget.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTraps.at(-1) !== trapId) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        escapeRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      const index = activeTraps.indexOf(trapId);
      if (index >= 0) activeTraps.splice(index, 1);
      returnTarget?.focus();
    };
  }, [active, containerRef, initialFocusRef, returnFocusRef]);
}
