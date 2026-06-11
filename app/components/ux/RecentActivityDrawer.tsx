'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RECENT_ACTIVITY_STORAGE_KEY } from '@/lib/ux-workflow';

interface RecentActivityDrawerProps {
  role: 'GROWER' | 'DISPENSARY';
}

interface RecentActivityItem {
  href: string;
  label: string;
  visitedAt: string;
  role: 'GROWER' | 'DISPENSARY';
}

const labelByPath: Array<[string, string]> = [
  ['/grower/products/add', 'Add product'],
  ['/grower/products', 'Products'],
  ['/grower/catalog', 'Catalog workspace'],
  ['/grower/orders', 'Grower orders'],
  ['/grower/settings', 'Grower settings'],
  ['/dispensary/catalog', 'Catalog'],
  ['/dispensary/cart', 'Request draft'],
  ['/dispensary/orders', 'Orders'],
  ['/dispensary/saved', 'Saved workspace'],
  ['/dispensary/settings', 'Dispensary settings'],
];

const fallbackLinks = {
  GROWER: [
    { href: '/grower/dashboard', label: 'Dashboard' },
    { href: '/grower/products', label: 'Products' },
    { href: '/grower/orders', label: 'Orders' },
  ],
  DISPENSARY: [
    { href: '/dispensary/dashboard', label: 'Dashboard' },
    { href: '/dispensary/catalog', label: 'Catalog' },
    { href: '/dispensary/cart', label: 'Request draft' },
  ],
};

function getLabel(pathname: string) {
  const match = labelByPath.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  if (match) return match[1];

  const segment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readRecentItems(): RecentActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_ACTIVITY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function RecentActivityDrawer({ role }: RecentActivityDrawerProps) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    if (!pathname || pathname.includes('/auth/')) return;

    const nextItem: RecentActivityItem = {
      href: pathname,
      label: getLabel(pathname),
      visitedAt: new Date().toISOString(),
      role,
    };
    const existing = readRecentItems().filter((item) => item.href !== pathname);
    const next = [nextItem, ...existing].slice(0, 12);
    window.localStorage.setItem(RECENT_ACTIVITY_STORAGE_KEY, JSON.stringify(next));
    const timer = window.setTimeout(() => setItems(next), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, role]);

  useEffect(() => {
    const timer = window.setTimeout(() => setItems(readRecentItems()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const roleItems = useMemo(
    () => items.filter((item) => item.role === role).slice(0, 6),
    [items, role],
  );

  const links = roleItems.length > 0 ? roleItems : fallbackLinks[role].map((item) => ({
    ...item,
    role,
    visitedAt: '',
  }));

  return (
    <div className="fixed bottom-5 left-5 z-[65] hidden sm:block">
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Recently used</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                <span className="font-medium">{item.label}</span>
                {item.visitedAt && (
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(item.visitedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-lg hover:bg-gray-50"
      >
        Recent
      </button>
    </div>
  );
}
