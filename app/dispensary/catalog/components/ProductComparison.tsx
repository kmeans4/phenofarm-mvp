'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Scale, BarChart3, Check, Plus } from 'lucide-react';
import AddToCartButton from './AddToCartButton';

// ============================================
// TYPES
// ============================================

export interface Product {
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

export interface CompareState {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompareList: (productId: string) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
  maxItems: number;
}

// ============================================
// CONSTANTS
// ============================================

export const MAX_COMPARE_ITEMS = 3;
export const COMPARE_STORAGE_KEY = 'phenofarm_compare_products';

// ============================================
// HOOK: useCompare
// ============================================

export function useCompare(): CompareState {
  const [compareList, setCompareList] = useState<Product[]>([]);

  // Load compare list from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load compare list:', e);
    }
  }, []);

  // Save compare list to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.error('Failed to save compare list:', e);
    }
  }, [compareList]);

  // Add product to compare
  const addToCompare = useCallback((product: Product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) {
        // Remove first item if at max
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  }, []);

  // Remove product from compare
  const removeFromCompare = useCallback((productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Check if product is in compare list
  const isInCompareList = useCallback((productId: string) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  // Clear all compare items
  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    isInCompareList,
    clearCompare,
    canAddMore: compareList.length < MAX_COMPARE_ITEMS,
    maxItems: MAX_COMPARE_ITEMS,
  };
}

// ============================================
// COMPONENT: ProductCompareCheckbox
// ============================================

interface ProductCompareCheckboxProps {
  product: Product;
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
  variant?: 'card' | 'list' | 'compact';
}

export function ProductCompareCheckbox({
  product,
  isInCompare,
  onCompareToggle,
  compareDisabled,
  variant = 'card',
}: ProductCompareCheckboxProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCompareToggle();
        }}
        disabled={compareDisabled && !isInCompare}
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
          isInCompare 
            ? 'bg-green-600 text-white' 
            : compareDisabled 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isInCompare ? 'Remove from compare' : compareDisabled ? `Max ${MAX_COMPARE_ITEMS} products` : 'Add to compare'}
      >
        {isInCompare ? <Check size={16} /> : <Scale size={16} />}
      </button>
    );
  }

  if (variant === 'list') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCompareToggle();
        }}
        disabled={compareDisabled && !isInCompare}
        className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
          isInCompare 
            ? 'bg-green-600 text-white shadow-md' 
            : compareDisabled 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isInCompare ? 'Remove from compare' : compareDisabled ? `Max ${MAX_COMPARE_ITEMS} products` : 'Add to compare'}
      >
        {isInCompare ? <Check size={18} /> : <Scale size={18} />}
      </button>
    );
  }

  // Card variant (default)
  return (
    <div className="absolute top-2 left-2 z-10">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCompareToggle();
        }}
        disabled={compareDisabled && !isInCompare}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isInCompare 
            ? 'bg-green-600 text-white shadow-lg' 
            : compareDisabled 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm'
        }`}
      >
        {isInCompare ? <Check size={14} /> : <Plus size={14} />}
        {isInCompare ? 'Comparing' : 'Compare'}
      </button>
    </div>
  );
}

// ============================================
// COMPONENT: CompareBar
// ============================================

interface CompareBarProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onOpenModal: () => void;
  onHide?: () => void;
  isVisible?: boolean;
}

export function CompareBar({
  products,
  onRemove,
  onClear,
  onOpenModal,
  onHide,
  isVisible = true,
}: CompareBarProps) {
  if (products.length === 0 || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Scale className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">
            Compare ({products.length}/{MAX_COMPARE_ITEMS})
          </span>
        </div>
        
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {products.map(product => (
            <div 
              key={product.id} 
              className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 min-w-fit"
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-sm overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="opacity-50">🌿</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                {product.name}
              </span>
              <button
                onClick={() => onRemove(product.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenModal}
            disabled={products.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <BarChart3 size={18} />
            Compare Now
          </button>
          <button
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all"
          >
            <X size={20} />
          </button>
          {onHide && (
            <button
              onClick={onHide}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Hide"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: CompareModal
// ============================================

interface CompareModalProps {
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export function CompareModal({ 
  products, 
  onClose, 
  onRemove, 
  onClear 
}: CompareModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const getThcColor = (thc: number | null) => {
    if (!thc) return 'bg-gray-100';
    if (thc < 15) return 'bg-emerald-500';
    if (thc < 20) return 'bg-yellow-500';
    if (thc < 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrainTypeColor = (strainType: string | null) => {
    if (!strainType) return 'bg-gray-100 text-gray-700';
    const lower = strainType.toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-700';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getThcBadgeColor = (thc: number | null) => {
    if (!thc) return 'bg-gray-50 text-gray-600';
    if (thc < 15) return 'bg-emerald-50 text-emerald-700';
    if (thc < 20) return 'bg-yellow-50 text-yellow-700';
    if (thc < 25) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  };

  const getCbdBadgeColor = (cbd: number | null) => {
    if (!cbd) return 'bg-gray-50 text-gray-600';
    if (cbd < 1) return 'bg-gray-50 text-gray-600';
    if (cbd < 5) return 'bg-blue-50 text-blue-700';
    return 'bg-indigo-50 text-indigo-700';
  };

  const formatPricePerGram = (price: number, unit: string | null) => {
    if (!unit) return `$${price.toFixed(2)}`;
    const unitLower = unit.toLowerCase();
    if (unitLower.includes('g') || unitLower.includes('gram')) {
      const match = unit.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        const grams = parseFloat(match[1]);
        if (grams > 0) {
          return `$${(price / grams).toFixed(2)}/g`;
        }
      }
    }
    return `$${price.toFixed(2)}/${unit}`;
  };

  const getMOQ = (price: number) => Math.max(1, Math.ceil(price / 50));

  const comparisonAttributes = [
    { 
      label: 'Price', 
      key: 'price', 
      format: (p: Product) => `$${p.price.toFixed(2)}`,
      highlight: true,
    },
    { 
      label: 'Price per Unit', 
      key: 'pricePerGram', 
      format: (p: Product) => formatPricePerGram(p.price, p.unit),
    },
    { 
      label: 'THC', 
      key: 'thc', 
      format: (p: Product) => p.thc ? `${p.thc}%` : 'N/A',
      visual: true,
      visualKey: 'thc' as const,
    },
    { 
      label: 'CBD', 
      key: 'cbd', 
      format: (p: Product) => p.cbd ? `${p.cbd}%` : 'N/A',
      badge: true,
      badgeKey: 'cbd' as const,
    },
    { 
      label: 'Strain Type', 
      key: 'strainType', 
      format: (p: Product) => p.strainType || 'N/A',
      badge: true,
      badgeKey: 'strainType' as const,
    },
    { 
      label: 'Strain', 
      key: 'strain', 
      format: (p: Product) => p.strain || 'N/A',
    },
    { 
      label: 'Product Type', 
      key: 'productType', 
      format: (p: Product) => p.productType || 'N/A',
    },
    { 
      label: 'Unit', 
      key: 'unit', 
      format: (p: Product) => p.unit || 'unit',
    },
    { 
      label: 'MOQ', 
      key: 'moq', 
      format: (p: Product) => `${getMOQ(p.price)} units`,
    },
    { 
      label: 'Stock Status', 
      key: 'stock', 
      format: (p: Product) => {
        if (p.inventoryQty === 0) return 'Out of Stock';
        if (p.inventoryQty <= 10) return `Low (${p.inventoryQty})`;
        return `In Stock (${p.inventoryQty})`;
      },
      stockStatus: true,
    },
    { 
      label: 'Grower', 
      key: 'grower', 
      format: (p: Product) => p.grower.businessName,
      link: true,
      linkHref: (p: Product) => `/dispensary/grower/${p.grower.id}`,
    },
  ];

  // Calculate grid columns based on number of products
  const getGridCols = () => {
    if (products.length === 1) return 'grid-cols-1 max-w-md';
    if (products.length === 2) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scale className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Comparison</h2>
              <p className="text-xs sm:text-sm text-gray-500">Comparing {products.length} product{products.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="hidden sm:flex px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Products Grid */}
          <div className={`grid gap-3 sm:gap-4 ${getGridCols()}`}>
            {products.map(product => (
              <div key={product.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                {/* Product Header */}
                <div className="p-3 sm:p-4 bg-white border-b border-gray-200">
                  <div className="relative h-24 sm:h-32 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl opacity-30">🌿</span>
                    )}
                    <button
                      onClick={() => onRemove(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2">{product.name}</h3>
                  <Link 
                    href={`/dispensary/grower/${product.grower.id}`}
                    className="text-xs sm:text-sm text-green-600 hover:underline"
                  >
                    {product.grower.businessName}
                  </Link>
                </div>

                {/* Attributes */}
                <div className="divide-y divide-gray-200 flex-1">
                  {comparisonAttributes.map(attr => (
                    <div key={attr.key} className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{attr.label}</span>
                      
                      {/* Visual THC Bar */}
                      {attr.visual && attr.visualKey === 'thc' && product.thc && (
                        <div className="mt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getThcColor(product.thc)} transition-all duration-500`}
                              style={{ width: `${Math.min(product.thc, 35) / 35 * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 text-right">
                            <span className="text-sm font-bold text-gray-900">{product.thc}%</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Regular Value */}
                      {(!attr.visual || !product.thc) && (
                        <div className="mt-1">
                          {/* Badged values */}
                          {attr.badge && attr.badgeKey === 'cbd' && (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getCbdBadgeColor(product.cbd)}`}>
                              {attr.format(product)}
                            </span>
                          )}
                          {attr.badge && attr.badgeKey === 'strainType' && (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStrainTypeColor(product.strainType)}`}>
                              {attr.format(product)}
                            </span>
                          )}
                          {attr.stockStatus && (
                            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                              product.inventoryQty === 0 ? 'text-red-600' :
                              product.inventoryQty <= 10 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                product.inventoryQty === 0 ? 'bg-red-500' :
                                product.inventoryQty <= 10 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`} />
                              {attr.format(product)}
                            </span>
                          )}
                          {/* Linked value */}
                          {attr.link && (
                            <Link 
                              href={attr.linkHref!(product)}
                              className="text-sm font-medium text-green-600 hover:underline"
                            >
                              {attr.format(product)}
                            </Link>
                          )}
                          {/* Plain value */}
                          {!attr.badge && !attr.stockStatus && !attr.link && (
                            <span className={`text-sm sm:text-base font-medium ${
                              attr.highlight ? 'text-green-700 text-lg sm:text-xl' : 'text-gray-900'
                            }`}>
                              {attr.format(product)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
                  <AddToCartButton 
                    product={product}
                    growerName={product.grower.businessName}
                    growerId={product.grower.id}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Visual Comparison Charts - Price */}
          {products.length >= 2 && (
            <div className="mt-6 sm:mt-8 bg-gray-50 rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Price Comparison
              </h3>
              <div className="space-y-3">
                {[...products].sort((a, b) => b.price - a.price).map(product => {
                  const maxPrice = Math.max(...products.map(p => p.price));
                  const minPrice = Math.min(...products.map(p => p.price));
                  const range = maxPrice - minPrice || 1;
                  const percentage = ((product.price - minPrice) / range) * 60 + 40;
                  const isLowest = product.price === minPrice;
                  return (
                    <div key={product.id} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-24 sm:w-32 truncate text-xs sm:text-sm font-medium text-gray-700">
                        {product.name}
                      </div>
                      <div className="flex-1 h-6 sm:h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500 ${
                            isLowest ? 'bg-green-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-white text-xs sm:text-sm font-bold">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Comparison Charts - THC */}
          {products.length >= 2 && products.some(p => p.thc) && (
            <div className="mt-4 sm:mt-6 bg-gray-50 rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
                THC Potency Comparison
              </h3>
              <div className="space-y-3">
                {[...products].filter(p => p.thc).sort((a, b) => (b.thc || 0) - (a.thc || 0)).map(product => {
                  const thcProducts = products.filter(p => p.thc);
                  const maxThc = Math.max(...thcProducts.map(p => p.thc || 0));
                  const minThc = Math.min(...thcProducts.map(p => p.thc || 0));
                  const range = maxThc - minThc || 1;
                  const percentage = product.thc ? ((product.thc - minThc) / range) * 60 + 40 : 0;
                  return (
                    <div key={product.id} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-24 sm:w-32 truncate text-xs sm:text-sm font-medium text-gray-700">
                        {product.name}
                      </div>
                      <div className="flex-1 h-6 sm:h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500 ${getThcColor(product.thc)}`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-white text-xs sm:text-sm font-bold">{product.thc}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Mobile Clear All */}
        <div className="sm:hidden px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClear}
            className="w-full py-2.5 text-sm text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
