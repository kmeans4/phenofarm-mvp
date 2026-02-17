import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNav } from "@/app/grower/components/MobileNav";
import { ClientNav } from "./components/ClientNav";
import { SignOutButton } from "@/app/components/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Growers', href: '/admin/growers' },
    { name: 'Dispensaries', href: '/admin/dispensaries' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
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
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block flex-shrink-0 h-screen sticky top-0">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-green-600">PhenoFarm</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          
          <ClientNav links={navLinks} />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="bg-green-50 rounded-lg p-4 mb-3">
              <p className="text-sm font-medium text-green-900 mb-1">Admin Access</p>
              <p className="text-xs text-green-700">Full system access</p>
            </div>
            <SignOutButton variant="sidebar" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-20 lg:pt-0 w-full min-w-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
