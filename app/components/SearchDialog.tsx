'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'strain';
  title: string;
  subtitle?: string;
}

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 flex items-start justify-center pt-[10vh] px-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ zIndex: 100000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 rounded">
              ESC
            </kbd>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto">
          <div className="px-4 py-8 text-center text-gray-400">
            <p className="text-sm">Start typing to search...</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">Products</span>
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">Orders</span>
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">Customers</span>
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">Strains</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
          <span>0 results</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors group"
        aria-label="Open search"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span className="text-sm">Search...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded text-gray-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal rendered via portal to document.body */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
