'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExtendedUser } from '@/types';
import { Button } from '@/app/components/ui/Button';

interface Product {
  id: string;
  name: string;
  strain: string | null;
  category: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  createdAt: string;
}

export default function GrowerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = session.user as ExtendedUser;
    if (user.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }

    fetchProducts();
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Failed to fetch products (${response.status})`);
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch {
      console.error('Error:', error);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setProducts(products.map(p => p.id === productId ? { ...p, isAvailable: updated.isAvailable } : p));
      } else {
        alert('Failed to update product');
      }
    } catch {
      console.error('Error:', error);
    }
  };

  const totalProducts = products?.length || 0;
  const totalValue = products?.reduce((sum, p) => sum + ((p?.price || 0) * (p?.inventoryQty || 0)), 0) || 0;
  const availableCount = products?.filter(p => p?.isAvailable)?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your cannabis product catalog</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/grower/products/add">+ Add Product</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{availableCount}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={fetchProducts} className="mt-2">Retry</Button>
        </div>
      )}

      {/* Section Divider */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-px flex-1 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">All Products</span>
        </div>
        <div className="h-px flex-1 bg-gray-200"></div>
      </div>

      {/* Products Grid */}
      {products?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product?.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{product?.name || 'Unnamed Product'}</p>
                    {product?.strain && (
                      <p className="text-sm text-gray-500 truncate">{product.strain}</p>
                    )}
                  </div>
                  <span 
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      product?.isAvailable 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {product?.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex justify-between items-baseline mb-3">
                  <p className="text-2xl font-bold text-gray-900">
                    ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-gray-500">per {product?.unit || 'unit'}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
                    {product?.inventoryQty || 0} in stock
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/grower/products/${product?.id}/edit`}>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
                    className="flex-1"
                  >
                    {product?.isAvailable ? 'Disable' : 'Enable'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteProduct(product?.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No products found</p>
          <Button variant="primary" asChild>
            <Link href="/grower/products/add">Add your first product</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
