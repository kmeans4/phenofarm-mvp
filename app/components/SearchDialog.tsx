'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Package, ShoppingCart, Users, Leaf, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'strain';
  title: string;
  subtitle?: string;
  href: string;
}

const typeIcons = {
  product: Package,
  order: ShoppingCart,
  customer: Users,
  strain: Leaf,
};

const typeLabels = {
  product: 'Product',
  order: 'Order',
  customer: 'Customer',
  strain: 'Strain',
};

export function SearchDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch search results
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 200);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close modal on escape
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Handle result click
  const handleResultClick = (href: string) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  };

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
        onKeyDown={handleModalKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
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
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : query.length < 2 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <p className="text-sm">Start typing to search...</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">Products</span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">Orders</span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">Customers</span>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">Strains</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result.href)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.subtitle}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-400 capitalize">
                        {typeLabels[result.type]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
          <span>{results.length} results</span>
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

      {/* Modal rendered via portal */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
