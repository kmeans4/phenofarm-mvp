import { PortalDesktopHeader } from '@/app/components/ui/PortalDesktopHeader';
import type { Session } from 'next-auth';
import { redirect } from "next/navigation";
import { getAuthSession } from '@/lib/auth-helpers';
import { Providers } from '@/app/providers';
import { MobileNav } from "@/app/components/ui/MobileNav";
import { ClientNav } from "@/app/grower/components/ClientNav";
import { PortalAccount, PortalBrand } from '@/app/components/ui/PortalBrand';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session?.user as { id: string; role: string; email?: string | null; name?: string | null } | undefined;
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  const accountName = user.name || user.email || 'PhenoFarm admin';

  const navLinks = [
    { name: 'Overview', href: '/admin/dashboard', group: 'Operations' },
    { name: 'Users', href: '/admin/users', group: 'Accounts' },
    { name: 'Growers', href: '/admin/growers', group: 'Accounts' },
    { name: 'Dispensaries', href: '/admin/dispensaries', group: 'Accounts' },
    { name: 'Settings', href: '/admin/settings', group: 'System' },
  ];

  return (
    <Providers session={session as Session}>
      <div className="pf-portal min-h-screen w-full bg-pf-canvas">
      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-pf-canvas lg:hidden">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <PortalBrand portalLabel="Admin" />
            <div className="flex items-center gap-2">
              <NotificationBell compact />
              <MobileNav
                links={navLinks}
                portalLabel="Admin Panel"
                accountName={accountName}
                roleLabel="Admin"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-pf-line bg-pf-canvas px-3 py-5 lg:flex">
          <div className="flex-shrink-0 px-1 pb-4">
            <PortalBrand portalLabel="Admin" />

          </div>

          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-2">
            <ClientNav links={navLinks} />
          </div>
          <PortalAccount accountName={accountName} roleLabel="Full system access" />
        </aside>

        {/* Main Content */}
        <main className="w-full min-w-0 flex-1 pt-16 lg:pt-0">
          <PortalDesktopHeader accountName={accountName} role="admin" />
          <div className="mx-auto max-w-[1440px] p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
      </div>
    </Providers>
  );
}
