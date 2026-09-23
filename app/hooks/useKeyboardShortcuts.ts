'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onSave?: (...args: unknown[]) => void | Promise<void>;
  onCancel?: () => void;
  isDirty?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard shortcuts in forms
 * 
 * Features:
 * - Ctrl+S / Cmd+S: Trigger save action (prevents default browser save)
 * - Esc: Trigger cancel/back action
 * 
 * Usage:
 * const { isDirty, resetDirtyState } = useUnsavedChanges({ enabled: true });
 * 
 * useKeyboardShortcuts({
 *   onSave: handleSubmit,
 *   onCancel: () => router.push('/grower/products'),
 *   isDirty,
 *   enabled: true
 * });
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const { onSave, onCancel, isDirty = true, enabled = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || e.defaultPrevented || document.querySelector('[aria-modal="true"]')) return;

      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        if (onSave && isDirty) {
          onSave();
        }
      }

      // Esc to cancel/go back
      if (e.key === 'Escape' && !(e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.closest('input, textarea, select, [role=combobox]')))) {
        e.preventDefault();
        if (onCancel) {
          onCancel();
        }
      }
    },
    [onSave, onCancel, isDirty, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
