import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GrowerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;

  const navLinks = [
    { name: 'Dashboard', href: '/grower' },
    { name: 'Products', href: '/grower/products' },
    { name: 'Orders', href: '/grower/orders' },
    { name: 'Customers', href: '/grower/customers' },
    { name: 'Inventory', href: '/grower/inventory' },
    { name: 'Marketplace', href: '/grower/marketplace' },
    { name: 'Reports', href: '/grower/reports' },
    { name: 'Pricing', href: '/grower/pricing' },
    { name: 'Settings', href: '/grower/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
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

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-green-600">PhenoFarm</h1>
          <Link href="/grower" className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Link>
        </div>
        {/* Mobile Navigation Dropdown */}
        <div className="mt-3 space-y-1">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="block px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-600"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
