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
  unit: string | null;
  thc: number | null;
  inventoryQty: number;
  category: string | null;
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

  const categories = ['All', 'Flower', 'Concentrates', 'Edibles', 'Topicals', 'Vapes', 'Pre-rolls', 'Other'];

  // Filter groups based on category and search
  const filteredGroups = useMemo(() => {
    return initialGroups.map(group => {
      let filteredProducts = group.products;
      
      // Filter by category
      if (selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(p => 
          (p.category || 'Other').toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.strain && p.strain.toLowerCase().includes(query)) ||
          group.growerName.toLowerCase().includes(query)
        );
      }
      
      return {
        ...group,
        products: filteredProducts
      };
    }).filter(group => group.products.length > 0);
  }, [initialGroups, selectedCategory, searchQuery]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grower Catalogs</h1>
          <p className="text-gray-600 mt-1">Browse products from verified growers</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Link
            href="/dispensary/cart"
            className="relative px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart
            <CartBadge />
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button 
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full border whitespace-nowrap transition-colors text-sm ${
              selectedCategory === category
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredGroups.reduce((sum, g) => sum + g.products.length, 0)} products found
      </p>

      {/* Grower Groups */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No products match your filters</p>
          <button 
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        filteredGroups.map((group) => (
          <div key={group.growerId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{group.growerName}</h2>
                <p className="text-sm text-gray-500">{group.products.length} products available</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{product.category || 'Product'}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.strain && (
                          <Badge variant="secondary" className="text-xs">
                            {product.strain}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">
                          ${Number(product.price).toFixed(2)}/{product.unit}
                        </span>
                        <span className={`text-sm ${product.inventoryQty < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                          {product.inventoryQty} in stock
                        </span>
                      </div>
                      {product.thc && (
                        <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                          <span>THC: {product.thc}%</span>
                        </div>
                      )}
                      <AddToCartButton 
                        product={{
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          strain: product.strain,
                          unit: product.unit,
                          thc: product.thc,
                          inventoryQty: product.inventoryQty,
                        }}
                        growerName={group.growerName}
                        growerId={group.growerId}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/dispensary/orders"
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Orders</p>
              <p className="text-sm text-gray-600">Check your order history</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dispensary/cart"
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View Cart</p>
              <p className="text-sm text-gray-600">Review items before checkout</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
