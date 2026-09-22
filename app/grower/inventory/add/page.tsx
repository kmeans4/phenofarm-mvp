'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { formatProductUnit } from '@/lib/product-display';

interface StockProduct {
  id: string;
  name: string;
  productType?: string | null;
  subType?: string | null;
  inventoryQty?: number | null;
  unit?: string | null;
  strain?: { name?: string | null } | null;
}

export default function UpdateStockPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState('');

  const pendingRef = useRef(false);
  useEffect(() => { loadProducts(); }, []);

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
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const candidates = query
      ? products.filter((product) => {
          const haystack = [
            product.name,
            product.productType,
            product.subType,
            product.strain?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(query);
        })
      : products;

    return candidates.slice(0, 8);
  }, [productSearch, products]);

  const handleProductPick = (product: StockProduct) => {
    setProductId(product.id);
    setProductSearch(product.name || '');
    setQuantity(String(product.inventoryQty ?? 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingRef.current) return;
    const parsedQuantity = Number(quantity);
    if (!productId || !quantity.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity < 0 || parsedQuantity > 999999) {
      setError('Select a product and enter a whole number between 0 and 999999.');
      return;
    }
    pendingRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantityAvailable: parsedQuantity }),
      });

      if (response.ok) {
        router.push('/grower/inventory');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to update stock');
      }
    } catch {
      setError('An error occurred');
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 sm:space-y-5">
      <PageHeader title="Update stock" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 space-y-3 sm:p-4 sm:space-y-4">
            <div>
              <label htmlFor="stock-product-search" className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <input
                id="stock-product-search"
                type="search"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductId('');
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Search products"
                autoComplete="off"

              />


              {!selectedProduct && <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductPick(product)}
                      className={`flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 ${
                        product.id === productId ? 'bg-green-50 text-green-900' : 'text-gray-800'
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{product.name || 'Unnamed product'}</span>
                        <span className="block text-xs text-gray-500">
                          {[product.productType, product.subType, product.strain?.name]
                            .filter(Boolean)
                            .join(' · ') || 'No type or strain'}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-gray-500">
                        {product.inventoryQty ?? 0} {formatProductUnit(product.unit)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500">No products match that search.</div>
                )}
              </div>}

              {selectedProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Current stock: {selectedProduct.inventoryQty ?? 0} {formatProductUnit(selectedProduct.unit)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-1">Stock on hand *</label>
              <input
                id="stock-quantity"
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">Replaces the current stock.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/grower/inventory" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:w-auto">Cancel</Link>
          <button
            type="submit"
            disabled={isSubmitting || !productId || quantity === ''}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? 'Saving...' : 'Save stock'}
          </button>
        </div>
      </form>
      <Link href="/grower/products/add" className="inline-flex min-h-10 items-center text-sm font-medium text-green-700 hover:underline">Add a new product →</Link>
    </div>
  );
}
