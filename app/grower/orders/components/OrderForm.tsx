'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { useGrowerProductOptions } from '@/app/hooks/useGrowerProductOptions';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { toast } from '@/app/hooks/useToast';
import { formatMoney, formatQuantity } from '@/lib/format';
import {
  PAYMENT_TERMS_OPTIONS,
  buildOrderRequestNotes,
  parseOrderRequestNotes,
  canEditOrderItems,
} from '@/lib/order-workflow';
import { CustomerForm } from '../../customers/components/CustomerForm';
type ProductOption = {
  id: string;
  name: string;
  price: number | string;
  inventoryQty: number;
  unit: string;
  strain?: { name: string } | null;
  status?: string;
  isAvailable?: boolean;
};
type Line = {
  id?: string;
  productId: string;
  name: string;
  unit: string;
  stock: number;
  quantity: string;
  price: string;
  catalogPrice: number;
  acceptedQuoteId?: string | null;
};
export type EditableOrder = {
  id: string;
  orderId: string;
  status: string;
  notes: string | null;
  shippingFee: number;
  tax: number;
  dispensary: { id?: string; businessName: string };
  items: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    maxQuantity: number;
    acceptedQuoteId?: string | null;
    product: { id: string; name: string; unit: string; strain: string | null };
  }[];
};
const field =
  'mt-1 min-h-11 w-full rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-base sm:text-sm';
