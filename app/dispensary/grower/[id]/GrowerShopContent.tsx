'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { 
  LayoutGrid, 
  List as ListIcon, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown,
  Search,
  Filter
} from "lucide-react";
import AddToCartButton from "../../catalog/components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  price: Decimal;
  strain: { name: string } | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  batch: { thc: number | null } | null;
  thcLegacy: number | null;
  inventoryQty: number;
  images: string[];
  description: string | null;
}

interface Decimal {
  toNumber(): number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'thc-asc' | 'thc-desc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'thc-desc', label: 'THC: High to Low' },
  { value: 'thc-asc', label: 'THC: Low to High' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

export default function GrowerShopContent({ 
  products,
  growerName,
  growerId 
}: { 
  products: Product[];
  growerName: string;
  growerId: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique product types for filter
  const productTypes = useMemo(() => {
    const types = [...new Set(products.map(p => p.productType).filter(Boolean))];
    return types.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.strain?.name && p.strain.name.toLowerCase().includes(query)) ||
        (p.productType && p.productType.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(p => p.productType === selectedType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price.toNumber() - b.price.toNumber());
        break;
      case 'price-desc':
        result.sort((a, b) => b.price.toNumber() - a.price.toNumber());
        break;
      case 'thc-asc':
        result.sort((a, b) => ((a.batch?.thc || a.thcLegacy || 0) - (b.batch?.thc || b.thcLegacy || 0)));
        break;
      case 'thc-desc':
        result.sort((a, b) => ((b.batch?.thc || b.thcLegacy || 0) - (a.batch?.thc || a.thcLegacy || 0)));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [products, searchQuery, selectedType, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSortBy('default');
  };

  const hasActiveFilters = searchQuery || selectedType || sortBy !== 'default';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <p className="text-gray-600">Browse {growerName}'s full catalog</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

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

          {/* Filter Button (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filters
            {selectedType && (
              <span className="ml-1 bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                1
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
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
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
          <span className="text-sm text-gray-500">Active filters:</span>
          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <button onClick={() => setSortBy('default')} className="hover:text-purple-900">
                <X size={14} />
              </button>
            </span>
          )}
          {selectedType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
              Type: {selectedType}
              <button onClick={() => setSelectedType(null)} className="hover:text-green-900">
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
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Product Type Filters (Desktop) */}
      <div className="hidden lg:flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedType 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Types
        </button>
        {productTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type === selectedType ? null : type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Filter by Type</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedType 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Types
            </button>
            {productTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type === selectedType ? null : type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  growerName={growerName}
                  growerId={growerId}
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
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters 
              ? "Try adjusting your filters or search criteria"
              : "This grower hasn't listed any products yet"
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Product Card Component (Grid View)
function ProductCard({ 
  product, 
  growerName, 
  growerId 
}: { 
  product: Product; 
  growerName: string; 
  growerId: string;
}) {
  const thcValue = product.batch?.thc || product.thcLegacy;
  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of stock', color: 'text-red-600' }
    : product.inventoryQty <= 10 
      ? { text: `Only ${product.inventoryQty} left!`, color: 'text-orange-600' }
      : { text: 'In Stock', color: 'text-green-600' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <span className="text-6xl font-bold text-green-200">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* THC Badge */}
        {thcValue && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            {thcValue}% THC
          </div>
        )}
        
        {/* Product Type Badge */}
        {product.productType && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium">
            {product.productType}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        
        {product.strain?.name && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Strain:</span> {product.strain.name}
          </p>
        )}
        
        {product.subType && (
          <p className="text-sm text-gray-500 mb-3">{product.subType}</p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-green-700">${product.price.toNumber().toFixed(2)}</span>
            <span className="text-sm text-gray-500">/{product.unit || 'unit'}</span>
          </div>
          <AddToCartButton 
            product={{
              id: product.id,
              name: product.name,
              price: product.price.toNumber(),
              strain: product.strain?.name || null,
              unit: product.unit,
              thc: thcValue || null,
              inventoryQty: product.inventoryQty,
            }}
            growerName={growerName}
            growerId={growerId}
          />
        </div>
        
        <p className={`text-xs mt-2 ${stockStatus.color}`}>{stockStatus.text}</p>
      </div>
    </div>
  );
}

// Product List Item Component (List View)
function ProductListItem({ 
  product, 
  growerName, 
  growerId 
}: { 
  product: Product; 
  growerName: string; 
  growerId: string;
}) {
  const thcValue = product.batch?.thc || product.thcLegacy;
  const stockStatus = product.inventoryQty === 0 
    ? { text: 'Out of stock', color: 'text-red-600', bg: 'bg-red-50' }
    : product.inventoryQty <= 10 
      ? { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50' }
      : { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <span className="text-2xl font-bold text-green-200">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
          {product.strain?.name && (
            <span><span className="font-medium">Strain:</span> {product.strain.name}</span>
          )}
          {product.productType && (
            <span><span className="font-medium">Type:</span> {product.productType}</span>
          )}
          {product.subType && (
            <span className="text-gray-500">{product.subType}</span>
          )}
        </div>
      </div>

      {/* THC Badge */}
      {thcValue && (
        <div className="hidden sm:flex flex-col items-center px-3 py-1 bg-purple-50 rounded">
          <span className="text-xs text-purple-600 font-medium">THC</span>
          <span className="text-sm font-bold text-purple-700">{thcValue}%</span>
        </div>
      )}

      {/* Stock Status */}
      <div className={`hidden md:flex items-center px-3 py-1 rounded ${stockStatus.bg}`}>
        <span className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
      </div>

      {/* Price */}
      <div className="text-right min-w-[100px]">
        <div className="text-lg font-bold text-green-700">${product.price.toNumber().toFixed(2)}</div>
        <div className="text-xs text-gray-500">/{product.unit || 'unit'}</div>
      </div>

      {/* Add to Cart */}
      <div className="flex-shrink-0">
        <AddToCartButton 
          product={{
            id: product.id,
            name: product.name,
            price: product.price.toNumber(),
            strain: product.strain?.name || null,
            unit: product.unit,
            thc: thcValue || null,
            inventoryQty: product.inventoryQty,
          }}
          growerName={growerName}
          growerId={growerId}
          compact
        />
      </div>
    </div>
  );
}
