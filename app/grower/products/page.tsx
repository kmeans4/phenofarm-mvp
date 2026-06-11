'use client';

import { type FormEvent, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthSession } from '@/types';
import { Button } from '@/app/components/ui/Button';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '@/app/components/ui/FetchState';
import { toast } from '@/app/hooks/useToast';
import {
  readDensityPreference,
  saveDensityPreference,
  TableDensity,
  TableDensityControl,
} from '@/app/components/ux/TableDensityControl';
import { STRAIN_TYPE_LABELS, StrainTypeValue } from '@/lib/strain-types';
import {
  DEFAULT_PRODUCT_DEFAULTS,
  PRODUCT_DEFAULTS_STORAGE_KEY,
  ProductDefaults,
} from '@/lib/ux-workflow';
import {
  toSafeAvailability,
  toSafeNonNegativeInteger,
  toSafeNonNegativeNumber,
  toSafeOptionalString,
  toSafeProductName,
  toSafeProductType,
  toSafeUnit,
} from '@/lib/product-serializers';

type FilterType = 'all' | 'byProductType' | 'byStrain' | 'byBatch';
type WorkflowView = 'all' | 'active' | 'low-stock' | 'missing-price' | 'hidden';

interface QuickProductDraft {
  name: string;
  productType: string;
  price: string;
  inventoryQty: string;
  unit: string;
}
interface Strain {
  id: string;
  name: string;
  strainType: StrainTypeValue | null;
  genetics: string | null;
}

interface Batch {
  id: string;
  batchNumber: string;
}

interface Product {
  id: string;
  name: string;
  strain: Strain | null;
  strainLegacy: string | null;
  category: string | null;
  categoryLegacy: string | null;
  productType: string | null;
  subType: string | null;
  batchId: string | null;
  batch: Batch | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  isPriceVisible: boolean;
  createdAt: string;
}

type BulkProductUpdate = Partial<Pick<Product, 'isAvailable' | 'isPriceVisible' | 'unit' | 'productType'>>;

interface GroupedProducts {
  [key: string]: Product[];
}

const formatInventoryUnit = (unit: string | null | undefined, qty: number): string => {
  const trimmed = (unit || '').trim();
  if (!trimmed) return 'units';
  if (qty === 1) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower === 'oz' || lower === 'ml') return trimmed;
  if (lower.endsWith('s')) return trimmed;

  return `${trimmed}s`;
};

function normalizeFetchedProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const id = toSafeOptionalString(record.id);
  if (!id) return null;

  const inventoryQty = toSafeNonNegativeInteger(record.inventoryQty, 0);

  const rawStrain = record.strain;
  const strainRecord = rawStrain && typeof rawStrain === 'object'
    ? (rawStrain as Record<string, unknown>)
    : null;

  const strainId = strainRecord ? toSafeOptionalString(strainRecord.id) : null;
  const strainName = strainRecord ? toSafeOptionalString(strainRecord.name) : null;

  const strain: Strain | null = strainId && strainName
    ? {
        id: strainId,
        name: strainName,
        strainType: (toSafeOptionalString(strainRecord?.strainType) as StrainTypeValue | null) || null,
        genetics: toSafeOptionalString(strainRecord?.genetics),
      }
    : null;

  const rawBatch = record.batch;
  const batchRecord = rawBatch && typeof rawBatch === 'object'
    ? (rawBatch as Record<string, unknown>)
    : null;

  const batchId = batchRecord ? toSafeOptionalString(batchRecord.id) : null;
  const batchNumber = batchRecord ? toSafeOptionalString(batchRecord.batchNumber) : null;

  const batch: Batch | null = batchId && batchNumber
    ? { id: batchId, batchNumber }
    : null;

  return {
    id,
    name: toSafeProductName(record.name),
    strain,
    strainLegacy: toSafeOptionalString(record.strainLegacy),
    category: toSafeOptionalString(record.category),
    categoryLegacy: toSafeOptionalString(record.categoryLegacy),
    productType: toSafeProductType(record.productType, record.categoryLegacy),
    subType: toSafeOptionalString(record.subType),
    batchId: toSafeOptionalString(record.batchId),
    batch,
    price: toSafeNonNegativeNumber(record.price, 0),
    inventoryQty,
    unit: toSafeUnit(record.unit),
    isAvailable: toSafeAvailability(record.isAvailable, inventoryQty),
    isPriceVisible: record.isPriceVisible === false ? false : true,
    createdAt: toSafeOptionalString(record.createdAt) || new Date(0).toISOString(),
  };
}

