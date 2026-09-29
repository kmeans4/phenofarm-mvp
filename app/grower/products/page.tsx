'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PRODUCT_DEFAULTS_STORAGE_KEY } from '@/lib/ux-workflow';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { Pagination } from '@/app/components/ui/Pagination';
import { toast } from '@/app/hooks/useToast';
import { ProductCsvImportDialog } from './ProductCsvImportDialog';
import { ProductTypeSelector } from '../components/ProductTypeSelector';
import { InlineStock } from './components/InlineStock';
import { defaultUnitForProductType } from '@/lib/product-types';
import { parseInventoryQty, parsePrice } from '@/lib/product-payload';
import {
  formatProductMoney,
  formatProductUnit,
  isLowStock,
  productUnitOptions,
  productVisibility,
} from '@/lib/product-display';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';

type Product = {
  id: string;
  name: string;
  productType: string | null;
  subType: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  status: string;
  isAvailable: boolean;
  isPriceVisible: boolean;
  strain?: { name: string } | null;
  batch?: { batchNumber: string } | null;
};
type Page = {
  products: Product[];
  page: number;
  pageSize: number;
  total: number;
  counts: Record<string, number>;
};
const views = [
  ['all', 'All'],
  ['active', 'Live'],
  ['drafts', 'Drafts'],
  ['unavailable', 'Hidden'],
  ['low-stock', 'Low stock'],
  ['out-of-stock', 'Sold out'],
  ['quote-only', 'Price on request'],
  ['missing-images', 'Missing photos'],
  ['missing-type', 'Missing type'],
  ['hidden', 'Not live'],
  ['deleted', 'Recently deleted'],
];
const control =
  'min-h-11 rounded-lg border border-pf-line-strong bg-pf-raised px-3 text-sm';
