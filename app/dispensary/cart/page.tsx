'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle2, Trash2 } from 'lucide-react';
import {
  readCart,
  writeCart,
  calculateTotals,
  getLineTotal,
  removeOrderedItems,
  syncAccountCart,
  getCartSyncError,
  retryCartSync,
  normalizeCart,
  type Cart,
  type CartItem,
} from '@/lib/cart';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { Modal } from '@/app/components/ui/Modal';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { formatProductUnit } from '@/lib/product-display';
import { formatMoney } from '@/lib/format';
import { buildOrderRequestNotes } from '@/lib/order-workflow';
import { normalizeOrderDefaults } from '@/lib/buyer-defaults';
import { isLicenseExpired } from '@/lib/license';
import { toast } from '@/app/hooks/useToast';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';

type Details = ReturnType<typeof normalizeOrderDefaults> & {
  deliveryAddress: string;
};
type Pending = {
  key: string;
  cart: Cart;
  notes: string;
  growerNotes?: Record<string, string>;
  details: Details;
};
type Receipt = {
  id: string;
  orderId: string;
  growerId: string;
  orderedProductIds: string[];
};
type Terms = {
  growerId: string;
  minimumOrder: string;
  fulfillmentMethods: string;
  fulfillmentRegion: string;
  paymentTerms: string;
};
type Issue = {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  reason?: string;
};
const emptyDetails: Details = {
  ...normalizeOrderDefaults(null),
  deliveryAddress: '',
};
const inputClass =
  'mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-surface px-3 py-2 text-base sm:text-sm';
function readPending(key: string): Pending | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (
    !value ||
    typeof value.key !== 'string' ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(value.key) ||
    !Array.isArray(value.cart?.items) ||
    !value.cart.items.length ||
    typeof value.notes !== 'string'
  )
    throw new Error(
      'The saved confirmation could not be read. Check your orders before sending again.'
    );
  return value;
}
function minimumValue(value: string) {
  const match = value.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}

