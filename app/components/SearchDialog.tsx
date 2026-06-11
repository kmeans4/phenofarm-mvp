'use client';

import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Package, ShoppingCart, Users, Leaf, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';

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

interface SearchDialogProps {
  variant?: 'default' | 'icon';
  className?: string;
}

export function SearchDialog({ variant = 'default', className = '' }: SearchDialogProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const isDispensaryRoute = pathname.startsWith('/dispensary');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    initialFocusRef: inputRef,
    returnFocusRef: triggerRef,
    onEscape: closeDialog,
  });

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
      openDialog();
    }
  }, [openDialog]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close modal on escape
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDialog();
    }
  };

  // Handle result click
  const handleResultClick = (href: string) => {
    closeDialog();
    setQuery('');
    setResults([]);
    router.push(href);
  };

  const getQuickActions = (result: SearchResult) => {
    if (isDispensaryRoute && result.type === 'product') {
      return [
        { label: 'View', href: result.href },
        { label: 'Saved', href: '/dispensary/saved' },
        { label: 'Message', href: result.href },
      ];
    }

    if (isDispensaryRoute && result.type === 'order') {
      return [
        { label: 'View request', href: result.href },
        { label: 'Follow up', href: result.href },
      ];
    }

    if (!isDispensaryRoute && result.type === 'product') {
      return [
        { label: 'Edit listing', href: result.href },
        { label: 'Catalog', href: '/grower/catalog' },
      ];
    }

    if (!isDispensaryRoute && result.type === 'order') {
      return [
        { label: 'View request', href: result.href },
        { label: 'Orders', href: '/grower/orders' },
      ];
    }

    return [{ label: 'Open', href: result.href }];
  };

  const emptySearchLabels = isDispensaryRoute
    ? ['Products', 'Orders', 'Strains']
    : ['Products', 'Orders', 'Customers', 'Strains'];

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-[99999] flex items-start justify-center px-4 pt-[10vh]"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeDialog}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[100000] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onKeyDown={handleModalKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <h2 id={titleId} className="sr-only">Search PhenoFarm</h2>
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder={isDispensaryRoute ? 'Search products, orders, growers...' : 'Search products, orders, customers...'}
              aria-label={isDispensaryRoute ? 'Search products, orders, growers, and strains' : 'Search products, orders, customers, and strains'}
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
            type="button"
            onClick={closeDialog}
            onMouseDown={(event) => event.preventDefault()}
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
                {emptySearchLabels.map((label) => (
                  <span key={label} className="px-2 py-1 text-xs bg-gray-100 rounded">{label}</span>
                ))}
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
                const quickActions = getQuickActions(result);
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleResultClick(result.href)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      className="flex w-full items-start gap-3 text-left"
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
                    <div className="ml-11 mt-2 flex flex-wrap gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={`${result.id}-${action.label}`}
                          type="button"
                          onClick={() => handleResultClick(action.href)}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-green-50 hover:text-green-700 hover:ring-green-200"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
      {variant === 'icon' ? (
        <button
          ref={triggerRef}
          onClick={openDialog}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors ${className}`}
          aria-label="Open search"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={openDialog}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors group ${className}`}
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
      )}

      {/* Modal rendered via portal */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
