'use client';

import { useState, useEffect, useCallback, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  Bookmark,
  FileText,
  Grid2X2,
  Leaf,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  Search,
  ShoppingCart,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useSession } from 'next-auth/react';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

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
  order: 'Request',
  customer: 'Customer',
  strain: 'Strain',
};

interface SearchDialogProps {
  variant?: 'default' | 'icon';
  className?: string;
}

interface SearchOpenEventDetail {
  trigger?: HTMLButtonElement | null;
}

interface SearchAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const RECENT_QUERY_LIMIT = 5;

export function SearchDialog({ variant = 'default', className = '' }: SearchDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname() || '';
  const isDispensaryRoute = pathname.startsWith('/dispensary');
  const isAdminRoute = pathname.startsWith('/admin');
  const roleKey = isAdminRoute ? 'admin' : isDispensaryRoute ? 'dispensary' : 'grower';
  const recentQueriesStorageKey = `phenofarm:search:${session?.user?.id || "anonymous"}:${roleKey}:recent-queries`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const titleId = useId();
  const resultsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openDialog = useCallback((trigger?: HTMLButtonElement | null) => {
    returnFocusRef.current = trigger?.getClientRects().length ? trigger : null;
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    initialFocusRef: inputRef,
    returnFocusRef,
    onEscape: closeDialog,
  });
  useBodyOverlay(isOpen);

  useEffect(() => {
    if (!mounted) return;

    try {
      const stored = window.localStorage.getItem(recentQueriesStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setRecentQueries(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, RECENT_QUERY_LIMIT) : []);
    } catch {
      setRecentQueries([]);
    }
  }, [mounted, recentQueriesStorageKey]);

  const rememberQuery = useCallback((value: string) => {
    const trimmed = value.trim();

    if (trimmed.length < 2) return;

    setRecentQueries((current) => {
      const next = [
        trimmed,
        ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, RECENT_QUERY_LIMIT);

      try {
        window.localStorage.setItem(recentQueriesStorageKey, JSON.stringify(next));
      } catch {
        // Ignore storage failures; search still works without recents.
      }

      return next;
    });
  }, [recentQueriesStorageKey]);

  // Fetch search results
  useEffect(() => {
    if (!isOpen) return;
    const trimmedQuery = query.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setSearchError('');
    setResults([]);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data.results)) throw new Error('Invalid search response');
        setResults(data.results.filter((result: SearchResult) => result && typeof result.id === 'string' && typeof result.title === 'string' && Object.hasOwn(typeIcons, result.type) && safeInternalPath(result.href, '')));
        rememberQuery(trimmedQuery);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setSearchError('Search is temporarily unavailable. Please try again.');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      controller.abort();
    };
  }, [isOpen, query, rememberQuery]);

  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  useEffect(() => {
    if (activeIndex < 0) return;

    resultRefs.current[activeIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.defaultPrevented && (e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openDialog(null);
    }
  }, [openDialog]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const openFromTrigger = (event: Event) => {
      const detail = (event as CustomEvent<SearchOpenEventDetail>).detail;
      openDialog(detail?.trigger || null);
    };
    window.addEventListener('phenofarm:open-search', openFromTrigger);
    return () => { document.removeEventListener('keydown', handleKeyDown); window.removeEventListener('phenofarm:open-search', openFromTrigger); };
  }, [handleKeyDown, openDialog]);

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      const target = e.target;

      if (target instanceof HTMLElement && target.closest('button, a')) {
        return;
      }

      e.preventDefault();
      handleResultClick(results[activeIndex].href);
    }
  };

  // Handle result click
  const handleResultClick = useCallback((href: string) => {
    const safeHref = safeInternalPath(href, '');
    if (!safeHref) return;
    rememberQuery(query);
    closeDialog();
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    router.push(safeHref);
  }, [closeDialog, query, rememberQuery, router]);

  const getQuickActions = (result: SearchResult): SearchAction[] => {
    if (isDispensaryRoute && result.type === 'product') {
      return [
        { label: 'View', href: result.href, icon: ArrowUpRight },
        { label: 'Saved', href: '/dispensary/saved', icon: Bookmark },
        { label: 'Message', href: result.href, icon: MessageSquare },
      ];
    }

    if (isDispensaryRoute && result.type === 'order') {
      return [
        { label: 'View request', href: result.href, icon: FileText },
        { label: 'Follow up', href: result.href, icon: MessageSquare },
      ];
    }

    if (!isDispensaryRoute && result.type === 'product') {
      return [
        { label: 'Edit listing', href: result.href, icon: Pencil },
        { label: 'Catalog', href: '/grower/catalog', icon: Grid2X2 },
      ];
    }

    if (!isDispensaryRoute && result.type === 'order') {
      return [
        { label: 'View request', href: result.href, icon: FileText },
        { label: 'Requests', href: '/grower/orders', icon: ShoppingCart },
      ];
    }

    return [{ label: 'Open', href: result.href, icon: ArrowUpRight }];
  };



  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-[99999] flex items-stretch justify-center p-0 sm:items-start sm:px-4 sm:pt-[10vh]"
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
        className="relative z-[100000] flex h-full w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-w-2xl sm:rounded-xl"
        onKeyDown={handleModalKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 id={titleId} className="sr-only">Search PhenoFarm</h2>
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search PhenoFarm"
              aria-label={isDispensaryRoute ? 'Search products, requests, growers, and strains' : 'Search products, requests, customers, and strains'}
              aria-controls={resultsId}
              aria-activedescendant={activeIndex >= 0 ? `${resultsId}-result-${activeIndex}` : undefined}
              className="flex-1 rounded-md min-w-0 px-1 py-1 text-base sm:text-lg outline-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
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
            className="ml-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results Area */}
        <div id={resultsId} className="min-h-0 flex-1 overflow-y-auto sm:max-h-96 sm:flex-none">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-4 py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : searchError ? (<p role="alert" className="px-4 py-8 text-sm text-red-700">{searchError}</p>) : query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">{query.trim().length === 0 ? 'Products, requests, businesses and strains' : 'Type at least 2 characters'}</p>
              {query.trim().length === 0 && recentQueries.length > 0 ? (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Recent searches</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {recentQueries.map((recentQuery) => (
                      <button
                        key={recentQuery}
                        type="button"
                        onClick={() => {
                          setQuery(recentQuery);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                      >
                        {recentQuery}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm font-medium text-gray-700">No results for &apos;{query.trim()}&apos;</p>
              <p className="mt-1 text-sm text-gray-500">Check spelling or try a product, order, customer, or strain name.</p>
            </div>
          ) : (
            <div className="divide-y" role="listbox" aria-label="Search results">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                const quickActions = getQuickActions(result);
                const primaryAction = quickActions[0];
                const secondaryActions = quickActions.slice(1);
                const isActive = activeIndex === index;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    id={`${resultsId}-result-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`group relative transition-colors ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <button
                      ref={(element) => {
                        resultRefs.current[index] = element;
                      }}
                      type="button"
                      onClick={() => handleResultClick(primaryAction.href)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onFocus={() => setActiveIndex(index)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 ${secondaryActions.length > 0 ? 'pr-24 sm:pr-28' : 'pr-4'}`}
                      aria-label={`${primaryAction.label}: ${result.title}`}
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
                        <p className="truncate text-xs text-gray-500">
                          {result.subtitle}
                        </p>
                      </div>
                      <div className="hidden flex-shrink-0 sm:block">
                        <span className="text-xs text-gray-400 capitalize">
                          {typeLabels[result.type]}
                        </span>
                      </div>
                    </button>
                    {secondaryActions.length > 0 ? (
                      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
                        {secondaryActions.map((action) => {
                          const ActionIcon = action.icon;

                          return (
                            <button
                              key={`${result.id}-${action.label}`}
                              type="button"
                              title={action.label}
                              aria-label={`${action.label}: ${result.title}`}
                              onClick={() => handleResultClick(action.href)}
                              onMouseDown={(event) => event.preventDefault()}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-colors hover:bg-green-50 hover:text-green-700 hover:ring-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                            >
                              <ActionIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <span>{query.trim().length >= 2 ? `${results.length} result${results.length === 1 ? '' : 's'}` : ''}</span>
          <span className="hidden sm:inline">↑↓ navigate · ↵ open · esc close</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Search Button */}
      {variant === 'icon' ? (
        <button
          onClick={(event) => openDialog(event.currentTarget)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${className}`}
          aria-label="Search"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={(event) => openDialog(event.currentTarget)}
          className={`group flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${className}`}
          aria-label="Search"
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

export function SearchTrigger({ variant = 'default', className = '' }: SearchDialogProps) {
  return <button type="button" aria-label="Search" title="Search" onClick={(event) => window.dispatchEvent(new CustomEvent('phenofarm:open-search', { detail: { trigger: event.currentTarget } }))} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 ${variant === 'icon' ? 'w-10 shrink-0' : 'px-3'} ${className}`}>
    <Search className="h-5 w-5" />{variant === 'default' && <span>Search...</span>}
  </button>;
}
