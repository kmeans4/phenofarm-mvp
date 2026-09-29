'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Modal } from '@/app/components/ui/Modal';
import { safeInternalPath } from '@/app/components/ui/safeNavigation';
type Result = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};
function focusCatalogSearch() {
  if (location.pathname === '/dispensary/catalog') {
    const input = document.getElementById('catalog-search');
    if (input) {
      input.focus();
      input.scrollIntoView({ block: 'center' });
      return true;
    }
  }
  return false;
}
export function SearchDialog({
  variant = 'default',
  className = '',
}: {
  variant?: 'default' | 'icon';
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const [shortcut, setShortcut] = useState('Ctrl K');
  const input = useRef<HTMLInputElement>(null);
  const launch = useCallback(() => {
    if (!focusCatalogSearch()) setOpen(true);
  }, []);
  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        launch();
      }
    };
    window.addEventListener('phenofarm:open-search', launch);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('phenofarm:open-search', launch);
      document.removeEventListener('keydown', onKey);
    };
  }, [launch]);
  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Search unavailable.');
        setResults(data.results);
        setActive(-1);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Could not search.');
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  const isBuyer = pathname.startsWith('/dispensary');
  const isAdmin = pathname.startsWith('/admin');
  const scope = isAdmin
    ? 'Business, email, contact or license'
    : isBuyer
      ? 'Products, growers and orders'
      : 'Products, orders, customers and strains';
  const go = (href: string) => {
    setOpen(false);
    router.push(safeInternalPath(href, '/dashboard'));
  };
  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={launch}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-pf-line-strong px-3 text-sm text-pf-secondary ${className}`}
      >
        <Search className="h-5 w-5" />
        {variant === 'default' && (
          <>
            <span>Search</span>
            <kbd className="ml-auto text-sm">{shortcut}</kbd>
          </>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Search">
        <label
          htmlFor="global-search"
          className="mb-2 block text-sm text-pf-muted"
        >
          {scope}
        </label>
        <input
          ref={input}
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((value) => Math.min(results.length - 1, value + 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            }
            if (event.key === 'Enter' && results[active])
              go(results[active].href);
          }}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `search-result-${active}` : undefined
          }
          className="w-full rounded-lg border px-3 py-2.5 text-base"
        />
        {busy && (
          <p role="status" className="py-3 text-sm">
            Searching…
          </p>
        )}
        {error && (
          <p role="alert" className="py-3 text-sm text-pf-danger">
            {error}
          </p>
        )}
        <ul
          id="global-search-results"
          role="listbox"
          className="mt-3 divide-y divide-pf-line"
        >
          {results.map((result, index) => (
            <li
              key={`${result.type}-${result.id}`}
              id={`search-result-${index}`}
              role="option"
              aria-selected={active === index}
            >
              <button
                className={`w-full rounded-lg p-3 text-left ${active === index ? 'bg-pf-accent-bg' : ''}`}
                onClick={() => go(result.href)}
              >
                <span className="block font-medium">{result.title}</span>
                <span className="text-sm text-pf-muted">{result.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
        {!busy && !error && query.trim().length >= 2 && !results.length && (
          <p className="py-3 text-sm text-pf-muted">
            No matches. Try a shorter name or order number.
          </p>
        )}
        {query.trim().length >= 2 && (
          <button
            type="button"
            onClick={() =>
              go(
                `${isAdmin ? '/admin/review' : isBuyer ? '/dispensary/catalog' : '/grower/products'}?${isAdmin ? 'q' : 'search'}=${encodeURIComponent(query)}`
              )
            }
            className="mt-2 min-h-11 text-sm text-pf-accent underline"
          >
            See all {isAdmin ? 'businesses' : 'products'}
          </button>
        )}
      </Modal>
    </>
  );
}
export function SearchTrigger({
  variant = 'default',
  className = '',
}: {
  variant?: 'default' | 'icon';
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Search"
      onClick={() => {
        if (!focusCatalogSearch())
          window.dispatchEvent(new Event('phenofarm:open-search'));
      }}
      className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-pf-line-strong px-2 text-sm text-pf-secondary ${className}`}
    >
      <Search className="h-5 w-5" />
      {variant === 'default' && 'Search'}
    </button>
  );
}
