'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

interface StoredDraft<T> { value: T; savedAt: string }
interface UseLocalDraftOptions<T> {
  key: string;
  value: T;
  enabled?: boolean;
  delayMs?: number;
  autoRestore?: boolean;
  onRestore?: (value: T, savedAt: string) => void;
  shouldSave?: (value: T) => boolean;
}

export function useLocalDraft<T>({ key, value, enabled = true, delayMs = 600,
  autoRestore = true, onRestore, shouldSave }: UseLocalDraftOptions<T>) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const storageKey = userId ? `phenofarm:user:${encodeURIComponent(userId)}:${key}` : null;
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [availableDraft, setAvailableDraft] = useState<StoredDraft<T> | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const restoreRef = useRef(onRestore);
  const shouldSaveRef = useRef(shouldSave);
  const writeVersion = useRef(0);

  useEffect(() => { restoreRef.current = onRestore; }, [onRestore]);
  useEffect(() => { shouldSaveRef.current = shouldSave; }, [shouldSave]);

  useEffect(() => {
    if (!enabled || !storageKey) return;
    setReadyKey(null);
    setAvailableDraft(null);
    setSavedAt(null);
    setStorageError(null);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDraft<T>;
        if (parsed && typeof parsed === 'object' && parsed.value != null && typeof parsed.savedAt === 'string' && Number.isFinite(Date.parse(parsed.savedAt))) {
          if (autoRestore) restoreRef.current?.(parsed.value, parsed.savedAt);
          else setAvailableDraft(parsed);
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      setStorageError('Browser draft storage is unavailable. You can still save your changes.');
    }
    setReadyKey(storageKey);
  }, [autoRestore, enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !storageKey || readyKey !== storageKey || availableDraft) return;
    const version = writeVersion.current;
    const timeout = window.setTimeout(() => {
      if (version !== writeVersion.current || (shouldSaveRef.current && !shouldSaveRef.current(value))) return;
      try {
        const nextSavedAt = new Date().toISOString();
        const serialized = JSON.stringify({ value, savedAt: nextSavedAt });
        if (serialized.length > 128 * 1024) throw new Error('Draft too large');
        window.localStorage.setItem(storageKey, serialized);
        setSavedAt(nextSavedAt);
        setStorageError(null);
      } catch {
        setStorageError('This draft could not be stored in your browser. Save your changes before leaving.');
      }
    }, delayMs);
    return () => window.clearTimeout(timeout);
  }, [availableDraft, delayMs, enabled, readyKey, storageKey, value]);

  const saveDraft = useCallback(() => {
    if (!enabled || !storageKey || (shouldSaveRef.current && !shouldSaveRef.current(value))) return;
    try {
      const timestamp = new Date().toISOString();
      const serialized = JSON.stringify({ value, savedAt: timestamp });
      if (serialized.length > 128 * 1024) throw new Error('Draft too large');
      window.localStorage.setItem(storageKey, serialized);
      setSavedAt(timestamp);
    } catch { setStorageError('This draft could not be stored in your browser. Save your changes before leaving.'); }
  }, [enabled, storageKey, value]);

  const clearDraft = useCallback(() => {
    writeVersion.current += 1;
    try { if (storageKey) window.localStorage.removeItem(storageKey); } catch { /* Storage can be disabled. */ }
    setAvailableDraft(null);
    setSavedAt(null);
  }, [storageKey]);
  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    restoreRef.current?.(availableDraft.value, availableDraft.savedAt);
    setAvailableDraft(null);
  }, [availableDraft]);

  return { clearDraft, saveDraft, restoreDraft, availableDraft, restored: Boolean(storageKey && readyKey === storageKey), savedAt, storageError };
}
