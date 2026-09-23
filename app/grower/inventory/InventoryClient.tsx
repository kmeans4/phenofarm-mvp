'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { OperationsSummary } from '../components/OperationsSummary';
import { formatProductMoney, formatProductUnit } from '@/lib/product-display';
import { toast } from '@/app/hooks/useToast';

const LOW_STOCK_THRESHOLD = 10;

export interface InventoryProduct {
  id: string;
  name: string;
  productType: string | null;
  subType: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  strainName: string | null;
}

type InventoryFilter = 'all' | 'low-stock' | 'out-of-stock' | 'unavailable';

function getProductTypeLabel(product: InventoryProduct) {
  if (product.productType) {
    return `${product.productType}${product.subType ? ` - ${product.subType}` : ''}`;
  }

  return '-';
}

function InventoryStatusBadge({ isAvailable, quantity }: { isAvailable?: boolean; quantity?: number }) {
  if ((quantity || 0) <= 0) {
    return <span className="rounded-full bg-pf-danger-bg px-2 py-1 text-xs font-medium text-pf-danger">Out of Stock</span>;
  }
  if (!isAvailable) {
    return <span className="rounded-full bg-pf-surface px-2 py-1 text-xs font-medium text-pf-secondary">Unavailable</span>;
  }
  return <span className="rounded-full bg-pf-accent-bg px-2 py-1 text-xs font-medium text-pf-accent">Available</span>;
}

interface InventoryClientProps {
  initialProducts: InventoryProduct[];
  view: InventoryFilter;
  counts: Record<string, number>;
  inventoryValue: number;
}

