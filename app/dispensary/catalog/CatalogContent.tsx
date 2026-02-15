'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products by name, strain, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      {/* Product Groups */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map(group => (
            <div key={group.growerId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {group.growerName}
                </h2>
                <p className="text-sm text-gray-500">{group.products.length} products</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.products.map(product => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      
                      {product.inventoryQty <= 10 && product.inventoryQty > 0 && (
                        <p className="text-xs text-orange-600 mt-2">Only {product.inventoryQty} left!</p>
                      )}
                      {product.inventoryQty === 0 && (
                        <p className="text-xs text-red-600 mt-2">Out of stock</p>
                      )}
                    </div>
                  ))}
                </div>
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
