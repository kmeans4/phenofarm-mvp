'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GrowerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (!session) {
    router.push('/auth/sign_in');
    return null;
  }

  const user = session.user as any;
  
  if (user.role !== 'GROWER') {
    router.push('/dashboard');
    return null;
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
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-green-600">PhenoFarm</h1>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation Dropdown - ONLY show when open */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-600"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
