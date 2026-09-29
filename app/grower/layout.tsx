import { signInDestination } from '@/lib/auth-navigation';
import { MobileTabs } from '@/app/components/ui/MobileTabs';
import { requirePolicyAcceptance } from '@/lib/policies/server';
import { PortalDesktopHeader } from '@/app/components/ui/PortalDesktopHeader';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { Providers } from '@/app/providers';
import { ClientNav } from './components/ClientNav';
import { SearchTrigger } from '@/app/components/SearchDialog';
import { PortalFloatingActions } from '@/app/components/ui/PortalFloatingActions';
import { getGrowerAttentionSummary } from '@/lib/grower-attention';
import { db } from '@/lib/db';
import { PortalAccount, PortalBrand } from '@/app/components/ui/PortalBrand';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';

export default async function GrowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect(await signInDestination());
  }

  await requirePolicyAcceptance(session.user.id);

  const user = session.user as {
    id: string;
    role: string;
    email?: string | null;
    name?: string | null;
    growerId?: string;
    dispensaryId?: string;
  };

  if (user.role === 'GROWER' && !user.growerId)
    redirect('/auth/error?error=Configuration');
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  let attentionSummary: Awaited<
    ReturnType<typeof getGrowerAttentionSummary>
  > | null = null;
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

  const navLinks = [
    { name: 'Overview', href: '/grower/dashboard', group: 'Sell' },
    {
      name: 'Orders',
      href: '/grower/orders',
      group: 'Sell',
      badge: attentionSummary?.counts.pendingRequests || 0,
    },
    { name: 'Customers', href: '/grower/customers', group: 'Sell' },
    { name: 'Reports', href: '/grower/reports', group: 'Sell' },
    { name: 'Products', href: '/grower/products', group: 'Products' },
    { name: 'Strains', href: '/grower/strains', group: 'Products' },
    { name: 'Batches', href: '/grower/batches', group: 'Products' },
    { name: 'Settings', href: '/grower/settings', group: 'Account' },
    { name: 'Plans', href: '/grower/pricing', group: 'Account' },
  ];

  return (
    <Providers session={session as Session}>
      <div className="pf-portal min-h-screen w-full bg-pf-canvas">
        <a className="pf-skip-link" href="#main-content">
          Skip to content
        </a>
        {/* Mobile Header */}
        <div className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-pf-canvas md:hidden">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <PortalBrand portalLabel="Grower" compactOnMobile />
              <div className="flex items-center gap-1.5">
                <SearchTrigger
                  variant="icon"
                  className="!border-pf-line-strong !bg-white/5 !text-[#c4d1c6] hover:!bg-white/10 hover:!text-white"
                />
                <NotificationBell compact />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-screen md:pl-60">
          {/* Tablet/Desktop Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-pf-line bg-pf-canvas px-3 py-5 md:flex">
            <div className="flex-shrink-0 px-1 pb-3">
              <PortalBrand portalLabel="Grower" />
            </div>

            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-2">
              <ClientNav links={navLinks} />
            </div>
            <PortalAccount accountName={accountName} roleLabel="Grower" />
          </aside>

          {/* Main Content */}
          <PortalDesktopHeader accountName={accountName} role="grower" />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex min-h-screen w-full min-w-0 flex-col bg-pf-canvas pt-16 md:pt-0"
          >
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col p-4 pb-40 md:p-6 md:pb-24">
              {children}
            </div>
          </main>
        </div>

        <MobileTabs role="grower" links={navLinks} accountName={accountName} />
        <PortalFloatingActions currentUserId={user.id} role="GROWER" />
      </div>
    </Providers>
  );
}
