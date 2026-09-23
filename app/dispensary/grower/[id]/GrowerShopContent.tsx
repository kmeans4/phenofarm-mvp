'use client';

import { useState, useEffect, useRef } from 'react';
import type { BuyerCatalogPage } from '@/lib/buyer-catalog';
import {
  LayoutGrid,
  List as ListIcon,
  X,
  ArrowUpDown,
  Search,
  Filter
} from "lucide-react";
import { Modal } from '@/app/components/ui/Modal';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { getThcBadgeColor } from '@/lib/product-badges';
import { useSearchParams } from 'next/navigation';
import AddToCartButton from "../../catalog/components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  price: number | null;
  isPriceVisible: boolean;
  strain: { name: string } | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  batch: { thc: number | null } | null;
  thc: number | null;
  inventoryQty: number;
  images: string[];

}

type ViewMode = 'grid' | 'list';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-asc' | 'thc-desc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low' },
  { value: 'price-desc', label: 'Price: high' },
  { value: 'thc-desc', label: 'THC: high' },
  { value: 'thc-asc', label: 'THC: low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

function shopProducts(data: BuyerCatalogPage): Product[] {
  return data.products.map(product => ({ ...product, strain: product.strain ? { name: product.strain } : null, batch: { thc: product.thc } }));
}

export default function GrowerShopContent({
  initialData,
  growerName,
  growerId
}: {
  initialData: BuyerCatalogPage;
  growerName: string;
  growerId: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  useEffect(() => { setSearchQuery(searchParams.get('search') || ''); }, [searchParams]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [messageProduct, setMessageProduct] = useState<Product | null>(null);
  const [messageMode, setMessageMode] = useState<'REQUEST_PRICING' | 'QUESTION'>('REQUEST_PRICING');
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [messageError, setMessageError] = useState('');

  const [products, setProducts] = useState(() => shopProducts(initialData));
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [productTypes, setProductTypes] = useState(() => Object.keys(initialData.productTypeCounts).sort());
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const key = JSON.stringify([growerId, debouncedSearch, selectedType, sortBy, page]);
  const hydratedKey = useRef<string | null>(key);
  useEffect(() => {
    if (hydratedKey.current === key) return;
    hydratedKey.current = null;
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    const params = new URLSearchParams({ growerId, search: debouncedSearch, sortBy, page: String(page), limit: '24' });
    if (selectedType) params.set('productTypes', selectedType);
    fetch(`/api/dispensary/catalog?${params}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not load products. Try again.');
      const data: BuyerCatalogPage = await response.json();
      if (controller.signal.aborted) return;
      const next = shopProducts(data);
      setProducts(previous => page === 1 ? next : [...new Map([...previous, ...next].map(product => [product.id, product])).values()]);
      setTotal(data.total); setHasMore(data.hasMore); setProductTypes(Object.keys(data.productTypeCounts).sort());
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, growerId, debouncedSearch, selectedType, sortBy, page]);
  const filteredProducts = products;

  const changeType = (value: string | null) => { setPage(1); setSelectedType(value); };
  const changeSort = (value: SortOption) => { setPage(1); setSortBy(value); };

  const clearFilters = () => {
    setSearchQuery('');
    changeType(null);
    changeSort('default');
  };

  const openMessageModal = (product: Product, mode: 'REQUEST_PRICING' | 'QUESTION') => {
    const defaultMessage = mode === 'REQUEST_PRICING'
      ? `Hi ${growerName}, can you send pricing for ${product.name}${product.unit ? ` (${product.unit})` : ''}?`
      : `Hi ${growerName}, I have a question about ${product.name}.`;

    setMessageMode(mode);
    setMessageProduct(product);
    setMessageText(defaultMessage);
    setMessageSuccess('');
    setMessageError('');
  };

  const sendMessage = async () => {
    if (!messageProduct) return;

    const trimmed = messageText.trim();
    if (!trimmed) {
      setMessageError('Message is required.');
      return;
    }

    setMessageSending(true);
    setMessageError('');

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          growerId,
          productId: messageProduct.id,
          messageType: messageMode === 'REQUEST_PRICING' ? 'PRICING_REQUEST' : 'TEXT',
          body: trimmed,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessageSuccess(
        messageMode === 'REQUEST_PRICING'
          ? `Pricing request sent to ${growerName}. Opening conversation...`
          : `Message sent to ${growerName}. Opening conversation...`
      );
      setMessageText('');

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: { conversationId: data.conversationId },
        })
      );

      window.setTimeout(() => {
        setMessageProduct(null);
        setMessageSuccess('');
      }, 600);
    } catch (err) {
      setMessageSuccess('');
      setMessageError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setMessageSending(false);
    }
  };

  const hasActiveFilters = searchQuery || selectedType || sortBy !== 'default';

  return (
    <div id="shop-products" className="scroll-mt-24 space-y-4 sm:scroll-mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-pf-text sm:text-lg">Products ({total})</h2>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:flex-wrap">
          {/* Search */}
          <div className="relative col-span-3 min-w-0 flex-1 sm:min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pf-muted" />
            <input
              type="text"
              placeholder="Search products" aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-pf-line-strong rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => changeSort(e.target.value as SortOption)}
              aria-label="Sort products" className="w-full appearance-none bg-pf-surface border border-pf-line-strong rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-emerald-400 focus:border-transparent cursor-pointer text-base sm:text-sm"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pf-muted pointer-events-none" />
          </div>

          {/* Filter Button (Mobile) */}
          <button
            aria-label="Product filters" aria-expanded={showFilters}
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-emerald-500 text-[#032116] border-emerald-500'
                : 'bg-pf-surface text-pf-secondary border-pf-line-strong hover:bg-pf-canvas'
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
            {selectedType && (
              <span className="ml-1 bg-pf-surface text-pf-accent text-xs font-bold px-2 py-0.5 rounded-full">
                1
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-pf-line-strong overflow-hidden">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-[#032116]'
                  : 'bg-pf-surface text-pf-muted hover:bg-pf-canvas'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-500 text-[#032116]'
                  : 'bg-pf-surface text-pf-muted hover:bg-pf-canvas'
              }`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-pf-muted">Active:</span>
          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pf-purple-bg text-pf-purple text-sm rounded-full">
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <button onClick={() => changeSort('default')} className="hover:text-pf-purple">
                <X size={14} />
              </button>
            </span>
          )}
          {selectedType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pf-accent-bg text-pf-accent text-sm rounded-full">
              Type: {selectedType}
              <button onClick={() => changeType(null)} className="hover:text-pf-accent">
                <X size={14} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pf-info-bg text-pf-info text-sm rounded-full">
              Search: &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery('')} className="hover:text-pf-info">
                <X size={14} />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-pf-muted hover:text-pf-secondary underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Product Type Filters (Desktop) */}
      <div className="hidden lg:flex flex-wrap gap-2">
        <button
          onClick={() => changeType(null)}
          className={`min-h-10 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedType
              ? 'bg-emerald-500 text-[#032116]'
              : 'bg-pf-surface text-pf-secondary hover:bg-pf-raised'
          }`}
        >
          All types
        </button>
        {productTypes.map(type => (
          <button
            key={type}
            onClick={() => changeType(type === selectedType ? null : type)}
            className={`min-h-10 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type
                ? 'bg-emerald-500 text-[#032116]'
                : 'bg-pf-surface text-pf-secondary hover:bg-pf-raised'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="lg:hidden bg-pf-surface rounded-lg border border-pf-line p-3 space-y-2">
          <h3 className="font-semibold text-pf-text">Product type</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => changeType(null)}
              className={`min-h-10 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedType
                  ? 'bg-emerald-500 text-[#032116]'
                  : 'bg-pf-raised text-pf-secondary'
              }`}
            >
              All types
            </button>
            {productTypes.map(type => (
              <button
                key={type}
                onClick={() => changeType(type === selectedType ? null : type)}
                className={`min-h-10 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-emerald-500 text-[#032116]'
                    : 'bg-pf-raised text-pf-secondary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {loadError && <p role="alert" className="text-sm text-pf-danger">{loadError}</p>}
      {loading && <p role="status" className="text-sm text-pf-muted">Loading products…</p>}
      {hasMore && <button type="button" disabled={loading} onClick={() => setPage(value => value + 1)} className="min-h-10 rounded-lg border border-pf-line-strong px-4 py-2 text-sm">More products</button>}
      {filteredProducts.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  growerName={growerName}
                  growerId={growerId}
                  onRequestPricing={() => openMessageModal(product, 'REQUEST_PRICING')}
                  onMessageGrower={() => openMessageModal(product, 'QUESTION')}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  growerName={growerName}
                  growerId={growerId}
                  onRequestPricing={() => openMessageModal(product, 'REQUEST_PRICING')}
                  onMessageGrower={() => openMessageModal(product, 'QUESTION')}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-pf-line-strong bg-pf-surface px-4 py-8 text-center sm:py-10">
          <h3 className="text-lg font-semibold text-pf-text mb-2">No products found</h3>
          <p className="text-pf-muted mb-4">
            {hasActiveFilters
              ? "Try a different search or clear your filters."
              : "This grower hasn't listed any products yet"
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-emerald-500 text-[#032116] rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <Modal open={Boolean(messageProduct)} onClose={() => { if (!messageSending) { setMessageProduct(null); setMessageSuccess(''); setMessageError(''); } }} title={messageMode === 'REQUEST_PRICING' ? 'Request pricing' : 'Message grower'} className="max-w-lg">
        {messageProduct && <div className="space-y-4">
          <div className="min-w-0"><p className="break-words font-medium text-pf-text">{messageProduct.name}</p><p className="break-words text-sm text-pf-muted">To: {growerName}</p></div>
          <label htmlFor="shop-message" className="block text-sm font-medium text-pf-secondary">Message</label>
          <textarea id="shop-message" value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} className="w-full rounded-lg border border-pf-line-strong px-4 py-3 text-base focus:ring-2 focus:ring-emerald-400 sm:text-sm" placeholder="Write your message…" />
          {messageSuccess && <p className="text-sm text-pf-accent">{messageSuccess}</p>}
          {messageError && <p className="text-sm text-pf-danger">{messageError}</p>}
          <div className="flex justify-end gap-3"><button type="button" disabled={messageSending} onClick={() => setMessageProduct(null)} className="min-h-10 rounded-lg px-4 py-2 text-pf-secondary hover:bg-pf-surface">Cancel</button><button type="button" onClick={sendMessage} disabled={messageSending || !messageText.trim()} className="min-h-10 rounded-lg bg-emerald-500 px-4 py-2 text-[#032116] hover:bg-emerald-400 disabled:opacity-60">{messageSending ? 'Sending…' : 'Send message'}</button></div>
        </div>}
      </Modal>
    </div>
  );
}

interface ProductDisplayProps {
  product: Product;
  growerName: string;
  growerId: string;
  onRequestPricing: () => void;
  onMessageGrower: () => void;
}

function ProductCard(props: ProductDisplayProps) { return <ProductDisplay {...props} />; }
function ProductListItem(props: ProductDisplayProps) { return <ProductDisplay {...props} list />; }

function ProductDisplay({ product, growerName, growerId, onRequestPricing, onMessageGrower, list = false }: ProductDisplayProps & { list?: boolean }) {
  const thc = product.batch?.thc ?? product.thc;
  const unit = product.unit?.toLowerCase() === 'gram' ? 'g' : product.unit || 'unit';
  const priced = product.isPriceVisible && product.price != null;
  return (
    <article className={list ? 'grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-xl border border-pf-line bg-pf-surface p-3 sm:flex sm:items-start sm:p-4' : 'grid grid-cols-[4rem_minmax(0,1fr)] gap-3 p-3 min-w-0 overflow-hidden rounded-xl border border-pf-line bg-pf-surface sm:block sm:p-0'}>
      <ProductImage src={product.images?.[0]} alt={product.name} productType={product.productType} showPlaceholderLabel={false} imageStyle={{ objectFit: 'contain' }} className={list ? 'h-16 w-16 shrink-0 rounded-lg' : 'h-16 w-16 rounded-lg sm:h-40 sm:w-full sm:rounded-none'} />
      <div className={list ? 'min-w-0 flex-1' : 'min-w-0 space-y-1 sm:space-y-2 sm:px-4 sm:pt-4'}>
        <h3 className="break-words text-sm font-semibold text-pf-text sm:text-base">{product.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {thc != null && <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getThcBadgeColor(thc)}`}>THC {thc}%</span>}
          {product.productType && <span className="rounded-full border border-pf-line bg-pf-surface px-2 py-0.5 text-xs text-pf-muted">{product.productType}</span>}
        </div>
        {product.strain?.name && <p className="mt-1 text-sm text-pf-muted">{product.strain.name}</p>}
        {product.subType && <p className="text-sm text-pf-muted">{product.subType}</p>}
        {!priced && <p className="mt-2 text-xs text-pf-muted">{product.inventoryQty} available</p>}
      </div>
      <div className={list ? 'col-span-2 min-w-0 space-y-2 border-t border-pf-line pt-3 sm:w-64 sm:shrink-0 sm:border-0 sm:pt-0' : 'col-span-2 space-y-2 border-t border-pf-line pt-2 sm:m-4 sm:space-y-3 sm:pt-3'}>
        {priced ? <>
          <p className="text-lg font-semibold text-pf-accent">${product.price!.toFixed(2)}<span className="text-sm font-normal text-pf-muted">/{unit}</span></p>
          <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, strain: product.strain?.name || null, unit: product.unit, thc, inventoryQty: product.inventoryQty }} growerName={growerName} growerId={growerId} />
        </> : <button type="button" onClick={onRequestPricing} className="min-h-10 w-full rounded-lg border border-pf-accent-line bg-pf-accent-bg px-3 py-2 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg">Request pricing</button>}
        <button type="button" onClick={onMessageGrower} className="min-h-10 w-full rounded-lg px-3 py-2 text-sm font-medium text-pf-accent hover:bg-pf-accent-bg">Message grower</button>
      </div>
    </article>
  );
}
