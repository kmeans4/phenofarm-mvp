'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UpdateStockPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }
    loadProducts();
  }, [status, session, router]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p?.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantityAvailable: quantity }),
      });

      if (response.ok) {
        router.push('/grower/inventory');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update stock');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Update Stock</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Set the current stock level for a product. Batch, harvest, and compliance details live on the product itself.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Stock Details</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="stock-product" className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
              <select
                id="stock-product"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose a product...</option>
                {products.map((p: Product) => (
                  <option key={p?.id} value={p?.id}>
                    {p?.name}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Current stock: {selectedProduct.inventoryQty ?? 0} {selectedProduct.unit || 'units'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-1">New Stock Level *</label>
              <input
                id="stock-quantity"
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter the total quantity on hand"
              />
              <p className="mt-1 text-xs text-gray-500">This replaces the current stock level; it is not added to it.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/grower/inventory" className="w-full sm:w-auto text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
          <button
            type="submit"
            disabled={isSubmitting || !productId || quantity === ''}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Update Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
