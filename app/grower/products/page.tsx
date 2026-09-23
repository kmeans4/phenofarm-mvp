'use client';

import { isLicenseExpired } from '@/lib/license';
import { type FormEvent, useState, useEffect, useMemo, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { OperationsSummary } from '../components/OperationsSummary';
import { RecordActions } from '../components/RecordActions';
import { formatProductMoney, formatProductUnit } from '@/lib/product-display';
import { deleteRecord } from '@/app/components/ui/deleteRecord';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '@/app/components/ui/FetchState';
import { toast } from '@/app/hooks/useToast';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
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
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Pagination } from '@/app/components/ui/Pagination';
import { getGrowerPlan } from '@/lib/plans';
import { ProductCsvImportDialog } from './ProductCsvImportDialog';

type FilterType = 'all' | 'byProductType' | 'byStrain' | 'byBatch';
type WorkflowView = 'all' | 'active' | 'low-stock' | 'quote-only' | 'missing-images' | 'missing-type' | 'hidden';

interface QuickProductDraft {
  name: string;
  productType: string;
  price: string;
  inventoryQty: string;
  unit: string;
  isPriceVisible: boolean;
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
  category: string | null;
  productType: string | null;
  subType: string | null;
  batchId: string | null;
  batch: Batch | null;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  isPriceVisible: boolean;
  images: string[];
  imageCount: number;
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

function QuoteOnlyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-800 ${
      compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    }`}>
      Quote only — price hidden from buyers
    </span>
  );
}

function normalizeWorkflowView(value: string | null | undefined): WorkflowView {
  if (
    value === 'active' ||
    value === 'low-stock' ||
    value === 'quote-only' ||
    value === 'missing-images' ||
    value === 'missing-type' ||
    value === 'hidden'
  ) {
    return value;
  }

  return 'all';
}

function normalizeImageList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((image): image is string => typeof image === 'string' && image.trim().length > 0);
}

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
    category: toSafeOptionalString(record.category),
    productType: toSafeProductType(record.productType),
    subType: toSafeOptionalString(record.subType),
    batchId: toSafeOptionalString(record.batchId),
    batch,
    price: toSafeNonNegativeNumber(record.price, 0),
    inventoryQty,
    unit: toSafeUnit(record.unit),
    isAvailable: toSafeAvailability(record.isAvailable, inventoryQty),
    isPriceVisible: record.isPriceVisible === false ? false : true,
    images: normalizeImageList(record.images),
    imageCount: typeof record.imageCount === 'number' ? record.imageCount : Array.isArray(record.images) ? record.images.length : 0,
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

interface ProductControls {
  selectedProductIds: Set<string>;
  pendingProductIds: Set<string>;
  toggleProductSelection: (id: string) => void;
  toggleAvailability: (id: string, current: boolean) => Promise<void>;
  cardPaddingClass: string;
  compactMode: boolean;
  tableCellClass: string;
  setOpenActionMenuId: Dispatch<SetStateAction<string | null>>;
  openActionMenuId: string | null;
  duplicateProduct: (product: Product) => Promise<void>;
  duplicatingProductId: string | null;
  setDeleteCandidate: Dispatch<SetStateAction<Product | null>>;
  allVisibleSelected: boolean;
  toggleVisibleSelection: () => void;
}

  // Get strain name for display
  const getStrainName = (product: Product): string => {
    if (product.strain?.name) return product.strain.name;
    return '';
  };


  const getStrainTypeLabel = (product: Product): string => {
    if (!product.strain?.strainType) return '';
    return STRAIN_TYPE_LABELS[product.strain.strainType] || '';
  };

  const ProductCard = ({ product, selectedProductIds, pendingProductIds, toggleProductSelection, toggleAvailability, cardPaddingClass, compactMode, setOpenActionMenuId, openActionMenuId, duplicateProduct, duplicatingProductId, setDeleteCandidate }: { product: Product } & ProductControls) => {
    const strainName = getStrainName(product);
    const strainTypeLabel = getStrainTypeLabel(product);

    return (
      <div id={`product-card-${product.id}`} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 scroll-mt-24 ${selectedProductIds.has(product.id) ? 'ring-2 ring-green-500' : ''}`}>
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
            <div className="min-w-0">
              <p className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                ${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}
              </p>
              {!product.isPriceVisible && (
                <div className="mt-1">
                  <QuoteOnlyBadge />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">per {product?.unit || 'unit'}</p>
          </div>

          {/* Additional Info */}
          <div className="space-y-1 mb-3">
            {product?.productType && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Type:</span> {product.productType}
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
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <Button variant="primary" size="sm" asChild className="flex-1">
              <Link href={'/grower/products/' + product?.id + '/edit'}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => toggleAvailability(product?.id, product?.isAvailable)}
              className="flex-1"
              disabled={pendingProductIds.has(product.id) || (product?.inventoryQty || 0) <= 0 && !product?.isAvailable}
              aria-pressed={product?.isAvailable}
            >
              {(product?.inventoryQty || 0) <= 0 && !product?.isAvailable ? 'Out of stock' : product?.isAvailable ? 'Disable' : 'Enable'}
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpenActionMenuId((current) => current === product.id ? null : product.id)}
                aria-expanded={openActionMenuId === product.id}
                aria-label={`More actions for ${product.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {openActionMenuId === product.id && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close product action menu"
                    onClick={() => setOpenActionMenuId(null)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => duplicateProduct(product)}
                      disabled={duplicatingProductId === product.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Copy className="h-4 w-4" />
                      {duplicatingProductId === product.id ? 'Duplicating...' : 'Duplicate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        setDeleteCandidate(product);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  function MobileProduct({ product, controls }: { product: Product; controls: ProductControls }) {
    const pending = controls.pendingProductIds.has(product.id);
    return <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <label className="-ml-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center"><input type="checkbox" checked={controls.selectedProductIds.has(product.id)} onChange={() => controls.toggleProductSelection(product.id)} aria-label={`Select ${product.name}`} className="h-4 w-4" /></label>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold break-words">{product.name}</h3><p className="mt-1 text-xs text-gray-500">{[product.productType, getStrainName(product)].filter(Boolean).join(' · ')}</p></div>
        <span className="shrink-0 text-xs text-gray-600">{product.inventoryQty <= 0 ? 'No stock' : product.isAvailable ? 'Live' : 'Hidden'}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="font-semibold">{formatProductMoney(product.price)}/{formatProductUnit(product.unit)}{!product.isPriceVisible && <span className="ml-2 text-xs font-normal text-blue-700">Quote only</span>}</p><p>Stock: {product.inventoryQty.toLocaleString()} {formatProductUnit(product.unit)}</p></div>
      <div className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2">
        <Button asChild size="sm" variant="primary"><Link href={`/grower/products/${product.id}/edit`}>Edit</Link></Button>
        <Button size="sm" variant="outline" disabled={pending || product.inventoryQty <= 0 && !product.isAvailable} aria-pressed={product.isAvailable} onClick={() => controls.toggleAvailability(product.id, product.isAvailable)}>{product.isAvailable ? 'Hide' : 'Enable'}</Button>
        <RecordActions name={product.name} actions={[{label: 'Duplicate', onSelect: () => { if (!controls.duplicatingProductId) void controls.duplicateProduct(product); }}, {label: 'Delete', destructive: true, onSelect: () => controls.setDeleteCandidate(product)}]} />
      </div>
    </article>;
  }

  // Product Row component for list view
  const ProductRow = ({ product, selectedProductIds, pendingProductIds, toggleProductSelection, toggleAvailability, tableCellClass, setOpenActionMenuId, openActionMenuId, duplicateProduct, duplicatingProductId, setDeleteCandidate }: { product: Product } & ProductControls) => {
    const strainName = getStrainName(product);
    const strainTypeLabel = getStrainTypeLabel(product);

    return (
      <tr id={`product-row-${product.id}`} className={`hover:bg-gray-50 transition-colors ${selectedProductIds.has(product.id) ? 'bg-green-50/60' : ''}`}>
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
          {product?.productType || '-'}
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
          <div className="flex flex-col items-start gap-1">
            <span>${typeof product?.price === 'number' ? product.price.toFixed(2) : '0.00'}</span>
            {!product.isPriceVisible && <QuoteOnlyBadge compact />}
          </div>
        </td>
        <td className={`${tableCellClass} text-gray-600`}>
          <span className={(product?.inventoryQty || 0) <= 5 ? 'text-red-600 font-medium' : ''}>
            {(product?.inventoryQty || 0) <= 0 ? 'Out of Stock' : `${product?.inventoryQty || 0} ${formatInventoryUnit(product?.unit, product?.inventoryQty || 0)}`}
          </span>
        </td>
        <td className={tableCellClass}>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href={'/grower/products/' + product?.id + '/edit'}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpenActionMenuId((current) => current === product.id ? null : product.id)}
                aria-expanded={openActionMenuId === product.id}
                aria-label={`More actions for ${product.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {openActionMenuId === product.id ? (
                <>
                  <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close product action menu" onClick={() => setOpenActionMenuId(null)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        toggleAvailability(product.id, product.isAvailable);
                      }}
                      disabled={pendingProductIds.has(product.id) || (product.inventoryQty || 0) <= 0 && !product.isAvailable}
                      className="flex min-h-10 w-full items-center px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 disabled:opacity-50"
                    >
                      {product.isAvailable ? 'Disable listing' : 'Enable listing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateProduct(product)}
                      disabled={duplicatingProductId === product.id}
                      className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      {duplicatingProductId === product.id ? 'Duplicating...' : 'Duplicate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        setDeleteCandidate(product);
                      }}
                      className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Product Table component for list view
  const ProductTable = ({ products, ...controls }: { products: Product[] } & ProductControls) => {
    const { allVisibleSelected, toggleVisibleSelection } = controls;
    return (
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
              <ProductRow {...controls} key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

export default function GrowerProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const strainFilterId = searchParams?.get('strain') || searchParams?.get('strainId') || '';
  const batchFilterId = searchParams?.get('batch') || searchParams?.get('batchId') || '';
  const workflowView = normalizeWorkflowView(searchParams?.get('view'));
  const page = Math.max(1, Number(searchParams?.get('page')) || 1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, counts: {} as Record<string, number>, inventoryValue: 0 });
  const [originalPageProducts, setOriginalPageProducts] = useState<Product[]>([]);
  const listRequest = useRef<AbortController | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  useBodyOverlay(selectedProductIds.size > 0);
  const pendingIds = useRef(new Set<string>());
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [duplicatingProductId, setDuplicatingProductId] = useState<string | null>(null);
  const defaultsKey = session?.user?.id ? `${PRODUCT_DEFAULTS_STORAGE_KEY}:${session.user.id}` : null;
  const [savedProductDefaults, setSavedProductDefaults] = useState<ProductDefaults | null>(null);
  const [quickDraftRestored, setQuickDraftRestored] = useState(false);
  const [growerAccess, setGrowerAccess] = useState<{ isVerified: boolean; licenseExpiry: string | null; subscriptionPlan: string | null; subscriptionStatus: string | null } | null>(null);
  const [quickProduct, setQuickProduct] = useState<QuickProductDraft>({
    name: '',
    productType: 'Flower',
    price: '',
    inventoryQty: '0',
    unit: 'Gram',
    isPriceVisible: true,
  });

  // Load view mode from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem('productViewMode'); } catch { /* Optional preference. */ }
      if (saved === 'card' || saved === 'list') {
        setViewMode(saved);
      }
      setTableDensity(readDensityPreference('phenofarm:density:products'));
      try {
        const parsed = JSON.parse((defaultsKey ? window.localStorage.getItem(defaultsKey) : null) || 'null') as ProductDefaults | null;
        if (parsed) setSavedProductDefaults(parsed);
      } catch {
        setSavedProductDefaults(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultsKey]);

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('productViewMode', mode); } catch { /* Optional preference. */ }
    }
  };

  const handleDensityChange = (mode: TableDensity) => {
    setTableDensity(mode);
    saveDensityPreference('phenofarm:density:products', mode);
  };

  const handleWorkflowViewChange = (view: WorkflowView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (view === 'all') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    params.delete('page');
    const queryString = params.toString();
    router.replace(queryString ? `/grower/products?${queryString}` : '/grower/products');
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/growers/me', { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then(setGrowerAccess).catch(() => null);
    return () => controller.abort();
  }, []);

  const fetchProducts = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    try {
      setError(null);
      const params = new URLSearchParams({ paged: 'true', page: String(page), pageSize: '50', view: workflowView });
      if (strainFilterId) params.set('strainId', strainFilterId);
      if (batchFilterId) params.set('batchId', batchFilterId);
      const response = await fetch(`/api/products?${params}`, { signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to fetch products');
      if (!Array.isArray(data.products)) throw new Error('Product response was incomplete');
      const next = data.products.map(normalizeFetchedProduct).filter((item: Product | null): item is Product => item !== null);
      setProducts(next);
      setOriginalPageProducts(next);
      setPagination({ page: data.page, pageSize: data.pageSize, counts: data.counts, inventoryValue: data.inventoryValue });
      setSelectedProductIds(new Set());
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Network error - please check your connection');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, workflowView, strainFilterId, batchFilterId]);
  useEffect(() => {
    void fetchProducts();
    return () => listRequest.current?.abort();
  }, [fetchProducts]);

  const deleteProduct = async (productId: string) => {
    if (pendingIds.current.has(productId)) return;
    pendingIds.current.add(productId);
    setPendingProductIds(new Set(pendingIds.current));
    try {
      await deleteRecord('/api/products/' + productId, 'Failed to delete product');
      setProducts((current) => current.filter(item => item.id !== productId));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error deleting product');
    } finally {
      pendingIds.current.delete(productId);
      setPendingProductIds(new Set(pendingIds.current));
      setDeleteCandidate(null);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    if (pendingIds.current.has(productId)) return;
    const product = products.find((item) => item.id === productId);

    if (product && product.inventoryQty <= 0 && !currentStatus) {
      toast.warning('Add inventory before enabling this product', {
        description: 'Zero-inventory products stay unavailable.',
      });
      return;
    }

    pendingIds.current.add(productId);
    setPendingProductIds(new Set(pendingIds.current));
    setProducts((current) => current.map((item) => item.id === productId ? { ...item, isAvailable: !currentStatus } : item));
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

        setProducts((current) => current.map(p => p.id === productId
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
        throw new Error(errData.error || 'Failed to update product');
      }
    } catch (error) {
      setProducts((current) => current.map((item) => item.id === productId ? { ...item, isAvailable: currentStatus } : item));
      toast.error(error instanceof Error ? error.message : 'Network error updating product');
    } finally {
      pendingIds.current.delete(productId);
      setPendingProductIds(new Set(pendingIds.current));
    }
  };

  const catalogDefaults = useMemo<ProductDefaults>(() => {
    if (products.length === 0) return savedProductDefaults || DEFAULT_PRODUCT_DEFAULTS;

    const newestProduct = [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      productType: getMostCommonValue(
        products.map((product) => product.productType || ''),
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
      isPriceVisible: defaults.isPriceVisible,
    }));
    setQuickError('');
  };

  const saveProductDefaults = (defaults: ProductDefaults) => {
    setSavedProductDefaults(defaults);
    if (typeof window !== 'undefined') {
      try { if (defaultsKey) window.localStorage.setItem(defaultsKey, JSON.stringify(defaults)); } catch { /* Storage is optional. */ }
    }
  };

  const resetQuickProduct = () => {
    setQuickProduct({
      name: '',
      productType: catalogDefaults.productType || 'Flower',
      price: catalogDefaults.price || '',
      inventoryQty: '0',
      unit: catalogDefaults.unit || 'Gram',
      isPriceVisible: catalogDefaults.isPriceVisible,
    });
    setQuickError('');
  };

  const toggleQuickCreate = () => {
    if (showQuickCreate) {
      setShowQuickCreate(false);
      return;
    }

    const hasRestorableDraft = Boolean(
      quickProduct.name.trim() ||
      quickProduct.productType !== (catalogDefaults.productType || 'Flower') ||
      quickProduct.price !== (catalogDefaults.price || '') ||
      quickProduct.inventoryQty !== '0' ||
      quickProduct.unit !== (catalogDefaults.unit || 'Gram') ||
      quickProduct.isPriceVisible !== catalogDefaults.isPriceVisible
    );
    setQuickDraftRestored(hasRestorableDraft);
    setShowQuickCreate(true);
  };

  const scrollProductIntoView = (productId: string) => {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      document.getElementById(`product-card-${productId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
  };

  const duplicateProduct = async (product: Product) => {
    if (duplicatingProductId) return;

    setDuplicatingProductId(product.id);
    setOpenActionMenuId(null);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${product.name} Copy`,
          productType: product.productType || 'Flower',
          subType: product.subType,
          strainId: product.strain?.id,
          batchId: product.batchId,
          price: product.price,
          inventoryQty: product.inventoryQty,
          unit: product.unit,
          isAvailable: product.inventoryQty > 0 ? product.isAvailable : false,
          isPriceVisible: product.isPriceVisible,
          images: [],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data
          ? String((data as { error?: unknown }).error)
          : 'Failed to duplicate product.';
        throw new Error(message);
      }

      const created = normalizeFetchedProduct(data);
      if (!created) {
        await fetchProducts();
        toast.success('Product duplicated');
        return;
      }

      handleWorkflowViewChange('all');
      setActiveFilter('all');
      handleViewModeChange('card');
      setProducts((prev) => [created, ...prev]);
      scrollProductIntoView(created.id);
      toast.success('Product duplicated', {
        description: `${created.name} was added to your catalog.`,
        action: {
          label: 'Edit copy',
          onClick: () => router.push(`/grower/products/${created.id}/edit`),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate product.');
    } finally {
      setDuplicatingProductId(null);
    }
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
          isPriceVisible: quickProduct.isPriceVisible,
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
        isPriceVisible: quickProduct.isPriceVisible,
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
        text: `${successLabel} for ${data.updatedCount ?? selectedProductIds.size} product${selectedProductIds.size === 1 ? '' : 's'}.`,
      });
      const updatedIds = new Set<string>(Array.isArray(data.updatedIds) ? data.updatedIds : Array.from(selectedProductIds));
      setProducts((current) => current.map((product) => updatedIds.has(product.id)
        ? { ...product, ...updates, isAvailable: updates.isAvailable === undefined ? product.isAvailable : updates.isAvailable && product.inventoryQty > 0 }
        : product));
      setSelectedProductIds(new Set());
    } catch (err) {
      setBulkMessage({ type: 'error', text: err instanceof Error ? err.message : 'Bulk update failed' });
    } finally {
      setBulkUpdating(false);
    }
  };

  const runBulkDelete = async () => {
    if (selectedProductIds.size === 0 || bulkUpdating) return;

    const idsToDelete = Array.from(selectedProductIds);
    setBulkUpdating(true);
    setBulkMessage(null);

    try {
      const results = await Promise.allSettled(idsToDelete.map(async productId => {
        await deleteRecord('/api/products/' + productId, 'Failed to delete product');
        return productId;
      }));
      const deletedIds = new Set(results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []));
      const failedIds = idsToDelete.filter(id => !deletedIds.has(id));
      setProducts(current => current.filter(product => !deletedIds.has(product.id)));
      setSelectedProductIds(new Set(failedIds));
      setBulkMessage({ type: failedIds.length ? 'error' : 'success',
        text: `Deleted ${deletedIds.size} product${deletedIds.size === 1 ? '' : 's'}.${failedIds.length ? ` ${failedIds.length} could not be deleted and remain selected.` : ''}` });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk delete failed';
      setBulkMessage({ type: 'error', text: message });
      toast.error(message);
    } finally {
      setBulkUpdating(false);
      setBulkDeleteOpen(false);
    }
  };

  const catalogProducts = useMemo(() => {
    return products.filter((product) => {
      if (strainFilterId && product.strain?.id !== strainFilterId) return false;
      if (batchFilterId && product.batchId !== batchFilterId) return false;
      return true;
    });
  }, [products, strainFilterId, batchFilterId]);

  const activeStrainFilterName = useMemo(() => {
    if (!strainFilterId) return '';
    return products.find((product) => product.strain?.id === strainFilterId)?.strain?.name || 'selected strain';
  }, [products, strainFilterId]);

  const activeBatchFilterName = useMemo(() => {
    if (!batchFilterId) return '';
    return products.find((product) => product.batchId === batchFilterId)?.batch?.batchNumber || 'selected batch';
  }, [products, batchFilterId]);

  const activeCatalogFilterLabel = [
    strainFilterId ? activeStrainFilterName : '',
    batchFilterId ? activeBatchFilterName : '',
  ].filter(Boolean).join(' and ');

  const workflowProducts = useMemo(() => {
    if (workflowView === 'active') {
      return catalogProducts.filter((product) => product.isAvailable && product.inventoryQty > 0);
    }

    if (workflowView === 'low-stock') {
      return catalogProducts.filter((product) => product.inventoryQty > 0 && product.inventoryQty <= 10);
    }

    if (workflowView === 'quote-only') {
      return catalogProducts.filter((product) => !product.isPriceVisible);
    }

    if (workflowView === 'missing-images') {
      return catalogProducts.filter((product) => product.imageCount === 0);
    }

    if (workflowView === 'missing-type') {
      return catalogProducts.filter((product) => !product.productType?.trim());
    }

    if (workflowView === 'hidden') {
      return catalogProducts.filter((product) => !product.isAvailable || product.inventoryQty <= 0);
    }

    return catalogProducts;
  }, [catalogProducts, workflowView]);

  const catalogStats = useMemo(() => {
    const counts = { ...pagination.counts };
    let inventoryValue = pagination.inventoryValue;
    const adjust = (product: Product, delta: number) => {
      const matches = { all: true, active: product.isAvailable && product.inventoryQty > 0,
        'low-stock': product.inventoryQty > 0 && product.inventoryQty <= 10, 'quote-only': !product.isPriceVisible,
        'missing-images': product.imageCount === 0, 'missing-type': !product.productType?.trim(),
        hidden: !product.isAvailable || product.inventoryQty <= 0 };
      Object.entries(matches).forEach(([key, match]) => { if (match) counts[key] = (counts[key] || 0) + delta; });
      inventoryValue += product.price * product.inventoryQty * delta;
    };
    originalPageProducts.forEach(product => adjust(product, -1));
    catalogProducts.forEach(product => adjust(product, 1));
    return { counts, inventoryValue };
  }, [pagination, originalPageProducts, catalogProducts]);
  const workflowViewOptions = [
    { key: 'all' as const, label: 'All' }, { key: 'active' as const, label: 'Active' },
    { key: 'low-stock' as const, label: 'Low inventory' }, { key: 'quote-only' as const, label: 'Quote only' },
    { key: 'missing-images' as const, label: 'Missing images' }, { key: 'missing-type' as const, label: 'Missing type' },
    { key: 'hidden' as const, label: 'Hidden/out' },
  ].map(view => ({ ...view, count: catalogStats.counts[view.key] || 0 }));
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
        const type = product.productType || 'Uncategorized';
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

  const totalProducts = catalogStats.counts.all || 0;
  const totalValue = catalogStats.inventoryValue;
  const availableCount = catalogStats.counts.active || 0;

  const filterTabs = [
    { key: 'all', label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
    { key: 'byProductType', label: 'Product type', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { key: 'byStrain', label: 'Strain', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'byBatch', label: 'Batch', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ] as const;


  const productControls: ProductControls = { selectedProductIds, pendingProductIds, toggleProductSelection, toggleAvailability, cardPaddingClass, compactMode, tableCellClass, setOpenActionMenuId, openActionMenuId, duplicateProduct, duplicatingProductId, setDeleteCandidate, allVisibleSelected, toggleVisibleSelection };

  return (
    <div className="space-y-3 sm:space-y-6 pb-20 sm:pb-24">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:flex sm:gap-3">
        <PageHeader title="Products" className="sm:mr-auto" />
        <Button variant="primary" asChild className="justify-self-end sm:order-3">
          <Link href="/grower/products/add">Add product</Link>
        </Button>
        <div className="col-span-2 flex items-center gap-2 sm:order-2">
          <Button
            type="button"
            variant="secondary"
            onClick={toggleQuickCreate}
            className="shrink-0"
          >
            Quick add
          </Button>
          <ProductCsvImportDialog enabled={getGrowerPlan(growerAccess) !== 'free'} onImported={fetchProducts} />
        </div>
      </div>

      {growerAccess && (!growerAccess.isVerified || isLicenseExpired(growerAccess.licenseExpiry)) ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Listings are hidden from buyers.</strong> PhenoFarm must verify your account and current license before products appear in the marketplace. <Link href="/grower/settings#business-profile" className="font-semibold underline">Review license details</Link></section>
      ) : null}

      {showQuickCreate && (
        <form onSubmit={submitQuickProduct} className="rounded-xl border border-green-100 bg-green-50 p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quick add</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                resetQuickProduct();
                setShowQuickCreate(false);
              }}
              className="self-start rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyQuickDefaults(catalogDefaults)}
              className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              Catalog defaults
            </button>
            {savedProductDefaults && (
              <button
                type="button"
                onClick={() => {
                  applyQuickDefaults(savedProductDefaults);
                  setQuickDraftRestored(true);
                }}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                Last listing
              </button>
            )}
            {quickDraftRestored ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-900">
                Draft restored
                <button
                  type="button"
                  onClick={() => {
                    resetQuickProduct();
                    setQuickDraftRestored(false);
                  }}
                  className="min-h-10 rounded px-2 text-green-700 underline underline-offset-2 hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  Clear
                </button>
              </span>
            ) : null}
          </div>

          {quickError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{quickError}{/free plan|upgrade/i.test(quickError) ? <> <Link href="/grower/pricing" className="font-semibold underline">Compare plans</Link></> : null}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
            <label className="col-span-2 text-sm font-medium text-gray-700">
              Product name
              <input
                value={quickProduct.name}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Blueberries NF"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Type
              <input
                value={quickProduct.productType}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, productType: event.target.value }))}
                className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Flower"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Unit
              <select value={quickProduct.unit} onChange={(event) => setQuickProduct((prev) => ({ ...prev, unit: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm">
                {['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack', 'Each', 'Lb'].map((unit) => <option key={unit}>{unit}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={quickProduct.price}
                onChange={(event) => setQuickProduct((prev) => ({ ...prev, price: event.target.value }))}
                className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-900">
                <input
                  type="checkbox"
                  checked={quickProduct.isPriceVisible}
                  onChange={(event) => setQuickProduct((prev) => ({ ...prev, isPriceVisible: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                Show price to buyers
              </label>
            </div>
            <Button type="submit" variant="primary" disabled={quickSaving} className="shrink-0">
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
            <button type="button" onClick={() => setBulkMessage(null)} className="rounded text-xs font-semibold opacity-75 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <OperationsSummary items={[{label: 'Products', value: totalProducts}, {label: 'Stock value', value: formatProductMoney(totalValue)}, {label: 'Available', value: availableCount}]} />

      {(strainFilterId || batchFilterId) && (
        <div className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing products for <span className="font-semibold">{activeCatalogFilterLabel}</span>.
          </p>
          <Button variant="outline" size="sm" asChild className="bg-white">
            <Link href="/grower/products">Clear filter</Link>
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <label htmlFor="product-mobile-filter" className="sr-only">Filter products</label>
        <select id="product-mobile-filter" value={workflowView} onChange={(event) => handleWorkflowViewChange(event.target.value as WorkflowView)} className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-base sm:hidden">
          {workflowViewOptions.map((view) => <option key={view.key} value={view.key}>{view.label} ({view.count})</option>)}
        </select>
        <p className="mb-2 hidden text-xs font-medium text-gray-500 sm:block">Filter</p>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {workflowViewOptions.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => handleWorkflowViewChange(view.key)}
              aria-pressed={workflowView === view.key}
              aria-label={`${view.label}: ${view.count} products`}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                workflowView === view.key
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2`}
            >
              <span>{view.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                workflowView === view.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Display Controls */}
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
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2`}
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

          <div className="relative hidden sm:block">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDisplayMenu((prev) => !prev)}
              aria-expanded={showDisplayMenu}
              aria-haspopup="menu"
              className="w-full justify-between gap-3 sm:w-auto"
            >
              <span>Display</span>
              <span className="text-xs font-normal text-gray-500">
                {viewMode === 'card' ? 'Cards' : 'List'} · {compactMode ? 'Compact' : 'Comfort'}
              </span>
            </Button>
            {showDisplayMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close display settings"
                  onClick={() => setShowDisplayMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:w-72">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Density</p>
                      <TableDensityControl value={tableDensity} onChange={handleDensityChange} label="Rows" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">View</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleViewModeChange('card');
                            setShowDisplayMenu(false);
                          }}
                          aria-pressed={viewMode === 'card'}
                          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            viewMode === 'card'
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2`}
                          title="Card view"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleViewModeChange('list');
                            setShowDisplayMenu(false);
                          }}
                          aria-pressed={viewMode === 'list'}
                          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            viewMode === 'list'
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2`}
                          title="List view"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                          </svg>
                          List
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {workflowProducts.length > 0 && selectedCount > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleVisibleSelection}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {allVisibleSelected ? 'Clear all' : 'Select all'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
            </div>

          </div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 z-40 px-4 pointer-events-none" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl pointer-events-auto sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedCount} product{selectedCount === 1 ? '' : 's'} selected
              </p>
              <p className="text-xs text-gray-500">
                {bulkUpdating ? 'Updating...' : 'Choose an action for the selected listings.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isAvailable: false }, 'Disabled')}>
                Disable
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={bulkUpdating} onClick={() => runBulkUpdate({ isAvailable: true }, 'Enabled')}>
                Enable
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={bulkUpdating} onClick={() => setBulkDeleteOpen(true)}>
                Delete
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={bulkUpdating} onClick={() => setSelectedProductIds(new Set())}>
                Clear selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && <Pagination page={pagination.page} pageSize={pagination.pageSize} total={catalogStats.counts[workflowView] || 0} basePath="/grower/products" label="products" query={Object.fromEntries(searchParams?.entries() || [])} />}
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
              {activeFilter !== 'all' && <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {groups[groupName]?.length || 0}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>}

              <div className="space-y-3 sm:hidden">{groups[groupName]?.map(product => <MobileProduct key={product.id} product={product} controls={productControls} />)}</div>
              <div className="hidden sm:block">
                {viewMode === 'card' ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{groups[groupName]?.map(product => <ProductCard {...productControls} key={product.id} product={product} />)}</div> : <ProductTable {...productControls} products={groups[groupName] || []} />}
              </div>
            </div>
          ))}
        </div>
      ) : totalProducts > 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products in this view</h3>
          <p className="text-gray-500 mb-5 max-w-sm mx-auto">
            Clear filters to see all products.
          </p>
          <Button type="button" variant="secondary" onClick={() => handleWorkflowViewChange('all')}>
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
              className="shrink-0"
              onClick={() => {
                applyQuickDefaults(catalogDefaults);
                setShowQuickCreate(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Quick add first listing
            </Button>
            <Button variant="primary" asChild className="shrink-0">
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
        loading={Boolean(deleteCandidate && pendingProductIds.has(deleteCandidate.id))}
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
      <ConfirmDialog
        loading={bulkUpdating}
        open={bulkDeleteOpen}
        title="Delete selected products?"
        description={`Delete ${selectedCount} selected product${selectedCount === 1 ? '' : 's'} from your catalog. This removes them from buyer browsing and cannot be undone from this screen.`}
        confirmLabel="Delete selected"
        intent="danger"
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={runBulkDelete}
      />
    </div>
  );
}
