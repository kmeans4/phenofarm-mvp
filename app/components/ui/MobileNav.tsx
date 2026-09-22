'use client';

import type { ReactNode } from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSignOut } from '@/app/hooks/useSignOut';
import { LogOut, Menu, X } from 'lucide-react';
import { Badge } from '@/app/components/ui/Badge';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

export interface MobileNavLink {
  name: string;
  href: string;
  group?: string;
  badge?: number | null;
  badgeComponent?: ReactNode;
}

interface MobileNavProps {
  links: MobileNavLink[];
  portalLabel: string;
  accountName?: string | null;
  roleLabel?: string;
}

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/$/, '');
  return normalized || '/';
}

function isActiveRoute(pathname: string, href: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);

  if (target.endsWith('/dashboard')) {
    const portalRoot = target.replace(/\/dashboard$/, '');
    return current === target || current === portalRoot || current.startsWith(`${target}/`);
  }

  return current === target || current.startsWith(`${target}/`);
}

export function MobileNav({ links, portalLabel, accountName, roleLabel = portalLabel }: MobileNavProps) {
  const pathname = usePathname() || '';
  const titleId = useId();
  const drawerId = useId();
  const [openState, setOpenState] = useState(false);
  const [openedPathname, setOpenedPathname] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasGroups = links.length > 7 && links.some((link) => Boolean(link.group));
  const isOpen = openState && openedPathname === pathname;

  const closeMenu = useCallback(() => {
    setOpenState(false);
  }, []);

  const openMenu = () => {
    setOpenedPathname(pathname);
    setOpenState(true);
  };

  useFocusTrap({
    active: isOpen,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: menuButtonRef,
    onEscape: closeMenu,
  });
  useBodyOverlay(isOpen);

  const { handleSignOut, isSigningOut } = useSignOut();

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={openMenu}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-[#c4d1c6] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd08a]"
        aria-label={`Open ${portalLabel} navigation menu`}
        aria-expanded={isOpen}
        aria-controls={drawerId}
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/50"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />

          <div
            id={drawerId}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-80 max-w-[calc(100vw-2rem)] flex-col bg-[#16251c] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-white">
                  Menu
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#c4d1c6] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd08a]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label={`${portalLabel} navigation`}>
              {links.map((link, index) => {
                const active = isActiveRoute(pathname, link.href);
                const previousLink = links[index - 1];
                const group = link.group || 'Main';
                const previousGroup = previousLink?.group || 'Main';
                const showGroup = hasGroups && group !== previousGroup;

                return (
                  <div key={link.href}>
                    {showGroup && (
                      <div className="font-metadata px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7d947f]">
                        {group}
                      </div>
                    )}
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                        active
                          ? 'bg-[#294c39] font-semibold text-[#f2f5ee] shadow-[inset_3px_0_0_#6fd08a]'
                          : 'text-[#a9bcad] hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span className="min-w-0 truncate">{link.name}</span>
                      {link.badge && link.badge > 0 ? (
                        <Badge variant="warning" className="shrink-0 px-1.5 py-0 text-xs">
                          {link.badge}
                        </Badge>
                      ) : link.badgeComponent ? (
                        <span className="shrink-0">{link.badgeComponent}</span>
                      ) : null}
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-white/[0.07] px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              <div className="mb-1 rounded-lg bg-white/[0.05] px-3 py-2">
                <p className="truncate text-sm font-semibold text-[#e3ebe3]">{accountName || 'PhenoFarm account'}</p>
                <p className="text-xs font-medium text-[#7d947f]">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-[#d98b7a] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98b7a]"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
