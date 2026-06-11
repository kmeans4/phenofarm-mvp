'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface StoredDraft<T> {
  value: T;
  savedAt: string;
}

interface UseLocalDraftOptions<T> {
  key: string;
  value: T;
  enabled?: boolean;
  delayMs?: number;
  onRestore?: (value: T, savedAt: string) => void;
  shouldSave?: (value: T) => boolean;
}

export function useLocalDraft<T>({
  key,
  value,
  enabled = true,
  delayMs = 600,
  onRestore,
  shouldSave = () => true,
}: UseLocalDraftOptions<T>) {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const restoreRef = useRef(onRestore);
  const shouldSaveRef = useRef(shouldSave);
  const restoredRef = useRef(false);
  const keyRef = useRef(key);

  useEffect(() => {
    restoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    shouldSaveRef.current = shouldSave;
  }, [shouldSave]);

  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    restoredRef.current = false;
    setRestored(false);
    setSavedAt(null);
  }, [key]);

  useEffect(() => {
    if (!enabled || restoredRef.current || typeof window === 'undefined') return;
    restoredRef.current = true;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDraft<T>;
        if (parsed?.value && parsed.savedAt) {
          restoreRef.current?.(parsed.value, parsed.savedAt);
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      setRestored(true);
    }
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || !restoredRef.current || typeof window === 'undefined') return;

    const timeout = window.setTimeout(() => {
      if (!shouldSaveRef.current(value)) return;

      const nextSavedAt = new Date().toISOString();
      window.localStorage.setItem(key, JSON.stringify({ value, savedAt: nextSavedAt }));
      setSavedAt(nextSavedAt);
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, enabled, key, value]);

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    setSavedAt(null);
  }, [key]);

  return {
    clearDraft,
    restored,
    savedAt,
  };
}
