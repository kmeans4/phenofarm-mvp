'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts';
import { useToast } from '@/app/hooks/useToast';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { canTransitionOrderStatus, getOrderStatusLabel, type OrderStatusValue } from '@/lib/order-workflow';
import { pluralize } from '@/lib/utils';
import { formatProductUnit } from '@/lib/product-display';
import { CheckCircle2, ClipboardList, Flag, Package, Truck, XCircle, type LucideIcon } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  maxQuantity?: number;
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
  { value: 'PENDING', label: getOrderStatusLabel('PENDING'), color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: ClipboardList },
  { value: 'CONFIRMED', label: getOrderStatusLabel('CONFIRMED'), color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle2 },
  { value: 'PROCESSING', label: getOrderStatusLabel('PROCESSING'), color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Package },
  { value: 'SHIPPED', label: getOrderStatusLabel('SHIPPED'), color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Truck },
  { value: 'DELIVERED', label: getOrderStatusLabel('DELIVERED'), color: 'bg-green-100 text-green-800 border-green-300', icon: Flag },
  { value: 'CANCELLED', label: getOrderStatusLabel('CANCELLED'), color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
] satisfies Array<{
  value: OrderStatusValue;
  label: string;
  color: string;
  icon: LucideIcon;
}>;

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

const validateQuantity = (qty: number, maxQuantity?: number): string | undefined => {
  if (qty < 1) return 'Quantity must be at least 1';
  if (qty > 9999) return 'Quantity cannot exceed 9999';
  if (maxQuantity !== undefined && qty > maxQuantity) return `Quantity cannot exceed available stock (${maxQuantity})`;
  return undefined;
};

