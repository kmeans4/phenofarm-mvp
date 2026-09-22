'use client';

import { Modal } from '@/app/components/ui/Modal';
import { getThcBadgeColor, getStrainTypeColor } from '@/lib/product-badges';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useBuyerCollection } from '../hooks/useBuyerCollection';
import Link from "next/link";
import { LayoutGrid, List as ListIcon, Heart, HeartOff, ShoppingCart, Loader2, MessageCircle } from "lucide-react";
import AddToCartButton from "../catalog/components/AddToCartButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { toast } from '@/app/hooks/useToast';
import { ProductImage } from '@/app/components/ui/ProductImage';

function displayUnit(unit: string | null | undefined) { return unit?.toLowerCase() === 'gram' ? 'g' : unit || 'unit'; }

interface Product {
  id: string;
  name: string;
  price: number;
  isPriceVisible: boolean;
  strain: string | null;
  strainId: string | null;
  strainType: string | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  thc: number | null;
  cbd: number | null;
  images: string[];
  inventoryQty: number;
  grower: {
    id: string;
    businessName: string;
    location?: string | null;
    isVerified?: boolean;
  };
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-desc' | 'thc-asc' | 'name-asc' | 'name-desc';
type MessageMode = 'REQUEST_PRICING' | 'QUESTION';



const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low' },
  { value: 'price-desc', label: 'Price: high' },
  { value: 'thc-desc', label: 'THC: high' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'thc-asc', label: 'THC: low' },
];

function normalizeFavoriteIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && !!id))] : [];
}

interface FavoritesContentProps {
  embedded?: boolean;
}

