'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useToast } from '@/app/hooks/useToast';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    strain: string | null;
    unit: string;
  };
}

interface Order {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  notes: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  dispensary: {
    businessName: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  };
  items: OrderItem[];
}

interface FieldErrors {
  shippingFee?: string;
  tax?: string;
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-orange-100 text-orange-800' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const validateShippingFee = (fee: number): string | undefined => {
  if (fee < 0) return 'Shipping fee cannot be negative';
  if (fee > 999999.99) return 'Shipping fee exceeds maximum allowed';
  return undefined;
};

const validateTax = (tax: number): string | undefined => {
  if (tax < 0) return 'Tax cannot be negative';
  if (tax > 999999.99) return 'Tax exceeds maximum allowed';
  return undefined;
};

const validateNotes = (notes: string): string | undefined => {
  if (!notes) return undefined;
  if (notes.length > 1000) return 'Notes must be less than 1000 characters';
  return undefined;
};

const validateQuantity = (qty: number): string | undefined => {
  if (qty < 1) return 'Quantity must be at least 1';
  if (qty > 9999) return 'Quantity cannot exceed 9999';
  return undefined;
};

const INPUT_CLASSES = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const INPUT_ERROR_CLASSES = "w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";

export default function EditOrderForm({ order }: { order: Order }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [shippingFee, setShippingFee] = useState(order.shippingFee);
  const [tax, setTax] = useState(order.tax);
  const [items, setItems] = useState(order.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const initialData = {
    status: order.status,
    notes: order.notes || '',
    shippingFee: order.shippingFee,
    tax: order.tax,
    items: order.items,
  };

  const currentData = { status, notes, shippingFee, tax, items };

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in this order. Are you sure you want to leave?',
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  }, [currentData, setIsDirty]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + shippingFee + tax;
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {
      shippingFee: validateShippingFee(shippingFee),
      tax: validateTax(tax),
      notes: validateNotes(notes),
    };
    
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FieldErrors] === undefined) {
        delete newErrors[key as keyof FieldErrors];
      }
    });
    
    const invalidItems = items.filter(item => validateQuantity(item.quantity));
    if (invalidItems.length > 0) {
      showToast('error', 'One or more items have invalid quantities');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && invalidItems.length === 0;
  };

  const validateField = (field: keyof FieldErrors, value: string | number): string | undefined => {
    switch (field) {
      case 'shippingFee': return validateShippingFee(Number(value) || 0);
      case 'tax': return validateTax(Number(value) || 0);
      case 'notes': return validateNotes(String(value));
      default: return undefined;
    }
  };

  const handleShippingFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setShippingFee(numValue);
    if (touched.shippingFee) {
      const error = validateShippingFee(numValue);
      setErrors(prev => ({ ...prev, shippingFee: error }));
    }
  };

  const handleTaxChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTax(numValue);
    if (touched.tax) {
      const error = validateTax(numValue);
      setErrors(prev => ({ ...prev, tax: error }));
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (touched.notes) {
      const error = validateNotes(value);
      setErrors(prev => ({ ...prev, notes: error }));
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let value: string | number;
    switch (field) {
      case 'shippingFee': value = shippingFee; break;
      case 'tax': value = tax; break;
      case 'notes': value = notes; break;
      default: value = '';
    }
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    const error = validateQuantity(newQuantity);
    if (error) {
      showToast('error', error);
      return;
    }
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    if (!confirm('Remove this item from the order?')) return;
    setItems(items.filter(item => item.id !== itemId));
    showToast('info', 'Item has been removed from the order');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {
      shippingFee: true,
      tax: true,
      notes: true,
    };
    setTouched(allTouched);
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors below before saving');
      return;
    }
    
    if (items.length === 0) {
      showToast('error', 'Order must have at least one item');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          shippingFee,
          tax,
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        }),
      });

      if (response.ok) {
        showToast('success', 'Order updated successfully!');
        resetDirtyState();
        setTimeout(() => {
          router.push(`/grower/orders/${order.id}`);
          router.refresh();
        }, 1500);
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to update order');
      }
    } catch {
      showToast('error', 'An error occurred while updating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href={`/grower/orders/${order.id}`} className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Order
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Order #{order.orderId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Current Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            STATUS_OPTIONS.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
          }`}>
            {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
          </span>
        </div>
      </div>

      {isDirty && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>You have unsaved changes.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  status === option.value
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="sr-only"
                />
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                  {item.product?.strain && <p className="text-sm text-gray-500">{item.product.strain}</p>}
                  <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} / {item.product?.unit || 'unit'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100 border-r disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100 border-l disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={item.quantity >= 9999}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium">No items in this order</p>
              <p className="text-sm mt-1">Add items before saving</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Notes</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingFee}
                onChange={(e) => handleShippingFeeChange(e.target.value)}
                onBlur={() => handleBlur('shippingFee')}
                className={errors.shippingFee && touched.shippingFee ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
              />
              {errors.shippingFee && touched.shippingFee && (
                <p className="text-sm text-red-600 mt-1">{errors.shippingFee}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => handleTaxChange(e.target.value)}
                onBlur={() => handleBlur('tax')}
                className={errors.tax && touched.tax ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
              />
              {errors.tax && touched.tax && (
                <p className="text-sm text-red-600 mt-1">{errors.tax}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={() => handleBlur('notes')}
              placeholder="Add any special instructions or notes..."
              className={errors.notes && touched.notes 
                ? "w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50" 
                : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"}
            />
            {errors.notes && touched.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
            )}
            <p className="text-xs text-gray-500 text-right mt-1">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">{formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
          <Link
            href={`/grower/orders/${order.id}`}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0 || (hasErrors && Object.keys(touched).length > 0)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
