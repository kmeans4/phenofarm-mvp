'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavLink {
  name: string;
  href: string;
}

interface ClientNavProps {
  links: NavLink[];
  mobile?: boolean;
}

export function ClientNav({ links, mobile = false }: ClientNavProps) {
  const pathname = usePathname() || '';
  
  const isActive = (href: string): boolean => {
    // Handle /admin/dashboard specially (exact match like grower/dispensary)
    if (href === '/admin/dashboard') {
      return pathname === href || pathname === '/admin/dashboard/';
    }
    // Exact match for root /admin
    if (href === '/admin') {
      return pathname === href || pathname === '/admin/' || pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (mobile) {
    return (
      <>
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                active 
                  ? 'bg-green-600 text-white font-medium' 
                  : 'text-gray-700 bg-gray-100 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </>
    );
  }

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
