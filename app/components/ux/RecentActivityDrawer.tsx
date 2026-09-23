'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';
import { usePathname } from 'next/navigation';
import { Clock3, X } from 'lucide-react';
import { RECENT_ACTIVITY_STORAGE_KEY } from '@/lib/ux-workflow';

interface RecentActivityDrawerProps {
  role: 'GROWER' | 'DISPENSARY';
}

interface RecentActivityItem {
  href: string;
  label: string;
  visitedAt: string;
  role: 'GROWER' | 'DISPENSARY';
  pageKey?: string;
}

const labelByPath: Array<[string, string]> = [
  ['/grower/dashboard', 'Dashboard'],
  ['/grower/products/add', 'Add product'],
  ['/grower/products', 'Products'],
  ['/grower/inventory', 'Inventory'],
  ['/grower/batches', 'Batches'],
  ['/grower/strains', 'Strains'],
  ['/grower/customers', 'Customers'],
  ['/grower/catalog', 'Catalog'],
  ['/grower/orders', 'Requests'],
  ['/grower/pricing', 'Plans'],
  ['/grower/reports', 'Reports'],
  ['/grower/settings', 'Settings'],
  ['/dispensary/dashboard', 'Dashboard'],
  ['/dispensary/catalog', 'Catalog'],
  ['/dispensary/cart', 'Request draft'],
  ['/dispensary/orders', 'Orders'],
  ['/dispensary/saved', 'Saved'],
  ['/dispensary/favorites', 'Favorites'],
  ['/dispensary/price-alerts', 'Price alerts'],
  ['/dispensary/settings', 'Settings'],
];

const MAX_RECENT_ENTRIES = 8;

interface PageMeta {
  href: string;
  label: string;
  pageKey: string;
}

function normalizePath(pathname: string) {
  const [path] = pathname.split('?');
  return path.replace(/\/$/, '') || pathname;
}

function getPageMeta(pathname: string): PageMeta {
  const normalizedPath = normalizePath(pathname);
  if (/^\/dispensary\/grower\/[^/]+$/.test(normalizedPath)) return { href: normalizedPath, label: 'Grower shop', pageKey: normalizedPath };
  const match = labelByPath
    .filter(([path]) => normalizedPath === path || normalizedPath.startsWith(`${path}/`))
    .sort(([a], [b]) => b.length - a.length)[0];

  if (match) {
    return {
      href: normalizedPath,
      label: match[1],
      pageKey: match[0],
    };
  }

  const segment = normalizedPath.split('/').filter(Boolean).pop() || 'Dashboard';
  const label = segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    href: normalizedPath,
    label,
    pageKey: normalizedPath,
  };
}

function getTimestamp(item: RecentActivityItem) {
  const timestamp = Date.parse(item.visitedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dedupeRecentItems(items: RecentActivityItem[]) {
  const byPage = new Map<string, RecentActivityItem>();

  items.forEach((item) => {
    if (!item || typeof item !== 'object' || typeof item.href !== 'string' || !safeInternalPath(item.href, '') || typeof item.visitedAt !== 'string' || !Number.isFinite(Date.parse(item.visitedAt)) || (item.role !== 'GROWER' && item.role !== 'DISPENSARY')) return;

    const href = normalizePath(item.href);
    const meta = getPageMeta(typeof item.pageKey === 'string' && safeInternalPath(item.pageKey, '') ? item.pageKey : href);
    const normalized: RecentActivityItem = {
      href,
      label: href.startsWith('/dispensary/grower/') && typeof item.label === 'string' && item.label !== href.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ? item.label : meta.label,
      pageKey: meta.pageKey,
      role: item.role,
      visitedAt: item.visitedAt,
    };
    const key = `${normalized.role}:${normalized.pageKey}`;
    const existing = byPage.get(key);

    if (!existing || getTimestamp(normalized) > getTimestamp(existing)) {
      byPage.set(key, normalized);
    }
  });

  const byRole = Array.from(byPage.values()).reduce<Record<RecentActivityItem['role'], RecentActivityItem[]>>(
    (acc, item) => {
      acc[item.role].push(item);
      return acc;
    },
    { GROWER: [], DISPENSARY: [] }
  );

  return (Object.keys(byRole) as RecentActivityItem['role'][])
    .flatMap((itemRole) =>
      byRole[itemRole]
        .sort((a, b) => getTimestamp(b) - getTimestamp(a))
        .slice(0, MAX_RECENT_ENTRIES)
    )
    .sort((a, b) => getTimestamp(b) - getTimestamp(a));
}

function readRecentItems(storageKey: string): RecentActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? dedupeRecentItems(parsed as RecentActivityItem[]) : [];
  } catch {
    return [];
  }
}

function formatRelativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return 'just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function RecentActivityDrawer({ role }: RecentActivityDrawerProps) {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const storageKey = `${RECENT_ACTIVITY_STORAGE_KEY}:${session?.user?.id || 'anonymous'}`;
  const drawerId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    if (!pathname || pathname.includes('/auth/')) return;

    const meta = getPageMeta(pathname);
    const nextItem: RecentActivityItem = {
      href: meta.href,
      label: pathname.startsWith('/dispensary/grower/') ? document.querySelector('main h1')?.textContent?.trim() || meta.label : meta.label,
      pageKey: meta.pageKey,
      visitedAt: new Date().toISOString(),
      role,
    };
    const next = dedupeRecentItems([nextItem, ...readRecentItems(storageKey)]);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Recent activity is optional. */ }
    const timer = window.setTimeout(() => setItems(next), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, role, storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setItems(readRecentItems(storageKey)), 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const roleItems = useMemo(
    () => dedupeRecentItems(items).filter((item) => item.role === role).slice(0, MAX_RECENT_ENTRIES),
    [items, role],
  );

  const clearRoleItems = () => {
    const remaining = readRecentItems(storageKey).filter((item) => item.role !== role);
    try { window.localStorage.setItem(storageKey, JSON.stringify(remaining)); } catch { /* Recent activity is optional. */ }
    setItems(remaining);
  };

  return (
    <div className="relative hidden sm:block">
      {open && (
        <div
          id={drawerId}
          className="absolute bottom-14 right-0 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Recently used</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearRoleItems}
                disabled={roleItems.length === 0}
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                aria-label="Close recent activity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {roleItems.length > 0 ? (
              roleItems.map((item) => {
                const relativeTime = formatRelativeTime(item.visitedAt);

                return (
                  <Link
                    key={`${item.role}-${item.pageKey || item.href}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-label={`${item.label}${relativeTime ? `, ${relativeTime}` : ''}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    <span className="min-w-0 truncate font-medium">{item.label}</span>
                    <time dateTime={item.visitedAt} className="shrink-0 text-xs text-gray-400">
                      {relativeTime}
                    </time>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500">
                Recent pages will appear here as you move through the portal.
              </p>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open recent activity"
        aria-controls={drawerId}
        aria-expanded={open}
        className="pf-portal-fab-trigger flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition-[opacity,background-color] duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        title="Recent activity"
      >
        <Clock3 className="h-5 w-5" />
      </button>
    </div>
  );
}
