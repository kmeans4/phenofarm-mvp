'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';

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
  const [sessionLoaded, setSessionLoaded] = useState(false);
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
  const [loadingDispensaries, setLoadingDispensaries] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getServerSession(authOptions);
      if (!session) {
        redirect('/auth/sign_in');
      }
      setSessionLoaded(true);
      loadDispensaries();
      loadProducts();
    };

    checkSession();
  }, []);

  const loadDispensaries = async () => {
    try {
      const response = await fetch('/api/dispensaries');
      if (response.ok) {
        const data = await response.json();
        setDispensaries(data);
      }
    } catch (err) {
      console.error('Error loading dispensaries:', err);
    } finally {
      setLoadingDispensaries(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.inventoryQty > 0));
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;

    const newItem: OrderItem = {
      productId: products[0].id,
      quantity: 1,
      unitPrice: products[0].price,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
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
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      // Update unit price if product changes
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          newItems[index].unitPrice = product.price;
        }
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.06; // 6% tax rate
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + (parseFloat(formData.shippingFee) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate
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

    // Check inventory
    for (const item of formData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.inventoryQty < item.quantity) {
        setError(`Insufficient inventory for ${product.name}. Available: ${product.inventoryQty}`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const orderData = {
        dispensaryId: formData.dispensaryId,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: formData.notes || null,
        shippingFee: parseFloat(formData.shippingFee) || 0,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/grower/orders');
        }, 2000);
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

  if (!sessionLoaded) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created Successfully!</h2>
          <p className="text-gray-600">Redirecting to orders page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      <form onSubmit={handleSubmit}>
        {/* Dispensary Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Dispensary *
              </label>
              <select
                value={formData.dispensaryId}
                onChange={(e) => {
                  const selected = dispensaries.find(d => d.id === e.target.value);
                  setSelectedDispensary(selected || null);
                  setFormData(prev => ({ ...prev, dispensaryId: e.target.value }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select a dispensary</option>
                {dispensaries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.businessName} - {d.city}, {d.state}
                  </option>
                ))}
              </select>
              {selectedDispensary && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedDispensary.businessName}
                  {selectedDispensary.address && `, ${selectedDispensary.address}`}
                  {selectedDispensary.city && `, ${selectedDispensary.city}`}
                  {selectedDispensary.state && ` ${selectedDispensary.state}`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Special instructions for this order..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingFee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order Items</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddItem} type="button">
                + Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-600">No products available. Please add products first.</p>
              </div>
            ) : formData.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No items added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Product
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {products.filter(p => item.productId === p.id || p.inventoryQty > 0).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - {p.strain || 'No strain'} - ${p.price.toFixed(2)}
                              {p.inventoryQty < 10 && ' (Low stock)'}
                              {p.inventoryQty === 0 && ' (Out of stock)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Subtotal
                        </label>
                        <p className="px-3 py-2 text-lg font-bold text-gray-900">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-start pt-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (6%):</span>
                      <span className="font-medium">${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">${(parseFloat(formData.shippingFee) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
