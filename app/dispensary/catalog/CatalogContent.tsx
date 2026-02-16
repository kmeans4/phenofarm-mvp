'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
import { LayoutGrid, List as ListIcon } from "lucide-react";
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

export default function CatalogContent({ 
  initialGroups 
}: { 
  initialGroups: GrowerGroup[] 
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use productType for categories (with fallback to legacy category for old data)
  const categories = ['All', 'Flower', 'Edibles', 'Cartridge', 'Bulk Extract', 'Drink', 'Merchandise', 'Prepack', 'Tincture', 'Topicals', 'Plant Material', 'Live Plant', 'Seed'];

  // Filter groups based on category and search
  const filteredGroups = useMemo(() => {
    return initialGroups.map(group => {
      let filteredProducts = group.products;
      
      // Filter by category (use productType or fallback to categoryLegacy)
      if (selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(p => 
          (p.productType || 'Other').toLowerCase() === selectedCategory.toLowerCase()
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
  }, [initialGroups, selectedCategory, searchQuery]);

  // Calculate total products
  const totalProducts = useMemo(() => {
    return filteredGroups.reduce((sum, group) => sum + group.products.length, 0);
  }, [filteredGroups]);

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

      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products by name, strain, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
          
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

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{totalProducts} product{totalProducts !== 1 ? 's' : ''} found</span>
        <span className="text-xs text-gray-500">View: {viewMode === 'grid' ? 'Grid' : 'List'}</span>
      </div>

      {/* Product Groups */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map(group => (
            <div key={group.growerId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {group.growerName}
                    </h2>
                    <p className="text-sm text-gray-500">{group.products.length} products</p>
                  </div>
                  <Link 
                    href={`/dispensary/grower/${group.growerId}`}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View Shop →
                  </Link>
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
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
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
