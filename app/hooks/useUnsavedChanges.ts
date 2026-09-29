'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { askToLeave } from '@/app/components/ui/UnsavedChangesDialog';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/** Guards browser unload and links without mutating Next's shared router.
 * Programmatic Cancel/back actions must call confirmNavigation before navigating.
 */
export function useUnsavedChanges({
  enabled = true,
  message = 'Your latest changes have not been saved.',
}: UseUnsavedChangesOptions = {}) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const dirtyRef = useRef(false);
  const updateDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setIsDirty(value);
  }, []);
  const confirmNavigation = useCallback(
    async () => !enabled || !dirtyRef.current || (await askToLeave(message)),
    [enabled, message]
  );

  useEffect(() => {
    if (!enabled || !isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = message;
    };
    const onLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>('a[href]');
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        anchor.target === '_blank'
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      if (dirtyRef.current) {
        event.preventDefault();
        event.stopPropagation();
        void confirmNavigation().then((leave) => {
          if (!leave) return;
          updateDirty(false);
          if (destination.origin === window.location.origin)
            router.push(
              destination.pathname + destination.search + destination.hash
            );
          else window.location.assign(destination.href);
        });
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onLink, true);
    };
  }, [confirmNavigation, enabled, isDirty, message, router, updateDirty]);

  return {
    isDirty,
    setIsDirty: updateDirty,
    triggerDirty: useCallback(() => updateDirty(true), [updateDirty]),
    resetDirtyState: useCallback(() => updateDirty(false), [updateDirty]),
    confirmNavigation,
    message,
  };
}

export default useUnsavedChanges;
