'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import { signOut } from 'next-auth/react';

interface NavLink {
  name: string;
  href: string;
  badge?: number | null;
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
      >
        <svg 
          className="w-6 h-6 text-gray-700" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-green-600">
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-green-700 transition-colors"
            aria-label="Close navigation menu"
          >
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="py-4">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link 
                key={link.href}
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
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button at Bottom */}
        <div className="absolute bottom-12 left-0 right-0 px-4">
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">PhenoFarm Dispensary</p>
        </div>
      </div>
    </>
  );
}
