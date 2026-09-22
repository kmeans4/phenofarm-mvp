'use client';

import { X, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAllProductTypes } from '@/lib/product-types';
import { THC_RANGES, PRICE_RANGES, type FilterState } from '@/lib/catalog-filters';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  activeFilterCount: number;
  productTypeCounts: Record<string, number>;
  resultCount: number;
  showFavoritesOnly: boolean;
  favoriteCount: number;
  onFavoritesOnlyChange: (nextValue: boolean) => void;
  savedFilters: { id: string; name: string }[];
  onApplySavedFilter: (id: string) => void;
  onDeleteSavedFilter: (id: string) => void;
  onSaveFilter: () => void;
  hasSearchOrSort: boolean;
}

const PRODUCT_TYPES = getAllProductTypes();

function MobileFilterSheetContent({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  productTypeCounts,
  showFavoritesOnly,
  favoriteCount,
  onFavoritesOnlyChange,
  savedFilters,
  onApplySavedFilter,
  onDeleteSavedFilter,
  onSaveFilter,
  hasSearchOrSort,
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [localFavorites, setLocalFavorites] = useState(showFavoritesOnly);
  const activeFilterCount = localFilters.productTypes.length + localFilters.thcRanges.length + localFilters.priceRanges.length + Number(localFilters.recentlyAdded) + Number(localFilters.trending) + Number(localFavorites);
  const canSaveFilter = activeFilterCount - Number(localFavorites) > 0 || hasSearchOrSort;
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: isOpen, containerRef: sheetRef, onEscape: onClose });
  useBodyOverlay(isOpen);

  const productTypeOptions = useMemo(() => {
    const baseTypes = new Set(PRODUCT_TYPES);
    const customTypes = Object.keys(productTypeCounts)
      .filter((type) => !baseTypes.has(type))
      .sort((a, b) => a.localeCompare(b));

    return [...PRODUCT_TYPES, ...customTypes]
      .map((type) => ({
        type,
        count: productTypeCounts[type] || 0,
        isSelected: localFilters.productTypes.includes(type),
      }))
      .filter((option) => option.count > 0 || option.isSelected);
  }, [localFilters.productTypes, productTypeCounts]);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as HTMLElement).dataset.startY = String(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = Number((e.currentTarget as HTMLElement).dataset.startY || 0);
    const diff = touch.clientY - startY;
    
    if (diff > 50) {
      onClose();
    }
  };

  const toggleFilter = (category: 'productTypes' | 'thcRanges' | 'priceRanges', value: string) => {
    setLocalFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    onFavoritesOnlyChange(localFavorites);
    onClose();
  };

  const clearAll = () => {
    const empty: FilterState = { productTypes: [], thcRanges: [], priceRanges: [], recentlyAdded: false, trending: false };
    setLocalFilters(empty);
    setLocalFavorites(false);
  };



  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-100`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef} role="dialog" aria-modal="true" aria-label="Catalog filters" tabIndex={-1}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[90dvh] flex flex-col translate-y-0`}
      >
        {/* Drag Handle */}
        <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
          {activeFilterCount > 0 && <button type="button" onClick={clearAll} aria-label="Clear all filters" className="min-h-10 rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-100">Clear</button>}
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            aria-label="Close filters"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
          </div>
        </div>

        {/* Filter Content - Scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {savedFilters.length > 0 && <details className="rounded-xl border border-gray-200 px-3">
            <summary className="min-h-10 cursor-pointer content-center text-sm font-semibold text-gray-900">Saved filters ({savedFilters.length})</summary>
            <div className="space-y-1 pb-2">
              {savedFilters.map(filter => <div key={filter.id} className="flex items-center gap-2 rounded-lg bg-green-50 pl-2">
                <button type="button" onClick={() => onApplySavedFilter(filter.id)} className="min-h-10 min-w-0 flex-1 break-words px-1 py-2 text-left text-sm font-medium text-green-800">{filter.name}</button>
                <button type="button" onClick={() => onDeleteSavedFilter(filter.id)} aria-label={`Delete saved filter ${filter.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </div>)}
            </div>
          </details>}
          <div className="space-y-1">
            <label className="flex min-h-10 items-center gap-3 text-sm font-medium"><input type="checkbox" checked={localFavorites} onChange={e => setLocalFavorites(e.target.checked)} className="h-4 w-4 accent-green-700" />Favorites only ({favoriteCount})</label>
            <label className="flex min-h-10 items-center gap-3 text-sm font-medium"><input type="checkbox" checked={localFilters.recentlyAdded} onChange={e => setLocalFilters(prev => ({ ...prev, recentlyAdded: e.target.checked }))} className="h-4 w-4 accent-green-700" />Added in 7 days</label>
          </div>

          {/* Product Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Product Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {productTypeOptions.length > 0 ? (
                productTypeOptions.map(({ type, count, isSelected }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFilter('productTypes', type)}
                    aria-pressed={isSelected}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))
              ) : (
                <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  No product types match the current results.
                </p>
              )}
            </div>
          </div>

          {/* THC Range Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              THC Potency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {THC_RANGES.map(range => {
                const isSelected = localFilters.thcRanges.includes(range.id);
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => toggleFilter('thcRanges', range.id)}
                    aria-pressed={isSelected}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {range.label.replace(/ per unit/g, '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 uppercase tracking-wide">
              Price per unit
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PRICE_RANGES.map(range => {
                const isSelected = localFilters.priceRanges.includes(range.id);
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => toggleFilter('priceRanges', range.id)}
                    aria-pressed={isSelected}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {range.label.replace(/ per unit/g, '')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => { applyFilters(); onSaveFilter(); }} disabled={!canSaveFilter} className="min-h-11 rounded-xl border border-green-300 px-3 py-3 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">Save filter</button>
          <button
            type="button"
            onClick={applyFilters}
            className="min-h-11 rounded-xl bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>, document.body
  );
}

export default function MobileFilterSheet(props: MobileFilterSheetProps) {
  return props.isOpen ? <MobileFilterSheetContent {...props} /> : null;
}
