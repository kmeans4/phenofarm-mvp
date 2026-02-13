'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavLink {
  name: string;
  href: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
      
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white">
          <nav className="p-4 space-y-1">
            {links.map((link) => (
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
  );
}
