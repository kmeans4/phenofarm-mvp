'use client';

import { useState, useRef } from 'react';
import { useGrowerProductOptions } from '@/app/hooks/useGrowerProductOptions';
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

  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState('');

  const pendingRef = useRef(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
  const { options: filteredProducts, loading, error: loadError, hasMore, loadMore } = useGrowerProductOptions<StockProduct>(productSearch);

  const handleProductPick = (product: StockProduct) => {
    setSelectedProduct(product);
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


  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 sm:space-y-5">
      <PageHeader title="Update stock" />

      {error && (
        <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg text-pf-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line">
          <div className="p-3 space-y-3 sm:p-4 sm:space-y-4">
            <div>
              <label htmlFor="stock-product-search" className="block text-sm font-medium text-pf-secondary mb-1">Product *</label>
              <input
                id="stock-product-search"
                type="search"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductId('');
                  setSelectedProduct(null);
                }}
                className="w-full rounded-lg border border-pf-line-strong px-3 py-2 focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent"
                placeholder="Search products"
                autoComplete="off"

              />


              {!selectedProduct && <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-pf-line bg-pf-surface shadow-sm">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductPick(product)}
                      className={`flex w-full items-start justify-between gap-3 border-b border-pf-line px-3 py-2 text-left text-sm last:border-b-0 hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pf-accent ${
                        product.id === productId ? 'bg-pf-accent-bg text-pf-accent' : 'text-pf-secondary'
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{product.name || 'Unnamed product'}</span>
                        <span className="block text-xs text-pf-muted">
                          {[product.productType, product.subType, product.strain?.name]
                            .filter(Boolean)
                            .join(' · ') || 'No type or strain'}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-pf-muted">
                        {product.inventoryQty ?? 0} {formatProductUnit(product.unit)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-pf-muted">{loading ? 'Loading products…' : loadError || 'No products match that search.'}</div>
                )}
              {hasMore && <button type="button" disabled={loading} onClick={loadMore} className="w-full px-3 py-2 text-sm text-pf-accent">{loadError ? 'Retry products' : 'More products'}</button>}
              </div>}

              {selectedProduct && (
                <p className="mt-1 text-sm text-pf-muted">
                  Current stock: {selectedProduct.inventoryQty ?? 0} {formatProductUnit(selectedProduct.unit)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock-quantity" className="block text-sm font-medium text-pf-secondary mb-1">Stock on hand *</label>
              <input
                id="stock-quantity"
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-pf-line-strong px-3 py-2 focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-pf-muted">Replaces the current stock.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/grower/inventory" className="flex-1 rounded-lg border border-pf-line-strong px-4 py-2 text-center hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 sm:w-auto">Cancel</Link>
          <button
            type="submit"
            disabled={isSubmitting || !productId || quantity === ''}
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? 'Saving...' : 'Save stock'}
          </button>
        </div>
      </form>
      <Link href="/grower/products/add" className="inline-flex min-h-10 items-center text-sm font-medium text-pf-accent hover:underline">Add a new product →</Link>
    </div>
  );
}
