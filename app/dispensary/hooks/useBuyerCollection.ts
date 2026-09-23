'use client';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useSession } from 'next-auth/react';

type Kind = 'favorites' | 'price-alerts' | 'saved-filters';
function itemId(kind: Kind, value: unknown): string {
  if (kind === 'favorites') return typeof value === 'string' ? value : '';
  if (!value || typeof value !== 'object') return '';
  const item = value as Record<string, unknown>;
  if (kind === 'price-alerts') return String(item.productId || '');
  // The server assigns saved-filter IDs; match cached pending creations by content
  // so an edit during hydration also applies to its canonical server record.
  return JSON.stringify([item.name, item.filters, item.searchQuery || '', item.sortBy || 'default']);
}
function writable(kind: Kind, value: unknown) {
  if (kind !== 'price-alerts') return value;
  const item = value as { productId: string; targetPrice: number; isTriggered?: boolean };
  return { productId: item.productId, targetPrice: item.targetPrice, isTriggered: item.isTriggered === true };
}
function signature(kind: Kind, items: unknown[]) { return JSON.stringify(items.map(item => writable(kind, item))); }

/** Account-backed collections: hydration never writes, and only user edits produce a debounced diff. */
export function useBuyerCollection<T>(kind: Kind, normalize: (value: unknown) => T[]) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [items, setState] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const baseline = useRef<T[]>([]);
  const desired = useRef<T[]>([]);
  const edited = useRef(false);
  const queue = useRef(Promise.resolve());
  const key = userId ? `phenofarm:${userId}:${kind}` : null;
  const setItems: Dispatch<SetStateAction<T[]>> = useCallback(action => {
    edited.current = true;
    const next = typeof action === 'function' ? (action as (old: T[]) => T[])(desired.current) : action;
    desired.current = next; setState(next);
  }, []);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    edited.current = false; setReady(false); setError('');
    let cached: T[] = [];
    try { cached = normalize(JSON.parse(localStorage.getItem(key) || '[]')); } catch { /* Server remains authoritative. */ }
    baseline.current = cached; desired.current = cached; setState(cached);
    void (async () => {
      try {
        // Strict Mode can replay mount effects; do not start the superseded GET.
        await Promise.resolve();
        if (controller.signal.aborted) return;
        const response = await fetch(`/api/dispensary/${kind}`, { signal: controller.signal });
        const body = await response.json();
        const value = body[kind === 'favorites' ? 'productIds' : kind === 'price-alerts' ? 'alerts' : 'filters'];
        if (!response.ok || !Array.isArray(value)) throw new Error('Unable to load saved items.');
        const server = normalize(value);
        if (controller.signal.aborted) return;
        let next = server;
        if (edited.current) {
          const ids = new Set(desired.current.map(item => itemId(kind, item)));
          const removed = new Set(cached.filter(item => !ids.has(itemId(kind, item))).map(item => itemId(kind, item)));
          const changed = desired.current.filter(item => !cached.some(previous => itemId(kind, previous) === itemId(kind, item) && JSON.stringify(writable(kind, previous)) === JSON.stringify(writable(kind, item))));
          const merged = new Map(server.filter(item => !removed.has(itemId(kind, item))).map(item => [itemId(kind, item), item]));
          changed.forEach(item => merged.set(itemId(kind, item), item)); next = [...merged.values()];
        }
        baseline.current = server; desired.current = next; setState(next); setReady(true);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load saved items.'); }
    })();
    return () => controller.abort();
  }, [key, kind, normalize]);
  const persist = useCallback(() => {
    if (!ready || !key) return;
    queue.current = queue.current.then(async () => {
      const next = desired.current;
      const before = baseline.current;
      if (signature(kind, next) === signature(kind, before)) return;
      const ids = new Set(next.map(item => itemId(kind, item)));
      const added = next.filter(item => !before.some(previous => itemId(kind, previous) === itemId(kind, item) && JSON.stringify(writable(kind, previous)) === JSON.stringify(writable(kind, item)))).map(item => writable(kind, item));
      const removed = before.filter(item => !ids.has(itemId(kind, item))).map(item => itemId(kind, item));
      const response = await fetch(`/api/dispensary/${kind}`, { method: kind === 'saved-filters' ? 'PUT' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kind === 'saved-filters' ? { filters: next } : { added, removed }), keepalive: true });
      if (!response.ok) throw new Error('Your change could not be saved. Try again.');
      baseline.current = next; setError('');
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to save changes.'));
  }, [key, kind, ready]);
  const flushOnExit = useRef(persist);
  useEffect(() => { flushOnExit.current = persist; }, [persist]);
  useEffect(() => () => { flushOnExit.current(); }, []);
  useEffect(() => {
    if (!ready || !key) return;
    try { localStorage.setItem(key, signature(kind, items)); } catch { /* Local caching is optional. */ }
    if (signature(kind, items) === signature(kind, baseline.current)) return;
    const timer = setTimeout(persist, 300);
    return () => clearTimeout(timer);
  }, [items, kind, ready, key, persist]);
  // Refresh merges known records only; incomplete/empty responses cannot erase saved alerts.
  const mergeRefresh = useCallback((value: unknown) => {
    if (!Array.isArray(value)) throw new Error('Invalid refresh response.');
    const updates = new Map(normalize(value).map(item => [itemId(kind, item), item]));
    const before = baseline.current;
    const next = desired.current.map(item => {
      const old = before.find(previous => itemId(kind, previous) === itemId(kind, item));
      const locallyChanged = !old || JSON.stringify(writable(kind, old)) !== JSON.stringify(writable(kind, item));
      return locallyChanged ? item : updates.get(itemId(kind, item)) ?? item;
    });
    baseline.current = before.map(item => updates.get(itemId(kind, item)) ?? item);
    desired.current = next; setState(next);
  }, [kind, normalize]);
  return { items, setItems, ready, error, mergeRefresh };
}
