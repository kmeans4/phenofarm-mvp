import { unstable_cache } from 'next/cache';
import type { Session } from 'next-auth';
import { redirect } from "next/navigation";
import { getAuthSession } from '@/lib/auth-helpers';
import { Providers } from '@/app/providers';
import { MobileNav } from "@/app/components/ui/MobileNav";
import { ClientNav } from "@/app/grower/components/ClientNav";
import { SearchDialog, SearchTrigger } from "@/app/components/SearchDialog";
import { db } from "@/lib/db";
import CartBadge from "./catalog/components/CartBadge";
import { PortalFloatingActions } from '@/app/components/ui/PortalFloatingActions';
import { PortalAccount, PortalBrand } from '@/app/components/ui/PortalBrand';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';
import { PriceAlertSessionRefresh } from './PriceAlertSessionRefresh';

interface SessionUser {
  id: string;
  role?: string;
  email?: string | null;
  name?: string | null;
  dispensaryId?: string;
}

// The account id participates in the cache key; only the navigation badge may be up to 30s old.
const getPendingOrdersCount = unstable_cache(async (dispensaryId: string) => {
  return db.order.count({ where: { dispensaryId, status: 'PENDING' } });
}, ['dispensary-pending-orders'], { revalidate: 30 });

export default async function DispensaryLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as SessionUser;
  
  if (user.role === 'DISPENSARY' && !user.dispensaryId) redirect('/auth/error?error=Configuration');
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const [pendingOrdersCount, dispensaryProfile] = user.dispensaryId
    ? await Promise.all([
        getPendingOrdersCount(user.dispensaryId),
        db.dispensary.findUnique({
          where: { id: user.dispensaryId },
          select: { businessName: true },
        }),
      ])
    : [0, null];
  const accountName = dispensaryProfile?.businessName || user.email || 'Dispensary account';

  const navLinks = [
    { name: 'Dashboard', href: '/dispensary/dashboard', group: 'Home', badge: null },
    { name: 'Catalog', href: '/dispensary/catalog', group: 'Shop', badge: null },
    { name: 'Request Draft', href: '/dispensary/cart', group: 'Shop', badge: null, badgeComponent: <CartBadge /> },
    { name: 'Orders', href: '/dispensary/orders', group: 'Orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { name: 'Saved', href: '/dispensary/saved', group: 'Saved', badge: null },
    { name: 'Settings', href: '/dispensary/settings', group: 'Account', badge: null },
  ];

  return (
    <Providers session={session as Session}>
      <div className="pf-portal min-h-screen w-full bg-gray-50">
      <PriceAlertSessionRefresh />
      {/* Mobile Header with Hamburger Menu */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-[#16251c] md:hidden">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <PortalBrand portalLabel="Dispensary" compactOnMobile />
            <div className="flex items-center gap-1.5">
              <span id="portal-mobile-messages" className="pf-portal-message-slot h-10 w-10 shrink-0" />
              <SearchTrigger variant="icon" className="!border-white/10 !bg-white/5 !text-[#c4d1c6] hover:!bg-white/10 hover:!text-white" />
              <NotificationBell compact />
              <MobileNav
                links={navLinks}
                portalLabel="Dispensary Portal"
                accountName={accountName}
                roleLabel="Dispensary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen md:pl-60">
        {/* Tablet/Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#16251c] px-4 py-5 md:flex">
          <div className="flex-shrink-0 px-1 pb-3">
            <PortalBrand portalLabel="Dispensary" />
            <div className="mt-3">
              <SearchDialog className="!border-white/10 !bg-white/5 !text-[#a9bcad] hover:!bg-white/10 hover:!text-white [&_kbd]:!border-white/10 [&_kbd]:!bg-white/5" />
            </div>
            <div className="mt-2">
              <NotificationBell />
            </div>
          </div>

          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-2">
            <ClientNav links={navLinks} />
          </div>
          <PortalAccount accountName={accountName} roleLabel="Verified buyer" />
        </aside>

        {/* Main Content */}
        <main className="flex min-h-screen w-full min-w-0 flex-col bg-gray-50 pt-16 md:pt-0">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 pb-24 md:p-7 md:pb-24 lg:p-8 lg:pb-24">
            {children}
          </div>
        </main>
      </div>

      <PortalFloatingActions currentUserId={user.id} role="DISPENSARY" />
      </div>
    </Providers>
  );
}