function parseAmount(value: string) {
  return Number(value.replace(/[$,]/g, '').trim());
}
export function OrderForm({ order }: { order?: EditableOrder }) {
  const router = useRouter();
  const params = useSearchParams();
  const [customers, setCustomers] = useState<
    { id: string; businessName: string }[]
  >([]);
  const [buyer, setBuyer] = useState(order?.dispensary.id || '');
  const [buyerQuery, setBuyerQuery] = useState('');
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [buyerIndex, setBuyerIndex] = useState(0);
  const [newCustomer, setNewCustomer] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(!order);
  const [customerError, setCustomerError] = useState('');
  const [search, setSearch] = useState('');
  const {
    options,
    loading,
    error: productError,
    hasMore,
    loadMore,
  } = useGrowerProductOptions<ProductOption>(search);
  const [picker, setPicker] = useState(false);
  const [lines, setLines] = useState<Line[]>(
    order?.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      unit: i.product.unit,
      stock: i.maxQuantity,
      quantity: String(i.quantity),
      price: String(i.unitPrice),
      catalogPrice: i.unitPrice,
      acceptedQuoteId: i.acceptedQuoteId,
    })) || []
  );
  const parsed = parseOrderRequestNotes(order?.notes || null);
  const [details, setDetails] = useState({
    ...parsed.details,
    buyerNotes: parsed.notesText,
  });
  const [shipping, setShipping] = useState(String(order?.shippingFee || 0));
  const [tax, setTax] = useState(String(order?.tax || 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [adjustStock, setAdjustStock] = useState(false);
  const [quoteId, setQuoteId] = useState('');
  const { triggerDirty, resetDirtyState, confirmNavigation } =
    useUnsavedChanges();
  function clearErrors(...keys: string[]) {
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([key]) => !keys.includes(key))
      )
    );
  }
  async function loadCustomers() {
    setCustomersLoading(true);
    setCustomerError('');
    try {
      const r = await fetch('/api/dispensaries');
      if (!r.ok) throw new Error('Could not load customers.');
      setCustomers(await r.json());
    } catch (e) {
      setCustomerError(
        e instanceof Error ? e.message : 'Could not load customers.'
      );
    } finally {
      setCustomersLoading(false);
    }
  }
  useEffect(() => {
    if (order) return;
    void loadCustomers();
    let active = true;
    const source = params.get('from');
    const quote = params.get('quote');
    const customer = params.get('customer');
    if (customer) setBuyer(customer);
    if (source || quote) {
      fetch(
        quote ? `/api/grower/accepted-quotes/${quote}` : `/api/orders/${source}`
      )
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'Could not load order.');
          if (!active) return;
          if (quote) {
            setBuyer(d.dispensaryId);
            setQuoteId(d.id);
            setLines([
              {
                productId: d.productId,
                name: d.product.name,
                unit: d.product.unit,
                stock: d.product.inventoryQty,
                quantity: String(d.quantity || 1),
                price: String(d.unitPrice),
                catalogPrice: Number(d.product.price),
                acceptedQuoteId: d.id,
              },
            ]);
          } else {
            setBuyer(d.dispensaryId);
            setLines(
              d.items.map(
                (i: {
                  productId: string;
                  quantity: number;
                  unitPrice: string;
                  product: ProductOption;
                }) => ({
                  productId: i.productId,
                  name: i.product.name,
                  unit: i.product.unit,
                  stock: i.product.inventoryQty,
                  quantity: String(i.quantity),
                  price: String(i.unitPrice),
                  catalogPrice: Number(i.unitPrice),
                })
              )
            );
            const p = parseOrderRequestNotes(d.notes);
            setDetails({ ...p.details, buyerNotes: p.notesText });
            setShipping(String(d.shippingFee));
          }
        })
        .catch((e) => {
          if (active) setErrors({ form: e.message });
        });
    } else {
      fetch('/api/grower/commercial-terms')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (active && d?.terms)
            setDetails((v) => ({
              ...v,
              fulfillmentMethod: d.terms.fulfillmentMethods?.includes(
                'Delivery'
              )
                ? 'Delivery'
                : 'Pickup',
              paymentTerms: d.terms.paymentTerms || '',
            }));
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [order, params]);
  function updateLine(index: number, patch: Partial<Line>) {
    triggerDirty();
    clearErrors(`quantity-${index}`, `price-${index}`, 'items');
    setAdjustStock(false);
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }
  function addProduct(p: ProductOption) {
    if (lines.some((x) => x.productId === p.id)) {
      setErrors({
        items:
          'This product is already in the order. Change its quantity below.',
      });
      return;
    }
    triggerDirty();
    clearErrors('items');
    setLines((prev) => [
      ...prev,
      {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        stock: Number(p.inventoryQty),
        quantity: '1',
        price: String(p.price),
        catalogPrice: Number(p.price),
      },
    ]);
    setPicker(false);
    setSearch('');
  }
  const filtered = customers.filter((c) =>
    c.businessName.toLowerCase().includes(buyerQuery.toLowerCase())
  );
  const selectedCustomer = customers.find((c) => c.id === buyer);
  const requestedByProduct = new Map<string, number>();
  for (const line of lines)
    requestedByProduct.set(
      line.productId,
      (requestedByProduct.get(line.productId) || 0) +
        (Number(line.quantity) || 0)
    );
  const shortage = lines.filter(
    (line, index) =>
      lines.findIndex((item) => item.productId === line.productId) === index &&
      (requestedByProduct.get(line.productId) || 0) > line.stock
  );
  const subtotal = lines.reduce(
    (n, l) => n + (Number(l.quantity) || 0) * (parseAmount(l.price) || 0),
    0
  );
  async function save() {
    if (pending.current) return;
    const next: Record<string, string> = {};
    if (!order && !buyer) next.buyer = 'Choose a customer.';
    if (!lines.length) next.items = 'Add at least one product.';
    lines.forEach((l, i) => {
      if (
        !l.quantity.trim() ||
        !Number.isInteger(Number(l.quantity)) ||
        Number(l.quantity) < 1 ||
        Number(l.quantity) > 9999
      )
        next[`quantity-${i}`] = 'Enter a whole quantity from 1 to 9999.';
      if (
        !l.price.trim() ||
        !Number.isFinite(parseAmount(l.price)) ||
        parseAmount(l.price) < 0
      )
        next[`price-${i}`] = 'Enter a valid price.';
    });
    if (
      !shipping.trim() ||
      !Number.isFinite(parseAmount(shipping)) ||
      parseAmount(shipping) < 0
    )
      next.shipping = 'Enter a valid delivery fee.';
    if (
      order &&
      (!tax.trim() ||
        !Number.isFinite(parseAmount(tax)) ||
        parseAmount(tax) < 0)
    )
      next.tax = 'Enter a valid tax amount.';
    if (shortage.length && !adjustStock)
      next.items = order
        ? 'Some quantities exceed stock. Reduce them or update stock first.'
        : 'Review the stock correction below before saving.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`order-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const res = await fetch(
        order ? `/api/orders/${order.id}` : '/api/orders',
        {
          method: order ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dispensaryId: buyer,
            items: lines.map((l) => ({
              ...(order
                ? { id: l.id, unitPrice: parseAmount(l.price) }
                : {
                    ...(parseAmount(l.price) !== l.catalogPrice
                      ? {
                          priceOverride: {
                            unitPrice: parseAmount(l.price),
                            reason: 'Phone price',
                          },
                        }
                      : {}),
                  }),
              productId: l.productId,
              quantity: Number(l.quantity),
            })),
            notes: buildOrderRequestNotes(details),
            shippingFee: parseAmount(shipping),
            ...(order ? { tax: parseAmount(tax) } : {}),
            adjustStock,
            quoteId: quoteId || undefined,
          }),
        }
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not save order.');
      resetDirtyState();
      toast.success(order ? 'Order saved' : 'Order recorded');
      router.push(`/grower/orders/${d.id}`);
      router.refresh();
    } catch (e) {
      setErrors({
        form: e instanceof Error ? e.message : 'Could not save order.',
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (order && !canEditOrderItems(order.status))
    return (
      <div className="space-y-3">
        <PageHeader title={`Order #${order.orderId}`} />
        <p>Items on this closed order cannot be changed.</p>
        <Button onClick={() => router.push(`/grower/orders/${order.id}`)}>
          Back to order
        </Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <PageHeader
        title={order ? `Edit order #${order.orderId}` : 'Record order'}
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-4"
      >
        {errors.form && (
          <p
            role="alert"
            className="rounded-lg bg-pf-danger-bg p-3 text-sm text-pf-danger"
          >
            {errors.form}
          </p>
        )}
        {order ? (
          <p className="text-sm">{order.dispensary.businessName}</p>
        ) : (
          <section className="rounded-xl border border-pf-line bg-pf-surface p-4">
            <label htmlFor="order-buyer" className="text-sm font-medium">
              Customer
            </label>
            <input
              id="order-buyer"
              role="combobox"
              aria-controls="order-customers"
              aria-expanded={buyerOpen}
              aria-autocomplete="list"
              aria-activedescendant={
                buyerOpen && filtered[buyerIndex]
                  ? `buyer-${filtered[buyerIndex].id}`
                  : undefined
              }
              value={
                buyerOpen
                  ? buyerQuery
                  : selectedCustomer?.businessName || buyerQuery
              }
              onFocus={() => setBuyerOpen(true)}
              onChange={(e) => {
                setBuyer('');
                setBuyerQuery(e.target.value);
                setBuyerOpen(true);
                setBuyerIndex(0);
                triggerDirty();
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setBuyerOpen(true);
                  setBuyerIndex((i) => Math.min(i + 1, filtered.length - 1));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setBuyerIndex((i) => Math.max(0, i - 1));
                }
                if (e.key === 'Enter' && buyerOpen && filtered[buyerIndex]) {
                  e.preventDefault();
                  setBuyer(filtered[buyerIndex].id);
                  clearErrors('buyer');
                  setBuyerOpen(false);
                  triggerDirty();
                }
                if (e.key === 'Escape') setBuyerOpen(false);
              }}
              aria-invalid={!!errors.buyer}
              className={field}
              placeholder={
                customersLoading ? 'Loading customers…' : 'Search customers'
              }
            />
            {errors.buyer && (
              <p role="alert" className="mt-1 text-sm text-pf-danger">
                {errors.buyer}
              </p>
            )}
            {customerError && (
              <div role="alert" className="text-sm text-pf-danger">
                {customerError}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void loadCustomers()}
                >
                  Retry
                </Button>
              </div>
            )}
            {buyerOpen && (
              <ul
                id="order-customers"
                role="listbox"
                className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-pf-line"
              >
                {filtered.map((c, i) => (
                  <li
                    key={c.id}
                    id={`buyer-${c.id}`}
                    role="option"
                    aria-selected={buyerIndex === i}
                  >
                    <button
                      type="button"
                      className={`min-h-11 w-full px-3 text-left text-sm ${buyerIndex === i ? 'bg-pf-accent-bg' : ''}`}
                      onClick={() => {
                        setBuyer(c.id);
                        clearErrors('buyer');
                        setBuyerOpen(false);
                        triggerDirty();
                      }}
                    >
                      {c.businessName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setNewCustomer(true);
                setBuyerOpen(false);
              }}
            >
              + New customer
            </Button>
            {newCustomer && (
              <CustomerForm
                compact
                onCancel={() => setNewCustomer(false)}
                onSaved={(c) => {
                  setCustomers((prev) => [
                    { id: c.id, businessName: c.businessName },
                    ...prev,
                  ]);
                  setBuyer(c.id);
                  clearErrors('buyer');
                  setBuyerQuery('');
                  setBuyerOpen(false);
                  setNewCustomer(false);
                  triggerDirty();
                }}
              />
            )}
          </section>
        )}
        <section
          id="order-items"
          tabIndex={-1}
          className="rounded-xl border border-pf-line bg-pf-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Items</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPicker(!picker)}
            >
              Add item
            </Button>
          </div>
          {errors.items && (
            <p role="alert" className="mb-3 text-sm text-pf-danger">
              {errors.items}
            </p>
          )}
          {picker && (
            <div className="mb-4 rounded-lg border border-pf-line p-3">
              <label className="text-sm">
                Find product
                <input
                  autoFocus
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={field}
                  placeholder="Name or strain"
                />
              </label>
              {loading && (
                <p role="status" className="p-2 text-sm">
                  Loading products…
                </p>
              )}
              {productError && (
                <p role="alert" className="text-sm text-pf-danger">
                  {productError}
                </p>
              )}
              <div className="max-h-64 overflow-y-auto">
                {options
                  .filter(
                    (p) =>
                      p.status !== 'DRAFT' &&
                      (p.isAvailable !== false || p.inventoryQty === 0)
                  )
                  .map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 border-b border-pf-line py-3 text-left text-sm"
                    >
                      <span>
                        {p.name}
                        {p.strain?.name ? ` · ${p.strain.name}` : ''}
                      </span>
                      <span className="text-pf-muted">
                        {formatQuantity(p.inventoryQty, p.unit)} ·{' '}
                        {formatMoney(Number(p.price))}
                      </span>
                    </button>
                  ))}
              </div>
              {hasMore && (
                <Button
                  variant="outline"
                  type="button"
                  disabled={loading}
                  onClick={loadMore}
                >
                  {productError ? 'Retry' : 'Load more'}
                </Button>
              )}
            </div>
          )}
          <div className="space-y-3">
            {lines.map((l, i) => (
              <article
                key={l.id || `${l.productId}-${i}`}
                className="rounded-lg border border-pf-line p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{l.name}</h3>
                    <p className="text-sm text-pf-muted">
                      {formatQuantity(l.stock, l.unit)} available
                      {l.acceptedQuoteId ? ' · Accepted quote' : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Remove ${l.name}`}
                    onClick={() => {
                      triggerDirty();
                      setLines((prev) => prev.filter((_, x) => x !== i));
                      toast.info('Item removed', {
                        duration: 8000,
                        action: {
                          label: 'Undo',
                          onClick: () =>
                            setLines((prev) => [
                              ...prev.slice(0, i),
                              l,
                              ...prev.slice(i),
                            ]),
                        },
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="text-sm" htmlFor={`order-quantity-${i}`}>
                    Quantity
                    <div className="mt-1 flex">
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`Decrease ${l.name}`}
                        onClick={() =>
                          updateLine(i, {
                            quantity: String(
                              Math.max(1, (Number(l.quantity) || 1) - 1)
                            ),
                          })
                        }
                      >
                        −
                      </Button>
                      <input
                        id={`order-quantity-${i}`}
                        inputMode="numeric"
                        value={l.quantity}
                        onChange={(e) =>
                          updateLine(i, { quantity: e.target.value })
                        }
                        aria-invalid={!!errors[`quantity-${i}`]}
                        className="min-h-11 min-w-0 w-full border border-pf-line-strong bg-pf-raised px-2 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`Increase ${l.name}`}
                        onClick={() =>
                          updateLine(i, {
                            quantity: String((Number(l.quantity) || 0) + 1),
                          })
                        }
                      >
                        +
                      </Button>
                    </div>
                    {errors[`quantity-${i}`] && (
                      <span className="text-sm text-pf-danger">
                        {errors[`quantity-${i}`]}
                      </span>
                    )}
                  </label>
                  <label htmlFor={`order-price-${i}`} className="text-sm">
                    Price / {l.unit}
                    <input
                      id={`order-price-${i}`}
                      inputMode="decimal"
                      value={l.price}
                      readOnly={!!l.acceptedQuoteId}
                      onChange={(e) => updateLine(i, { price: e.target.value })}
                      onBlur={() => {
                        if (
                          l.price.trim() &&
                          Number.isFinite(parseAmount(l.price))
                        )
                          updateLine(i, {
                            price: String(parseAmount(l.price)),
                          });
                      }}
                      aria-invalid={!!errors[`price-${i}`]}
                      className={field}
                    />
                    {errors[`price-${i}`] && (
                      <span className="text-sm text-pf-danger">
                        {errors[`price-${i}`]}
                      </span>
                    )}
                  </label>
                </div>
              </article>
            ))}
          </div>
          {!order && shortage.length > 0 && (
            <div className="mt-3 rounded-lg border border-pf-warning-line bg-pf-warning-bg p-3 text-sm">
              <p>
                {shortage
                  .map(
                    (l) =>
                      `${l.name}: only ${formatQuantity(l.stock, l.unit)} in stock`
                  )
                  .join('; ')}
              </p>
              <label className="mt-2 flex min-h-11 items-start gap-3">
                <input
                  className="mt-1 h-5 w-5"
                  type="checkbox"
                  checked={adjustStock}
                  onChange={(e) => setAdjustStock(e.target.checked)}
                />
                <span>
                  I confirm this stock was received. Add the missing quantity,
                  reserve it for this order, and record the correction.
                </span>
              </label>
            </div>
          )}
        </section>
        <section className="rounded-xl border border-pf-line bg-pf-surface p-4">
          <h2 className="mb-3 font-semibold">Order details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Fulfillment
              <select
                className={field}
                value={details.fulfillmentMethod}
                onChange={(e) => {
                  triggerDirty();
                  setDetails({ ...details, fulfillmentMethod: e.target.value });
                }}
              >
                <option value="">Choose method</option>
                <option>Pickup</option>
                <option>Delivery</option>
                <option>Flexible</option>
              </select>
            </label>
            <label className="text-sm">
              Requested date (optional)
              <input
                type="date"
                className={field}
                value={
                  /^\d{4}-\d{2}-\d{2}$/.test(details.requestedWindow)
                    ? details.requestedWindow
                    : ''
                }
                onChange={(e) => {
                  triggerDirty();
                  setDetails({ ...details, requestedWindow: e.target.value });
                }}
              />
            </label>
            <label className="text-sm">
              Payment terms
              <select
                className={field}
                value={details.paymentTerms}
                onChange={(e) => {
                  triggerDirty();
                  setDetails({ ...details, paymentTerms: e.target.value });
                }}
              >
                <option value="">Choose terms</option>
                {[
                  ...new Set([
                    ...PAYMENT_TERMS_OPTIONS,
                    ...(details.paymentTerms ? [details.paymentTerms] : []),
                  ]),
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label htmlFor="order-shipping" className="text-sm">
              Delivery fee
              <input
                id="order-shipping"
                inputMode="decimal"
                className={field}
                value={shipping}
                onChange={(e) => {
                  triggerDirty();
                  setShipping(e.target.value);
                  clearErrors('shipping');
                }}
              />
              {errors.shipping && (
                <span className="text-pf-danger">{errors.shipping}</span>
              )}
            </label>
            {details.fulfillmentMethod === 'Delivery' && (
              <label className="text-sm sm:col-span-2">
                Delivery address
                <input
                  className={field}
                  value={details.deliveryAddress || ''}
                  onChange={(e) => {
                    triggerDirty();
                    setDetails({ ...details, deliveryAddress: e.target.value });
                  }}
                />
              </label>
            )}
            {order && (
              <label className="text-sm" htmlFor="order-tax">
                Tax (optional)
                <input
                  id="order-tax"
                  inputMode="decimal"
                  value={tax}
                  className={field}
                  onChange={(e) => {
                    triggerDirty();
                    setTax(e.target.value);
                    clearErrors('tax');
                  }}
                />
                {errors.tax && (
                  <span className="text-pf-danger">{errors.tax}</span>
                )}
              </label>
            )}
            <label className="text-sm sm:col-span-2">
              Notes (optional)
              <textarea
                className={`${field} py-2`}
                rows={3}
                maxLength={700}
                value={details.buyerNotes}
                onChange={(e) => {
                  triggerDirty();
                  setDetails({ ...details, buyerNotes: e.target.value });
                }}
              />
            </label>
          </div>
        </section>
        <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pf-line-strong bg-pf-surface p-3 shadow-lg lg:bottom-3">
          <strong>
            {formatMoney(
              subtotal +
                (parseAmount(shipping) || 0) +
                (order ? parseAmount(tax) || 0 : 0)
            )}
          </strong>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (await confirmNavigation())
                  router.push(
                    order ? `/grower/orders/${order.id}` : '/grower/orders'
                  );
              }}
            >
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? 'Saving…' : order ? 'Save order' : 'Record order'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