export function InventoryClient({ initialProducts, view, counts, inventoryValue }: InventoryClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const activeFilter = view;
  const setActiveFilter = (filter: InventoryFilter) => startTransition(() => router.push(`/grower/inventory?view=${filter}`));
  useEffect(() => { setProducts(initialProducts); setQuantityDrafts({}); }, [initialProducts]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const productsRef = useRef(initialProducts);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const totalValue = inventoryValue + products.reduce((sum, product) => {
    const original = initialProducts.find(item => item.id === product.id);
    return sum + product.price * (product.inventoryQty - (original?.inventoryQty ?? product.inventoryQty));
  }, 0);
  const lowStockCount = counts['low-stock'] || 0;
  const filterOptions = useMemo(() => [
    { key: 'all' as const, label: 'All', count: counts.all || 0 },
    { key: 'low-stock' as const, label: 'Low stock', count: counts['low-stock'] || 0 },
    { key: 'out-of-stock' as const, label: 'Out of stock', count: counts['out-of-stock'] || 0 },
    { key: 'unavailable' as const, label: 'Unavailable', count: counts.unavailable || 0 },
  ], [counts]);
  const filteredProducts = products;

  const setPending = (productId: string, isPending: boolean) => {
    setPendingProductIds((prev) => {
      const next = new Set(prev);
      if (isPending) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const updateProductQuantity = async (
    productId: string,
    nextQuantity: number,
    options: { showUndo?: boolean } = {},
  ) => {
    const product = productsRef.current.find((item) => item.id === productId);
    if (!product) return;

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setQuantityDrafts((prev) => ({ ...prev, [productId]: String(product.inventoryQty) }));
      toast.error('Enter a non-negative whole number');
      return;
    }

    const previousQuantity = product.inventoryQty;
    if (nextQuantity === previousQuantity) {
      setQuantityDrafts((prev) => ({ ...prev, [productId]: String(previousQuantity) }));
      return;
    }

    setPending(productId, true);
    setProducts((prev) => prev.map((item) => (
      item.id === productId ? { ...item, inventoryQty: nextQuantity } : item
    )));
    setQuantityDrafts((prev) => ({ ...prev, [productId]: String(nextQuantity) }));

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantityAvailable: nextQuantity }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data
          ? String((data as { error?: unknown }).error)
          : 'Failed to update stock';
        throw new Error(message);
      }

      const confirmedQuantity = data && typeof data === 'object' && 'inventoryQty' in data
        ? Number((data as { inventoryQty?: unknown }).inventoryQty)
        : nextQuantity;
      const safeQuantity = Number.isInteger(confirmedQuantity) && confirmedQuantity >= 0
        ? confirmedQuantity
        : nextQuantity;

      setProducts((prev) => prev.map((item) => (
        item.id === productId ? { ...item, inventoryQty: safeQuantity } : item
      )));
      setQuantityDrafts((prev) => ({ ...prev, [productId]: String(safeQuantity) }));

      router.refresh();
      toast.success('Stock updated', {
        description: `${product.name} is now ${safeQuantity} ${formatProductUnit(product.unit)}.`,
        action: options.showUndo === false ? undefined : {
          label: 'Undo',
          onClick: () => {
            void updateProductQuantity(productId, previousQuantity, { showUndo: false });
          },
        },
      });
    } catch (error) {
      setProducts((prev) => prev.map((item) => (
        item.id === productId ? { ...item, inventoryQty: previousQuantity } : item
      )));
      setQuantityDrafts((prev) => ({ ...prev, [productId]: String(previousQuantity) }));
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setPending(productId, false);
    }
  };

  const commitDraftQuantity = (product: InventoryProduct) => {
    const draft = quantityDrafts[product.id] ?? String(product.inventoryQty);
    const nextQuantity = Number(draft);
    void updateProductQuantity(product.id, nextQuantity);
  };

  const adjustQuantity = (product: InventoryProduct, delta: number) => {
    const draft = quantityDrafts[product.id] ?? String(product.inventoryQty);
    const baseQuantity = Number.isInteger(Number(draft)) ? Number(draft) : product.inventoryQty;
    const nextQuantity = Math.max(0, baseQuantity + delta);
    setQuantityDrafts((prev) => ({ ...prev, [product.id]: String(nextQuantity) }));
    void updateProductQuantity(product.id, nextQuantity);
  };

  const renderStockEditor = (product: InventoryProduct) => {
    const pending = pendingProductIds.has(product.id);
    const draftValue = quantityDrafts[product.id] ?? String(product.inventoryQty);

    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          disabled={pending || product.inventoryQty <= 0}
          onClick={() => adjustQuantity(product, -1)}
          aria-label={`Decrease stock for ${product.name}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={draftValue}
          disabled={pending}
          onChange={(event) => setQuantityDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))}
          onBlur={() => commitDraftQuantity(product)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          aria-label={`Stock quantity for ${product.name}`}
          className="h-10 w-20 rounded-lg border border-pf-line-strong px-2 text-center text-base font-semibold text-pf-text focus:border-pf-accent focus:outline-none focus:ring-2 focus:ring-pf-accent disabled:bg-pf-surface disabled:text-pf-muted sm:text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          disabled={pending}
          onClick={() => adjustQuantity(product, 1)}
          aria-label={`Increase stock for ${product.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  if (counts.all === 0) {
    return (
      <>
        <OperationsSummary items={[{label: 'Products', value: 0}, {label: 'Stock value', value: '$0'}, {label: 'Low stock', value: 0}]} />

        <div className="rounded-lg border border-pf-line bg-pf-surface shadow-sm">
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pf-surface">
              <svg className="h-8 w-8 text-pf-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-pf-text">No inventory yet</h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-pf-muted">
              Add a product to track stock and availability.
            </p>
            <Link href="/grower/products/add" className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 font-medium text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first product
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <OperationsSummary items={[{label: 'Products', value: counts.all}, {label: 'Stock value', value: formatProductMoney(totalValue)}, {label: 'Low stock', value: lowStockCount}]} />

      <p className="hidden text-xs text-pf-muted sm:block">Stock value = list price × quantity on hand.</p>
      <div className="rounded-lg border border-pf-line bg-pf-surface shadow-sm">
        <div className="border-b border-pf-line p-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-pf-muted">Stock edits save automatically.</p>
            </div>
            <label className="sr-only" htmlFor="inventory-mobile-filter">Filter inventory</label>
            <select id="inventory-mobile-filter" disabled={navigating} value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as InventoryFilter)} className="min-h-10 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-base sm:hidden">
              {filterOptions.map((filter) => <option key={filter.key} value={filter.key}>{filter.label} ({filter.count})</option>)}
            </select>
            <div className="hidden flex-wrap gap-2 sm:flex" aria-label="Inventory filters">
              {filterOptions.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  disabled={navigating}
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 ${
                    activeFilter === filter.key
                      ? 'bg-pf-accent-bg text-pf-accent ring-1 ring-inset ring-pf-accent-line'
                      : 'bg-pf-surface text-pf-secondary hover:bg-pf-raised'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === filter.key ? 'bg-pf-accent/15 text-pf-accent' : 'bg-pf-surface text-pf-muted ring-1 ring-pf-line'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <h3 className="text-base font-semibold text-pf-text">No products in this filter</h3>
            <p className="mt-1 text-sm text-pf-muted">Switch filters to see the rest of your inventory.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 p-3 sm:hidden">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-xl border border-pf-line p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-pf-text">{product.name || 'Unnamed'}</div>
                      {product.strainName && <div className="mt-1 truncate text-xs text-pf-muted">{product.strainName}</div>}
                    </div>
                    <InventoryStatusBadge isAvailable={product.isAvailable} quantity={product.inventoryQty} />
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-2 text-sm">
                    <p className="min-w-0 text-pf-muted">{getProductTypeLabel(product)}</p>
                    <p className="shrink-0 font-medium text-pf-text">{formatProductMoney(product.price)}/{formatProductUnit(product.unit)}</p>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-pf-muted">Stock ({formatProductUnit(product.unit)})</p>
                      {renderStockEditor(product)}
                    </div>
                    <Link href={`/grower/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} className="inline-flex min-h-10 items-center rounded-lg border border-pf-line px-3 text-sm font-medium text-pf-accent hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2">Edit</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full divide-y divide-pf-line">
                <thead className="bg-pf-canvas">
                  <tr>
                    <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Product</th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Type</th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Price</th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Inventory</th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Status</th>
                    <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-pf-muted sm:px-6 sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pf-line bg-pf-surface">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={product.inventoryQty <= LOW_STOCK_THRESHOLD ? 'bg-pf-danger-bg/30' : undefined}>
                      <td className="px-3 py-4 sm:px-6">
                        <div className="font-medium text-pf-text sm:text-base">{product.name || 'Unnamed'}</div>
                        {product.strainName && <div className="text-xs text-pf-muted">{product.strainName}</div>}
                      </td>
                      <td className="px-3 py-4 text-sm text-pf-muted sm:px-6">
                        {getProductTypeLabel(product)}
                      </td>
                      <td className="px-3 py-4 text-sm text-pf-muted sm:px-6">
                        {formatProductMoney(product.price)}/{formatProductUnit(product.unit)}
                      </td>
                      <td className="px-3 py-4 text-sm sm:px-6">
                        <div className="flex flex-col gap-1.5">
                          {renderStockEditor(product)}
                          <span className={product.inventoryQty <= LOW_STOCK_THRESHOLD ? 'text-pf-danger font-medium' : 'text-pf-text'}>
                            {product.inventoryQty} {formatProductUnit(product.unit)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 sm:px-6">
                        <InventoryStatusBadge isAvailable={product.isAvailable} quantity={product.inventoryQty} />
                      </td>
                      <td className="px-3 py-4 text-right sm:px-6">
                        <Link
                          href={`/grower/products/${product.id}/edit`}
                          className="text-sm font-medium text-pf-accent hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
