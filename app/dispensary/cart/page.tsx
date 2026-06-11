'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { PAYMENT_TERMS_OPTIONS, buildOrderRequestNotes } from '@/lib/order-workflow';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import {
  DEFAULT_REQUEST_DEFAULTS,
  REQUEST_DEFAULTS_STORAGE_KEY,
  REQUEST_NOTE_TEMPLATES,
  RequestDefaults,
} from '@/lib/ux-workflow';

interface CartItem {
  id: string;
  name: string;
  grower: string;
  growerId: string;
  price: number;
  quantity: number;
  maxQty: number;
  strain?: string;
  unit?: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface CheckoutIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

interface DispensaryProductGroup {
  products?: Array<{ id: string; inventoryQty: number | null }>;
}

interface RequestDraftDetails {
  orderNotes: string;
  fulfillmentMethod: string;
  requestedWindow: string;
  paymentTerms: string;
}

type BuilderStep = 'items' | 'logistics' | 'terms' | 'review';

const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0;
  return { subtotal, tax, total: subtotal + tax };
};

function notifyCartUpdated() {
  window.dispatchEvent(new Event('cart-updated'));
}

export default function DispensaryCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [checkoutIssues, setCheckoutIssues] = useState<CheckoutIssue[]>([]);
  const [inventoryAdjustmentNotice, setInventoryAdjustmentNotice] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [showRequestReview, setShowRequestReview] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('Flexible');
  const [requestedWindow, setRequestedWindow] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Handled directly');
  const [builderStep, setBuilderStep] = useState<BuilderStep>('items');
  const [savedRequestDefaults, setSavedRequestDefaults] = useState<RequestDefaults | null>(null);

  const requestDraft = useLocalDraft<RequestDraftDetails>({
    key: 'phenofarm:draft:order-request',
    value: { orderNotes, fulfillmentMethod, requestedWindow, paymentTerms },
    enabled: mounted,
    onRestore: (value) => {
      setOrderNotes(value.orderNotes || '');
      setFulfillmentMethod(value.fulfillmentMethod || 'Flexible');
      setRequestedWindow(value.requestedWindow || '');
      setPaymentTerms(value.paymentTerms || 'Handled directly');
    },
    shouldSave: (value) =>
      Boolean(
        value.orderNotes.trim() ||
        value.requestedWindow.trim() ||
        value.fulfillmentMethod !== 'Flexible' ||
        value.paymentTerms !== 'Handled directly'
      ),
  });

  const syncCartWithLiveInventory = useCallback(async (savedCart: Cart) => {
    if (!savedCart.items.length) {
      setCart(savedCart);
      return;
    }

    try {
      const response = await fetch('/api/dispensary/products?limit=200');
      if (!response.ok) {
        setCart(savedCart);
        return;
      }

      const data = await response.json();
      const groups: DispensaryProductGroup[] = Array.isArray(data?.groups) ? data.groups : [];
      const liveProducts = groups.flatMap((group) =>
        Array.isArray(group.products) ? group.products : []
      );
      const inventoryByProductId = new Map(
        liveProducts.map((product) => [product.id, product.inventoryQty ?? 0])
      );

      let changedCount = 0;
      const syncedItems = savedCart.items.flatMap((item) => {
        const liveInventory = inventoryByProductId.get(item.id);

        if (liveInventory === undefined) {
          changedCount += 1;
          return [];
        }

        const nextMaxQty = Math.max(0, liveInventory);
        const nextQuantity = Math.min(item.quantity, nextMaxQty);

        if (nextQuantity !== item.quantity || nextMaxQty !== item.maxQty) {
          changedCount += 1;
        }

        if (nextQuantity < 1) {
          return [];
        }

        return [{ ...item, quantity: nextQuantity, maxQty: nextMaxQty }];
      });

      const nextCart = { items: syncedItems, ...calculateTotals(syncedItems) };
      setCart(nextCart);

      if (changedCount > 0) {
        setInventoryAdjustmentNotice(
          changedCount === 1
            ? '1 cart item was refreshed to match current inventory.'
            : `${changedCount} cart items were refreshed to match current inventory.`
        );
      }
    } catch {
      setCart(savedCart);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('phenofarm-cart');
    if (saved) {
      try {
        const parsedCart = JSON.parse(saved);
        void syncCartWithLiveInventory(parsedCart);
      } catch {
        setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
      }
    }
    const defaultsTimer = window.setTimeout(() => {
      try {
        const parsedDefaults = JSON.parse(localStorage.getItem(REQUEST_DEFAULTS_STORAGE_KEY) || 'null') as RequestDefaults | null;
        setSavedRequestDefaults(parsedDefaults);
      } catch {
        setSavedRequestDefaults(null);
      }
    }, 0);
    return () => window.clearTimeout(defaultsTimer);
  }, [syncCartWithLiveInventory]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('phenofarm-cart', JSON.stringify(cart));
      notifyCartUpdated();
    }
  }, [cart, mounted]);


  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (delta > 0 && newQty > item.maxQty) return item;
          if (newQty < 1) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return { items, ...calculateTotals(items) };
    });
  };

  const setExactQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.min(qty, item.maxQty) };
        }
        return item;
      });
      return { items, ...calculateTotals(items) };
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => {
      const items = prev.items.filter(item => item.id !== id);
      return { items, ...calculateTotals(items) };
    });
  };

  const applyInventoryAdjustments = (issues: CheckoutIssue[]) => {
    if (issues.length === 0) return;

    setCart((prev) => {
      let changedCount = 0;
      const nextItems = prev.items.flatMap((item) => {
        const issue = issues.find((entry) => entry.productId === item.id);
        if (!issue) return [item];

        const adjustedQuantity = Math.max(0, Math.min(item.quantity, issue.available));
        if (adjustedQuantity === item.quantity) return [item];

        changedCount += 1;

        if (adjustedQuantity < 1) {
          return [];
        }

        return [{
          ...item,
          quantity: adjustedQuantity,
          maxQty: issue.available,
        }];
      });

      if (changedCount > 0) {
        setInventoryAdjustmentNotice(
          changedCount === 1
            ? '1 item quantity was adjusted to match currently available inventory.'
            : `${changedCount} item quantities were adjusted to match currently available inventory.`
        );
      }

      return { items: nextItems, ...calculateTotals(nextItems) };
    });
  };

  const persistRequestDefaults = (defaults: RequestDefaults) => {
    setSavedRequestDefaults(defaults);
    localStorage.setItem(REQUEST_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults));
  };

  const applyRequestDefaults = (defaults: RequestDefaults) => {
    setFulfillmentMethod(defaults.fulfillmentMethod || DEFAULT_REQUEST_DEFAULTS.fulfillmentMethod);
    setRequestedWindow(defaults.requestedWindow || '');
    setPaymentTerms(defaults.paymentTerms || DEFAULT_REQUEST_DEFAULTS.paymentTerms);
    setOrderNotes(defaults.orderNotes || '');
    setBuilderStep('review');
  };

  const handleSubmitRequest = async () => {
    setSubmittingRequest(true);
    setRequestError('');
    setCheckoutIssues([]);
    setInventoryAdjustmentNotice('');

    try {
      const notes = buildOrderRequestNotes({
        fulfillmentMethod,
        requestedWindow,
        paymentTerms,
        buyerNotes: orderNotes,
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items, notes }),
      });

      const data = await response.json();
      const issues = Array.isArray(data.issues) ? data.issues : [];

      if (!response.ok) {
        setCheckoutIssues(issues);
        applyInventoryAdjustments(issues);
        throw new Error(data.error || 'Request submission failed');
      }

      setCheckoutIssues(issues);
      applyInventoryAdjustments(issues);

      persistRequestDefaults({ orderNotes, fulfillmentMethod, requestedWindow, paymentTerms });
      localStorage.removeItem('phenofarm-cart');
      requestDraft.clearDraft();
      setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
      setOrderNotes('');
      setRequestedWindow('');
      setFulfillmentMethod('Flexible');
      setPaymentTerms('Handled directly');
      setBuilderStep('items');
      setShowRequestReview(false);
      setRequestSuccess(true);
      setTimeout(() => router.push('/dispensary/orders'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request submission failed';
      setRequestError(message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (!mounted) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl font-bold">Order Request Draft</h1>
          <p className="text-sm text-gray-600">Loading your request draft...</p>
        </div>
      </div>
    );
  }

  if (requestSuccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="mb-4 text-5xl text-green-600">✓</div>
        <h1 className="text-2xl font-bold">Order Request Submitted</h1>
        <p className="text-gray-600">The grower will review the request. Redirecting to orders...</p>
      </div>
    );
  }

  const isEmpty = cart.items.length === 0;
  const growerGroups = cart.items.reduce<Record<string, { grower: string; items: CartItem[]; subtotal: number }>>((groups, item) => {
    if (!groups[item.growerId]) {
      groups[item.growerId] = { grower: item.grower, items: [], subtotal: 0 };
    }
    groups[item.growerId].items.push(item);
    groups[item.growerId].subtotal += item.price * item.quantity;
    return groups;
  }, {});

  const builderSteps: Array<{ key: BuilderStep; label: string; complete: boolean }> = [
    { key: 'items', label: 'Items', complete: cart.items.length > 0 },
    { key: 'logistics', label: 'Logistics', complete: Boolean(fulfillmentMethod.trim()) },
    { key: 'terms', label: 'Terms', complete: Boolean(paymentTerms.trim()) },
    { key: 'review', label: 'Review', complete: false },
  ];
  const requestDetailsReady = cart.items.length > 0 && Boolean(fulfillmentMethod.trim()) && Boolean(paymentTerms.trim());
  const requestSuggestions = [
    !requestedWindow.trim()
      ? {
          title: 'Add a timing window',
          description: 'A pickup, delivery, or flexible receiving window reduces follow-up messages.',
          step: 'logistics' as BuilderStep,
        }
      : null,
    !orderNotes.trim()
      ? {
          title: 'Add a short note',
          description: 'Receiving instructions, substitutions, or PO context help growers respond faster.',
          step: 'terms' as BuilderStep,
        }
      : null,
  ].filter((item): item is { title: string; description: string; step: BuilderStep } => item !== null);

  const applyNoteTemplate = (body: string) => {
    setOrderNotes((prev) => {
      if (!prev.trim()) return body;
      return `${prev.trim()}\n\n${body}`;
    });
    setBuilderStep('terms');
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold">Order Request Draft</h1>
        <p className="text-sm text-gray-600">
          Build a wholesale request for growers to review. PhenoFarm does not collect wholesale payment.
        </p>
      </div>

      {!isEmpty && (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {builderSteps.map((step, index) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setBuilderStep(step.key)}
                  aria-pressed={builderStep === step.key}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    builderStep === step.key
                      ? 'bg-green-600 text-white shadow-sm'
                      : step.complete
                        ? 'bg-white text-green-800 ring-1 ring-green-200'
                        : 'bg-white/70 text-gray-700 ring-1 ring-green-100'
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-green-800">
                    {step.complete ? 'OK' : index + 1}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <DraftAutosaveStatus
            savedAt={requestDraft.savedAt}
            label="Request browser draft"
            onClear={requestDraft.clearDraft}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Smart request defaults</p>
                <p className="text-xs text-gray-600">Reuse the logistics, terms, and notes that worked last time.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedRequestDefaults && (
                  <button
                    type="button"
                    onClick={() => applyRequestDefaults(savedRequestDefaults)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Use previous request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => applyRequestDefaults(DEFAULT_REQUEST_DEFAULTS)}
                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100"
                >
                  Use standard terms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(requestError || inventoryAdjustmentNotice) && (
        <div className="mb-4 space-y-3">
          {requestError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{requestError}</div>
          )}
          {inventoryAdjustmentNotice && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              {inventoryAdjustmentNotice}
            </div>
          )}
          {checkoutIssues.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">Inventory changes applied</p>
              <ul className="space-y-2 text-sm text-amber-900">
                {checkoutIssues.map((issue) => (
                  <li key={`${issue.productId}-${issue.requested}`} className="rounded-md bg-white/70 border border-amber-100 px-3 py-2">
                    <span className="font-medium">{issue.productName}</span>
                    <span className="text-amber-800"> was adjusted from {issue.requested} to {issue.available} due to current inventory availability.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isEmpty ? (
        <Card className="p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
            <span className="text-2xl font-bold">+</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Start a request from the catalog</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Add products first, then confirm logistics and direct payment terms in one review step. No wholesale payment is collected in PhenoFarm.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/dispensary/catalog" className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">
              Browse products
            </Link>
            <Link href="/dispensary/saved" className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Open saved workspace
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => {
              const atMax = item.quantity >= item.maxQty;
              return (
                <Card key={item.id}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">🌿</div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.grower} • ${item.price}/{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1">-</button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setExactQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-1 border-x"
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          disabled={atMax}
                          className="px-3 py-1 disabled:opacity-30"
                        >+</button>
                      </div>
                      <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeItem(item.id)} className="text-red-600">🗑️</button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className={builderStep === 'logistics' ? 'ring-2 ring-green-500' : ''}>
              <CardHeader>
                <CardTitle>Logistics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fulfillment-method-page" className="block text-sm font-medium text-gray-700">
                    Fulfillment method
                  </label>
                  <select
                    id="fulfillment-method-page"
                    value={fulfillmentMethod}
                    onChange={(event) => {
                      setFulfillmentMethod(event.target.value);
                      setBuilderStep('logistics');
                    }}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option>Flexible</option>
                    <option>Pickup</option>
                    <option>Delivery requested</option>
                    <option>Coordinate with grower</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="requested-window-page" className="block text-sm font-medium text-gray-700">
                    Requested window <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="requested-window-page"
                    value={requestedWindow}
                    onChange={(event) => {
                      setRequestedWindow(event.target.value);
                      setBuilderStep('logistics');
                    }}
                    maxLength={120}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Example: Tuesday morning or next week"
                  />
                  <p className="mt-1 text-right text-xs text-gray-500">{requestedWindow.length}/120</p>
                </div>
              </CardContent>
            </Card>

            <Card className={builderStep === 'terms' ? 'ring-2 ring-green-500' : ''}>
              <CardHeader>
                <CardTitle>Terms and Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="payment-terms-page" className="block text-sm font-medium text-gray-700">
                    Direct payment terms
                  </label>
                  <select
                    id="payment-terms-page"
                    value={paymentTerms}
                    onChange={(event) => {
                      setPaymentTerms(event.target.value);
                      setBuilderStep('terms');
                    }}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Informational only. PhenoFarm does not process wholesale settlement.</p>
                </div>

                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label htmlFor="request-notes-page" className="block text-sm font-medium text-gray-700">
                      Notes or special instructions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {REQUEST_NOTE_TEMPLATES.map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => applyNoteTemplate(template.body)}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="request-notes-page"
                    value={orderNotes}
                    onChange={(event) => {
                      setOrderNotes(event.target.value);
                      setBuilderStep('terms');
                    }}
                    rows={4}
                    maxLength={500}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Delivery window, receiving instructions, buyer PO number, or other context for the grower."
                  />
                  <p className="mt-1 text-right text-xs text-gray-500">{orderNotes.length}/500</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader><CardTitle>Request Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Estimated item value</span><span>${cart.subtotal.toFixed(2)}</span></div>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Payment terms are coordinated directly between buyer and grower.
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                {Object.keys(growerGroups).length > 1
                  ? `This draft will create ${Object.keys(growerGroups).length} separate grower requests.`
                  : 'This draft will create one grower request.'}
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <div className="flex justify-between gap-3">
                  <span>Fulfillment</span>
                  <span className="font-medium text-gray-900">{fulfillmentMethod}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span>Payment terms</span>
                  <span className="font-medium text-gray-900">{paymentTerms}</span>
                </div>
                {requestedWindow && (
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Window</span>
                    <span className="font-medium text-gray-900">{requestedWindow}</span>
                  </div>
                )}
              </div>
              {requestSuggestions.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">Optional fixes before review</p>
                  <div className="mt-2 space-y-2">
                    {requestSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => setBuilderStep(suggestion.step)}
                        className="block w-full rounded-md bg-white/70 px-3 py-2 text-left hover:bg-white"
                      >
                        <span className="block font-medium">{suggestion.title}</span>
                        <span className="text-xs text-amber-800">{suggestion.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  setBuilderStep('review');
                  setShowRequestReview(true);
                }}
                disabled={submittingRequest || !requestDetailsReady}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Review Request
              </button>
              {!requestDetailsReady && (
                <p className="text-xs text-red-600">
                  Add at least one item and confirm fulfillment and direct payment terms before review.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showRequestReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Review Order Request</h2>
                  <p className="mt-1 text-sm text-gray-600">Confirm grower splits, value, logistics, and direct payment terms before submitting.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequestReview(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close request review"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Review mode</p>
                <h3 className="mt-1 text-base font-semibold text-gray-900">Confirm before submitting</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    { label: 'Items', value: `${cart.items.length} item${cart.items.length === 1 ? '' : 's'}`, step: 'items' as BuilderStep },
                    { label: 'Grower requests', value: `${Object.keys(growerGroups).length}`, step: 'items' as BuilderStep },
                    { label: 'Fulfillment', value: fulfillmentMethod || 'Not set', step: 'logistics' as BuilderStep },
                    { label: 'Direct terms', value: paymentTerms || 'Not set', step: 'terms' as BuilderStep },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500">{item.label}</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900">{item.value}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequestReview(false);
                            setBuilderStep(item.step);
                          }}
                          className="text-xs font-semibold text-green-700 hover:text-green-800"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {requestSuggestions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-950">Optional details that can reduce follow-up</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {requestSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() => {
                            setShowRequestReview(false);
                            setBuilderStep(suggestion.step);
                          }}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                        >
                          {suggestion.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {Object.entries(growerGroups).map(([growerId, group]) => (
                  <div key={growerId} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-gray-900">{group.grower}</h3>
                      <span className="text-sm font-semibold text-gray-700">${group.subtotal.toFixed(2)}</span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>{item.quantity} × {item.name}</span>
                          <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="fulfillment-method" className="block text-sm font-medium text-gray-700">
                  Fulfillment method
                </label>
                <select
                  id="fulfillment-method"
                  value={fulfillmentMethod}
                  onChange={(event) => setFulfillmentMethod(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option>Flexible</option>
                  <option>Pickup</option>
                  <option>Delivery requested</option>
                  <option>Coordinate with grower</option>
                </select>
              </div>

              <div>
                <label htmlFor="requested-window" className="block text-sm font-medium text-gray-700">
                  Requested window
                </label>
                <input
                  id="requested-window"
                  value={requestedWindow}
                  onChange={(event) => setRequestedWindow(event.target.value)}
                  maxLength={120}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Example: Tuesday morning, next week, or coordinate after acceptance"
                />
              </div>

              <div>
                <label htmlFor="payment-terms" className="block text-sm font-medium text-gray-700">
                  Direct payment terms
                </label>
                <select
                  id="payment-terms"
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {PAYMENT_TERMS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Informational only. PhenoFarm does not process wholesale settlement.</p>
              </div>

              <div>
                <label htmlFor="request-notes" className="block text-sm font-medium text-gray-700">
                  Notes or special instructions
                </label>
                <textarea
                  id="request-notes"
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  rows={4}
                  maxLength={500}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Delivery window, receiving instructions, buyer PO number, or other context for the grower."
                />
                <p className="mt-1 text-right text-xs text-gray-500">{orderNotes.length}/500</p>
              </div>

              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                Inventory is checked again when you submit. If quantities changed, the draft will be adjusted before any request is created.
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between text-base font-bold"><span>Estimated item value</span><span>${cart.subtotal.toFixed(2)}</span></div>
                <p className="text-xs text-gray-500">No wholesale payment is collected in PhenoFarm.</p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRequestReview(false)}
                  disabled={submittingRequest}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back to Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest}
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting Request...' : 'Submit Order Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <StickyMobileActionBar
          primaryLabel={submittingRequest ? 'Submitting...' : 'Review request'}
          onPrimary={() => {
            setBuilderStep('review');
            setShowRequestReview(true);
          }}
          disabled={submittingRequest || !requestDetailsReady}
          helperText={
            requestDetailsReady
              ? 'Review grower splits before submitting.'
              : 'Confirm fulfillment and direct payment terms first.'
          }
          secondary={
            <Link
              href="/dispensary/catalog"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
            >
              Add
            </Link>
          }
        />
      )}
    </div>
  );
}
