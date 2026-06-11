import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNav } from "@/app/dispensary/_components/MobileNav";
import { ClientNav } from "@/app/grower/components/ClientNav";
import { SearchDialog } from "@/app/components/SearchDialog";
import { db } from "@/lib/db";
import CartBadge from "./catalog/components/CartBadge";
import { ChatDrawer } from "@/app/components/messaging/ChatDrawer";
import { RecentActivityDrawer } from "@/app/components/ux/RecentActivityDrawer";

interface SessionUser {
  id: string;
  role?: string;
  dispensaryId?: string;
}

// Fetch pending orders count for notification badge
async function getPendingOrdersCount(dispensaryId: string): Promise<number> {
  try {
    return await db.order.count({
      where: {
        dispensaryId,
        status: 'PENDING',
      },
    });
  } catch {
    return 0;
  }
}

export default async function DispensaryLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as SessionUser;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Get pending orders count for badge
  const pendingOrdersCount = user.dispensaryId ? await getPendingOrdersCount(user.dispensaryId) : 0;

  const navLinks = [
    { name: 'Dashboard', href: '/dispensary/dashboard', group: 'Home', badge: null },
    { name: 'Catalog', href: '/dispensary/catalog', group: 'Shop', badge: null },
    { name: 'Request Draft', href: '/dispensary/cart', group: 'Shop', badge: null, badgeComponent: <CartBadge /> },
    { name: 'Orders', href: '/dispensary/orders', group: 'Orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { name: 'Saved', href: '/dispensary/saved', group: 'Saved', badge: null },
    { name: 'Settings', href: '/dispensary/settings', group: 'Account', badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold text-green-600" aria-label="PhenoFarm dispensary portal">PhenoFarm</div>
            <div className="flex items-center gap-2">
              <SearchDialog variant="icon" />
              <MobileNav links={navLinks} />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen md:pl-56 lg:pl-64">
        {/* Tablet/Desktop Sidebar */}
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-56 lg:w-64 md:flex-col md:bg-white md:border-r md:border-gray-200">
          <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
            <div className="text-xl font-bold text-green-600" aria-label="PhenoFarm dispensary portal">PhenoFarm</div>
            <p className="text-sm text-gray-500">Dispensary Portal</p>
            <div className="mt-3">
              <SearchDialog />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            <ClientNav links={navLinks} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex min-h-screen flex-col pt-20 md:pt-0 w-full min-w-0 bg-gray-50">
          <div className="flex flex-1 flex-col p-4 md:p-5 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <ChatDrawer
        currentUserId={user.id}
        currentRole="DISPENSARY"
      />
      <RecentActivityDrawer role="DISPENSARY" />
    </div>
  );
}