export default function FavoritesContent({ embedded = false }: FavoritesContentProps) {
  const { items: favorites, setItems: setFavorites, ready, error: syncError } = useBuyerCollection('favorites', normalizeFavoriteIds);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [openingConversationKey, setOpeningConversationKey] = useState<string | null>(null);
  const productCache = useRef(new Map<string, Product>());
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const missing = favorites.filter(id => !productCache.current.has(id));
    const populate = () => setFavoriteProducts(favorites.map(id => productCache.current.get(id)).filter((product): product is Product => !!product));
    if (!missing.length) { populate(); setIsLoading(false); return; }
    setIsLoading(true);
    void (async () => {
      try {
        const response = await fetch('/api/dispensary/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: missing }), signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.products)) throw new Error('Unable to load favorite products.');
        if (controller.signal.aborted) return;
        for (const product of data.products) {
          if (typeof product?.id === 'string' && product.grower?.id && Array.isArray(product.images)) productCache.current.set(product.id, { ...product, price: product.price == null ? 0 : Number(product.price) });
        }
        populate();
      } catch { if (!controller.signal.aborted) toast.error('Unable to load favorite products. Your saved favorites are unchanged.'); }
      finally { if (!controller.signal.aborted) setIsLoading(false); }
    })();
    return () => controller.abort();
  }, [favorites, ready]);

  // Remove from favorites
  const removeFromFavorites = useCallback((productId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(id => id !== productId);
      return updated;
    });
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
  }, [setFavorites]);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    setFavoriteProducts([]);
    setShowClearConfirm(false);
  }, [setFavorites]);

  const openConversationDraft = useCallback(async (product: Product, mode: MessageMode) => {
    const key = `${product.id}:${mode}`;
    const draft = mode === 'REQUEST_PRICING'
      ? `Hi ${product.grower.businessName}, can you send pricing for ${product.name}${product.unit ? ` (${product.unit})` : ''}?`
      : `Hi ${product.grower.businessName}, I have a question about ${product.name}.`;

    setOpeningConversationKey(key);

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          growerId: product.grower.id,
          productId: product.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.conversationId) {
        throw new Error(data.error || 'Failed to open conversation');
      }

      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: {
            conversationId: data.conversationId,
            draft,
            context: [
              { label: 'Product', value: product.name },
              { label: 'Grower', value: product.grower.businessName },
            ],
            flash: true,
          },
        })
      );
    } catch (error) {
      console.error('Failed to open grower conversation:', error);
      toast.error('Could not open the conversation. Please try again.');
    } finally {
      setOpeningConversationKey(null);
    }
  }, []);

  // Sort products
  const sortedProducts = [...favoriteProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return Number(!a.isPriceVisible) - Number(!b.isPriceVisible) || (a.isPriceVisible && b.isPriceVisible ? a.price - b.price : 0);
      case 'price-desc': return Number(!a.isPriceVisible) - Number(!b.isPriceVisible) || (a.isPriceVisible && b.isPriceVisible ? b.price - a.price : 0);
      case 'thc-desc': return (b.thc || 0) - (a.thc || 0);
      case 'thc-asc': return (a.thc || 0) - (b.thc || 0);
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      default: return 0; // Keep original order (recently added)
    }
  });


  return (
    <div className={embedded ? "" : "pb-20 sm:pb-24"}>
      {syncError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{syncError}</p>}
      <div className={embedded ? "pb-4" : "space-y-6"}>
        {!embedded && <PageHeader title="Favorites" actions={<Link href="/dispensary/catalog" className="min-h-10 text-green-700">Browse catalog</Link>} />}

        {/* Controls */}
        {favoriteProducts.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
            <div className="min-w-0 flex-1">
              {/* Sort Dropdown */}
              <div className="min-w-0">
                <select
                  aria-label="Sort favorites"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                aria-label="Grid view" aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 flex items-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                  viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline text-sm">Grid</span>
              </button>
              <button
                aria-label="List view" aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                  viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListIcon size={18} />
                <span className="hidden sm:inline text-sm">List</span>
              </button>
            </div>
            <details className="relative ml-auto">
              <summary className="flex min-h-10 cursor-pointer items-center rounded-lg px-2 text-sm text-gray-600">More</summary>
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-white p-1 shadow-lg"><button type="button" onClick={() => setShowClearConfirm(true)} className="min-h-10 w-full rounded px-3 text-left text-sm text-red-700 hover:bg-red-50">Clear favorites</button></div>
            </details>
          </div>
        )}

        {/* Content */}
        {(isLoading && !syncError) ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start building your collection by clicking the heart icon on products you love. Your favorites will appear here.
            </p>
            <Link
              href="/dispensary/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <ShoppingCart size={20} />
              Browse Catalog
            </Link>
          </div>
        ) : (
          /* Products Grid/List */
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-2"
          }>
            {sortedProducts.map(product => (
              viewMode === 'grid' ? (
                <FavoriteCard 
                  key={product.id} 
                  product={product}
                  onRemove={() => removeFromFavorites(product.id)}
                  onRequestPricing={() => openConversationDraft(product, 'REQUEST_PRICING')}
                  onMessageGrower={() => openConversationDraft(product, 'QUESTION')}
                  isOpeningPricing={openingConversationKey === `${product.id}:REQUEST_PRICING`}
                  isOpeningMessage={openingConversationKey === `${product.id}:QUESTION`}
                />
              ) : (
                <FavoriteListItem 
                  key={product.id} 
                  product={product}
                  onRemove={() => removeFromFavorites(product.id)}
                  onRequestPricing={() => openConversationDraft(product, 'REQUEST_PRICING')}
                  onMessageGrower={() => openConversationDraft(product, 'QUESTION')}
                  isOpeningPricing={openingConversationKey === `${product.id}:REQUEST_PRICING`}
                  isOpeningMessage={openingConversationKey === `${product.id}:QUESTION`}
                />
              )
            ))}
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear favorites?" className="max-w-md">
          <p className="mb-5 text-sm text-gray-600">Remove your saved products? You can save them again from the catalog.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowClearConfirm(false)} className="min-h-10 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="button" onClick={clearAllFavorites} className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Clear favorites</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

