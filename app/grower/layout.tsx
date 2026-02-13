import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MobileNav } from "./components/MobileNav";

export default async function GrowerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const navLinks = [
    { name: 'Dashboard', href: '/grower/dashboard' },
    { name: 'Products', href: '/grower/products' },
    { name: 'Orders', href: '/grower/orders' },
    { name: 'Customers', href: '/grower/customers' },
    { name: 'Inventory', href: '/grower/inventory' },
    { name: 'Reports', href: '/grower/reports' },
    { name: 'Settings', href: '/grower/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
      <MobileNav links={navLinks} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block sticky top-0 h-screen">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-green-600">PhenoFarm</h1>
            <p className="text-sm text-gray-500">Grower Portal</p>
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
          
          <div className="p-4 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-1">Subscription</p>
              <p className="text-xs text-green-700">Active until Dec 31, 2024</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 w-full">
          <div className="p-4 lg:p-8 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
