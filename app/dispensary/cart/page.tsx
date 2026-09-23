'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { readCart, writeCart, calculateTotals, getLineTotal, removeOrderedItems, type Cart, type CartItem } from '@/lib/cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { formatProductUnit } from '@/lib/product-display';
import { PAYMENT_TERMS_OPTIONS, buildOrderRequestNotes } from '@/lib/order-workflow';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import {
  DEFAULT_COMMERCIAL_TERMS,
  DEFAULT_REQUEST_DEFAULTS,
  REQUEST_DEFAULTS_STORAGE_KEY,
  REQUEST_NOTE_TEMPLATES,
  RequestDefaults,
} from '@/lib/ux-workflow';
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';

interface CheckoutIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

interface RequestDraftDetails {
  orderNotes: string;
  fulfillmentMethod: string;
  requestedWindow: string;
  paymentTerms: string;
}

interface PendingSubmission {
  key: string;
  cart: Cart;
  notes: string;
  details: RequestDraftDetails;
}

function readPendingSubmission(storageKey: string): PendingSubmission | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  const value = JSON.parse(raw) as PendingSubmission;
  if (!value || typeof value.key !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(value.key)
    || !Array.isArray(value.cart?.items) || !value.cart.items.length || typeof value.notes !== 'string' || !value.details) {
    throw new Error('Your saved request could not be read. Check your requests before submitting again.');
  }
  return value;
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number | null;
  isPriceVisible: boolean;
  strain: string | null;
  unit: string | null;
  thc: number | null;
  inventoryQty: number;
  grower: {
    id: string;
    businessName: string;
  };
  source: 'favorite' | 'recent';
  orderCount?: number;
}

interface GrowerTerms {
  fulfillmentRegion: string;
  paymentTerms: string;
}

interface GrowerTermsResponse {
  growerId?: string;
  fulfillmentRegion?: string;
  paymentTerms?: string;
}

type BuilderStep = 'items' | 'logistics' | 'terms' | 'review';

const FAVORITES_KEY = 'phenofarm_favorites';
const SUGGESTION_LIMIT = 6;

function normalizeSuggestion(product: Omit<SuggestedProduct, 'source'>, source: SuggestedProduct['source']): SuggestedProduct | null {
  if (!product?.id || !product?.grower?.id || product.inventoryQty < 1) return null;

  return {
    id: product.id,
    name: product.name,
    price: product.isPriceVisible && product.price != null ? Number(product.price) : null,
    isPriceVisible: product.isPriceVisible,
    strain: product.strain || null,
    unit: product.unit || null,
    thc: product.thc ?? null,
    inventoryQty: product.inventoryQty,
    grower: {
      id: product.grower.id,
      businessName: product.grower.businessName,
    },
    source,
    orderCount: product.orderCount,
  };
}

