import type { Session } from 'next-auth';
import { redirect } from "next/navigation";
import { getAuthSession } from '@/lib/auth-helpers';
import { Providers } from '@/app/providers';
import { MobileNav } from "@/app/components/ui/MobileNav";
import { ClientNav } from "./components/ClientNav";
import { SearchDialog, SearchTrigger } from "@/app/components/SearchDialog";
import { PortalFloatingActions } from '@/app/components/ui/PortalFloatingActions';
import { getGrowerAttentionSummary } from "@/lib/grower-attention";
import { db } from "@/lib/db";
import { PortalAccount, PortalBrand } from '@/app/components/ui/PortalBrand';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';

export default async function GrowerLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as {
    id: string;
    role: string;
    email?: string | null;
    name?: string | null;
    growerId?: string;
    dispensaryId?: string;
  };
  
  if (user.role === 'GROWER' && !user.growerId) redirect('/auth/error?error=Configuration');
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  let attentionSummary: Awaited<ReturnType<typeof getGrowerAttentionSummary>> | null = null;
  let accountName = user.email || 'Grower account';

  if (user.growerId) {
    const [summary, growerProfile] = await Promise.all([
      getGrowerAttentionSummary({ growerId: user.growerId, userId: user.id }),
      db.grower.findUnique({
        where: { id: user.growerId },
        select: { businessName: true },
      }),
    ]);

    attentionSummary = summary;
    accountName = growerProfile?.businessName || accountName;
  }
  const requestAttention = attentionSummary?.counts.requestAttention || 0;

  const navLinks = [
    { name: 'Dashboard', href: '/grower/dashboard', group: 'Sell' },
    { name: 'Catalog', href: '/grower/catalog', group: 'Sell' },
    { name: 'Products', href: '/grower/products', group: 'Sell' },
    { name: 'Inventory', href: '/grower/inventory', group: 'Sell' },
    { name: 'Requests', href: '/grower/orders', group: 'Sell', badge: requestAttention },
    { name: 'Strains', href: '/grower/strains', group: 'Grow' },
    { name: 'Batches', href: '/grower/batches', group: 'Grow' },
    { name: 'Customers', href: '/grower/customers', group: 'Grow' },
    { name: 'Reports', href: '/grower/reports', group: 'Grow' },
    { name: 'Settings', href: '/grower/settings', group: 'Account' },
  ];

  return (
    <Providers session={session as Session}>
      <div className="pf-portal min-h-screen w-full bg-gray-50">
      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-[#16251c] md:hidden">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <PortalBrand portalLabel="Grower" compactOnMobile />
            <div className="flex items-center gap-1.5">
              <span id="portal-mobile-messages" className="pf-portal-message-slot h-10 w-10 shrink-0" />
              <SearchTrigger variant="icon" className="!border-white/10 !bg-white/5 !text-[#c4d1c6] hover:!bg-white/10 hover:!text-white" />
              <NotificationBell compact />
              <MobileNav
                links={navLinks}
                portalLabel="Grower"
                accountName={accountName}
                roleLabel="Grower"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen md:pl-60">
        {/* Tablet/Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#16251c] px-4 py-5 md:flex">
          <div className="flex-shrink-0 px-1 pb-3">
            <PortalBrand portalLabel="Grower" />
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
          <PortalAccount accountName={accountName} roleLabel="Grower account" />
        </aside>

        {/* Main Content */}
        <main className="flex min-h-screen w-full min-w-0 flex-col bg-gray-50 pt-16 md:pt-0">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 pb-24 md:p-7 md:pb-24 lg:p-8 lg:pb-24">
            {children}
          </div>
        </main>
      </div>

      <PortalFloatingActions currentUserId={user.id} role="GROWER" />
      </div>
    </Providers>
  );
}
