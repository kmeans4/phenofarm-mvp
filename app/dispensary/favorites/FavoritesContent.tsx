'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { LayoutGrid, List as ListIcon, Heart, ArrowLeft, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import AddToCartButton from "../catalog/components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  price: number;
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

const FAVORITES_KEY = 'phenofarm_favorites';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Recently Added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'thc-desc', label: 'THC: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
];

export default function FavoritesContent() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Fetch full product details for favorites
  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (favorites.length === 0) {
        setFavoriteProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/dispensary/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: favorites }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch favorite products');
        }

        const data = await response.json();
        // Sort by the order in favorites array (most recent first)
        const ordered = favorites
          .map(id => data.products.find((p: Product) => p.id === id))
          .filter(Boolean);
        setFavoriteProducts(ordered);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [favorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback((productId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(id => id !== productId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    setFavoriteProducts([]);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
    setShowClearConfirm(false);
  }, []);

  // Sort products
  const sortedProducts = [...favoriteProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'thc-desc': return (b.thc || 0) - (a.thc || 0);
      case 'thc-asc': return (a.thc || 0) - (b.thc || 0);
      case 'name-asc': return a.name.localeCompare(b.name);
      default: return 0; // Keep original order (recently added)
    }
  });

  const getThcBadgeColor = (thc: number) => {
    if (thc < 15) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (thc < 20) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (thc < 25) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStrainTypeColor = (strainType: string | null) => {
    if (!strainType) return 'bg-gray-100 text-gray-700';
    const lower = strainType.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dispensary/catalog" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Catalog
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
                My Favorites
              </h1>
              <p className="text-gray-600 mt-1">
                {favoriteProducts.length} saved product{favoriteProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            {favoriteProducts.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        {favoriteProducts.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 flex items-center gap-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline text-sm">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center gap-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListIcon size={18} />
                <span className="hidden sm:inline text-sm">List</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
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
                />
              ) : (
                <FavoriteListItem 
                  key={product.id} 
                  product={product}
                  onRemove={() => removeFromFavorites(product.id)}
                />
              )
            ))}
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Clear All Favorites?</h2>
              </div>
              <p className="text-gray-600 mb-6">
                This will remove all {favoriteProducts.length} products from your favorites. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllFavorites}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Favorite Card Component (Grid View)
function FavoriteCard({ product, onRemove }: { product: Product; onRemove: () => void }) {
  const getThcBadgeColor = (thc: number) => {
    if (thc < 15) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (thc < 20) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (thc < 25) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStrainTypeColor = (strainType: string | null) => {
    if (!strainType) return 'bg-gray-100 text-gray-700';
    const lower = strainType.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const strainType = product.strainType || (product.strain ? 
    (product.strain.toLowerCase().includes('indica') ? 'Indica' : 
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 hover:bg-red-50 shadow-sm transition-colors"
          title="Remove from favorites"
        >
          <Trash2 size={16} />
        </button>

        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30">🌿</span>
          </div>
        )}
      </div>

      <div className="p-4">
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
          by <Link href={`/dispensary/grower/${product.grower.id}`} className="text-green-600 hover:underline">
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
        {product.thc && (
          <div className="mb-3">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getThcBadgeColor(product.thc)}`}>
              THC {product.thc}%
            </span>
          </div>
        )}

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-green-700">${product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500 ml-1">/ {product.unit || 'unit'}</span>
          </div>
          <AddToCartButton 
            product={product}
            growerName={product.grower.businessName}
            growerId={product.grower.id}
          />
        </div>
      </div>
    </div>
  );
}

// Favorite List Item Component (List View)
function FavoriteListItem({ product, onRemove }: { product: Product; onRemove: () => void }) {
  const strainType = product.strainType || (product.strain ? 
    (product.strain.toLowerCase().includes('indica') ? 'Indica' : 
     product.strain.toLowerCase().includes('sativa') ? 'Sativa' : 'Hybrid') : null);

  const getStrainTypeColor = (strainType: string | null) => {
    if (!strainType) return 'bg-gray-100 text-gray-700';
    const lower = strainType.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of Stock', color: 'text-red-600' }
    : product.inventoryQty <= 10 
      ? { text: 'Low Stock', color: 'text-orange-600' }
      : { text: 'In Stock', color: 'text-green-600' };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      {/* Image */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-30">🌿</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500">
              by <Link href={`/dispensary/grower/${product.grower.id}`} className="text-green-600 hover:underline">
                {product.grower.businessName}
              </Link>
              {product.grower.isVerified && (
                <span className="ml-1 text-green-600" title="Verified">✓</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-green-700">${product.price.toFixed(2)}</span>
            <p className={`text-xs ${stockStatus.color}`}>{stockStatus.text}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {strainType && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStrainTypeColor(strainType)}`}>
              {strainType}
            </span>
          )}
          {product.thc && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              THC {product.thc}%
            </span>
          )}
          {product.productType && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {product.productType}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AddToCartButton 
          product={product}
          growerName={product.grower.businessName}
          growerId={product.grower.id}
          compact
        />
        <button
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove from favorites"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
