'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import { Menu, X } from 'lucide-react';

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

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Drawer from Left */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
            <X className="w-5 h-5 text-white" />
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">PhenoFarm Dispensary</p>
        </div>
      </div>
    </>
  );
}
