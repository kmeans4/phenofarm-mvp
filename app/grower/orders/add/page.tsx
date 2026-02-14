'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Product } from '@/types';

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
          setProducts(prodData.filter((p) => (p?.inventoryQty || 0) > 0));
        }
      }
    } catch {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    const newItem = {
      productId: firstProduct?.id || '',
      quantity: 1,
      unitPrice: typeof firstProduct?.price === 'number' ? firstProduct.price : 0,
    };
    setFormData((prev: unknown) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev: unknown) => ({
      ...prev,
      items: prev.items.filter((_: unknown, i: number) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: unknown) => {
    setFormData((prev: unknown) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'productId') {
        const product = products.find((p) => p?.id === value);
        if (product) {
          newItems[index].unitPrice = typeof product?.price === 'number' ? product.price : 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.dispensaryId) {
      setError('Please select a dispensary');
      setIsSubmitting(false);
      return;
    }
    if (formData.items.length === 0) {
      setError('Please add at least one product');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispensaryId: formData.dispensaryId,
          items: formData.items,
          notes: formData.notes || null,
          shippingFee: shippingFee,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/grower/orders'), 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to create order');
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
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">Add items to fulfill a dispensary order</p>
        </div>
        <div className="flex gap-3">
          <Link href="/grower/orders" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
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
                onChange={(e) => setFormData((prev: unknown) => ({ ...prev, dispensaryId: e.target.value }))}
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
                onChange={(e) => setFormData((prev: unknown) => ({ ...prev, notes: e.target.value }))}
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
                onChange={(e) => setFormData((prev: unknown) => ({ ...prev, shippingFee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between">
            <h2 className="font-semibold text-gray-900">Items</h2>
            <button type="button" onClick={handleAddItem} className="px-3 py-1 border rounded hover:bg-gray-50">+ Add</button>
          </div>
          <div className="p-4">
            {products.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No products available.</p>
            ) : formData.items.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No items. Click &quot;Add&quot; to start.</p>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index: number) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ${typeof p.price === 'number' ? p.price.toFixed(2) : '0.00'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="w-32">
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
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600">Remove</button>
                    </div>
                  </div>
                ))}

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
