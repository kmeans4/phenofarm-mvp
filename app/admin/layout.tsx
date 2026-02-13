import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/app/components/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Growers', href: '/admin/growers' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-green-600">PhenoFarm Admin</h1>
            <SignOutButton />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="px-3 py-1 text-sm text-gray-700 rounded-full bg-gray-100 hover:bg-green-50 hover:text-green-600 whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block sticky top-0 h-screen">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-green-600">PhenoFarm</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200 mt-auto">
            <SignOutButton variant="sidebar" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-24 lg:pt-0 w-full">
          <div className="p-4 lg:p-8 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
