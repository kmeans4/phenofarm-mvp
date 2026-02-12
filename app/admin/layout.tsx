import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    { name: 'Users', href: '/admin/users' },
    { name: 'Growers', href: '/admin/growers' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
