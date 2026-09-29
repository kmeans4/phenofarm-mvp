'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  ShoppingCart,
  ListOrdered,
  MessageSquare,
} from 'lucide-react';
import { MobileNav, type MobileNavLink } from './MobileNav';

export function MobileTabs({
  role,
  links,
  accountName,
}: {
  role: 'grower' | 'dispensary';
  links: MobileNavLink[];
  accountName: string;
}) {
  const pathname = usePathname();
  const tabs =
    role === 'grower'
      ? [
          { name: 'Overview', path: 'dashboard', icon: Home },
          { name: 'Orders', path: 'orders', icon: ListOrdered },
          { name: 'Products', path: 'products', icon: Package },
        ]
      : [
          { name: 'Catalog', path: 'catalog', icon: Package },
          { name: 'Cart', path: 'cart', icon: ShoppingCart },
          { name: 'Orders', path: 'orders', icon: ListOrdered },
        ];
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid min-h-16 grid-cols-5 border-t border-pf-line bg-pf-canvas px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map(({ name, path, icon: Icon }) => {
        const href = `/${role}/${path}`;
        const active = pathname.startsWith(href);
        const link = links.find((link) => link.href === href);
        return (
          <Link
            key={path}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-sm ${active ? 'text-pf-accent' : 'text-pf-secondary'}`}
          >
            <Icon aria-hidden className="h-5 w-5" />
            <span>{name}</span>
            {Boolean(link?.badge) && (
              <span className="absolute right-1 top-1 rounded-full bg-pf-warning-bg px-1 text-[13px] text-pf-warning">
                {link?.badge}
              </span>
            )}
            {link?.badgeComponent && (
              <span className="absolute right-1 top-1">
                {link.badgeComponent}
              </span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new CustomEvent('phenofarm-open-chat'))
        }
        className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm text-pf-secondary"
      >
        <MessageSquare aria-hidden className="h-5 w-5" />
        <span>Messages</span>
      </button>
      <MobileNav
        links={links}
        portalLabel={role === 'grower' ? 'Grower' : 'Dispensary'}
        accountName={accountName}
        tab
      />
    </nav>
  );
}