export default function DispensaryCartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const submissionStorageKey = session?.user?.id ? `phenofarm:pending-request:${session.user.id}` : null;
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [submissionStorageError, setSubmissionStorageError] = useState('');
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const submittingRef = useRef(false);
  const [inventorySyncing, setInventorySyncing] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [checkoutIssues, setCheckoutIssues] = useState<CheckoutIssue[]>([]);
  const [inventoryAdjustmentNotice, setInventoryAdjustmentNotice] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [showRequestReview, setShowRequestReview] = useState(false);
  useBodyOverlay(showRequestReview);
  const reviewRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: showRequestReview, containerRef: reviewRef, onEscape: () => setShowRequestReview(false) });
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('Flexible');
  const [requestedWindow, setRequestedWindow] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Handled directly');
  const [builderStep, setBuilderStep] = useState<BuilderStep>('items');
  const [savedRequestDefaults, setSavedRequestDefaults] = useState<RequestDefaults | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [growerTerms, setGrowerTerms] = useState<Record<string, GrowerTerms>>({});
  const [successRedirectPaused, setSuccessRedirectPaused] = useState(false);

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

  const syncCartWithLiveInventory = useCallback(async (savedCart: Cart, signal: AbortSignal) => {
    if (!savedCart.items.length) return;
    setInventorySyncing(true);
    try {
      const [response, quoteResponse] = await Promise.all([
        fetch('/api/dispensary/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: savedCart.items.map(item => item.id) }), signal }),
        fetch('/api/dispensary/accepted-quotes', { signal }),
      ]);
      if (!response.ok || !quoteResponse.ok) throw new Error('Unable to refresh inventory.');
      const data = await response.json();
      const quoteData = await quoteResponse.json();
      if (!Array.isArray(data.products) || !Array.isArray(quoteData.quotes)) throw new Error('Invalid inventory response.');
      const live = new Map<string, { id: string; inventoryQty: number; price: number | null; isPriceVisible: boolean; isAvailable: boolean }>(data.products.map((product: { id: string }) => [product.id, product]));
      const quotes = new Map<string, { id: string; quantity: number | null; unitPrice: number }>(quoteData.quotes.map((quote: { productId: string }) => [quote.productId, quote]));
      if (signal.aborted) return;
      // Reconcile against the current draft, so edits made during the request survive.
      setCart(current => {
        const items = current.items.map(item => {
          const product = live.get(item.id);
          if (!product) return item;
          const quote = quotes.get(item.id);
          const base = { ...item };
          delete base.acceptedQuoteId; delete base.quotedQuantity; delete base.quotedUnitPrice;
          return { ...base, price: quote?.unitPrice ?? product.price ?? 0, listPrice: product.price ?? undefined,
            maxQty: product.inventoryQty, quantity: product.isAvailable ? Math.min(item.quantity, product.inventoryQty) : item.quantity,
            unavailable: !product.isAvailable, requiresQuote: !product.isPriceVisible && (!quote || (quote.quantity != null && quote.quantity < item.quantity)),
            ...(quote ? { acceptedQuoteId: quote.id, quotedQuantity: quote.quantity ?? product.inventoryQty, quotedUnitPrice: quote.unitPrice } : {}),
          };
        });
        return { items, ...calculateTotals(items) };
      });
      const changed = savedCart.items.some(item => {
        const product = live.get(item.id);
        const quote = quotes.get(item.id);
        return !product || !product.isAvailable || item.quantity > product.inventoryQty || item.price !== (quote?.unitPrice ?? product.price ?? 0);
      });
      setInventoryAdjustmentNotice(changed ? 'Prices or availability changed. Review the updated draft.' : '');
    } catch {
      if (!signal.aborted) setInventoryAdjustmentNotice('Inventory could not be refreshed. Your saved draft has been kept.');
    } finally { if (!signal.aborted) setInventorySyncing(false); }
  }, []);

  useEffect(() => {
    if (!submissionStorageKey) return;
    const saved = readCart();
    setCart(saved);
    setMounted(true);
    const controller = new AbortController();
    try {
      const pending = readPendingSubmission(submissionStorageKey);
      setPendingSubmission(pending);
      if (!pending) void syncCartWithLiveInventory(saved, controller.signal);
    } catch {
      setSubmissionStorageError('Your saved request could not be read. Check your requests before submitting again.');
    }
    try {
      setSavedRequestDefaults(JSON.parse(localStorage.getItem(REQUEST_DEFAULTS_STORAGE_KEY) || 'null'));
    } catch { setSavedRequestDefaults(null); }
    return () => controller.abort();
  }, [submissionStorageKey, syncCartWithLiveInventory]);

  useEffect(() => {
    if (mounted && !writeCart(cart)) setInventoryAdjustmentNotice('This browser could not save the latest draft. Please free up storage before leaving.');
  }, [cart, mounted]);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const loadSuggestedProducts = async () => {
      setSuggestionsLoading(true);

      try {
        const storedFavoriteIds = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as string[];
        const favoritesResponse = await fetch('/api/dispensary/favorites');
        const favoritesData = favoritesResponse.ok ? await favoritesResponse.json() : { productIds: [] };
        const favoriteIds = Array.from(
          new Set([
            ...(Array.isArray(favoritesData.productIds) ? favoritesData.productIds : []),
            ...(Array.isArray(storedFavoriteIds) ? storedFavoriteIds : []),
          ].map((id) => String(id || '').trim()).filter(Boolean))
        ).slice(0, 20);

        const [favoriteDetailsResponse, recentResponse] = await Promise.all([
          favoriteIds.length > 0
            ? fetch('/api/dispensary/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: favoriteIds }),
              })
            : Promise.resolve(null),
          fetch('/api/dispensary/recent-products'),
        ]);

        const favoriteDetails = favoriteDetailsResponse?.ok ? await favoriteDetailsResponse.json() : { products: [] };
        const recentDetails = recentResponse.ok ? await recentResponse.json() : { products: [] };
        const favoriteProducts = Array.isArray(favoriteDetails.products)
          ? favoriteIds
              .map((id) => favoriteDetails.products.find((product: SuggestedProduct) => product.id === id))
              .filter(Boolean)
          : [];
        const recentProducts = Array.isArray(recentDetails.products) ? recentDetails.products : [];
        const merged = new Map<string, SuggestedProduct>();

        for (const product of favoriteProducts) {
          const suggestion = normalizeSuggestion(product, 'favorite');
          if (suggestion) merged.set(suggestion.id, suggestion);
        }

        for (const product of recentProducts) {
          const suggestion = normalizeSuggestion(product, 'recent');
          if (suggestion && !merged.has(suggestion.id)) {
            merged.set(suggestion.id, suggestion);
          }
        }

        if (!cancelled) {
          setSuggestedProducts(Array.from(merged.values()).slice(0, SUGGESTION_LIMIT));
        }
      } catch {
        if (!cancelled) {
          setSuggestedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    };

    void loadSuggestedProducts();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const growerIdsKey = Array.from(new Set(cart.items.map((item) => item.growerId).filter(Boolean))).sort().join(',');

  useEffect(() => {
    if (!mounted || !growerIdsKey) {
      setGrowerTerms({});
      return;
    }

    let cancelled = false;

    const loadGrowerTerms = async () => {
      try {
        const response = await fetch(`/api/dispensary/grower-terms?ids=${encodeURIComponent(growerIdsKey)}`);
        if (!response.ok) return;

        const data = await response.json();
        const terms: GrowerTermsResponse[] = Array.isArray(data.terms) ? data.terms : [];
        const nextTerms: Record<string, GrowerTerms> = {};

        for (const term of terms) {
          if (term.growerId) {
            nextTerms[term.growerId] = {
              fulfillmentRegion: term.fulfillmentRegion || DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion,
              paymentTerms: term.paymentTerms || DEFAULT_COMMERCIAL_TERMS.paymentTerms,
            };
          }
        }

        if (!cancelled) {
          setGrowerTerms(nextTerms);
        }
      } catch {
        if (!cancelled) {
          setGrowerTerms({});
        }
      }
    };

    void loadGrowerTerms();

    return () => {
      cancelled = true;
    };
  }, [growerIdsKey, mounted]);

  useEffect(() => {
    if (!requestSuccess || successRedirectPaused) return;

    const redirectTimer = window.setTimeout(() => {
      router.push('/dispensary/orders');
    }, 5000);

    return () => window.clearTimeout(redirectTimer);
  }, [requestSuccess, router, successRedirectPaused]);

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

  const addSuggestedProduct = (product: SuggestedProduct) => {
    if (product.inventoryQty < 1 || product.price == null) return;

    setCart((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.id === product.id);
      let items: CartItem[];

      if (existingIndex >= 0) {
        items = prev.items.map((item, index) => {
          if (index !== existingIndex) return item;
          return {
            ...item,
            quantity: Math.min(item.quantity + 1, product.inventoryQty),
            maxQty: product.inventoryQty,
          };
        });
      } else {
        items = [
          ...prev.items,
          {
            id: product.id,
            name: product.name,
            grower: product.grower.businessName,
            growerId: product.grower.id,
            price: product.price ?? 0,
            quantity: 1,
            maxQty: product.inventoryQty,
            strain: product.strain || undefined,
            unit: product.unit || undefined,
          },
        ];
      }

      return { items, ...calculateTotals(items) };
    });
  };

  const applyInventoryAdjustments = (issues: CheckoutIssue[]) => {
    if (!issues.length) return;
    const items = cart.items.map(item => {
      const issue = issues.find(entry => entry.productId === item.id);
      if (!issue) return item;
      return { ...item, quantity: issue.available > 0 ? Math.min(item.quantity, issue.available) : item.quantity,
        maxQty: Math.max(0, issue.available), unavailable: issue.available < 1 };
    });
    setCart({ items, ...calculateTotals(items) });
    setInventoryAdjustmentNotice('Inventory quantities updated. Unavailable items remain in your draft until you remove them.');
  };

  const applySingleInventoryAdjustment = (issue: CheckoutIssue) => {
    applyInventoryAdjustments([issue]);
    setCheckoutIssues((prev) => prev.filter((entry) => entry.productId !== issue.productId));
    setRequestError('');
  };

  const persistRequestDefaults = (defaults: RequestDefaults) => {
    setSavedRequestDefaults(defaults);
    try { localStorage.setItem(REQUEST_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* Request submission does not depend on saving defaults. */ }
  };

  const applyRequestDefaults = (defaults: RequestDefaults) => {
    setFulfillmentMethod(defaults.fulfillmentMethod || DEFAULT_REQUEST_DEFAULTS.fulfillmentMethod);
    setRequestedWindow(defaults.requestedWindow || '');
    setPaymentTerms(defaults.paymentTerms || DEFAULT_REQUEST_DEFAULTS.paymentTerms);
    setOrderNotes(defaults.orderNotes || '');
    setBuilderStep('review');
  };

  const handleSubmitRequest = async () => {
    if (submittingRef.current || inventorySyncing || !submissionStorageKey || submissionStorageError) return;
    if (!pendingSubmission && (!cart.items.length || cart.items.some(item => item.unavailable || item.requiresQuote))) {
      setRequestError('Remove unavailable items or obtain pricing for items that require a quote before submitting.'); return;
    }
    submittingRef.current = true;
    setSubmittingRequest(true);
    setRequestError('');
    setCheckoutIssues([]);
    setInventoryAdjustmentNotice('');

    try {
      // Persist before sending. Reuse the original payload after reload even if its
      // inventory is sold out or its quote has since been consumed by this request.
      const prepare = () => {
        const stored = readPendingSubmission(submissionStorageKey) || pendingSubmission;
        if (stored) {
          localStorage.setItem(submissionStorageKey, JSON.stringify(stored));
          return stored;
        }
        const details = { orderNotes, fulfillmentMethod, requestedWindow, paymentTerms };
        const attempt: PendingSubmission = { key: crypto.randomUUID(), cart,
          notes: buildOrderRequestNotes({ ...details, buyerNotes: orderNotes }), details };
        localStorage.setItem(submissionStorageKey, JSON.stringify(attempt));
        return attempt;
      };
      const attempt = navigator.locks
        ? await navigator.locks.request(submissionStorageKey, prepare) : prepare();
      setPendingSubmission(attempt);
      setShowRequestReview(false);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key },
        body: JSON.stringify({ items: attempt.cart.items, notes: attempt.notes }),
      });

      const data = await response.json().catch(() => ({}));
      const issues = Array.isArray(data.issues) ? data.issues : [];

      if (!response.ok) {
        // A validation conflict is definitive. Network/server failures can follow a
        // commit, so their receipt must survive until a successful confirmation.
        if ((response.status === 400 || response.status === 409) && data.code !== 'SUBMISSION_CONFLICT') {
          localStorage.removeItem(submissionStorageKey);
          setPendingSubmission(null);
        }
        setCheckoutIssues(issues);
        if (issues.length > 0) {
          setInventoryAdjustmentNotice('Review each inventory conflict and adjust the draft before submitting again.');
        }
        throw new Error(data.error || 'Request submission failed');
      }

      if (!Array.isArray(data.orders) || !data.orders.length || data.orders.some((order: { orderedProductIds?: unknown }) => !Array.isArray(order.orderedProductIds))) {
        throw new Error('Confirmation was interrupted. Check the request again to recover it safely.');
      }
      const remaining = removeOrderedItems(readCart(), data.orders);
      // Save the remaining draft before forgetting the receipt; a crash between
      // these writes can safely replay the confirmed request once more.
      if (!writeCart(remaining)) throw new Error('Your request was received, but this browser could not save the confirmation. Free up browser storage and check the request again.');
      localStorage.removeItem(submissionStorageKey);
      setPendingSubmission(null);
      setCheckoutIssues(issues);
      persistRequestDefaults(attempt.details);
      setCart(remaining);
      writeCart(remaining);
      if (remaining.items.length) {
        setRequestError('Some requests were submitted. Items that were not ordered remain in your draft; review the issues before retrying.');
        setShowRequestReview(false);
        return;
      }
      requestDraft.clearDraft();
      setOrderNotes('');
      setRequestedWindow('');
      setFulfillmentMethod('Flexible');
      setPaymentTerms('Handled directly');
      setBuilderStep('items');
      setShowRequestReview(false);
      setSuccessRedirectPaused(false);
      setRequestSuccess(true);
    } catch (err) {
      const message = err instanceof Error && err.name !== 'TypeError' ? err.message : 'Confirmation was interrupted. Check the request again to recover it safely.';
      setRequestError(message);
    } finally {
      submittingRef.current = false;
      setSubmittingRequest(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Order Request Draft" description="Loading your request draft..." className="mb-4" />
      </div>
    );
  }

  if (requestSuccess) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          className="rounded-2xl border border-pf-accent-line bg-pf-surface px-4 py-6 text-center sm:p-6 shadow-sm"
          onMouseEnter={() => setSuccessRedirectPaused(true)}
          onFocusCapture={() => setSuccessRedirectPaused(true)}
          onTouchStart={() => setSuccessRedirectPaused(true)}
        >
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-pf-accent" />
          <h1 className="text-xl font-semibold text-pf-text">Request submitted</h1>
          <p className="mt-2 text-sm text-pf-muted">
            The grower will review your request. Arrange payment directly with them.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/dispensary/orders"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              View requests
            </Link>
            <span className="inline-flex h-10 items-center justify-center text-sm text-pf-muted">
              {successRedirectPaused ? 'Redirect paused' : 'Redirecting in 5 seconds'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (pendingSubmission || submissionStorageError) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader><CardTitle>{submittingRequest ? 'Sending request…' : 'Confirm your request'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-pf-muted">{submittingRequest ? 'Keep this page open while we confirm your request.' : 'Check this saved request to retrieve its confirmation. It will not be submitted twice.'}</p>
            {pendingSubmission && <ul className="divide-y divide-pf-line text-sm text-pf-text">{pendingSubmission.cart.items.map(item => (
              <li key={item.id} className="flex justify-between gap-3 py-2"><span className="min-w-0 break-words">{item.name}</span><span className="shrink-0">{item.quantity} {formatProductUnit(item.unit)}</span></li>
            ))}</ul>}
            {(requestError || submissionStorageError) && <p role="alert" className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">{submissionStorageError || requestError}</p>}
            <div className="flex flex-wrap gap-3">
              {pendingSubmission && !submissionStorageError && <button type="button" disabled={submittingRequest} onClick={handleSubmitRequest} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] disabled:opacity-60">{submittingRequest ? <><Loader2 className="h-4 w-4 animate-spin" />Confirming…</> : 'Check request'}</button>}
              <Link href="/dispensary/orders" className="inline-flex min-h-11 items-center text-sm text-pf-accent">View requests</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmpty = cart.items.length === 0;
  const growerGroups = cart.items.reduce<Record<string, { grower: string; items: CartItem[]; subtotal: number }>>((groups, item) => {
    if (!groups[item.growerId]) {
      groups[item.growerId] = { grower: item.grower, items: [], subtotal: 0 };
    }
    groups[item.growerId].items.push(item);
    groups[item.growerId].subtotal += getLineTotal(item);
    return groups;
  }, {});

  const builderSteps: Array<{ key: BuilderStep; label: string; complete: boolean }> = [
    { key: 'items', label: 'Items', complete: cart.items.length > 0 },
    { key: 'logistics', label: 'Logistics', complete: Boolean(fulfillmentMethod.trim()) },
    { key: 'terms', label: 'Terms', complete: Boolean(paymentTerms.trim()) },
    { key: 'review', label: 'Review', complete: false },
  ];
  const requestDetailsReady = cart.items.length > 0 && Boolean(fulfillmentMethod.trim()) && Boolean(paymentTerms.trim());
  const applyNoteTemplate = (body: string) => {
    setOrderNotes((prev) => {
      if (!prev.trim()) return body;
      return `${prev.trim()}\n\n${body}`;
    });
    setBuilderStep('terms');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Request draft"
        description={isEmpty ? "Build a request for your grower." : undefined}
        className="mb-4"
      />

      {!isEmpty && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
          <nav aria-label="Draft sections" className="flex gap-2 text-sm">
            {builderSteps.filter(step => step.key !== 'review').map(step => <button key={step.key} type="button" onClick={() => { setBuilderStep(step.key); document.getElementById(`draft-${step.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} aria-pressed={builderStep === step.key} className={`min-h-10 rounded-lg px-3 ${builderStep === step.key ? 'bg-pf-accent-bg font-semibold text-pf-accent' : 'text-pf-muted hover:bg-pf-surface'}`}>{step.label}</button>)}
          </nav>
          <details className="relative">
            <summary className="flex min-h-10 cursor-pointer items-center rounded-lg px-2 text-sm text-pf-accent">Templates</summary>
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-pf-line bg-pf-surface p-1 shadow-lg">
              {savedRequestDefaults && <button type="button" onClick={() => applyRequestDefaults(savedRequestDefaults)} className="min-h-10 w-full rounded px-3 text-left text-sm text-pf-secondary hover:bg-pf-canvas">Reuse last request</button>}
              <button type="button" onClick={() => applyRequestDefaults(DEFAULT_REQUEST_DEFAULTS)} className="min-h-10 w-full rounded px-3 text-left text-sm text-pf-accent hover:bg-pf-accent-bg">Use standard terms</button>
            </div>
          </details>
          </div>

          <DraftAutosaveStatus
            savedAt={requestDraft.savedAt}
            label="Request browser draft"
            onClear={requestDraft.clearDraft}
          />
        </div>
      )}

      {(requestError || inventoryAdjustmentNotice) && (
        <div className="mb-4 space-y-3">
          {requestError && (
            <div className="p-4 bg-pf-danger-bg border border-pf-danger-line rounded-lg text-pf-danger">{requestError}</div>
          )}
          {inventoryAdjustmentNotice && (
            <div className="p-4 bg-pf-info-bg border border-pf-info-line rounded-lg text-pf-info">
              {inventoryAdjustmentNotice}
            </div>
          )}
          {checkoutIssues.length > 0 && (
            <div className="p-4 bg-pf-warning-bg border border-pf-warning-line rounded-lg">
              <p className="text-sm font-semibold text-pf-warning mb-2">Inventory conflicts</p>
              <ul className="space-y-2 text-sm text-pf-warning">
                {checkoutIssues.map((issue) => {
                  const currentItem = cart.items.find((item) => item.id === issue.productId);
                  const alreadyAdjusted = !currentItem || currentItem.quantity <= issue.available;

                  return (
                    <li
                      key={`${issue.productId}-${issue.requested}`}
                      className="flex flex-col gap-3 rounded-lg border border-pf-warning-line bg-pf-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-pf-warning">{issue.productName}</p>
                        <p className="mt-1 text-xs text-pf-warning">
                          Requested {issue.requested} · Available {issue.available}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applySingleInventoryAdjustment(issue)}
                        disabled={alreadyAdjusted}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-pf-warning-line px-3 text-xs font-semibold text-pf-warning transition-colors hover:bg-pf-warning-bg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                      >
                        {alreadyAdjusted ? 'Adjusted' : issue.available > 0 ? `Adjust to ${issue.available}` : 'Remove item'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {isEmpty ? (
        <Card className="px-4 py-6 text-center">
          <h2 className="text-xl font-semibold text-pf-text">Your draft is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-pf-muted">
            Add products to get started.
          </p>
          {(suggestionsLoading || suggestedProducts.length > 0) && (
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-pf-text">Suggested products</h3>
                </div>
                {suggestionsLoading && <Loader2 className="h-4 w-4 animate-spin text-pf-accent" />}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestionsLoading
                  ? Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="h-20 animate-pulse rounded-lg border border-pf-line bg-pf-canvas" />
                    ))
                  : suggestedProducts.map((product) => (
                      <div key={product.id} className="rounded-lg border border-pf-line bg-pf-surface p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-pf-text">{product.name}</p>
                            </div>
                            <p className="mt-1 text-xs text-pf-muted">{product.grower.businessName}</p>
                            <p className="mt-1 text-xs text-pf-muted">
                              {product.isPriceVisible ? `$${(product.price ?? 0).toFixed(2)}${product.unit ? `/${formatProductUnit(product.unit)}` : ''}` : ''}
                              {product.isPriceVisible ? ' · ' : ''}
                              {product.inventoryQty} available
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => product.isPriceVisible ? addSuggestedProduct(product) : router.push(`/dispensary/catalog?product=${encodeURIComponent(product.id)}&search=${encodeURIComponent(product.name)}`)}
                            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-[#032116] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                          >
                            {product.isPriceVisible && <Plus className="h-3.5 w-3.5" />}
                            {product.isPriceVisible ? 'Add' : 'Request pricing'}
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-6">
            <Link href="/dispensary/catalog" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] hover:bg-emerald-400">
              Browse catalog
            </Link>
            <Link href="/dispensary/saved" className="inline-flex h-10 items-center justify-center rounded-lg border border-pf-line-strong px-4 text-sm font-semibold text-pf-secondary hover:bg-pf-canvas">
              Saved
            </Link>
          </div>
        </Card>
      ) : (
        <div id="draft-items" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => {
              const atMax = item.quantity >= item.maxQty;
              return (
                <Card key={item.id}>
                  <CardContent className="flex flex-wrap gap-3 p-3 sm:p-4 sm:flex-nowrap">
                    <ProductImage src={item.image} alt={item.name} productType={item.productType} className="h-14 w-14 shrink-0 rounded-lg sm:h-20 sm:w-20" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold sm:text-base">{item.name}</p>
                      <p className="text-xs text-pf-muted sm:text-sm">{item.grower} · ${item.price}/{formatProductUnit(item.unit)}</p>
                      {item.acceptedQuoteId ? <p className="mt-1 inline-flex rounded-full bg-pf-accent-bg px-2 py-1 text-xs font-semibold text-pf-accent ring-1 ring-pf-accent-line">Quoted: ${item.quotedUnitPrice?.toFixed(2)}/{formatProductUnit(item.unit)} × up to {item.quotedQuantity}</p> : null}
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-4">
                      <div className="flex items-center rounded border border-pf-line-strong">
                        <button aria-label={`Decrease quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, -1)} className="h-10 w-10">-</button>
                        <input
                          type="number"
                          aria-label={`Quantity for ${item.name}`}
                        value={item.quantity}
                          onChange={(e) => setExactQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="h-10 w-12 text-center text-base border-x border-pf-line-strong"
                        />
                        <button
                          aria-label={`Increase quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, 1)}
                          disabled={atMax}
                          className="h-10 w-10 disabled:opacity-30"
                        >+</button>
                      </div>
                      <p className="font-bold">${getLineTotal(item).toFixed(2)}</p>
                      <button aria-label={`Remove ${item.name} from draft`}
                      onClick={() => removeItem(item.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-pf-danger hover:bg-pf-danger-bg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <section id="draft-logistics" className="scroll-mt-24"><Card className={builderStep === 'logistics' ? 'ring-2 ring-emerald-400' : ''}>
              <CardHeader className="pb-2">
                <CardTitle>Logistics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                <div>
                  <label htmlFor="fulfillment-method-page" className="block text-sm font-medium text-pf-secondary">
                    Fulfillment
                  </label>
                  <select
                    id="fulfillment-method-page"
                    value={fulfillmentMethod}
                    onChange={(event) => {
                      setFulfillmentMethod(event.target.value);
                      setBuilderStep('logistics');
                    }}
                    className="mt-1 w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base sm:text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <option>Flexible</option>
                    <option>Pickup</option>
                    <option>Delivery requested</option>
                    <option>Coordinate with grower</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="requested-window-page" className="block text-sm font-medium text-pf-secondary">
                    Requested window <span className="text-xs font-normal text-pf-muted">(optional)</span>
                  </label>
                  <input
                    id="requested-window-page"
                    value={requestedWindow}
                    onChange={(event) => {
                      setRequestedWindow(event.target.value);
                      setBuilderStep('logistics');
                    }}
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base sm:text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="e.g. Tuesday morning"
                  />
                  <p className="mt-1 text-right text-xs text-pf-muted">{requestedWindow.length}/120</p>
                </div>
              </CardContent>
            </Card>

            </section>
            <section id="draft-terms" className="scroll-mt-24"><Card className={builderStep === 'terms' ? 'ring-2 ring-emerald-400' : ''}>
              <CardHeader className="pb-2">
                <CardTitle>Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label htmlFor="payment-terms-page" className="block text-sm font-medium text-pf-secondary">
                    Payment terms
                  </label>
                  <select
                    id="payment-terms-page"
                    value={paymentTerms}
                    onChange={(event) => {
                      setPaymentTerms(event.target.value);
                      setBuilderStep('terms');
                    }}
                    className="mt-1 w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base sm:text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-pf-muted">Arrange payment directly with the grower.</p>
                </div>

                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label htmlFor="request-notes-page" className="block text-sm font-medium text-pf-secondary">
                      Notes <span className="font-normal text-pf-muted">(optional)</span>
                    </label>
                    <select aria-label="Add a note template" value="" onChange={event => { if (event.target.value) applyNoteTemplate(event.target.value); }} className="min-h-10 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-base sm:text-sm">
                      <option value="">Add note template…</option>
                      {REQUEST_NOTE_TEMPLATES.map(template => <option key={template.label} value={template.body}>{template.label}</option>)}
                    </select>
                  </div>
                  <textarea
                    id="request-notes-page"
                    value={orderNotes}
                    onChange={(event) => {
                      setOrderNotes(event.target.value);
                      setBuilderStep('terms');
                    }}
                    rows={3}
                    maxLength={500}
                    className="mt-1 w-full rounded-lg border border-pf-line-strong px-3 py-2.5 text-base sm:text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="Delivery details, PO number, or other notes."
                  />
                  <p className="mt-1 text-right text-xs text-pf-muted">{orderNotes.length}/500</p>
                </div>
              </CardContent>
            </Card></section>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-2"><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Total</span><span>${cart.subtotal.toFixed(2)}</span></div>
              <p className="text-sm text-pf-muted">{cart.items.length} item{cart.items.length === 1 ? '' : 's'} · {Object.keys(growerGroups).length} grower{Object.keys(growerGroups).length === 1 ? '' : 's'}</p>
              <button
                onClick={() => {
                  setBuilderStep('review');
                  setShowRequestReview(true);
                }}
                disabled={submittingRequest || !requestDetailsReady}
                className="hidden w-full bg-emerald-500 text-[#032116] py-3 rounded-lg sm:block hover:bg-emerald-400 disabled:opacity-50"
              >
                Review Request
              </button>
              {!requestDetailsReady && (
                <p className="text-xs text-pf-danger">
                  Add at least one item and confirm fulfillment and direct payment terms before review.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showRequestReview && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div ref={reviewRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="request-review-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-pf-line bg-pf-surface shadow-2xl">
            <div className="shrink-0 border-b border-pf-line bg-pf-canvas px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="request-review-title" className="text-lg font-semibold text-pf-text">Review request</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequestReview(false)}
                  className="rounded-lg p-2 text-pf-muted hover:bg-pf-raised hover:text-pf-text"
                  aria-label="Close request review"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div className="rounded-xl border border-pf-line bg-pf-canvas p-2 sm:p-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Items', value: `${cart.items.length} item${cart.items.length === 1 ? '' : 's'}`, step: 'items' as BuilderStep },
                    { label: 'Growers', value: `${Object.keys(growerGroups).length}`, step: 'items' as BuilderStep },
                    { label: 'Fulfillment', value: fulfillmentMethod || 'Not set', step: 'logistics' as BuilderStep },
                    { label: 'Terms', value: paymentTerms || 'Not set', step: 'terms' as BuilderStep },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-pf-surface px-2 py-2 ring-1 ring-pf-line sm:px-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-pf-muted">{item.label}</p>
                          <p className="mt-0.5 text-sm font-semibold text-pf-text">{item.value}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequestReview(false);
                            setBuilderStep(item.step);
                          }}
                          className="inline-flex min-h-10 min-w-10 items-center justify-center text-xs font-semibold text-pf-accent hover:text-pf-accent"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(growerGroups).map(([growerId, group]) => {
                  const terms = growerTerms[growerId] || {
                    fulfillmentRegion: DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion,
                    paymentTerms: DEFAULT_COMMERCIAL_TERMS.paymentTerms,
                  };

                  return (
                    <div key={growerId} className="rounded-lg border border-pf-line p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-pf-text">{group.grower}</h3>
                          <p className="mt-1 text-xs text-pf-muted">
                            {terms.fulfillmentRegion} · {terms.paymentTerms}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-pf-secondary">${group.subtotal.toFixed(2)}</span>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-pf-secondary">
                        {group.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span>{item.quantity} × {item.name}</span>
                            <span className="font-medium">${getLineTotal(item).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-pf-warning-bg p-3 text-xs text-pf-warning sm:p-4 sm:text-sm">
                Stock is checked before submission. Any changes return to your draft.
              </div>
            </div>

            <div className="shrink-0 border-t border-pf-line bg-pf-surface px-4 py-3">
              <div className="mb-3 space-y-1 text-sm">
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>${cart.subtotal.toFixed(2)}</span></div>
                <p className="text-xs text-pf-muted">Payment arranged with the grower.</p>
              </div>
              <div className="flex items-stretch justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestReview(false)}
                  disabled={submittingRequest || inventorySyncing}
                  className="rounded-lg border border-pf-line-strong px-4 py-2 text-pf-secondary hover:bg-pf-canvas disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest || inventorySyncing}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-[#032116] hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting Request...' : 'Submit request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

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
              ? undefined
              : 'Confirm fulfillment and direct payment terms first.'
          }
          secondary={
            <Link
              href="/dispensary/catalog"
              className="rounded-lg border border-pf-line-strong px-4 py-3 text-sm font-semibold text-pf-secondary"
            >
              Add items
            </Link>
          }
        />
      )}
    </div>
  );
}