const INPUT_CLASSES = "w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-sm";
const INPUT_ERROR_CLASSES = "w-full px-3 py-2.5 sm:py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50 text-base sm:text-sm";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getItemMaxQuantity = (item: OrderItem) => Math.max(1, item.maxQuantity ?? item.quantity);

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
  const [removeCandidate, setRemoveCandidate] = useState<OrderItem | null>(null);
  const [showCancellationConfirm, setShowCancellationConfirm] = useState(false);

  const initialData = useMemo(() => ({
    status: order.status,
    notes: order.notes || '',
    shippingFee: order.shippingFee,
    tax: order.tax,
    items: order.items,
  }), [order]);

  const currentData = useMemo(() => ({ status, notes, shippingFee, tax, items }), [status, notes, shippingFee, tax, items]);
  const submitRef = useRef(false);

  const { isDirty, setIsDirty, resetDirtyState, confirmNavigation } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in this request. Are you sure you want to leave?',
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  }, [currentData, initialData, setIsDirty]);

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
    
    const invalidItems = items.filter(item => validateQuantity(item.quantity, getItemMaxQuantity(item)));
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

  const setFieldError = (field: keyof FieldErrors, error: string | undefined) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleShippingFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setShippingFee(numValue);
    if (touched.shippingFee) {
      const error = validateShippingFee(numValue);
      setFieldError('shippingFee', error);
    }
  };

  const handleTaxChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTax(numValue);
    if (touched.tax) {
      const error = validateTax(numValue);
      setFieldError('tax', error);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (touched.notes) {
      const error = validateNotes(value);
      setFieldError('notes', error);
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
    setFieldError(field, error);
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    const item = items.find((candidate) => candidate.id === itemId);
    const error = validateQuantity(newQuantity, item ? getItemMaxQuantity(item) : undefined);
    if (error) {
      showToast('error', error);
      return;
    }
    
    setItems((current) => current.map(item => {
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
    setItems((current) => current.filter(item => item.id !== itemId));
    showToast('info', 'Item has been removed from the request');
  };

  const validateBeforeSubmit = () => {
    const allTouched: Record<string, boolean> = {
      shippingFee: true,
      tax: true,
      notes: true,
    };
    setTouched(allTouched);
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors below before saving');
      return false;
    }
    
    if (items.length === 0) {
      showToast('error', 'Request must have at least one item');
      return false;
    }

    return true;
  };

  const submitChanges = async () => {
    if (isSubmitting || submitRef.current) return;
    submitRef.current = true;
    
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
          })),
        }),
      });

      if (response.ok) {
        showToast('success', 'Request updated');
        resetDirtyState();
        router.push(`/grower/orders/${order.id}`);
      } else {
        const data = await response.json().catch(() => ({}));
        showToast('error', data.error || 'Failed to update request');
      }
    } catch {
      showToast('error', 'An error occurred while updating');
    } finally {
      submitRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      setShowCancellationConfirm(true);
      return;
    }

    await submitChanges();
  };

  // Keyboard shortcuts: Ctrl+S to save, Esc to cancel
  useKeyboardShortcuts({
    onSave: async () => {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    },
    onCancel: () => { if (confirmNavigation()) router.push(`/grower/orders/${order.id}`); },
    isDirty,
    enabled: true
  });

  const hasErrors = Object.keys(errors).length > 0;
  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === order.status);
  const validNextStatusOptions = STATUS_OPTIONS.filter((option) =>
    option.value !== order.status && canTransitionOrderStatus(order.status, option.value)
  );
  const CurrentStatusIcon = currentStatusOption?.icon || ClipboardList;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-3 sm:space-y-6 overflow-x-clip">
        <Link
          href={`/grower/orders/${order.id}`}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 sm:hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Request
        </Link>

        {/* Breadcrumb */}
        <nav className="hidden min-w-0 items-center gap-2 overflow-hidden pb-2 text-sm text-gray-500 sm:flex">
          <Link href="/grower/dashboard" className="hover:text-gray-700 transition-colors flex-shrink-0">
            Dashboard
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/grower/orders" className="hover:text-gray-700 transition-colors flex-shrink-0">
            Requests
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/grower/orders/${order.id}`} title={order.orderId} className="min-w-0 truncate transition-colors hover:text-gray-700">
            {order.orderId}
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium flex-shrink-0">Edit</span>
        </nav>

        <PageHeader
          title={<span className="flex min-w-0 flex-col gap-1"><span>Edit request</span><span title={order.orderId} className="max-w-full break-all font-sans text-base font-semibold leading-tight text-gray-600 sm:text-lg">#{order.orderId}</span></span>}
          description={order.dispensary.businessName}
        />

        {/* Unsaved Changes Warning */}
        {isDirty && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="font-medium text-yellow-800">You have unsaved changes</p>
              <p className="text-sm text-yellow-700">Remember to save your changes before leaving.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          {/* Request status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request status
            </h2>

            <p className="flex items-center gap-2 text-sm text-gray-600"><CurrentStatusIcon className="h-4 w-4" aria-hidden="true" />Current: {currentStatusOption?.label || getOrderStatusLabel(order.status)}</p>

            <div className="mt-3 sm:mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Change to</p>
              {validNextStatusOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {validNextStatusOptions.map((option) => {
                    const StatusIcon = option.icon;
                    const isSelected = status === option.value;
                    const isDestructive = option.value === 'CANCELLED';
                    const selectedClasses = isDestructive
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
                      : 'border-green-500 bg-green-50 ring-1 ring-green-500';
                    const idleClasses = isDestructive
                      ? 'border-red-200 hover:border-red-300 hover:bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
                    const textClasses = isDestructive
                      ? isSelected ? 'text-red-700' : 'text-red-600'
                      : isSelected ? 'text-green-700' : 'text-gray-700';

                    return (
                      <label
                        key={option.value}
                        className={`
                          min-h-10 cursor-pointer rounded-lg border-2 px-2 py-2 sm:p-3 transition-all
                          flex items-center gap-2 focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2
                          ${isSelected ? selectedClasses : idleClasses}
                        `}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => setStatus(option.value)}
                          className="sr-only"
                        />
                        <StatusIcon className={`h-5 w-5 ${textClasses}`} aria-hidden="true" />
                        <span className={`text-sm font-medium ${textClasses}`}>
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  This request is closed.
                </p>
              )}
              {status !== order.status && (
                <button
                  type="button"
                  onClick={() => setStatus(order.status)}
                  className="mt-2 min-h-10 rounded-md px-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  Keep current status
                </button>
              )}
            </div>
          </div>

          {/* Request items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Items
              <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>

            {/* Desktop View */}
            <div className="hidden sm:block space-y-3">
              {items.map((item, index) => {
                const maxQuantity = getItemMaxQuantity(item);

                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product?.name || 'Unknown Product'}</p>
                      {item.product?.strain && <p className="text-sm text-gray-500 truncate">{item.product.strain}</p>}
                      <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} / {formatProductUnit(item.product?.unit)}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Quantity Controls */}
                      <div>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-colors"
                            disabled={item.quantity >= maxQuantity}
                          >
                            +
                          </button>
                        </div>
                        <p className="mt-1 text-right text-xs text-gray-500">Max {maxQuantity}</p>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRemoveCandidate(item)}
                        className="min-h-10 min-w-10 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile View */}
            <div className="sm:hidden space-y-3">
              {items.map((item, index) => {
                const maxQuantity = getItemMaxQuantity(item);

                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                          {item.product?.strain && <p className="text-sm text-gray-500">{item.product.strain}</p>}
                          <p className="text-sm text-gray-600 mt-0.5">{formatCurrency(item.unitPrice)}/{formatProductUnit(item.product?.unit)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRemoveCandidate(item)}
                        className="min-h-10 min-w-10 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors -mr-2 -mt-2"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="min-h-10 px-3 py-1.5 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium min-w-[44px] touch-manipulation"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1.5 font-medium min-w-[50px] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="min-h-10 px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium min-w-[44px] touch-manipulation"
                            disabled={item.quantity >= maxQuantity}
                          >
                            +
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Max {maxQuantity}</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-200">
                <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-medium">No items in this request</p>
                <p className="text-sm mt-1">Add items before saving</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 sm:text-lg sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pricing
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Shipping ($)
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
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.shippingFee}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.tax}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-500">Optional tax: enter only the amount on your invoice. PhenoFarm does not calculate tax.</p>
            <div className="mt-3 sm:mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={() => handleBlur('notes')}
                placeholder="Instructions or notes"
                className={errors.notes && touched.notes 
                  ? "w-full px-3 py-2.5 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50 text-base sm:text-sm" 
                  : "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-sm"
                }
              />
              {errors.notes && touched.notes && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.notes}
                </p>
              )}
              <p className="text-xs text-gray-500 text-right mt-1.5">
                {notes.length}/1000 characters
              </p>
            </div>
          </div>

          {/* Request summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({pluralize(items.length, 'item')})</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900 text-base">Total</span>
                <span className="font-bold text-green-600 text-lg sm:text-xl">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1 pb-3 sm:flex sm:items-center sm:justify-between sm:pt-4 sm:pb-6">
            <Link
              href={`/grower/orders/${order.id}`}
              className="min-h-10 px-3 py-2 text-sm sm:px-6 sm:py-3 border border-gray-300 rounded-lg text-center text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0 || (hasErrors && Object.keys(touched).length > 0)}
              className="min-h-10 px-3 py-2 text-sm sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2 min-w-0 sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      <ConfirmDialog
        open={Boolean(removeCandidate)}
        title="Remove item?"
        description={`Remove ${removeCandidate?.product?.name || 'this item'} from the request record.`}
        confirmLabel="Remove item"
        intent="danger"
        onCancel={() => setRemoveCandidate(null)}
        onConfirm={() => {
          if (removeCandidate) {
            removeItem(removeCandidate.id);
          }
          setRemoveCandidate(null);
        }}
      />
      <ConfirmDialog
        loading={isSubmitting}
        open={showCancellationConfirm}
        title="Cancel request?"
        description="Saving this status will cancel the request and return reserved stock to inventory. This should only be used when the buyer and grower agree the request will not be fulfilled."
        confirmLabel="Cancel request"
        intent="danger"
        onCancel={() => setShowCancellationConfirm(false)}
        onConfirm={() => {
          setShowCancellationConfirm(false);
          void submitChanges();
        }}
      />
    </div>
  );
}
