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
              className={`inline-flex min-h-10 items-center px-3 py-1 text-sm rounded-lg whitespace-nowrap ${
                active
                  ? 'bg-pf-accent-bg text-pf-accent font-medium'
                  : 'text-pf-secondary bg-pf-surface hover:bg-pf-accent-bg hover:text-pf-accent'
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
                ? 'bg-pf-accent-bg text-pf-accent font-medium border-l-4 border-pf-accent'
                : 'text-pf-secondary hover:bg-pf-accent-bg hover:text-pf-accent'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