export default function DispensaryCartPage() {
  const { data: session } = useSession();
  const key = session?.user.id
    ? `phenofarm:pending-request:${session.user.id}`
    : null;
  const [cart, setCart] = useState<Cart>(normalizeCart(null));
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [storageError, setStorageError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const busy = useRef(false);
  const [review, setReview] = useState(false);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [license, setLicense] = useState<
    'loading' | 'approved' | 'pending' | 'error'
  >('loading');
  const [terms, setTerms] = useState<Record<string, Terms>>({});
  const [termChoices, setTermChoices] = useState<Record<string, string>>({});
  const [termsError, setTermsError] = useState('');
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>(
    {}
  );
  const [profileRetry, setProfileRetry] = useState(0);
  const [termsRetry, setTermsRetry] = useState(0);
  const persist = useCallback((next: Cart) => {
    writeCart(next);
    setCart(readCart());
  }, []);
  const draftValue = useMemo(
    () => ({ details, termChoices }),
    [details, termChoices]
  );
  const draft = useLocalDraft({
    key: 'cart-details-v2',
    value: draftValue,
    enabled: ready && !pending && cart.items.length > 0,
    autoRestore: false,
    onRestore: (value) => {
      setDetails({
        ...normalizeOrderDefaults(value?.details),
        deliveryAddress:
          typeof value?.details?.deliveryAddress === 'string'
            ? value.details.deliveryAddress.slice(0, 500)
            : '',
      });
      if (value?.termChoices && typeof value.termChoices === 'object')
        setTermChoices(
          Object.fromEntries(
            Object.entries(value.termChoices)
              .filter(([, term]) => typeof term === 'string')
              .map(([id, term]) => [id, term.slice(0, 120)])
          )
        );
    },
  });

  useEffect(() => {
    if (!key || !session?.user.id) return;
    let stopped = false;
    const update = () => {
      setCart(readCart());
      setSyncError(getCartSyncError());
    };
    window.addEventListener('cart-updated', update);
    window.addEventListener('cart-sync-updated', update);
    void syncAccountCart(session.user.id).then(() => {
      if (stopped) return;
      update();
      try {
        setPending(readPending(key));
      } catch (cause) {
        setStorageError(
          cause instanceof Error
            ? cause.message
            : 'Check your orders before sending again.'
        );
      }
      setReady(true);
    });
    return () => {
      stopped = true;
      window.removeEventListener('cart-updated', update);
      window.removeEventListener('cart-sync-updated', update);
    };
  }, [key, session?.user.id]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/dispensary/settings', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setLicense(
          data.licenseStatus === 'verified' &&
            !isLicenseExpired(data.licenseExpiry)
            ? 'approved'
            : 'pending'
        );
        const defaults = normalizeOrderDefaults(data.orderDefaults);
        setDetails((current) => ({
          ...defaults,
          ...Object.fromEntries(
            Object.entries(current).filter(
              ([, value]) => value && value !== 'Coordinate with grower'
            )
          ),
          deliveryAddress:
            current.deliveryAddress ||
            [data.address, data.city, data.state, data.zip]
              .filter(Boolean)
              .join(', '),
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted) setLicense('error');
      });
    return () => controller.abort();
  }, [profileRetry]);

  const growerKey = [...new Set(cart.items.map((item) => item.growerId))]
    .sort()
    .join(',');
  useEffect(() => {
    if (!growerKey) return;
    const controller = new AbortController();
    setTermsError('');
    void fetch(
      `/api/dispensary/grower-terms?ids=${encodeURIComponent(growerKey)}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setTerms(
          Object.fromEntries(
            (data.terms as Terms[]).map((term) => [term.growerId, term])
          )
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setTermsError('Grower terms could not load.');
      });
    return () => controller.abort();
  }, [growerKey, termsRetry]);

  const refresh = useCallback(async () => {
    const saved = readCart();
    if (!saved.items.length) return;
    setRefreshing(true);
    try {
      const [response, quotesResponse] = await Promise.all([
        fetch('/api/dispensary/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: saved.items.map((item) => item.id),
          }),
        }),
        fetch('/api/dispensary/accepted-quotes'),
      ]);
      if (!response.ok || !quotesResponse.ok)
        throw new Error('Stock could not refresh. Please retry.');
      const data = await response.json();
      const quoteData = await quotesResponse.json();
      const live = new Map<
        string,
        {
          id: string;
          inventoryQty: number;
          price: number | null;
          isPriceVisible: boolean;
          isAvailable: boolean;
        }
      >(data.products.map((item: { id: string }) => [item.id, item]));
      const quotes = new Map<
        string,
        { id: string; quantity: number | null; unitPrice: number }
      >(
        quoteData.quotes.map((quote: { productId: string }) => [
          quote.productId,
          quote,
        ])
      );
      const nextChanges: Record<string, string> = {};
      const items = readCart().items.map((item) => {
        const product = live.get(item.id);
        if (!product) return item;
        const quote = quotes.get(item.id);
        const price = quote?.unitPrice ?? product.price ?? 0;
        const notices = [];
        if (item.price !== price && product.isPriceVisible)
          notices.push(`${formatMoney(item.price)} → ${formatMoney(price)}`);
        if (!product.isAvailable) notices.push('Sold out');
        else if (item.quantity > product.inventoryQty)
          notices.push(`Only ${product.inventoryQty} available`);
        if (notices.length)
          nextChanges[item.id] = `${item.name}: ${notices.join('; ')}`;
        const next = {
          ...item,
          price,
          listPrice: product.price ?? undefined,
          maxQty: product.inventoryQty,
          unavailable: !product.isAvailable,
          image: item.image || `/api/dispensary/products/${item.id}/thumbnail`,
          requiresQuote:
            !product.isPriceVisible &&
            (!quote ||
              (quote.quantity != null && quote.quantity < item.quantity)),
        };
        delete next.acceptedQuoteId;
        delete next.quotedQuantity;
        delete next.quotedUnitPrice;
        return quote
          ? {
              ...next,
              acceptedQuoteId: quote.id,
              quotedQuantity: quote.quantity ?? product.inventoryQty,
              quotedUnitPrice: quote.unitPrice,
            }
          : next;
      });
      setChanges(nextChanges);
      persist({ items, ...calculateTotals(items) });
      return items;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not refresh stock.'
      );
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [persist]);
  useEffect(() => {
    if (ready && !pending && !storageError) void refresh();
  }, [ready, pending, storageError, refresh]);

  function remove(id: string) {
    const removed = cart.items.find((item) => item.id === id);
    if (!removed) return;
    persist(
      normalizeCart({ items: cart.items.filter((item) => item.id !== id) })
    );
    setIssues((value) => value.filter((issue) => issue.productId !== id));
    toast.success(`${removed.name} removed`, {
      action: {
        label: 'Undo',
        onClick: () => {
          const current = readCart();
          if (!current.items.some((item) => item.id === id))
            persist(normalizeCart({ items: [...current.items, removed] }));
        },
      },
    });
  }
  function quantity(item: CartItem, value: string) {
    const number = Number(value.replace(/[,\s]/g, ''));
    if (!Number.isSafeInteger(number) || number < 1) {
      setError(`Enter a whole number of 1 or more for ${item.name}.`);
      return;
    }
    persist(
      normalizeCart({
        items: readCart().items.map((row) =>
          row.id === item.id
            ? { ...row, quantity: number, maxQty: item.maxQty }
            : row
        ),
      })
    );
    setQuantityEdits((value) => {
      const next = { ...value };
      delete next[item.id];
      return next;
    });
  }
  function problematic(item: CartItem) {
    return item.unavailable || item.maxQty < 1
      ? 'Sold out'
      : item.requiresQuote
        ? 'Price on request'
        : item.quantity > item.maxQty
          ? `Only ${item.maxQty} available`
          : '';
  }
  function reviewOrder() {
    setError('');
    const edited = Object.entries(quantityEdits).find(
      ([, value]) => !Number.isSafeInteger(Number(value)) || Number(value) < 1
    );
    if (edited) {
      setError('Enter a whole number of 1 or more.');
      document.getElementById(`qty-${edited[0]}`)?.focus();
      return;
    }
    const problem = readCart().items.find(problematic);
    if (problem) {
      setError(`Review ${problem.name}: ${problematic(problem)}.`);
      document
        .getElementById(`cart-${problem.id}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (
      details.fulfillmentMethod === 'Delivery requested' &&
      !details.deliveryAddress.trim()
    ) {
      setError('Add a delivery address.');
      document.getElementById('delivery-address')?.focus();
      return;
    }
    setReview(true);
  }
  async function send() {
    if (
      busy.current ||
      !key ||
      storageError ||
      (!pending && license !== 'approved')
    )
      return;
    busy.current = true;
    setSending(true);
    setError('');
    try {
      const prepare = () => {
        const existing = readPending(key) || pending;
        if (existing) return existing;
        const current = readCart();
        if (current.items.some(problematic))
          throw new Error('Review unavailable products before sending.');
        const growerNotes = Object.fromEntries(
          [...new Set(current.items.map((item) => item.growerId))].map((id) => [
            id,
            buildOrderRequestNotes({
              ...details,
              paymentTerms:
                termChoices[id] ||
                terms[id]?.paymentTerms ||
                details.paymentTerms ||
                'Coordinate with grower',
              buyerNotes: details.orderNotes,
            }),
          ])
        );
        const attempt: Pending = {
          key: crypto.randomUUID(),
          cart: current,
          details,
          notes: buildOrderRequestNotes({
            ...details,
            buyerNotes: details.orderNotes,
          }),
          growerNotes,
        };
        localStorage.setItem(key, JSON.stringify(attempt));
        return attempt;
      };
      const attempt = navigator.locks
        ? await navigator.locks.request(key, prepare)
        : prepare();
      setPending(attempt);
      setReview(false);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': attempt.key,
        },
        body: JSON.stringify({
          items: attempt.cart.items,
          notes: attempt.notes,
          growerNotes: attempt.growerNotes,
          deliveryAddress: attempt.details.deliveryAddress,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const finalLicense =
          response.status === 403 &&
          ['LICENSE_NOT_VERIFIED', 'LICENSE_EXPIRED'].includes(data.code);
        if (
          ([400, 409].includes(response.status) &&
            data.code !== 'SUBMISSION_CONFLICT') ||
          finalLicense
        ) {
          if (Array.isArray(data.orders))
            persist(removeOrderedItems(readCart(), data.orders));
          localStorage.removeItem(key);
          setPending(null);
        }
        if (finalLicense) {
          setLicense('pending');
          setError('');
          return;
        }
        setIssues(Array.isArray(data.issues) ? data.issues : []);
        throw new Error(data.error || 'Could not send your order.');
      }
      if (
        !Array.isArray(data.orders) ||
        !data.orders.length ||
        data.orders.some(
          (order: Receipt) => !Array.isArray(order.orderedProductIds)
        )
      )
        throw new Error(
          'We could not confirm receipt. Check this order before trying again.'
        );
      persist(removeOrderedItems(readCart(), data.orders));
      if (!readCart().items.length) draft.clearDraft();
      localStorage.removeItem(key);
      setPending(null);
      setReceipts(data.orders);
      setIssues(data.issues || []);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== 'TypeError'
          ? cause.message
          : 'Connection lost. Check this order to confirm whether it was received.'
      );
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  const groups = cart.items.reduce<
    Record<string, { grower: string; items: CartItem[]; subtotal: number }>
  >((all, item) => {
    const group = (all[item.growerId] ||= {
      grower: item.grower,
      items: [],
      subtotal: 0,
    });
    group.items.push(item);
    group.subtotal += getLineTotal(item);
    return all;
  }, {});
  const notice =
    license === 'pending' ? (
      <p className="rounded-lg border border-pf-warning-line bg-pf-warning-bg p-3 text-sm text-pf-warning">
        You can send orders once your license is approved — we’ll keep your
        cart.{' '}
        <Link
          href="/dispensary/settings#license-verification"
          className="inline-flex min-h-11 items-center font-semibold underline"
        >
          Check status
        </Link>
      </p>
    ) : license === 'error' ? (
      <p role="alert" className="text-sm text-pf-danger">
        Could not check license status.{' '}
        <button
          onClick={() => setProfileRetry((value) => value + 1)}
          className="min-h-11 underline"
        >
          Retry
        </button>
      </p>
    ) : null;
  if (!ready)
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Cart" />
        <p role="status">Loading your cart…</p>
      </div>
    );
  if (pending || storageError)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title={sending ? 'Sending request…' : 'Check your request'}
        />
        <p>
          Check whether your request was received. This will not create a
          duplicate.
        </p>
        {(error || storageError) && (
          <p role="alert" className="text-pf-danger">
            {error || storageError}
          </p>
        )}
        <button
          disabled={sending || !!storageError}
          onClick={send}
          className="min-h-11 rounded-lg bg-emerald-500 px-4 font-semibold text-[#032116]"
        >
          {sending ? 'Checking…' : 'Check request'}
        </button>
        <Link
          href="/dispensary/orders"
          className="ml-4 inline-flex min-h-11 items-center text-pf-accent"
        >
          View orders
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Cart"
        mobileInlineActions
        actions={
          <Link
            href="/dispensary/catalog"
            className="inline-flex min-h-11 items-center text-sm text-pf-accent"
          >
            Add products
          </Link>
        }
      />
      {receipts.length > 0 && (
        <section
          role="status"
          className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-4"
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            {receipts.length === 1 ? 'Request submitted' : 'Requests submitted'}
          </h2>
          <ul>
            {receipts.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dispensary/orders/${order.id}`}
                  className="inline-flex min-h-11 items-center font-semibold text-pf-accent underline"
                >
                  {order.orderId}
                </Link>
              </li>
            ))}
          </ul>
          {cart.items.length > 0 && (
            <p className="text-sm">
              The remaining products are still in your cart.
            </p>
          )}
        </section>
      )}
      {notice}
      {draft.availableDraft && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-pf-line bg-pf-surface p-3 text-sm">
          <p>Saved pickup, delivery and notes are available.</p>
          <button
            type="button"
            onClick={draft.restoreDraft}
            className="min-h-11 font-semibold text-pf-accent"
          >
            Restore draft
          </button>
          <button
            type="button"
            onClick={draft.clearDraft}
            className="min-h-11 text-pf-muted"
          >
            Discard draft
          </button>
        </div>
      )}
      {draft.storageError && (
        <p role="alert" className="text-sm text-pf-warning">
          {draft.storageError}
        </p>
      )}
      {syncError && (
        <p role="alert" className="text-pf-warning">
          {syncError}{' '}
          <button onClick={retryCartSync} className="min-h-11 underline">
            Retry sync
          </button>
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-pf-danger-bg p-3 text-sm text-pf-danger"
        >
          {error}
        </p>
      )}
      {Object.keys(changes).length > 0 && (
        <section
          role="status"
          className="rounded-lg bg-pf-warning-bg p-3 text-sm text-pf-warning"
        >
          <h2 className="font-semibold">Cart updated</h2>
          <ul>
            {Object.values(changes).map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      )}
      {issues.length > 0 && (
        <ul className="rounded-lg bg-pf-warning-bg p-3 text-sm">
          {issues.map((issue) => (
            <li key={issue.productId}>
              {issue.productName}:{' '}
              {issue.available > 0
                ? `only ${issue.available} available`
                : 'sold out'}{' '}
              <button
                className="min-h-11 underline"
                onClick={() => {
                  const item = cart.items.find(
                    (item) => item.id === issue.productId
                  );
                  if (issue.available === 0) remove(issue.productId);
                  else if (item)
                    quantity(
                      { ...item, maxQty: issue.available },
                      String(issue.available)
                    );
                  setIssues((value) =>
                    value.filter((row) => row.productId !== issue.productId)
                  );
                }}
              >
                {issue.available > 0
                  ? `Set to ${issue.available}`
                  : 'Remove item'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!cart.items.length ? (
        !receipts.length && (
          <section className="rounded-xl border border-pf-line bg-pf-surface p-6 text-center">
            <h2 className="text-lg font-semibold">Your cart is empty</h2>
            <Link
              href="/dispensary/catalog"
              className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-emerald-500 px-4 font-semibold text-[#032116]"
            >
              Browse catalog
            </Link>
            <Link
              href="/dispensary/saved?tab=recent"
              className="ml-3 inline-flex min-h-11 items-center text-pf-accent"
            >
              Recently ordered
            </Link>
          </section>
        )
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              {Object.entries(groups).map(([id, group]) => {
                const term = terms[id];
                const minimum = minimumValue(term?.minimumOrder || '');
                return (
                  <section
                    key={id}
                    className="rounded-xl border border-pf-line bg-pf-surface p-3 sm:p-4"
                  >
                    <div className="mb-3 flex justify-between gap-3">
                      <h2 className="font-semibold">
                        <Link href={`/dispensary/grower/${id}`}>
                          {group.grower}
                        </Link>
                      </h2>
                      <strong>{formatMoney(group.subtotal)}</strong>
                    </div>
                    {term && (
                      <p className="mb-2 text-sm text-pf-muted">
                        {[
                          term.minimumOrder,
                          term.fulfillmentRegion,
                          term.paymentTerms,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {minimum != null && group.subtotal < minimum && (
                      <p className="mb-3 text-sm text-pf-warning">
                        Minimum {formatMoney(minimum)} — add{' '}
                        {formatMoney(minimum - group.subtotal)} more, or agree a
                        smaller order with the grower.
                      </p>
                    )}
                    <div className="divide-y divide-pf-line">
                      {group.items.map((item) => {
                        const problem = problematic(item);
                        return (
                          <article
                            id={`cart-${item.id}`}
                            key={item.id}
                            className={`scroll-mt-24 py-3 ${problem || changes[item.id] ? 'rounded-lg bg-pf-warning-bg px-2' : ''}`}
                          >
                            <div className="flex gap-3">
                              <ProductImage
                                src={
                                  item.image ||
                                  `/api/dispensary/products/${item.id}/thumbnail`
                                }
                                alt={item.name}
                                productType={item.productType}
                                className="h-16 w-16 shrink-0 rounded-lg"
                              />
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dispensary/catalog?product=${item.id}`}
                                  className="break-words font-semibold hover:underline"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-sm text-pf-muted">
                                  {item.requiresQuote
                                    ? 'Price on request'
                                    : `${formatMoney(item.price)} / ${formatProductUnit(item.unit)}`}
                                </p>
                                {item.acceptedQuoteId && (
                                  <p className="text-sm text-pf-accent">
                                    Quote: {formatMoney(item.quotedUnitPrice)} /{' '}
                                    {formatProductUnit(item.unit)} · up to{' '}
                                    {item.quotedQuantity}
                                  </p>
                                )}
                                {problem && (
                                  <p className="text-sm font-semibold text-pf-warning">
                                    {problem}{' '}
                                    {item.requiresQuote && (
                                      <Link
                                        href={`/messages?growerId=${item.growerId}&productId=${item.id}`}
                                        className="inline-flex min-h-11 items-center underline"
                                      >
                                        Ask for price
                                      </Link>
                                    )}
                                    {item.quantity > item.maxQty &&
                                      item.maxQty > 0 && (
                                        <button
                                          className="ml-2 min-h-11 underline"
                                          onClick={() =>
                                            quantity(item, String(item.maxQty))
                                          }
                                        >
                                          Set to {item.maxQty}
                                        </button>
                                      )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex rounded-lg border border-pf-line-strong">
                                <button
                                  aria-label={`Decrease quantity for ${item.name}`}
                                  disabled={item.quantity <= 1}
                                  onClick={() =>
                                    quantity(item, String(item.quantity - 1))
                                  }
                                  className="h-11 w-11 disabled:opacity-40"
                                >
                                  −
                                </button>
                                <input
                                  id={`qty-${item.id}`}
                                  aria-label={`Quantity for ${item.name}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    quantityEdits[item.id] ??
                                    String(item.quantity)
                                  }
                                  onChange={(event) =>
                                    setQuantityEdits((value) => ({
                                      ...value,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  onBlur={(event) =>
                                    quantity(item, event.target.value)
                                  }
                                  className="h-11 w-14 border-x border-pf-line-strong bg-transparent text-center text-base"
                                />
                                <button
                                  aria-label={`Increase quantity for ${item.name}`}
                                  disabled={item.quantity >= item.maxQty}
                                  onClick={() =>
                                    quantity(item, String(item.quantity + 1))
                                  }
                                  className="h-11 w-11 disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                              <strong>{formatMoney(getLineTotal(item))}</strong>
                              <button
                                aria-label={`Remove ${item.name} from cart`}
                                onClick={() => remove(item.id)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-pf-danger hover:bg-pf-danger-bg"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <label className="mt-3 block text-sm">
                      Payment timing
                      <select
                        className={inputClass}
                        value={
                          termChoices[id] ||
                          term?.paymentTerms ||
                          details.paymentTerms ||
                          'Coordinate with grower'
                        }
                        onChange={(event) =>
                          setTermChoices((value) => ({
                            ...value,
                            [id]: event.target.value,
                          }))
                        }
                      >
                        {[
                          ...new Set([
                            term?.paymentTerms || 'Coordinate with grower',
                            ...(details.paymentTerms
                              ? [details.paymentTerms]
                              : []),
                          ]),
                        ].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    {termChoices[id] &&
                      termChoices[id] !== term?.paymentTerms && (
                        <p className="text-sm text-pf-warning">
                          This differs from the grower’s terms and needs their
                          agreement.
                        </p>
                      )}
                  </section>
                );
              })}
              {termsError && (
                <p role="alert" className="text-sm text-pf-warning">
                  {termsError}{' '}
                  <button
                    onClick={() => setTermsRetry((value) => value + 1)}
                    className="min-h-11 underline"
                  >
                    Retry
                  </button>
                </p>
              )}
              <section className="space-y-3 rounded-xl border border-pf-line bg-pf-surface p-4">
                <h2 className="font-semibold">Pickup & delivery</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Pickup or delivery
                    <select
                      className={inputClass}
                      value={details.fulfillmentMethod}
                      onChange={(event) =>
                        setDetails((value) => ({
                          ...value,
                          fulfillmentMethod: event.target.value,
                        }))
                      }
                    >
                      {[
                        'Coordinate with grower',
                        'Pickup',
                        'Delivery requested',
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    Preferred date or time (optional)
                    <input
                      className={inputClass}
                      maxLength={120}
                      value={details.requestedWindow}
                      onChange={(event) =>
                        setDetails((value) => ({
                          ...value,
                          requestedWindow: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                {details.fulfillmentMethod === 'Delivery requested' && (
                  <label className="block text-sm">
                    Delivery address
                    <textarea
                      id="delivery-address"
                      required
                      maxLength={500}
                      className={inputClass}
                      rows={2}
                      value={details.deliveryAddress}
                      onChange={(event) =>
                        setDetails((value) => ({
                          ...value,
                          deliveryAddress: event.target.value,
                        }))
                      }
                    />
                  </label>
                )}
                <label className="block text-sm">
                  Notes (optional)
                  <textarea
                    className={inputClass}
                    maxLength={500}
                    rows={3}
                    value={details.orderNotes}
                    onChange={(event) =>
                      setDetails((value) => ({
                        ...value,
                        orderNotes: event.target.value,
                      }))
                    }
                  />
                </label>
              </section>
            </div>
            <aside className="hidden h-fit space-y-3 lg:block rounded-xl border border-pf-line bg-pf-surface p-4">
              <h2 className="font-semibold">Summary</h2>
              <p>
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}{' '}
                · {Object.keys(groups).length}{' '}
                {Object.keys(groups).length === 1 ? 'grower' : 'growers'}
              </p>
              <p className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatMoney(cart.total)}</span>
              </p>
              <button
                onClick={reviewOrder}
                disabled={sending || refreshing}
                className="min-h-11 w-full rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-[#032116] disabled:opacity-50"
              >
                Review request
              </button>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="min-h-11 text-sm text-pf-accent"
              >
                {refreshing ? 'Refreshing…' : 'Refresh stock'}
              </button>
            </aside>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="min-h-11 text-sm text-pf-accent lg:hidden"
          >
            {refreshing ? 'Refreshing…' : 'Refresh stock'}
          </button>
          <StickyMobileActionBar
            primaryLabel="Review request"
            onPrimary={reviewOrder}
            disabled={sending || refreshing}
            helperText={`${cart.items.length} ${cart.items.length === 1 ? 'item' : 'items'} · ${formatMoney(cart.total)}`}
            secondary={
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-pf-line-strong px-3 text-sm"
                href="/dispensary/catalog"
              >
                Add items
              </Link>
            }
          />
        </>
      )}
      <Modal
        open={review}
        onClose={() => setReview(false)}
        title="Review request"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {notice}
          <p className="text-sm">
            {details.fulfillmentMethod}
            {details.requestedWindow ? ` · ${details.requestedWindow}` : ''}
          </p>
          {details.fulfillmentMethod === 'Delivery requested' && (
            <p className="text-sm">
              <strong>Deliver to:</strong> {details.deliveryAddress}
            </p>
          )}
          {Object.entries(groups).map(([id, group]) => (
            <section key={id} className="rounded-lg border border-pf-line p-3">
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold">{group.grower}</h3>
                <strong>{formatMoney(group.subtotal)}</strong>
              </div>
              <p className="my-2 text-sm text-pf-muted">
                {termChoices[id] ||
                  terms[id]?.paymentTerms ||
                  details.paymentTerms ||
                  'Coordinate with grower'}
              </p>
              <ul className="space-y-2 text-sm">
                {group.items.map((item) => (
                  <li className="flex justify-between gap-3" key={item.id}>
                    <span>
                      {item.name} × {item.quantity}{' '}
                      {formatProductUnit(item.unit)}
                    </span>
                    <span>{formatMoney(getLineTotal(item))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {details.orderNotes && (
            <p className="whitespace-pre-wrap text-sm">{details.orderNotes}</p>
          )}
          <p className="text-sm text-pf-muted">
            Sending a request does not reserve stock. The grower checks
            availability and deducts stock when accepting. Payment is arranged
            directly with each grower.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pf-line pt-3">
            <strong>Total {formatMoney(cart.total)}</strong>
            <button
              disabled={sending || license !== 'approved' || refreshing}
              onClick={send}
              className="min-h-11 rounded-lg bg-emerald-500 px-4 font-semibold text-[#032116] disabled:opacity-50"
            >
              {sending
                ? 'Sending…'
                : license === 'loading'
                  ? 'Checking license…'
                  : 'Send order request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
