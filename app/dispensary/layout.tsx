import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { MobileNav } from "@/app/grower/components/MobileNav";
import { ClientNav } from "@/app/grower/components/ClientNav";
import { SignOutButton } from "@/app/components/SignOutButton";

export default async function DispensaryLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dispensary/dashboard' },
    { name: 'Catalog', href: '/dispensary/catalog' },
    { name: 'Orders', href: '/dispensary/orders' },
    { name: 'Cart', href: '/dispensary/cart' },
    { name: 'Settings', href: '/dispensary/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
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
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block sticky top-0 h-screen flex flex-col">
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
        <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 w-full">
          <div className="p-4 lg:p-8 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
