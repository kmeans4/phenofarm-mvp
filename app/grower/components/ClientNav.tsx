'use client';

import type React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/Badge';
import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  Gauge,
  LayoutGrid,
  Leaf,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  group?: string;
  badge?: number | null;
  badgeComponent?: React.ReactNode;
}

const iconBySegment: Record<string, LucideIcon> = {
  dashboard: Gauge,
  catalog: LayoutGrid,
  marketplace: ShoppingBag,
  products: Package,
  inventory: Boxes,
  orders: ShoppingCart,
  reports: BarChart3,
  strains: Leaf,
  batches: Sprout,
  customers: Users,
  pricing: CreditCard,
  settings: Settings,
  users: Users,
  growers: Sprout,
  dispensaries: Building2,
  admin: SlidersHorizontal,
  saved: Leaf,
  cart: ShoppingCart,
};

function getLinkIcon(href: string): LucideIcon {
  const segment = href.split('/').filter(Boolean).pop() || 'dashboard';
  return iconBySegment[segment] || LayoutGrid;
}

export function ClientNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname() || '';
  const hasGroups = links.length > 7 && links.some((link) => Boolean(link.group));
  
  const isActive = (href: string): boolean => {
    // Handle both grower and dispensary paths
    if (href.includes('/dashboard')) {
      return pathname === href || pathname === href.replace('/dashboard', '') || pathname === href.replace('/dispensary/dashboard', '/dispensary');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="space-y-1 px-3 py-3" aria-label="Portal navigation">
      {links.map((link, index) => {
        const active = isActive(link.href);
        const Icon = getLinkIcon(link.href);
        const previousGroup = links[index - 1]?.group;
        const showGroup = hasGroups && link.group && link.group !== previousGroup;
        return (
          <div key={link.href}>
            {showGroup ? (
              <div className="font-metadata px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#5f7562] first:pt-0">
                {link.group}
              </div>
            ) : null}
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-9 items-center justify-between rounded-[9px] px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd08a] ${
                active
                  ? 'bg-[#294c39] font-semibold text-[#f2f5ee] shadow-[inset_3px_0_0_#6fd08a]'
                  : 'text-[#a9bcad] hover:bg-white/[0.06] hover:text-[#f2f5ee]'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{link.name}</span>
              </span>
              {(link.badge && link.badge > 0) ? (
                <Badge variant="warning" className="ml-2 shrink-0 border-0 bg-[#e0c07a] px-2 py-0 text-[10px] text-[#3a2c08]">
                  {link.badge}
                </Badge>
              ) : link.badgeComponent ? (
                <span className="ml-2 shrink-0">{link.badgeComponent}</span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
