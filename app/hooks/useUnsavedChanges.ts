'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * Custom hook to warn users about unsaved changes when navigating away
 * 
 * Features:
 * - Detects browser navigation (back button, close tab, refresh) via beforeunload
 * - Detects in-app navigation (Next.js router) via route interception
 * - Tracks form dirty state by comparing current values to initial values
 * 
 * Usage:
 * const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
 *   enabled: true,
 *   message: 'You have unsaved changes. Are you sure you want to leave?'
 * });
 * 
 * // To mark form as dirty when values change:
 * useEffect(() => {
 *   const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
 *   setIsDirty(isChanged);
 * }, [formData, initialData]);
 * 
 * // To reset after successful save:
 * resetDirtyState();
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}) {
  const { 
    enabled = true, 
    message = 'You have unsaved changes. Are you sure you want to leave?' 
  } = options;
  
  const [isDirty, setIsDirty] = useState(false);
  const router = useRouter();
  const originalPushRef = useRef<typeof router.push>(undefined);
  const originalReplaceRef = useRef<typeof router.replace>(undefined);
  const originalBackRef = useRef<typeof router.back>(undefined);
  const originalForwardRef = useRef<typeof router.forward>(undefined);
  const isConfirmingRef = useRef(false);

  // Store original router methods
  useEffect(() => {
    if (!enabled) return;
    
    originalPushRef.current = router.push.bind(router);
    originalReplaceRef.current = router.replace.bind(router);
    originalBackRef.current = router.back.bind(router);
    originalForwardRef.current = router.forward.bind(router);
  }, [enabled, router]);

  // Handle browser beforeunload event (close tab, refresh, back button)
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isDirty, message]);

  // Handle in-app navigation via Next.js router
  useEffect(() => {
    if (!enabled || !originalPushRef.current) return;

    const confirmNavigation = (): boolean => {
      if (!isDirty || isConfirmingRef.current) return true;
      
      isConfirmingRef.current = true;
      const confirmed = window.confirm(message);
      isConfirmingRef.current = false;
      
      return confirmed;
    };

    // Override router.push
    const originalPush = originalPushRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,react-hooks/immutability
    (router as any).push = async (...args: Parameters<typeof router.push>) => {
      if (confirmNavigation()) {
        return originalPush(...args);
      }
      // Return a resolved promise to maintain the return type contract
      return Promise.resolve(false);
    };

    // Override router.replace
    const originalReplace = originalReplaceRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any).replace = async (...args: Parameters<typeof router.replace>) => {
      if (confirmNavigation()) {
        return originalReplace(...args);
      }
      return Promise.resolve(false);
    };

    // Override router.back
    const originalBack = originalBackRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any).back = () => {
      if (confirmNavigation()) {
        originalBack();
      }
    };

    // Override router.forward
    const originalForward = originalForwardRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any).forward = () => {
      if (confirmNavigation()) {
        originalForward();
      }
    };

    // Cleanup: restore original methods
    return () => {
      if (originalPushRef.current) router.push = originalPushRef.current;
      if (originalReplaceRef.current) router.replace = originalReplaceRef.current;
      if (originalBackRef.current) router.back = originalBackRef.current;
      if (originalForwardRef.current) router.forward = originalForwardRef.current;
    };
  }, [enabled, isDirty, router, message]);

  // Helper to manually trigger dirty state
  const triggerDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Helper to manually reset dirty state (call after successful save)
  const resetDirtyState = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    setIsDirty,
    triggerDirty,
    resetDirtyState,
    message,
  };
}

/**
 * Helper hook to track form dirty state by comparing current and initial values
 * 
 * Usage:
 * const { isDirty, resetDirtyState } = useFormDirty(formData, initialData);
 */
export function useFormDirty<T extends Record<string, unknown>>(
  currentData: T,
  initialData: T,
  options?: UseUnsavedChangesOptions
) {
  const [lastSavedData, setLastSavedData] = useState<T>(initialData);
  
  // Compare current data with last saved data
  const isDirty = JSON.stringify(currentData) !== JSON.stringify(lastSavedData);
  
  const unsavedChanges = useUnsavedChanges({
    ...options,
    enabled: options?.enabled !== false && isDirty,
  });

  // Sync with the hook's isDirty state
  useEffect(() => {
    unsavedChanges.setIsDirty(isDirty);
  }, [isDirty, unsavedChanges]);

  const resetDirtyState = useCallback(() => {
    setLastSavedData(currentData);
    unsavedChanges.resetDirtyState();
  }, [currentData, unsavedChanges]);

  return {
    isDirty,
    resetDirtyState,
    message: unsavedChanges.message,
  };
}

export default useUnsavedChanges;
