'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
import { LayoutGrid, List as ListIcon, SlidersHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import CartBadge from "./components/CartBadge";

interface Product {
  id: string;
  name: string;
  price: number;
  strain: string | null;
  strainId: string | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  thc: number | null;
  inventoryQty: number;
  grower: {
    id: string;
    businessName: string;
  };
}

interface GrowerGroup {
  growerId: string;
  growerName: string;
  products: Product[];
}

interface FilterState {
  productTypes: string[];
  thcRanges: string[];
  priceRanges: string[];
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-asc' | 'thc-desc' | 'name-asc' | 'name-desc';

const PRODUCT_TYPES = ['Flower', 'Edibles', 'Cartridge', 'Concentrate', 'Pre-roll', 'Tincture', 'Topical', 'Drink'];

const THC_RANGES = [
  { label: '< 15%', min: 0, max: 15, id: 'low' },
  { label: '15% - 20%', min: 15, max: 20, id: 'medium' },
  { label: '20% - 25%', min: 20, max: 25, id: 'high' },
  { label: '25%+', min: 25, max: 100, id: 'very-high' },
];

const PRICE_RANGES = [
  { label: 'Under $5', min: 0, max: 5, id: 'budget' },
  { label: '$5 - $10', min: 5, max: 10, id: 'standard' },
  { label: '$10 - $25', min: 10, max: 25, id: 'premium' },
  { label: '$25+', min: 25, max: 10000, id: 'luxury' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default (Grower)' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'thc-desc', label: 'THC: High to Low' },
  { value: 'thc-asc', label: 'THC: Low to High' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

export default function CatalogContent({ 
  initialGroups 
}: { 
  initialGroups: GrowerGroup[] 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filters, setFilters] = useState<FilterState>({
    productTypes: [],
    thcRanges: [],
    priceRanges: [],
  });

  // Toggle filter value
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({ productTypes: [], thcRanges: [], priceRanges: [] });
    setSearchQuery('');
    setSortBy('default');
  };

  // Check if product matches THC range
  const matchesThcRange = (thc: number | null, rangeIds: string[]) => {
    if (!thc || rangeIds.length === 0) return true;
    return rangeIds.some(rangeId => {
      const range = THC_RANGES.find(r => r.id === rangeId);
      if (!range) return false;
      return thc >= range.min && thc < range.max;
    });
  };

  // Check if product matches price range
  const matchesPriceRange = (price: number, rangeIds: string[]) => {
    if (rangeIds.length === 0) return true;
    return rangeIds.some(rangeId => {
      const range = PRICE_RANGES.find(r => r.id === rangeId);
      if (!range) return false;
      return price >= range.min && price < range.max;
    });
  };

  // Sort products
  const sortProducts = (products: Product[]): Product[] => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'thc-asc':
        return sorted.sort((a, b) => (a.thc || 0) - (b.thc || 0));
      case 'thc-desc':
        return sorted.sort((a, b) => (b.thc || 0) - (a.thc || 0));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  };

  // Filter and sort groups based on all criteria
  const filteredGroups = useMemo(() => {
    // If sorting by anything other than default, flatten and regroup
    if (sortBy !== 'default') {
      // Get all products
      const allProducts = initialGroups.flatMap(g => g.products);
      
      // Apply filters
      let filteredProducts = allProducts;

      // Filter by product type
      if (filters.productTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          p.productType && filters.productTypes.includes(p.productType)
        );
      }

      // Filter by THC range
      if (filters.thcRanges.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          matchesThcRange(p.thc, filters.thcRanges)
        );
      }

      // Filter by price range
      if (filters.priceRanges.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          matchesPriceRange(p.price, filters.priceRanges)
        );
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.strain && p.strain.toLowerCase().includes(query)) ||
          (p.productType && p.productType.toLowerCase().includes(query))
        );
      }

      // Sort products
      filteredProducts = sortProducts(filteredProducts);

      // Return as single group when sorting
      return filteredProducts.length > 0 
        ? [{ growerId: 'all', growerName: 'All Products', products: filteredProducts }]
        : [];
    }

    // Default view - grouped by grower
    return initialGroups.map(group => {
      let filteredProducts = group.products;

      // Filter by product type
      if (filters.productTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          p.productType && filters.productTypes.includes(p.productType)
        );
      }

      // Filter by THC range
      if (filters.thcRanges.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          matchesThcRange(p.thc, filters.thcRanges)
        );
      }

      // Filter by price range
      if (filters.priceRanges.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          matchesPriceRange(p.price, filters.priceRanges)
        );
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.strain && p.strain.toLowerCase().includes(query)) ||
          (p.productType && p.productType.toLowerCase().includes(query))
        );
      }

      return {
        ...group,
        products: filteredProducts,
      };
    }).filter(group => group.products.length > 0);
  }, [initialGroups, filters, searchQuery, sortBy]);

  // Calculate total products
  const totalProducts = useMemo(() => {
    return filteredGroups.reduce((sum, group) => sum + group.products.length, 0);
  }, [filteredGroups]);

  // Get active filter count
  const activeFilterCount = filters.productTypes.length + filters.thcRanges.length + filters.priceRanges.length;

  // Get active filter chips
  const getFilterChips = () => {
    const chips: { label: string; category: keyof FilterState; value: string }[] = [];
    filters.productTypes.forEach(type => {
      chips.push({ label: type, category: 'productTypes', value: type });
    });
    filters.thcRanges.forEach(rangeId => {
      const range = THC_RANGES.find(r => r.id === rangeId);
      if (range) chips.push({ label: `THC: ${range.label}`, category: 'thcRanges', value: rangeId });
    });
    filters.priceRanges.forEach(rangeId => {
      const range = PRICE_RANGES.find(r => r.id === rangeId);
      if (range) chips.push({ label: `Price: ${range.label}`, category: 'priceRanges', value: rangeId });
    });
    return chips;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600 mt-1">Browse products from verified growers</p>
        </div>
        <CartBadge />
      </div>

      {/* Search, Sort, and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products by name, strain, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer text-sm"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="List view"
              title="List view"
            >
              <ListIcon size={18} />
              <span className="hidden sm:inline text-sm">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(getFilterChips().length > 0 || searchQuery || sortBy !== 'default') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Active:</span>
          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <button onClick={() => setSortBy('default')} className="hover:text-purple-900">
                <X size={14} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                <X size={14} />
              </button>
            </span>
          )}
          {getFilterChips().map((chip, idx) => (
            <span 
              key={`${chip.category}-${chip.value}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
            >
              {chip.label}
              <button 
                onClick={() => toggleFilter(chip.category, chip.value)}
                className="hover:text-green-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {(getFilterChips().length > 0 || searchQuery || sortBy !== 'default') && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{totalProducts} product{totalProducts !== 1 ? 's' : ''} found</span>
        <span className="text-xs text-gray-500">View: {viewMode === 'grid' ? 'Grid' : 'List'}{sortBy !== 'default' && ` • Sorted: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Product Type Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Product Type</h3>
              <div className="space-y-2">
                {PRODUCT_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.productTypes.includes(type)}
                      onChange={() => toggleFilter('productTypes', type)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* THC Range Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">THC Potency</h3>
              <div className="space-y-2">
                {THC_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.thcRanges.includes(range.id)}
                      onChange={() => toggleFilter('thcRanges', range.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-2">
                {PRICE_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.priceRanges.includes(range.id)}
                      onChange={() => toggleFilter('priceRanges', range.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Product Grid/List */}
        <div className="flex-1 min-w-0">
          {filteredGroups.length > 0 ? (
            <div className="space-y-8">
              {filteredGroups.map(group => (
                <div key={group.growerId} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${sortBy !== 'default' ? 'border-green-200 ring-1 ring-green-100' : ''}`}>
                  <div className={`px-6 py-4 border-b border-gray-200 ${sortBy !== 'default' ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {group.growerName}
                          {sortBy !== 'default' && (
                            <span className="ml-2 text-sm font-normal text-green-700">
                              (sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label.toLowerCase()})
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500">{group.products.length} products</p>
                      </div>
                      {group.growerId !== 'all' && (
                        <Link 
                          href={`/dispensary/grower/${group.growerId}`}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View Shop →
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {viewMode === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.products.map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-2">
                        {group.products.map(product => (
                          <ProductListItem key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters, search, or sort criteria</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Product Card Component (Grid View)
function ProductCard({ product }: { product: Product }) {
  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of stock', color: 'text-red-600' }
    : product.inventoryQty <= 10 
      ? { text: `Only ${product.inventoryQty} left!`, color: 'text-orange-600' }
      : { text: 'In Stock', color: 'text-green-600' };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
      </div>
      
      {/* Strain & Product Type */}
      <div className="mb-3 space-y-1">
        {product.strain && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Strain:</span> {product.strain}
          </p>
        )}
        {product.productType && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {product.productType} {product.subType && `- ${product.subType}`}
          </p>
        )}
        {product.thc && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">THC:</span> {product.thc}%
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div>
          <span className="text-lg font-bold text-green-700">${product.price.toFixed(2)}</span>
          <span className="text-sm text-gray-500">/{product.unit || 'unit'}</span>
        </div>
        <AddToCartButton 
          product={product} 
          growerName={product.grower.businessName}
          growerId={product.grower.id}
        />
      </div>
      
      <p className={`text-xs mt-2 ${stockStatus.color}`}>{stockStatus.text}</p>
    </div>
  );
}

// Product List Item Component (List View)
function ProductListItem({ product }: { product: Product }) {
  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of stock', color: 'text-red-600', bg: 'bg-red-50' }
    : product.inventoryQty <= 10 
      ? { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50' }
      : { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
              {product.strain && (
                <span><span className="font-medium">Strain:</span> {product.strain}</span>
              )}
              {product.productType && (
                <span><span className="font-medium">Type:</span> {product.productType}</span>
              )}
              {product.subType && (
                <span className="text-gray-500">{product.subType}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* THC Badge */}
      {product.thc && (
        <div className="hidden sm:flex flex-col items-center px-3 py-1 bg-purple-50 rounded">
          <span className="text-xs text-purple-600 font-medium">THC</span>
          <span className="text-sm font-bold text-purple-700">{product.thc}%</span>
        </div>
      )}

      {/* Stock Status */}
      <div className={`hidden md:flex items-center px-3 py-1 rounded ${stockStatus.bg}`}>
        <span className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
      </div>

      {/* Price */}
      <div className="text-right min-w-[100px]">
        <div className="text-lg font-bold text-green-700">${product.price.toFixed(2)}</div>
        <div className="text-xs text-gray-500">/{product.unit || 'unit'}</div>
      </div>

      {/* Add to Cart */}
      <div className="flex-shrink-0">
        <AddToCartButton 
          product={product} 
          growerName={product.grower.businessName}
          growerId={product.grower.id}
          compact
        />
      </div>
    </div>
  );
}
