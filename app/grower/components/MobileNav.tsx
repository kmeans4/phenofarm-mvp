'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavLink {
  name: string;
  href: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() || '';
  
  const isActive = (href: string): boolean => {
    // Exact match for dashboard, starts with for others
    if (href === '/grower/dashboard') {
      return pathname === href || pathname === '/grower' || pathname === '/grower/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 pt-3 pb-2 gap-1">
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <Link 
            key={link.href}
            href={link.href}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
              active 
                ? 'bg-green-100 text-green-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
