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
 * - Escape is reserved for closing dialogs, never leaving a full page.
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
  const { onSave, isDirty = true, enabled = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        !enabled ||
        e.defaultPrevented ||
        document.querySelector('[aria-modal="true"]')
      )
        return;

      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        if (onSave && isDirty) {
          onSave();
        }
      }
    },
    [onSave, isDirty, enabled]
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
