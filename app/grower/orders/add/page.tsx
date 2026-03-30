'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Product } from '@/types';

const LOW_STOCK_THRESHOLD = 10;

export default function AddOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dispensaries, setDispensaries] = useState<{id: string; businessName: string; city: string; state: string}[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<{dispensaryId: string; items: {productId: string; quantity: number; unitPrice: number}[]; notes: string; shippingFee: string}>({
    dispensaryId: '',
    items: [] as {productId: string; quantity: number; unitPrice: number}[],
    notes: '',
    shippingFee: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }
    const user = session?.user;
    if (user?.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [status, session, router]);

  const loadData = async () => {
    try {
      const [dispRes, prodRes] = await Promise.all([
        fetch('/api/dispensaries'),
        fetch('/api/products')
      ]);
      if (dispRes.ok) {
        const dispData = await dispRes.json();
        setDispensaries(Array.isArray(dispData) ? dispData : []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) {
          setProducts(prodData.filter((p) => (p?.inventoryQty || 0) > 0 && p?.isAvailable));
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId: string) => products.find((p) => p?.id === productId);

  const getAllocatedQuantity = (
    items: {productId: string; quantity: number; unitPrice: number}[],
    productId: string,
    excludeIndex?: number
  ) => items.reduce((sum, item, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) return sum;
    if (item.productId !== productId) return sum;
    return sum + (Number.isFinite(item.quantity) ? item.quantity : 0);
  }, 0);

  const getRemainingForLine = (
    items: {productId: string; quantity: number; unitPrice: number}[],
    productId: string,
    lineIndex: number
  ) => {
    const product = getProductById(productId);
    const totalAvailable = Number(product?.inventoryQty || 0);
    const allocatedElsewhere = getAllocatedQuantity(items, productId, lineIndex);
    return Math.max(0, totalAvailable - allocatedElsewhere);
  };

  const getInventoryIssues = (items: {productId: string; quantity: number; unitPrice: number}[]) => {
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
    const firstProduct = products[0];
    const newItem = {
      productId: firstProduct?.id || '',
      quantity: 1,
      unitPrice: typeof firstProduct?.price === 'number' ? firstProduct.price : 0,
    };
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

      newItems[index] = { ...currentItem, [field]: value };

      if (field === 'productId') {
        const product = products.find((p) => p?.id === value);
        if (product) {
          newItems[index].unitPrice = typeof product?.price === 'number' ? product.price : 0;
        }

        const maxForLine = getRemainingForLine(newItems, String(value), index);
        if (maxForLine <= 0) {
          newItems[index].quantity = 0;
        } else if (newItems[index].quantity > maxForLine || newItems[index].quantity <= 0) {
          newItems[index].quantity = Math.min(Math.max(newItems[index].quantity || 1, 1), maxForLine);
        }
      }

      if (field === 'quantity') {
        const requestedQty = Number(value) || 0;
        const maxForLine = getRemainingForLine(newItems, newItems[index].productId, index);

        if (maxForLine <= 0) {
          newItems[index].quantity = 0;
        } else {
          newItems[index].quantity = Math.min(Math.max(requestedQty, 1), maxForLine);
        }
      }

      return { ...prev, items: newItems };
    });
  };

  const calculateSubtotal = () =>
    formData.items.reduce((total: number, item) => {
      const qty = typeof item?.quantity === 'number' ? item.quantity : 0;
      const price = typeof item?.unitPrice === 'number' ? item.unitPrice : 0;
      return total + (qty * price);
    }, 0);

  const calculateTax = () => calculateSubtotal() * 0.06;
  const shippingFee = parseFloat(formData?.shippingFee || '0') || 0;
  const calculateTotal = () => calculateSubtotal() + calculateTax() + shippingFee;

  const hasInvalidQuantities = formData.items.some((item) => (Number(item.quantity) || 0) <= 0);
  const inventoryIssues = getInventoryIssues(formData.items);
  const firstInventoryIssue = inventoryIssues[0];
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
        setTimeout(() => router.push('/grower/orders'), 2000);
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
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created!</h2>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Add items to fulfill a dispensary order</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
          <Link
            href="/grower/orders"
            className={`w-full sm:w-auto text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmitOrder}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Order Details</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispensary *</label>
              <select
                value={formData.dispensaryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, dispensaryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select...</option>
                {dispensaries.map((d) => (
                  <option key={d.id} value={d.id}>{d.businessName} - {d.city}, {d.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingFee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between">
            <h2 className="font-semibold text-gray-900">Items</h2>
            <button type="button" onClick={handleAddItem} disabled={isSubmitting} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">+ Add</button>
          </div>
          <div className="p-4">
            {products.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-700 font-medium mb-2">No products available to add</p>
                <p className="text-sm text-gray-500 mb-4">Next step: create at least one product before building an order.</p>
                <Link href="/grower/products/add" className="text-green-600 hover:text-green-700 font-medium">
                  Add a product
                </Link>
              </div>
            ) : formData.items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-700 font-medium mb-2">No items in this order yet</p>
                <p className="text-sm text-gray-500">Click <span className="font-medium text-gray-700">Add</span> above to include your first line item.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index: number) => {
                  const product = getProductById(item.productId);
                  const totalAvailable = Number(product?.inventoryQty || 0);
                  const remainingForLine = getRemainingForLine(formData.items, item.productId, index);
                  const isLowStock = totalAvailable > 0 && totalAvailable <= LOW_STOCK_THRESHOLD;
                  const isOverLimit = item.quantity > remainingForLine;

                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {products.map((p) => {
                              const remainingForOption = getRemainingForLine(formData.items, p.id, index);
                              const disabled = remainingForOption <= 0 && p.id !== item.productId;
                              return (
                                <option key={p.id} value={p.id} disabled={disabled}>
                                  {p.name} - ${typeof p.price === 'number' ? p.price.toFixed(2) : '0.00'} ({remainingForOption} available)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={remainingForLine > 0 ? 1 : 0}
                              max={remainingForLine}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetMaxQuantity(index)}
                              className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
                              title="Use maximum available quantity"
                            >
                              Max
                            </button>
                          </div>
                        </div>
                        <div className="w-full sm:w-32">
                          <label className="block text-xs text-gray-500 mb-1">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="flex items-end">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="w-full sm:w-auto text-left sm:text-right text-red-600">Remove</button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                          Available now: <span className="ml-1 font-semibold text-gray-900">{remainingForLine}</span>
                        </span>
                        {isLowStock && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
                            Low stock ({totalAvailable} total remaining)
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

                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${calculateSubtotal().toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax (6%):</span><span>${calculateTax().toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping:</span><span>${shippingFee.toFixed(2)}</span></div>
                  <div className="flex justify-between pt-2 border-t font-bold"><span>Total:</span><span className="text-green-600">${calculateTotal().toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