function InlinePrice({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: (price: number) => void;
}) {
  const [value, setValue] = useState(product.price.toFixed(2)),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => setValue(product.price.toFixed(2)), [product.price]);
  async function save() {
    const price = parsePrice(value);
    if (price === null) {
      setError('Enter a price such as 45.00.');
      return;
    }
    setValue(price.toFixed(2));
    if (price === product.price || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save price.');
      onSaved(price);
      toast.success('Price saved', { id: `price-${product.id}` });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Connection lost. Retry.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="flex items-center gap-1">
        <span aria-hidden="true">$</span>
        <input
          aria-label={`${product.name} price`}
          aria-invalid={Boolean(error)}
          disabled={busy}
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => void save()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className={`${control} w-28 px-2`}
        />
        <span className="text-sm text-pf-muted">
          / {formatProductUnit(product.unit)}
        </span>
      </div>
      {!product.isPriceVisible && (
        <p className="mt-1 text-sm text-pf-muted">Price on request</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-pf-danger">
          {error}{' '}
          <button onClick={() => void save()} className="underline">
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
export default function ProductsPage() {
  const params = useSearchParams(),
    router = useRouter(),
    query = params?.toString() || '';
  const { data: session } = useSession();
  const defaultsKey = session?.user?.id
    ? `${PRODUCT_DEFAULTS_STORAGE_KEY}:${session.user.id}`
    : null;
  function unitForType(type: string) {
    try {
      return (
        (defaultsKey &&
          window.localStorage.getItem(`${defaultsKey}:unit:${type}`)) ||
        defaultUnitForProductType(type)
      );
    } catch {
      return defaultUnitForProductType(type);
    }
  }
  const [page, setPage] = useState<Page | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState(params?.get('search') || ''),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState('');
  const [quick, setQuick] = useState(false),
    [quickError, setQuickError] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState({
    name: '',
    productType: 'Flower',
    subType: '',
    price: '',
    inventoryQty: '',
    unit: 'Lb',
    isPriceVisible: true,
  });
  const [bulkAction, setBulkAction] = useState('isAvailable:true'),
    [bulkValue, setBulkValue] = useState('');
  const [csvEnabled, setCsvEnabled] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const view = params?.get('view') || 'all',
    deleted = view === 'deleted';
  const returnTo = `/grower/products${query ? `?${query}` : ''}`;
  const { setIsDirty } = useUnsavedChanges({ enabled: !busy });
  useEffect(() => {
    setIsDirty(
      quick && Boolean(draft.name || draft.price || draft.inventoryQty)
    );
  }, [quick, draft.name, draft.price, draft.inventoryQty, setIsDirty]);
  const updateQuery = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(query);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      router.replace(`/grower/products?${next}`, { scroll: false });
    },
    [query, router]
  );
  useEffect(() => {
    setSearch(params?.get('search') || '');
  }, [params]);
  useEffect(() => {
    if (search === (params?.get('search') || '')) return;
    const timer = setTimeout(() => updateQuery({ search, page: '1' }), 300);
    return () => clearTimeout(timer);
  }, [search, params, updateQuery]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/products?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Could not load products.');
        setPage(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, refresh]);
  useEffect(() => {
    fetch('/api/growers/me')
      .then((response) => response.json())
      .then((data) =>
        setCsvEnabled(
          ['PRO', 'BUSINESS'].includes(
            String(data.subscriptionPlan).toUpperCase()
          )
        )
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    setSelected([]);
  }, [query]);
  useEffect(() => {
    if (page && location.hash)
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ block: 'center' });
  }, [page]);
  function patch(id: string, updates: Partial<Product>) {
    setPage((current) =>
      current
        ? {
            ...current,
            products: current.products.map((product) =>
              product.id === id ? { ...product, ...updates } : product
            ),
          }
        : current
    );
  }
  async function change(product: Product, updates: Record<string, unknown>) {
    const response = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not save product.');
    patch(product.id, data);
    return data;
  }
  async function restore(product: Product, available = false) {
    try {
      await change(product, { restore: true });
      if (available) await change(product, { isAvailable: true });
      setRefresh((value) => value + 1);
      toast.success('Product restored');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Restore failed.');
    }
  }
  async function remove(product: Product) {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Could not delete product.');
      setRefresh((value) => value + 1);
      toast.success('Moved to Recently deleted', {
        duration: 10000,
        action: {
          label: 'Undo',
          onClick: () => void restore(product, product.isAvailable),
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed.');
    }
  }
  async function soldOut(product: Product) {
    try {
      await change(product, { inventoryQty: 0 });
      toast.success('Marked sold out', {
        duration: 10000,
        action: {
          label: 'Undo',
          onClick: () => {
            void change(product, {
              inventoryQty: product.inventoryQty,
              isAvailable: product.isAvailable,
            }).catch((error) => toast.error(error.message));
          },
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update stock.'
      );
    }
  }
  async function toggle(product: Product) {
    try {
      const updated = await change(product, {
        isAvailable: !product.isAvailable,
      });
      toast.success(
        updated.isAvailable
          ? 'Product is live'
          : product.status === 'DRAFT'
            ? 'Publish the draft to make it live'
            : product.inventoryQty === 0
              ? 'Add stock to make it live'
              : 'Product hidden'
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update visibility.'
      );
    }
  }
  async function quickSave(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors.name = 'Enter a product name.';
    if (!draft.productType) errors.productType = 'Choose a type.';
    if (parsePrice(draft.price) === null)
      errors.price = 'Enter a price, such as 45.00.';
    if (parseInventoryQty(draft.inventoryQty) === null)
      errors.inventoryQty =
        'Enter whole units. For partial weights, use a smaller unit.';
    setQuickError(errors);
    if (Object.keys(errors).length) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)
        ?.focus();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          price: parsePrice(draft.price),
          inventoryQty: parseInventoryQty(draft.inventoryQty),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not save product.');
      try {
        if (defaultsKey)
          window.localStorage.setItem(
            `${defaultsKey}:unit:${draft.productType}`,
            draft.unit
          );
      } catch {}
      toast.success(
        data.isAvailable ? 'Product is live' : 'Saved but hidden: no stock'
      );
      setDraft((current) => ({ ...current, name: '', inventoryQty: '' }));
      setQuick(false);
      setRefresh((value) => value + 1);
    } catch (error) {
      setQuickError({
        form:
          error instanceof Error ? error.message : 'Connection lost. Retry.',
      });
    } finally {
      setBusy(false);
    }
  }
  async function bulkSave() {
    if (busy || !selected.length) return;
    const [key, raw] = bulkAction.split(':');
    const updates = {
      [key]: ['price', 'pricePercent'].includes(key)
        ? bulkValue
        : raw === 'true',
    };
    setBusy(true);
    setResult('');
    try {
      const response = await fetch('/api/products/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selected, updates }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not update products.');
      const reasons = [
        ...new Set(
          (data.skipped || []).map((item: { reason: string }) => item.reason)
        ),
      ].join(', ');
      setResult(
        `${data.updatedCount} updated${data.skippedCount ? ` · ${data.skippedCount} skipped: ${reasons}` : ''}`
      );
      setSelected([]);
      setRefresh((value) => value + 1);
      if (key === 'soldOut')
        toast.success('Marked sold out', {
          duration: 10000,
          action: {
            label: 'Undo',
            onClick: () => {
              void Promise.all(
                data.previous.map((product: Product) =>
                  change(product, {
                    inventoryQty: product.inventoryQty,
                    isAvailable: product.isAvailable,
                  })
                )
              )
                .then(() => setRefresh((value) => value + 1))
                .catch((error) => toast.error(error.message));
            },
          },
        });
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : 'Connection lost. Retry.'
      );
    } finally {
      setBusy(false);
    }
  }
  const pageQuery = Object.fromEntries(new URLSearchParams(query));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        actions={
          <>
            <button
              className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
              onClick={() => setQuick((value) => !value)}
            >
              Add product
            </button>
            <ProductCsvImportDialog
              enabled={csvEnabled}
              onImported={() => setRefresh((value) => value + 1)}
            />
          </>
        }
      />
      {quick && (
        <form
          ref={formRef}
          onSubmit={quickSave}
          noValidate
          className="space-y-3 rounded-xl border border-pf-line bg-pf-surface p-4"
        >
          <h2 className="font-semibold">Add product</h2>
          <label className="block text-sm">
            Name
            <input
              name="name"
              autoFocus
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              aria-invalid={Boolean(quickError.name)}
              className={`${control} mt-1 w-full`}
            />
            {quickError.name && (
              <span className="text-pf-danger">{quickError.name}</span>
            )}
          </label>
          <ProductTypeSelector
            productType={draft.productType}
            subType={draft.subType}
            onProductTypeChange={(productType) =>
              setDraft((current) => ({
                ...current,
                productType,
                unit: unitForType(productType),
              }))
            }
            onSubTypeChange={(subType) =>
              setDraft((current) => ({ ...current, subType }))
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['price', 'inventoryQty'] as const).map((key) => (
              <label key={key} className="text-sm">
                {key === 'price' ? 'Price ($)' : 'Stock'}
                <input
                  name={key}
                  inputMode={key === 'price' ? 'decimal' : 'numeric'}
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value })
                  }
                  aria-invalid={Boolean(quickError[key])}
                  className={`${control} mt-1 w-full`}
                />
                {quickError[key] && (
                  <span className="text-pf-danger">{quickError[key]}</span>
                )}
              </label>
            ))}
            <label className="text-sm">
              Unit
              <select
                value={draft.unit}
                onChange={(event) =>
                  setDraft({ ...draft, unit: event.target.value })
                }
                className={`${control} mt-1 w-full`}
              >
                {productUnitOptions().map((unit) => (
                  <option key={unit} value={unit}>
                    {formatProductUnit(unit)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-pf-muted">
            Stock counts whole selling units. Use oz or g for partial pounds.
            {draft.inventoryQty === '0' ? ' Zero stock saves hidden.' : ''}
          </p>
          {quickError.form && (
            <p role="alert" className="text-sm text-pf-danger">
              {quickError.form}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              disabled={busy}
              className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <Link
              href={`/grower/products/add?${new URLSearchParams({ returnTo, name: draft.name, productType: draft.productType, subType: draft.subType, price: draft.price, inventoryQty: draft.inventoryQty, unit: draft.unit })}`}
              className="inline-flex min-h-11 items-center text-sm text-pf-accent"
            >
              More details
            </Link>
          </div>
        </form>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="sr-only" htmlFor="products-search">
          Search products
        </label>
        <input
          id="products-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products, strains or types"
          className={`${control} col-span-2 sm:col-span-1`}
        />
        <label className="sr-only" htmlFor="products-status">
          Status
        </label>
        <select
          id="products-status"
          value={view}
          onChange={(event) =>
            updateQuery({ view: event.target.value, page: '1' })
          }
          className={control}
        >
          {views.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
              {!deleted &&
              page?.counts[value] !== undefined &&
              value !== 'deleted'
                ? ` (${page.counts[value]})`
                : ''}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="products-sort">
          Sort products
        </label>
        <select
          id="products-sort"
          value={`${params?.get('sortBy') || 'createdAt'}:${params?.get('sortOrder') || 'desc'}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(':');
            updateQuery({ sortBy, sortOrder, page: '1' });
          }}
          className={control}
        >
          <option value="createdAt:desc">Newest</option>
          <option value="name:asc">Name</option>
          <option value="price:asc">Price: low to high</option>
          <option value="price:desc">Price: high to low</option>
          <option value="inventoryQty:asc">Stock: low to high</option>
        </select>
      </div>
      {(params?.get('strainId') || params?.get('batchId')) && (
        <button
          onClick={() => updateQuery({ strainId: '', batchId: '', page: '1' })}
          className={`${control} text-pf-accent`}
        >
          Clear strain / batch filter
        </button>
      )}
      {error ? (
        <ErrorState
          title="Could not load products"
          description={error}
          onRetry={() => setRefresh((value) => value + 1)}
        />
      ) : loading && !page ? (
        <LoadingState title="Loading products" />
      ) : (
        page && (
          <>
            {page.products.length === 0 ? (
              <EmptyState
                title={
                  deleted
                    ? 'No deleted products'
                    : search
                      ? 'No matching products'
                      : 'No products in this view'
                }
                actionButton={
                  <button
                    className={`${control} mt-3`}
                    onClick={() =>
                      search || view !== 'all'
                        ? updateQuery({ search: '', view: 'all' })
                        : setQuick(true)
                    }
                  >
                    {search || view !== 'all' ? 'Clear filters' : 'Add product'}
                  </button>
                }
              />
            ) : (
              <div
                aria-busy={loading}
                className="rounded-xl border border-pf-line bg-pf-surface"
              >
                {!deleted && (
                  <label className="flex min-h-11 items-center gap-3 border-b border-pf-line px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        page.products.length > 0 &&
                        page.products.every((product) =>
                          selected.includes(product.id)
                        )
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? page.products.map((product) => product.id)
                            : []
                        )
                      }
                      className="h-5 w-5"
                    />
                    Select page
                  </label>
                )}
                {page.products.map((product) => (
                  <article
                    id={`product-${product.id}`}
                    key={product.id}
                    className="grid scroll-mt-24 grid-cols-1 gap-3 border-b border-pf-line p-3 last:border-b-0 lg:grid-cols-[minmax(12rem,1.5fr)_minmax(10rem,1fr)_minmax(13rem,1fr)_8rem]"
                  >
                    <div className="flex gap-3">
                      {!deleted && (
                        <label className="flex min-h-11 min-w-11 items-start pt-2">
                          <input
                            aria-label={`Select ${product.name}`}
                            type="checkbox"
                            checked={selected.includes(product.id)}
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [...current, product.id]
                                  : current.filter((id) => id !== product.id)
                              )
                            }
                            className="h-5 w-5"
                          />
                        </label>
                      )}
                      <div className="min-w-0">
                        <Link
                          className="inline-flex min-h-11 items-center font-semibold text-pf-text hover:underline"
                          href={`/grower/products/${product.id}/edit?returnTo=${encodeURIComponent(`${returnTo}#product-${product.id}`)}`}
                        >
                          {product.name}
                        </Link>
                        <p className="text-sm text-pf-muted">
                          {[
                            product.productType,
                            product.subType,
                            product.strain?.name,
                            product.batch?.batchNumber,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                    {deleted ? (
                      <p className="self-center text-sm">
                        {formatProductMoney(product.price)} /{' '}
                        {formatProductUnit(product.unit)}
                      </p>
                    ) : (
                      <InlinePrice
                        product={product}
                        onSaved={(price) => patch(product.id, { price })}
                      />
                    )}
                    {!deleted && (
                      <div>
                        <InlineStock
                          id={product.id}
                          name={product.name}
                          quantity={product.inventoryQty}
                          unit={product.unit}
                          onSaved={(inventoryQty, isAvailable) =>
                            patch(product.id, { inventoryQty, isAvailable })
                          }
                        />
                        {product.status !== 'DRAFT' &&
                          isLowStock(product.inventoryQty, product.unit) && (
                            <p className="mt-1 text-sm text-pf-warning">
                              Low stock
                            </p>
                          )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 lg:block">
                      {deleted ? (
                        <button
                          className={`${control} text-pf-accent`}
                          onClick={() => restore(product)}
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            role="switch"
                            aria-checked={
                              product.isAvailable && product.status !== 'DRAFT'
                            }
                            aria-label={`${product.name} visibility: ${productVisibility(product)}`}
                            onClick={() => toggle(product)}
                            className={`${control} ${productVisibility(product) === 'Live' ? 'border-pf-accent-line text-pf-accent' : 'text-pf-secondary'}`}
                          >
                            {productVisibility(product)}
                          </button>
                          <details className="relative">
                            <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm">
                              Actions
                            </summary>
                            <div className="absolute right-0 z-20 min-w-44 rounded-xl border border-pf-line-strong bg-pf-surface p-1 shadow-xl">
                              <Link
                                className="flex min-h-11 items-center px-3 text-sm"
                                href={`/grower/products/${product.id}/preview`}
                              >
                                Preview as buyer
                              </Link>
                              <Link
                                className="flex min-h-11 items-center px-3 text-sm"
                                href={`/grower/products/add?duplicate=${product.id}&returnTo=${encodeURIComponent(returnTo)}`}
                              >
                                Duplicate
                              </Link>
                              <button
                                className="flex min-h-11 w-full items-center px-3 text-sm"
                                onClick={() => soldOut(product)}
                              >
                                Mark sold out
                              </button>
                              <button
                                className="flex min-h-11 w-full items-center px-3 text-sm"
                                onClick={() => {
                                  void change(product, {
                                    isPriceVisible: !product.isPriceVisible,
                                  }).catch((error) =>
                                    toast.error(error.message)
                                  );
                                }}
                              >
                                {product.isPriceVisible
                                  ? 'Price on request'
                                  : 'Show price'}
                              </button>
                              <button
                                className="flex min-h-11 w-full items-center px-3 text-sm text-pf-danger"
                                onClick={() => remove(product)}
                              >
                                Delete
                              </button>
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Pagination
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              basePath="/grower/products"
              query={pageQuery}
              label="products"
            />
          </>
        )
      )}
      {(selected.length > 0 || result) && (
        <div className="sticky bottom-20 z-20 rounded-xl border border-pf-line-strong bg-pf-surface p-3 shadow-lg lg:bottom-4">
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">{selected.length} selected</span>
              <select
                aria-label="Bulk action"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value)}
                className={`${control} max-w-full`}
              >
                <option value="isAvailable:true">Make live</option>
                <option value="isAvailable:false">Hide</option>
                <option value="soldOut:true">Mark sold out</option>
                <option value="price:value">Set price</option>
                <option value="pricePercent:value">Change price by %</option>
                <option value="isPriceVisible:true">Show price</option>
                <option value="isPriceVisible:false">Price on request</option>
              </select>
              {bulkAction.startsWith('price') && (
                <input
                  aria-label={
                    bulkAction.startsWith('pricePercent')
                      ? 'Price change percent'
                      : 'New price'
                  }
                  inputMode="decimal"
                  value={bulkValue}
                  onChange={(event) => setBulkValue(event.target.value)}
                  className={`${control} w-28`}
                />
              )}
              <button
                disabled={busy}
                onClick={bulkSave}
                className="min-h-11 rounded-lg bg-pf-accent px-4 text-sm font-semibold text-pf-canvas"
              >
                {busy ? 'Saving…' : 'Apply'}
              </button>
              <button className={control} onClick={() => setSelected([])}>
                Clear
              </button>
            </div>
          )}
          {result && (
            <p role="status" className="text-sm">
              {result}{' '}
              <button
                className="min-h-11 px-2 underline"
                onClick={() => setResult('')}
              >
                Dismiss
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
