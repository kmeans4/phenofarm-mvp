'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Badge } from '@/app/components/ui/Badge';
import { Menu, X } from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  group?: string;
  badge?: number | null;
  badgeComponent?: React.ReactNode;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() || '';
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (href: string): boolean => {
    if (href.includes('/dashboard')) {
      return pathname === href || pathname === href.replace('/dashboard', '') || pathname === href.replace('/dispensary/dashboard', '/dispensary');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/sign_in' });
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="dispensary-mobile-menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer from Left */}
      {isOpen && (
        <div
          id="dispensary-mobile-menu"
          className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-green-600">
            <h2 className="text-lg font-bold text-white">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-green-700 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="py-4 flex-1 overflow-y-auto">
            {links.map((link, index) => {
              const active = isActive(link.href);
              const previousLink = links[index - 1];
              const showGroup = (link.group || 'Main') !== (previousLink?.group || 'Main');
              return (
                <div key={link.href}>
                  {showGroup && (
                    <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {link.group || 'Main'}
                    </div>
                  )}
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      active
                        ? 'bg-green-100 text-green-700 font-medium border-l-4 border-green-600'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <span>{link.name}</span>
                    {link.badge && link.badge > 0 && (
                      <Badge variant="warning" className="text-xs px-1.5 py-0">{link.badge}</Badge>
                    )}
                    {link.badgeComponent && !link.badge && (
                      <span className="ml-2">{link.badgeComponent}</span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 mt-auto">
            <div className="px-4 pt-4 pb-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>

            <div className="px-4 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">PhenoFarm Dispensary</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