// Favorite Card Component (Grid View)
function FavoriteCard({
  product,
  onRemove,
  onRequestPricing,
  onMessageGrower,
  isOpeningPricing,
  isOpeningMessage,
}: {
  product: Product;
  onRemove: () => void;
  onRequestPricing: () => void;
  onMessageGrower: () => void;
  isOpeningPricing: boolean;
  isOpeningMessage: boolean;
}) {


  const strainType = product.strainType || (product.strain ? 
    (product.strain.toLowerCase().includes('indica') ? 'Indica' : 
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className={`relative overflow-hidden bg-green-50 ${product.images?.[0] ? 'h-20 sm:h-40' : 'h-20 sm:h-24'}`}>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${product.name} from favorites`}
          className="absolute top-2 right-2 z-10 min-h-10 min-w-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 shadow-sm transition-all hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          title="Remove from favorites"
        >
          <HeartOff size={16} />
        </button>

        <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          productType={product.productType}
          className="h-full w-full"
          imageClassName="max-sm:object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-3 sm:p-4">
        {/* Name & Verified */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          {product.grower.isVerified && (
            <span className="text-green-600 flex-shrink-0" title="Verified Grower">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </span>
          )}
        </div>

        {/* Grower */}
        <p className="text-sm text-gray-500 mb-2">
          by <Link href={`/dispensary/grower/${product.grower.id}`} className="inline-flex min-h-10 items-center text-green-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
            {product.grower.businessName}
          </Link>
        </p>

        {/* Strain Type */}
        {strainType && (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getStrainTypeColor(strainType)} mb-2`}>
            {strainType}
          </span>
        )}

        {/* THC Badge */}
        {product.thc != null && (
          <div className="mb-3">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getThcBadgeColor(product.thc)}`}>
              THC {product.thc}%
            </span>
          </div>
        )}

        {/* Price & Actions */}
        <div className="pt-3 border-t border-gray-100">
          {product.isPriceVisible ? (
            <div className="space-y-3">
              <div>
                <span className="text-xl font-bold text-green-700">${product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500 ml-1">/ {displayUnit(product.unit)}</span>
              </div>
              <AddToCartButton
                product={product}
                growerName={product.grower.businessName}
                growerId={product.grower.id}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onRequestPricing}
                disabled={isOpeningPricing}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {isOpeningPricing && <Loader2 className="h-4 w-4 animate-spin" />}
                Request pricing
              </button>
              <button
                type="button"
                onClick={onMessageGrower}
                disabled={isOpeningMessage}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {isOpeningMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Message grower
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Favorite List Item Component (List View)
function FavoriteListItem({
  product,
  onRemove,
  onRequestPricing,
  onMessageGrower,
  isOpeningPricing,
  isOpeningMessage,
}: {
  product: Product;
  onRemove: () => void;
  onRequestPricing: () => void;
  onMessageGrower: () => void;
  isOpeningPricing: boolean;
  isOpeningMessage: boolean;
}) {
  return (
    <article data-product-row className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 sm:flex sm:items-center">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-green-50"><ProductImage src={product.images?.[0]} alt={product.name} productType={product.productType} className="h-full w-full" /></div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <Link href={`/dispensary/grower/${product.grower.id}`} className="mt-1 inline-block text-sm text-green-700 hover:underline">{product.grower.businessName}</Link>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
          {product.productType && <span>{product.productType}</span>}
          {product.thc != null && <span>THC {product.thc}%</span>}
          <span>{product.inventoryQty} available</span>
        </div>
      </div>
      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:max-w-xs sm:border-0 sm:pt-0">
        {product.isPriceVisible ? <>
          <span data-product-price className="text-lg font-bold text-green-700">${product.price.toFixed(2)}<span className="text-sm font-normal text-gray-500">/{displayUnit(product.unit)}</span></span>
          <AddToCartButton product={product} growerName={product.grower.businessName} growerId={product.grower.id} compact compactLabel="Add" />
        </> : <button type="button" onClick={onRequestPricing} disabled={isOpeningPricing} className="min-h-10 flex-1 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 disabled:opacity-60">{isOpeningPricing ? 'Opening…' : 'Request pricing'}</button>}
        <button type="button" onClick={onMessageGrower} disabled={isOpeningMessage} className="min-h-10 px-2 text-sm font-medium text-green-700 hover:underline disabled:opacity-60">{isOpeningMessage ? 'Opening…' : 'Message'}</button>
        <button type="button" onClick={onRemove} aria-label={`Remove ${product.name} from favorites`} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><HeartOff size={18} /></button>
      </div>
    </article>
  );
}
