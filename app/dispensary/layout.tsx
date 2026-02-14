import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNav } from "@/app/dispensary/_components/MobileNav";
import { ClientNav } from "@/app/grower/components/ClientNav";
import { SignOutButton } from "@/app/components/SignOutButton";
import { db } from "@/lib/db";

interface SessionUser {
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

  const user = (session as any).user as SessionUser;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Get pending orders count for badge
  const pendingOrdersCount = user.dispensaryId ? await getPendingOrdersCount(user.dispensaryId) : 0;

  const navLinks = [
    { name: 'Dashboard', href: '/dispensary/dashboard', badge: null },
    { name: 'Catalog', href: '/dispensary/catalog', badge: null },
    { name: 'Orders', href: '/dispensary/orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { name: 'Cart', href: '/dispensary/cart', badge: null },
    { name: 'Settings', href: '/dispensary/settings', badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-green-600">PhenoFarm</h1>
            <SignOutButton />
          </div>
          <MobileNav links={navLinks} />
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-green-600">PhenoFarm</h1>
            <p className="text-sm text-gray-500">Dispensary Portal</p>
          </div>
          
          <ClientNav links={navLinks} />
          
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4 mb-3">
              <p className="text-sm font-medium text-blue-900 mb-1">Membership</p>
              <p className="text-xs text-blue-700">Active until Dec 31, 2024</p>
            </div>
            <SignOutButton variant="sidebar" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-20 lg:pt-0 w-full min-w-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