function getMostCommonValue(values: string[], fallback: string) {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

  let bestValue = fallback;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      bestValue = value;
      bestCount = count;
    }
  });

  return bestValue;
}

export default function GrowerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [workflowView, setWorkflowView] = useState<WorkflowView>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [savedProductDefaults, setSavedProductDefaults] = useState<ProductDefaults | null>(null);
  const [quickProduct, setQuickProduct] = useState<QuickProductDraft>({
    name: '',
    productType: 'Flower',
    price: '',
    inventoryQty: '0',
    unit: 'Gram',
  });

  // Load view mode from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('productViewMode');
      if (saved === 'card' || saved === 'list') {
        setViewMode(saved);
      }
      setTableDensity(readDensityPreference('phenofarm:density:products'));
      try {
        const parsed = JSON.parse(window.localStorage.getItem(PRODUCT_DEFAULTS_STORAGE_KEY) || 'null') as ProductDefaults | null;
        if (parsed) setSavedProductDefaults(parsed);
      } catch {
        setSavedProductDefaults(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('productViewMode', mode);
    }
  };

  const handleDensityChange = (mode: TableDensity) => {
    setTableDensity(mode);
    saveDensityPreference('phenofarm:density:products', mode);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign_in');
      return;
    }

    const user = (session as AuthSession).user;
    if (user.role !== 'GROWER') {
      router.push('/dashboard');
      return;
    }

    fetchProducts();
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(
            data
              .map(normalizeFetchedProduct)
              .filter((item): item is Product => item !== null)
          );
        } else {
          setProducts([]);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch products (' + response.status + ')');
      }
    } catch {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch('/api/products/' + productId, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Product deleted');
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete product');
      }
    } catch {
      toast.error('Network error deleting product');
    } finally {
      setDeleteCandidate(null);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    const product = products.find((item) => item.id === productId);

    if (product && product.inventoryQty <= 0 && !currentStatus) {
      toast.warning('Add inventory before enabling this product', {
        description: 'Zero-inventory products stay unavailable.',
      });
      return;
    }

    try {
      const response = await fetch('/api/products/' + productId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        const updatedInventoryQty = toSafeNonNegativeInteger(
          (updated as Record<string, unknown>)?.inventoryQty,
          product?.inventoryQty ?? 0
        );

        setProducts(products.map(p => p.id === productId
          ? {
              ...p,
              inventoryQty: updatedInventoryQty,
              isAvailable: toSafeAvailability(
                (updated as Record<string, unknown>)?.isAvailable,
                updatedInventoryQty
              ),
            }
          : p));
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to update product');
      }
    } catch {
      toast.error('Network error updating product');
    }
  };

  const catalogDefaults = useMemo<ProductDefaults>(() => {
    if (products.length === 0) return savedProductDefaults || DEFAULT_PRODUCT_DEFAULTS;

    const newestProduct = [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      productType: getMostCommonValue(
        products.map((product) => product.productType || product.categoryLegacy || ''),
        savedProductDefaults?.productType || DEFAULT_PRODUCT_DEFAULTS.productType
      ),
      unit: getMostCommonValue(
        products.map((product) => product.unit || ''),
        savedProductDefaults?.unit || DEFAULT_PRODUCT_DEFAULTS.unit
      ),
      price: newestProduct?.price > 0 ? newestProduct.price.toFixed(2) : savedProductDefaults?.price || '',
      isPriceVisible: newestProduct?.isPriceVisible ?? savedProductDefaults?.isPriceVisible ?? true,
    };
  }, [products, savedProductDefaults]);

  useEffect(() => {
    setSelectedProductIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(products.map((product) => product.id));
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const applyQuickDefaults = (defaults: ProductDefaults) => {
    setQuickProduct((prev) => ({
      ...prev,
      productType: defaults.productType || prev.productType,
      unit: defaults.unit || prev.unit,
      price: defaults.price || prev.price,
    }));
    setQuickError('');
  };

  const saveProductDefaults = (defaults: ProductDefaults) => {
    setSavedProductDefaults(defaults);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PRODUCT_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults));
    }
  };

  const resetQuickProduct = () => {
    setQuickProduct({
      name: '',
      productType: catalogDefaults.productType || 'Flower',
      price: catalogDefaults.price || '',
      inventoryQty: '0',
      unit: catalogDefaults.unit || 'Gram',
    });
    setQuickError('');
  };

  const duplicateIntoQuickCreate = (product: Product) => {
    setQuickProduct({
      name: `${product.name} Copy`,
      productType: product.productType || product.categoryLegacy || 'Flower',
      price: product.price > 0 ? product.price.toFixed(2) : '',
      inventoryQty: String(product.inventoryQty || 0),
      unit: product.unit || 'Gram',
    });
    setQuickError('');
    setShowQuickCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitQuickProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuickError('');

    const price = Number(quickProduct.price);
    const inventoryQty = Number(quickProduct.inventoryQty);

    if (!quickProduct.name.trim()) {
      setQuickError('Product name is required.');
      return;
    }

    if (!quickProduct.productType.trim()) {
      setQuickError('Product type is required.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setQuickError('Enter a valid price.');
      return;
    }

    if (!Number.isInteger(inventoryQty) || inventoryQty < 0) {
      setQuickError('Inventory must be a non-negative whole number.');
      return;
    }

    setQuickSaving(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickProduct.name.trim(),
          productType: quickProduct.productType.trim(),
          price,
          inventoryQty,
          unit: quickProduct.unit,
          isAvailable: inventoryQty > 0,
          isPriceVisible: true,
          images: [],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data
          ? String((data as { error?: unknown }).error)
          : 'Failed to create product.';
        throw new Error(message);
      }

      const created = normalizeFetchedProduct(data);
      if (created) {
        setProducts((prev) => [created, ...prev]);
      } else {
        await fetchProducts();
      }
      saveProductDefaults({
        productType: quickProduct.productType.trim(),
        unit: quickProduct.unit,
        price: quickProduct.price,
        isPriceVisible: true,
      });
      resetQuickProduct();
      setShowQuickCreate(false);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Failed to create product.');
    } finally {
      setQuickSaving(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    const visibleIds = workflowProducts.map((product) => product.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.has(id));

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const runBulkUpdate = async (updates: BulkProductUpdate, successLabel: string) => {
    if (selectedProductIds.size === 0 || bulkUpdating) return;

    setBulkUpdating(true);
    setBulkMessage(null);

    try {
      const response = await fetch('/api/products/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          updates,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Bulk update failed');
      }

      setBulkMessage({
        type: 'success',
        text: `${successLabel} for ${data.updatedCount || selectedProductIds.size} product${selectedProductIds.size === 1 ? '' : 's'}.`,
      });
      setSelectedProductIds(new Set());
      await fetchProducts();
    } catch (err) {
      setBulkMessage({ type: 'error', text: err instanceof Error ? err.message : 'Bulk update failed' });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Get strain name for display
  const getStrainName = (product: Product): string => {
    if (product.strain?.name) return product.strain.name;
    if (product.strainLegacy) return product.strainLegacy;
    return '';
  };


  const getStrainTypeLabel = (product: Product): string => {
    if (!product.strain?.strainType) return '';
    return STRAIN_TYPE_LABELS[product.strain.strainType] || '';
  };

  const workflowProducts = useMemo(() => {
    if (workflowView === 'active') {
      return products.filter((product) => product.isAvailable && product.inventoryQty > 0);
    }

    if (workflowView === 'low-stock') {
      return products.filter((product) => product.inventoryQty > 0 && product.inventoryQty <= 5);
    }

    if (workflowView === 'missing-price') {
      return products.filter((product) => product.price <= 0 || !product.isPriceVisible);
    }

    if (workflowView === 'hidden') {
      return products.filter((product) => !product.isAvailable || product.inventoryQty <= 0);
    }

    return products;
  }, [products, workflowView]);

  const workflowViewOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: products.length },
      { key: 'active' as const, label: 'Active', count: products.filter((product) => product.isAvailable && product.inventoryQty > 0).length },
      { key: 'low-stock' as const, label: 'Low inventory', count: products.filter((product) => product.inventoryQty > 0 && product.inventoryQty <= 5).length },
      { key: 'missing-price' as const, label: 'Missing price', count: products.filter((product) => product.price <= 0 || !product.isPriceVisible).length },
      { key: 'hidden' as const, label: 'Hidden/out', count: products.filter((product) => !product.isAvailable || product.inventoryQty <= 0).length },
    ],
    [products],
  );
  const selectedCount = selectedProductIds.size;
  const allVisibleSelected = workflowProducts.length > 0 && workflowProducts.every((product) => selectedProductIds.has(product.id));
  const compactMode = tableDensity === 'compact';
  const tableCellClass = compactMode ? 'px-3 sm:px-4 py-1.5 text-xs' : 'px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm';
  const cardPaddingClass = compactMode ? 'p-3' : 'p-4';

  // Group products based on active filter
  const { groups, groupOrder } = useMemo((): { groups: GroupedProducts; groupOrder: string[] } => {
    const groups: GroupedProducts = {};
    const groupOrder: string[] = [];

    if (activeFilter === 'all') {
      groups['All Products'] = workflowProducts;
      groupOrder.push('All Products');
      return { groups, groupOrder };
    }

    if (activeFilter === 'byProductType') {
      workflowProducts.forEach((product) => {
        const type = product.productType || product.categoryLegacy || 'Uncategorized';
        if (!groups[type]) {
          groups[type] = [];
          groupOrder.push(type);
        }
        groups[type].push(product);
      });
    } else if (activeFilter === 'byStrain') {
      workflowProducts.forEach((product) => {
        const strainName = getStrainName(product) || 'Unknown Strain';
        if (!groups[strainName]) {
          groups[strainName] = [];
          groupOrder.push(strainName);
        }
        groups[strainName].push(product);
      });
    } else if (activeFilter === 'byBatch') {
      workflowProducts.forEach((product) => {
        const batchLabel = product.batch?.batchNumber
          ? `Batch ${product.batch.batchNumber}`
          : product.batchId
            ? `Batch ${product.batchId.slice(0, 8)}...`
            : 'No Batch';
        if (!groups[batchLabel]) {
          groups[batchLabel] = [];
          groupOrder.push(batchLabel);
        }
        groups[batchLabel].push(product);
      });
    }

    groupOrder.sort((a, b) => a.localeCompare(b));

    return { groups, groupOrder };
  }, [activeFilter, workflowProducts]);

  const totalProducts = products.length;
  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + ((p?.price || 0) * (p?.inventoryQty || 0)), 0),
    [products],
  );
  const availableCount = useMemo(
    () => products.filter((p) => p?.isAvailable && (p?.inventoryQty || 0) > 0).length,
    [products],
  );

  const filterTabs = [
    { key: 'all', label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
    { key: 'byProductType', label: 'Product type', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { key: 'byStrain', label: 'Strain', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'byBatch', label: 'Batch', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ] as const;

  const ProductCard = ({ product }: { product: Product }) => {
    const strainName = getStrainName(product);
    const strainTypeLabel = getStrainTypeLabel(product);
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 ${selectedProductIds.has(product.id) ? 'ring-2 ring-green-500' : ''}`}>
        {/* Card Header */}
        <div className={`${cardPaddingClass} border-b border-gray-100`}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <input
                type="checkbox"
                checked={selectedProductIds.has(product.id)}
                onChange={() => toggleProductSelection(product.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                aria-label={`Select ${product.name}`}
              />
              <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{product?.name || 'Unnamed Product'}</p>
              {strainName && (
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{strainName}</p>
                  {strainTypeLabel && (
                    <span className="text-[11px] uppercase tracking-wide text-gray-400">{strainTypeLabel}</span>
                  )}
                </div>
              )}
              </div>
            </div>
            <span 
              className={'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ' + (
                (product?.inventoryQty || 0) <= 0
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : product?.isAvailable 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
              )}
            >
              {(product?.inventoryQty || 0) <= 0 ? 'Out of Stock' : product?.isAvailable ? 'Available' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className={cardPaddingClass}>
          <div className="flex justify-between items-baseline mb-3">
            <p className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
              ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-gray-500">per {product?.unit || 'unit'}</p>
          </div>
          
          {/* Additional Info */}
          <div className="space-y-1 mb-3">
            {(product?.productType || product?.categoryLegacy) && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Type:</span> {product.productType || product.categoryLegacy}
              </p>
            )}
            {product?.batch?.batchNumber && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Batch:</span> {product.batch.batchNumber}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
              {(product?.inventoryQty || 0) <= 0 ? 'Out of Stock' : `${product?.inventoryQty || 0} In Stock`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 xl:flex-row">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-1">
              <Button variant="outline" size="sm" asChild className="w-full xl:flex-1">
                <Link href={'/grower/products/' + product?.id + '/edit'}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
                className="w-full xl:flex-1"
                disabled={(product?.inventoryQty || 0) <= 0 && !product?.isAvailable}
              >
                {(product?.inventoryQty || 0) <= 0 && !product?.isAvailable ? 'Out of Stock' : product?.isAvailable ? 'Disable' : 'Enable'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => duplicateIntoQuickCreate(product)}
                className="w-full xl:flex-1"
              >
                Duplicate
              </Button>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteCandidate(product)}
              className="w-full xl:w-auto"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Product Row component for list view
  const ProductRow = ({ product }: { product: Product }) => {
    const strainName = getStrainName(product);
    const strainTypeLabel = getStrainTypeLabel(product);
    
    return (
      <tr className={`hover:bg-gray-50 transition-colors ${selectedProductIds.has(product.id) ? 'bg-green-50/60' : ''}`}>
        <td className={tableCellClass}>
          <input
            type="checkbox"
            checked={selectedProductIds.has(product.id)}
            onChange={() => toggleProductSelection(product.id)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            aria-label={`Select ${product.name}`}
          />
        </td>
        <td className={tableCellClass}>
          <div className="font-medium text-sm sm:text-base text-gray-900">{product?.name || 'Unnamed'}</div>
          {strainName && (
            <div className="flex items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-500">{strainName}</div>
              {strainTypeLabel && <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-400">{strainTypeLabel}</span>}
            </div>
          )}
        </td>
        <td className={`${tableCellClass} text-gray-600`}>
          {product?.productType || product?.categoryLegacy || '-'}
        </td>
        <td className={tableCellClass}>
          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
            (product?.inventoryQty || 0) <= 0
              ? 'bg-red-100 text-red-700'
              : product?.isAvailable 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
          }`}>
            {(product?.inventoryQty || 0) <= 0 ? 'Out of Stock' : product?.isAvailable ? 'Available' : 'Out of Stock'}
          </span>
        </td>
        <td className={`${tableCellClass} text-gray-900 font-medium`}>
          ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </td>
        <td className={`${tableCellClass} text-gray-600`}>
          <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
            {(product?.inventoryQty || 0) <= 0 ? 'Out of Stock' : `${product?.inventoryQty || 0} ${formatInventoryUnit(product?.unit, product?.inventoryQty || 0)}`}
          </span>
        </td>
        <td className={tableCellClass}>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={'/grower/products/' + product?.id + '/edit'}>Edit</Link>
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
              disabled={(product?.inventoryQty || 0) <= 0 && !product?.isAvailable}
            >
              {(product?.inventoryQty || 0) <= 0 && !product?.isAvailable ? 'Out of Stock' : product?.isAvailable ? 'Disable' : 'Enable'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => duplicateIntoQuickCreate(product)}
            >
              Duplicate
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setDeleteCandidate(product)}
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Product Table component for list view
  const ProductTable = ({ products }: { products: Product[] }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisibleSelection}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  aria-label="Select all visible products"
                />
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage listings, pricing, and stock visibility for dispensary buyers.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowQuickCreate((prev) => !prev)}
            className="w-full sm:w-auto"
          >
            Quick add
          </Button>
          <Button variant="primary" asChild className="w-full sm:w-auto">
            <Link href="/grower/products/add" className="inline-flex w-full sm:w-auto">+ Add Product</Link>
          </Button>
        </div>
      </div>

      {showQuickCreate && (
        <form onSubmit={submitQuickProduct} className="rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Quick product creation</p>
              <h2 className="text-lg font-semibold text-gray-900">Create the basic listing now</h2>
              <p className="text-sm text-green-900">Add required fields here, then edit the product later for strain, batch, lab, image, or advanced details.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetQuickProduct();
                setShowQuickCreate(false);
              }}
              className="self-start rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyQuickDefaults(catalogDefaults)}
              className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-100"
            >
              Use catalog defaults
            </button>
            {savedProductDefaults && (
              <button
                type="button"
                onClick={() => applyQuickDefaults(savedProductDefaults)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Use previous quick add
              </button>
            )}
            <span className="text-xs text-green-900">
              Defaults: {catalogDefaults.productType || 'Flower'} / {catalogDefaults.unit || 'Gram'}
              {catalogDefaults.price ? ` / $${catalogDefaults.price}` : ''}
            </span>
          </div>

          {quickError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{quickError}</p>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <label className="md:col-span-2 text-sm font-medium text-gray-700">
              Product name
              <input
                value={quickProduct.name}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Blueberries NF"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Type
              <input
                value={quickProduct.productType}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, productType: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Flower"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={quickProduct.price}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, price: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="45.00"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Inventory
              <input
                type="number"
                min="0"
                step="1"
                value={quickProduct.inventoryQty}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, inventoryQty: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm font-medium text-gray-700 sm:w-48">
              Unit
              <select
                value={quickProduct.unit}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, unit: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack', 'Each', 'Lb'].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="primary" disabled={quickSaving} className="w-full sm:w-auto">
              {quickSaving ? 'Creating...' : 'Create listing'}
            </Button>
          </div>
        </form>
      )}

      {bulkMessage && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          bulkMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <span>{bulkMessage.text}</span>
            <button type="button" onClick={() => setBulkMessage(null)} className="text-xs font-semibold opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Total Value</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600">Available</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{availableCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-900">Saved workflow views</p>
          <p className="text-xs text-gray-500">Use these before grouping to focus the catalog on the next cleanup task.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workflowViewOptions.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setWorkflowView(view.key)}
              aria-pressed={workflowView === view.key}
              aria-label={`${view.label}: ${view.count} products`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                workflowView === view.key
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {view.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                workflowView === view.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & View Toggle */}
      <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key as FilterType)}
                aria-pressed={activeFilter === tab.key}
                aria-label={tab.key === 'all' ? 'Show all products' : `Group products by ${tab.label}`}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.key
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === 'all' ? 'All' : 
                   tab.key === 'byProductType' ? 'Type' :
                   tab.key === 'byStrain' ? 'Strain' : 'Batch'}
                </span>
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-2 sm:border-t-0 sm:border-l sm:border-gray-200 sm:pt-0 sm:pl-3">
            <TableDensityControl value={tableDensity} onChange={handleDensityChange} />
            <button
              type="button"
              onClick={() => handleViewModeChange('card')}
              aria-pressed={viewMode === 'card'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'card'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {workflowProducts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleVisibleSelection}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {allVisibleSelected ? 'Clear visible' : 'Select visible'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedCount > 0 ? `${selectedCount} selected` : 'Select products for bulk cleanup.'}
              </span>
            </div>
            {selectedCount > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isAvailable: true }, 'Enabled')}>
                  Enable
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isAvailable: false }, 'Disabled')}>
                  Disable
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isPriceVisible: true }, 'Made prices visible')}>
                  Show prices
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isPriceVisible: false }, 'Hid prices')}>
                  Hide prices
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ unit: catalogDefaults.unit }, `Set unit to ${catalogDefaults.unit}`)}>
                  Use default unit
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={bulkUpdating} onClick={() => setSelectedProductIds(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Display */}
      {loading ? (
        <LoadingState
          title="Loading product catalog"
          description="Pulling your latest products, inventory, and availability status."
        />
      ) : error ? (
        <ErrorState
          title="Couldn&apos;t load products"
          description={error}
          onRetry={fetchProducts}
        />
      ) : workflowProducts.length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {groupOrder.map((groupName) => (
            <div key={groupName} className="space-y-3 sm:space-y-4">
              {/* Group Header */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {groups[groupName]?.length || 0}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              {/* Products Display based on view mode */}
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {groups[groupName]?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <ProductTable products={groups[groupName] || []} />
              )}
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products in this view</h3>
          <p className="text-gray-500 mb-5 max-w-sm mx-auto">
            Switch workflow views or clear grouping to see the rest of your catalog.
          </p>
          <Button type="button" variant="secondary" onClick={() => setWorkflowView('all')}>
            Show all products
          </Button>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-2 max-w-sm mx-auto">
            Add your first product to make your catalog visible to dispensary buyers.
          </p>
          <p className="text-sm text-gray-500 mb-6">Tip: include clear pricing and accurate inventory so buyers can place orders confidently.</p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                applyQuickDefaults(catalogDefaults);
                setShowQuickCreate(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Quick add first listing
            </Button>
            <Button variant="primary" asChild className="w-full sm:w-auto">
              <Link href="/grower/products/add">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Full product form
              </Link>
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete product?"
        description={`Delete ${deleteCandidate?.name || 'this product'} from your catalog. This removes it from buyer browsing and cannot be undone from this screen.`}
        confirmLabel="Delete product"
        intent="danger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteProduct(deleteCandidate.id);
          }
        }}
      />
    </div>
  );
}
