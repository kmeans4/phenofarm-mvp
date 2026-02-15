'use client';

import React;
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';

interface NavLink {
  name: string;
  href: string;
  badge?: number | null;
  badgeComponent?: React.ReactNode;
}

export function ClientNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() || '';
  
  const isActive = (href: string): boolean => {
    // Handle both grower and dispensary paths
    if (href.includes('/dashboard')) {
      return pathname === href || pathname === href.replace('/dashboard', '') || pathname === href.replace('/dispensary/dashboard', '/dispensary');
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
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              active 
                ? 'bg-green-100 text-green-700 font-medium border-l-4 border-green-600' 
                : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <span>{link.name}</span>
            {(link.badge && link.badge > 0) ? (
              <Badge variant="warning" className="ml-2">{link.badge}</Badge>
            ) : link.badgeComponent ? (
              <span className="ml-2">{link.badgeComponent}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
