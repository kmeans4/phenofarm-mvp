'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number; maxHeight: number } | undefined>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const mutating = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    // Responsive layouts mount two bells. Only the visible one owns polling.
    if (document.hidden || !triggerRef.current?.getClientRects().length) {
      inFlight.current?.abort();
      inFlight.current = null;
      return;
    }
    if (inFlight.current || mutating.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    try {
      const response = await fetch(open ? '/api/notifications' : '/api/notifications?countOnly=true', { signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Number.isFinite(data.unreadCount) || (open && !Array.isArray(data.notifications))) throw new Error('Invalid notifications');
      if (controller.signal.aborted) return;
      if (open) setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch {
      if (!controller.signal.aborted) setError('Notifications could not be loaded. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, [open]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    document.addEventListener('visibilitychange', load);
    window.addEventListener('resize', load);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener('resize', load);
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const groups = useMemo(() => {
    const grouped = new Map<string, NotificationItem[]>();
    for (const item of items) {
      const key = JSON.stringify([item.title, item.body, item.href]);
      grouped.set(key, [...(grouped.get(key) || []), item]);
    }
    return [...grouped.values()];
  }, [items]);

  const positionPanel = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (compact || !rect || window.innerWidth < 1024) { setPanelPosition(undefined); return; }
    const top = Math.min(rect.top, Math.max(12, window.innerHeight - 588));
    setPanelPosition({ left: Math.min(rect.right + 12, window.innerWidth - 396), top, maxHeight: Math.min(576, window.innerHeight - top - 12) });
  }, [compact]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', positionPanel);
    return () => window.removeEventListener('resize', positionPanel);
  }, [open, positionPanel]);

  const markRead = async (body: { id?: string; markAllRead?: boolean }) => {
    if (mutating.current) return false;
    mutating.current = true;
    setSaving(true);
    inFlight.current?.abort();
    inFlight.current = null;
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Read acknowledgement failed');
      setError(null);
      setUnreadCount(count => body.markAllRead ? 0 : Math.max(0, count - 1));
      setItems(current => current.map(item => body.markAllRead || item.id === body.id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
      return true;
    } catch {
      setError('Could not mark notifications as read. Try again.');
      return false;
    } finally {
      mutating.current = false;
      setSaving(false);
      setLoading(false);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.readAt && !await markRead({ id: item.id })) return;
    setOpen(false);
    router.push(item.href);
  };

  const renderItem = (item: NotificationItem) => (
    <button key={item.id} type="button" onClick={() => openNotification(item)} disabled={saving} className={`block w-full border-b border-pf-line px-4 py-3 text-left hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 ${item.readAt ? '' : 'bg-pf-accent-bg/60'}`}>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0"><span className="block text-sm font-semibold text-pf-text">{item.title}</span><span className="mt-1 block text-sm text-pf-muted">{item.body}</span></span>
        <time className="shrink-0 text-xs text-pf-muted" dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}>{relativeTime(item.createdAt)}</time>
      </span>
    </button>
  );

  return (
    <div className={compact ? '' : 'w-full'}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { positionPanel(); if (!open) setLoading(true); setOpen((value) => !value); }}
        aria-label="Notifications"
        aria-expanded={open}
        className={compact
          ? 'relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-[#c4d1c6] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd08a]'
          : 'relative flex min-h-10 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-[#a9bcad] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd08a]'}
      >
        <Bell className="h-4 w-4" />
        {!compact ? <span>Notifications</span> : null}
        {unreadCount > 0 ? (
          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-pf-warning-bg px-1 text-[11px] font-bold text-pf-warning">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? createPortal(
        <>
          <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-[110] cursor-default bg-black/20" />
          <section data-notifications-panel style={panelPosition} className="fixed right-3 top-16 z-[111] flex max-h-[min(36rem,calc(100vh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-pf-line bg-pf-surface shadow-2xl" aria-label="Notifications panel">
            <header className="flex items-center justify-between gap-3 border-b border-pf-line px-4 py-3">
              <div>
                <h2 className="font-semibold text-pf-text">Notifications</h2>
                {unreadCount > 0 && <p className="text-xs text-pf-muted">{unreadCount} unread</p>}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && <button type="button" onClick={() => void markRead({ markAllRead: true })} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-pf-accent hover:bg-pf-accent-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" disabled={saving}>
                  <CheckCheck className="h-4 w-4" /> Mark all read
                </button>}
                <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-muted hover:bg-pf-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            {error && <div role="alert" className="px-4 py-2 text-sm text-pf-danger">{error} <button type="button" onClick={() => void load()} className="font-semibold underline">Retry</button></div>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="flex items-center gap-2 p-4 text-sm text-pf-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>
              ) : items.length === 0 ? (
                <p className="p-6 text-center text-sm text-pf-muted">No notifications yet.</p>
              ) : groups.map((group) => group.length === 1 ? renderItem(group[0]) : (
                <details key={group[0].id} className="border-b border-pf-line">
                  <summary className={`cursor-pointer px-4 py-3 text-sm ${group.some(item => !item.readAt) ? 'bg-pf-accent-bg/60' : ''}`}>
                    <span className="font-semibold text-pf-text">{group[0].title} · {group.length}</span>
                    <span className="mt-1 block text-pf-muted">{group[0].body}</span>
                  </summary>
                  {group.map(item => renderItem(item))}
                </details>
              ))}
            </div>
          </section>
        </>, document.body
      ) : null}
    </div>
  );
}
