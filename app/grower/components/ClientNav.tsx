'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavLink {
  name: string;
  href: string;
}

export function ClientNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() || '';
  
  const isActive = (href: string): boolean => {
    // Exact match for dashboard, starts with for others
    if (href === '/grower/dashboard') {
      return pathname === href || pathname === '/grower' || pathname === '/grower/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="p-4 space-y-1 flex-1">
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <Link 
            key={link.href}
            href={link.href}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              active 
                ? 'bg-green-100 text-green-700 font-medium border-l-4 border-green-600' 
                : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
