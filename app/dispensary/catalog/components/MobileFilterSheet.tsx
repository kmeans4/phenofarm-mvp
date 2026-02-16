'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FilterState {
  productTypes: string[];
  thcRanges: string[];
  priceRanges: string[];
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  activeFilterCount: number;
}

const PRODUCT_TYPES = ['Flower', 'Edibles', 'Cartridge', 'Concentrate', 'Pre-roll', 'Tincture', 'Topical', 'Drink'];

const THC_RANGES = [
  { label: '< 15%', min: 0, max: 15, id: 'low' },
  { label: '15% - 20%', min: 15, max: 20, id: 'medium' },
  { label: '20% - 25%', min: 20, max: 25, id: 'high' },
  { label: '25%+', min: 25, max: 100, id: 'very-high' },
];

const PRICE_RANGES = [
  { label: 'Under $5', min: 0, max: 5, id: 'budget' },
  { label: '$5 - $10', min: 5, max: 10, id: 'standard' },
  { label: '$10 - $25', min: 10, max: 25, id: 'premium' },
  { label: '$25+', min: 25, max: 10000, id: 'luxury' },
];

export default function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  activeFilterCount,
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Sync local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsVisible(true);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as HTMLElement).dataset.startY = String(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = Number((e.currentTarget as HTMLElement).dataset.startY || 0);
    const diff = touch.clientY - startY;
    
    if (diff > 50 && e.currentTarget === e.target) {
      onClose();
    }
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
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
    onClose();
  };

  const clearAll = () => {
    const empty: FilterState = { productTypes: [], thcRanges: [], priceRanges: [] };
    setLocalFilters(empty);
    onFilterChange(empty);
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
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
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Filter Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Product Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Product Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map(type => {
                const isSelected = localFilters.productTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter('productTypes', type)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
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
                    onClick={() => toggleFilter('thcRanges', range.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Price Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PRICE_RANGES.map(range => {
                const isSelected = localFilters.priceRanges.includes(range.id);
                return (
                  <button
                    key={range.id}
                    onClick={() => toggleFilter('priceRanges', range.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-5 space-y-3 bg-white">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="w-full py-3.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={applyFilters}
            className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-green-600/25 min-h-[52px] flex items-center justify-center gap-2"
          >
            Show Results
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
              {activeFilterCount > 0 ? `${activeFilterCount} active` : 'All'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
