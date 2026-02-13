'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

interface Dispensary {
  id: string;
  businessName: string;
  city: string;
  state: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  strain: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface OrderFormData {
  dispensaryId: string;
  items: OrderItem[];
  notes: string;
  shippingFee: string;
}

export default function AddOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<OrderFormData>({
    dispensaryId: '',
    items: [],
    notes: '',
    shippingFee: '0',
  });
  const [selectedDispensary, setSelectedDispensary] = useState<Dispensary | null>(null);
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

    const user = session.user as any;
    if (user.role !== 'GROWER') {
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
        setDispensaries(dispData);
      }
      
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.filter((p: Product) => p.inventoryQty > 0));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const newItem: OrderItem = {
      productId: products[0].id,
      quantity: 1,
      unitPrice: products[0].price,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) newItems[index].unitPrice = product.price;
      }
      return { ...prev, items: newItems };
    });
  };

  const calculateSubtotal = () => formData.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  const calculateTax = () => calculateSubtotal() * 0.06;
  const calculateTotal = () => calculateSubtotal() + calculateTax() + (parseFloat(formData.shippingFee) || 0);

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
          shippingFee: parseFloat(formData.shippingFee) || 0,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/grower/orders'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create order');
      }
    } catch (err) {
      setError('Failed to create order. Please try again.');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">Add items to fulfill a dispensary order</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/grower/orders')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Dispensary *</label>
              <select
                value={formData.dispensaryId}
                onChange={(e) => {
                  const selected = dispensaries.find(d => d.id === e.target.value);
                  setSelectedDispensary(selected || null);
                  setFormData(prev => ({ ...prev, dispensaryId: e.target.value }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select a dispensary</option>
                {dispensaries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.businessName} - {d.city}, {d.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Special instructions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Fee ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingFee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order Items</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddItem} type="button">+ Add Product</Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No products available.</p>
              </div>
            ) : formData.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No items added. Click "Add Product" to start.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ${p.price.toFixed(2)}
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
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
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
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (6%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${(parseFloat(formData.shippingFee) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
