'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGrowerProductOptions } from '@/app/hooks/useGrowerProductOptions';
import { Product } from '@/types';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { formatProductUnit } from '@/lib/product-display';

const LOW_STOCK_THRESHOLD = 10;

type DispensaryOption = {
  id: string;
  businessName: string;
  city: string;
  state: string;
};

type DirectRequestItem = {
  productId: string;
  quantity: number | string;
  unitPrice: number;
};

export default function AddOrderPage() {
  const router = useRouter();
  const [dispensaries, setDispensaries] = useState<DispensaryOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const { options: productOptions, loading: loadingProducts, error: productError, hasMore, loadMore } = useGrowerProductOptions<Product>(productSearch, 'active');
  const pickedProducts = useRef(new Map<string, Product>());
  const [formData, setFormData] = useState<{dispensaryId: string; items: DirectRequestItem[]; notes: string; shippingFee: string}>({
    dispensaryId: '',
    items: [] as DirectRequestItem[],
    notes: '',
    shippingFee: '0',
  });
  const products = useMemo(() => {
    const selected = formData.items.map(item => pickedProducts.current.get(item.productId)).filter((product): product is Product => Boolean(product));
    return [...new Map([...productOptions, ...selected].map(product => [product.id, product])).values()];
  }, [productOptions, formData.items]);
  useEffect(() => { pickedProducts.current = new Map(products.map(product => [product.id, product])); }, [products]);
  const [dispensaryQuery, setDispensaryQuery] = useState('');
  const [isDispensaryListOpen, setIsDispensaryListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const submitRef = useRef(false);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const dispRes = await fetch('/api/dispensaries');
      if (!dispRes.ok) throw new Error('Could not load customers and products. Please reload and try again.');
      if (dispRes.ok) {
        const dispData = await dispRes.json();
        setDispensaries(Array.isArray(dispData) ? dispData : []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load request options.');
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId: string) => products.find((p) => p?.id === productId);
  const getDispensaryLabel = (dispensary: DispensaryOption) =>
    `${dispensary.businessName} - ${dispensary.city}, ${dispensary.state}`;

  const selectedDispensary = dispensaries.find((dispensary) => dispensary.id === formData.dispensaryId);
  const filteredDispensaries = useMemo(() => {
    const query = dispensaryQuery.trim().toLowerCase();
    if (!query) return dispensaries;

    return dispensaries.filter((dispensary) =>
      [
        dispensary.businessName,
        dispensary.city,
        dispensary.state,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [dispensaries, dispensaryQuery]);

  const selectDispensary = (dispensary: DispensaryOption) => {
    setFormData((prev) => ({ ...prev, dispensaryId: dispensary.id }));
    setDispensaryQuery(getDispensaryLabel(dispensary));
    setIsDispensaryListOpen(false);
    setError(null);
  };

  const getSelectedProductIds = (items = formData.items) => new Set(items.map((item) => item.productId).filter(Boolean));

  const getAllocatedQuantity = (
    items: DirectRequestItem[],
    productId: string,
    excludeIndex?: number
  ) => items.reduce((sum, item, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) return sum;
    if (item.productId !== productId) return sum;
    return sum + (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0);
  }, 0);

  const getRemainingForLine = (
    items: DirectRequestItem[],
    productId: string,
    lineIndex: number
  ) => {
    const product = getProductById(productId);
    const totalAvailable = Number(product?.inventoryQty || 0);
    const allocatedElsewhere = getAllocatedQuantity(items, productId, lineIndex);
    return Math.max(0, totalAvailable - allocatedElsewhere);
  };

  const getInventoryIssues = (items: DirectRequestItem[]) => {
    const issues: { productName: string; requested: number; available: number }[] = [];

    const byProduct = new Map<string, number>();
    items.forEach((item) => {
      if (!item.productId) return;
      byProduct.set(item.productId, (byProduct.get(item.productId) || 0) + (Number(item.quantity) || 0));
    });

    for (const [productId, requested] of byProduct.entries()) {
      const product = getProductById(productId);
      const available = Number(product?.inventoryQty || 0);
      if (!product || requested > available) {
        issues.push({
          productName: product?.name || 'Unknown product',
          requested,
          available,
        });
      }
    }

    return issues;
  };

  const handleSetMaxQuantity = (index: number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      if (!item) return prev;
      const maxForLine = getRemainingForLine(newItems, item.productId, index);
      newItems[index] = {
        ...item,
        quantity: maxForLine,
      };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const selectedProductIds = getSelectedProductIds();
    const firstProduct = products.find((product) => !selectedProductIds.has(product.id));
    if (!firstProduct) {
      setError('All available products are already in this request. Adjust quantities on the existing lines.');
      return;
    }
    const newItem = {
      productId: firstProduct?.id || '',
      quantity: 1,
      unitPrice: typeof firstProduct?.price === 'number' ? firstProduct.price : 0,
    };
    setError(null);
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i: number) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const currentItem = newItems[index];
      if (!currentItem) return prev;

      if (field === 'productId') {
        const productId = String(value);
        const product = products.find((p) => p?.id === productId);
        const duplicateIndex = newItems.findIndex((item, itemIndex) => itemIndex !== index && item.productId === productId);

        if (duplicateIndex >= 0) {
          const nextItems = newItems.filter((_, itemIndex) => itemIndex !== index);
          const targetIndex = duplicateIndex > index ? duplicateIndex - 1 : duplicateIndex;
          const targetItem = nextItems[targetIndex];
          const totalAvailable = Number(product?.inventoryQty || 0);
          const requestedQuantity = Number(currentItem.quantity || 0);
          const mergedQuantity = Math.min(
            totalAvailable,
            Number(targetItem.quantity || 0) + Math.max(requestedQuantity, 1)
          );

          nextItems[targetIndex] = {
            ...targetItem,
            quantity: mergedQuantity,
          };

          return { ...prev, items: nextItems };
        }
      }

      newItems[index] = { ...currentItem, [field]: value };

      if (field === 'productId') {
        const product = products.find((p) => p?.id === value);
        if (product) {
          newItems[index].unitPrice = typeof product?.price === 'number' ? product.price : 0;
        }

        const maxForLine = getRemainingForLine(newItems, String(value), index);
        if (maxForLine <= 0) {
          newItems[index].quantity = 0;
        } else if (Number(newItems[index].quantity) > maxForLine || Number(newItems[index].quantity) <= 0) {
          newItems[index].quantity = Math.min(Math.max(Number(newItems[index].quantity) || 1, 1), maxForLine);
        }
      }


      return { ...prev, items: newItems };
    });
  };

  const calculateSubtotal = () =>
    formData.items.reduce((total: number, item) => {
      const qty = Number(item.quantity) || 0;
      const price = typeof item?.unitPrice === 'number' ? item.unitPrice : 0;
      return total + qty * Math.round(price * 100);
    }, 0) / 100;

  const calculateTax = () => 0;
  const shippingFee = parseFloat(formData?.shippingFee || '0') || 0;
  const calculateTotal = () => (Math.round(calculateSubtotal() * 100) + Math.round(calculateTax() * 100) + Math.round(shippingFee * 100)) / 100;

  const hasInvalidQuantities = formData.items.some((item) => (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0));
  const inventoryIssues = getInventoryIssues(formData.items);
  const firstInventoryIssue = inventoryIssues[0];
  const hasProductsAvailableToAdd = products.some((product) => !getSelectedProductIds().has(product.id));
  const submitHint = (() => {
    if (!formData.dispensaryId) return 'Select a dispensary before recording the request.';
    if (formData.items.length === 0) return 'Add at least one product line item.';
    if (hasInvalidQuantities) return 'Each line item needs a quantity of at least 1.';
    if (firstInventoryIssue) {
      return `Adjust ${firstInventoryIssue.productName}; requested ${firstInventoryIssue.requested}, available ${firstInventoryIssue.available}.`;
    }
    return '';
  })();
  const canSubmitOrder = (
    !loading &&
    !isSubmitting &&
    Boolean(formData.dispensaryId) &&
    formData.items.length > 0 &&
    !hasInvalidQuantities &&
    inventoryIssues.length === 0
  );

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (submitRef.current) return;
    if (!canSubmitOrder) {
      if (!formData.dispensaryId) {
        setError('Please select a dispensary');
      } else if (formData.items.length === 0) {
        setError('Please add at least one product');
      } else if (hasInvalidQuantities) {
        setError('Each line item must have a quantity of at least 1.');
      } else if (firstInventoryIssue) {
        setError(`Not enough inventory for ${firstInventoryIssue.productName} (requested ${firstInventoryIssue.requested}, available ${firstInventoryIssue.available}).`);
      }
      return;
    }

    submitRef.current = true;
    setError(null);
    setIsSubmitting(true);

    try {
      const sanitizedItems = formData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispensaryId: formData.dispensaryId,
          items: sanitizedItems,
          notes: formData.notes.trim() || null,
          shippingFee: shippingFee,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        router.push('/grower/orders');
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409 && Array.isArray(errorData.issues) && errorData.issues.length > 0) {
          const first = errorData.issues[0];
          setError(`Inventory changed for ${first.productName} (requested ${first.requested}, available ${first.available}). Please review quantities.`);
        } else {
          setError(errorData.error || errorData.message || 'Failed to create order');
        }
      }
    } catch {
      setError('Failed to create order');
    } finally {
      submitRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-green-100 rounded-full p-4 mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Direct Request Recorded</h2>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader title="Record request" description="Record an agreement made directly with a buyer." />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 space-y-3 sm:p-4 sm:space-y-4">
            <div>
              <label htmlFor="request-buyer" className="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
              <div className="relative">
                <input
                  id="request-buyer"
                  type="text"
                  value={isDispensaryListOpen ? dispensaryQuery : selectedDispensary ? getDispensaryLabel(selectedDispensary) : dispensaryQuery}
                  onFocus={() => {
                    setDispensaryQuery(selectedDispensary ? getDispensaryLabel(selectedDispensary) : '');
                    setIsDispensaryListOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setIsDispensaryListOpen(false), 120);
                  }}
                  onChange={(e) => {
                    setDispensaryQuery(e.target.value);
                    setFormData((prev) => ({ ...prev, dispensaryId: '' }));
                    setIsDispensaryListOpen(true);
                  }}
                  role="combobox"
                  aria-expanded={isDispensaryListOpen}
                  aria-controls="dispensary-combobox-results"
                  aria-autocomplete="list"
                  placeholder="Search by name or city"
                  className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  required
                />
                {isDispensaryListOpen && (
                  <div
                    id="dispensary-combobox-results"
                    role="listbox"
                    className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                  >
                    {filteredDispensaries.length > 0 ? (
                      filteredDispensaries.map((dispensary) => (
                        <button
                          key={dispensary.id}
                          type="button"
                          role="option"
                          aria-selected={formData.dispensaryId === dispensary.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectDispensary(dispensary)}
                          className="flex w-full flex-col px-3 py-2 text-left hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline-none"
                        >
                          <span className="text-sm font-medium text-gray-900">{dispensary.businessName}</span>
                          <span className="text-xs text-gray-500">{dispensary.city}, {dispensary.state}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-3 text-sm text-gray-500">No dispensaries match that search.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-3 sm:p-4">
            <h2 className="font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={isSubmitting || !hasProductsAvailableToAdd}
              className="min-h-10 rounded border px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              title={hasProductsAvailableToAdd ? 'Add product line' : 'All available products are already selected'}
            >
              Add item
            </button>
          </div>
          <div className="p-3 sm:p-4">
            <label className="sr-only" htmlFor="order-product-search">Search products</label>
            <input id="order-product-search" type="search" value={productSearch} onChange={event => setProductSearch(event.target.value)} placeholder="Search products" className="mb-3 w-full rounded-lg border px-3 py-2 text-base" />
            {productError && <p role="alert" className="text-sm text-red-600">{productError}</p>}
            {hasMore && <button type="button" disabled={loadingProducts} onClick={loadMore} className="mb-3 min-h-10 text-sm text-green-700">More products</button>}
            {loadingProducts && <p className="text-sm text-gray-500">Loading products…</p>}
            {products.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-700 font-medium mb-2">No matching products</p>
                <p className="text-sm text-gray-500 mb-4">Search for another product or add a listing.</p>
                <Link href="/grower/products/add" className="text-green-600 hover:text-green-700 font-medium">
                  Add a product
                </Link>
              </div>
            ) : formData.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-center text-sm text-gray-600">Use Add item to choose products.</p>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index: number) => {
                  const product = getProductById(item.productId);
                  const totalAvailable = Number(product?.inventoryQty || 0);
                  const remainingForLine = getRemainingForLine(formData.items, item.productId, index);
                  const isLowStock = totalAvailable > 0 && totalAvailable <= LOW_STOCK_THRESHOLD;
                  const isOverLimit = Number(item.quantity) > remainingForLine;

                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border space-y-2 sm:p-4 sm:space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_8rem_9rem_auto] gap-3">
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="min-h-10 min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                          >
                            {products.map((p) => {
                              const remainingForOption = getRemainingForLine(formData.items, p.id, index);
                              const disabled = remainingForOption <= 0 && p.id !== item.productId;
                              return (
                                <option key={p.id} value={p.id} disabled={disabled}>
                                  {p.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={remainingForLine > 0 ? 1 : 0}
                              max={remainingForLine}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              onBlur={(e) => handleItemChange(index, 'quantity', Math.min(remainingForLine, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                              className="min-h-10 min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetMaxQuantity(index)}
                              className="min-h-10 rounded-lg border border-gray-300 px-2 py-2 text-sm font-medium hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                              title="Use maximum available quantity"
                            >
                              Max
                            </button>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                            <span>Agreed price</span>
                          </label>
                          <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-green-500">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="min-h-10 min-w-0 flex-1 border-0 px-3 py-2 text-base focus:outline-none"
                            />
                            <span className="flex items-center border-l border-gray-200 bg-gray-50 px-2 text-xs text-gray-500">
                              / {formatProductUnit(product?.unit)}
                            </span>
                          </div>
                        </div>
                        <div className="hidden items-end justify-end sm:flex">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="min-h-10 rounded px-2 py-2 text-sm text-right text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 sm:w-auto sm:text-right"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button type="button" onClick={() => handleRemoveItem(index)} className="order-last ml-auto min-h-10 rounded px-2 py-2 text-sm text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 sm:hidden">Remove</button>
                        <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                          <span className="font-semibold">{remainingForLine} {formatProductUnit(product?.unit)}</span>&nbsp;available
                        </span>
                        {isLowStock && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
                            Low stock
                          </span>
                        )}
                        {isOverLimit && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700">
                            Requested quantity exceeds available stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>
        <details className="rounded-xl border border-gray-200 bg-white px-3 py-1 sm:p-4">
          <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold sm:py-0">Shipping &amp; notes</summary>
          <div className="mt-2 grid gap-3 pb-2 sm:mt-4 sm:gap-4 sm:grid-cols-2 sm:pb-0">            <div>
              <label htmlFor="request-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="request-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="request-shipping" className="block text-sm font-medium text-gray-700 mb-1">Shipping ($)</label>
              <input
                id="request-shipping"
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingFee: e.target.value }))}
                className="min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </details>
        {formData.items.length > 0 && <>                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between"><span>Subtotal</span><span>${calculateSubtotal().toFixed(2)}</span></div>
                  {calculateTax() > 0 && <div className="flex justify-between"><span>Recorded tax</span><span>${calculateTax().toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span>Shipping</span><span>${shippingFee.toFixed(2)}</span></div>
                  <div className="flex justify-between pt-2 border-t font-bold"><span>Est. total</span><span className="text-green-600">${calculateTotal().toFixed(2)}</span></div>
                  <p className="pt-2 text-xs text-gray-500">Payment is arranged directly with the buyer.</p>
                </div>
        </>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!canSubmitOrder} className="min-h-10 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Record request'}</button>
          <Link href="/grower/orders" className={`inline-flex min-h-10 items-center rounded-lg border border-gray-300 px-4 py-2 text-sm ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>Cancel</Link>
        </div>
        {submitHint && <p className="text-xs text-gray-500">{submitHint}</p>}
      </form>
    </div>
  );
}
