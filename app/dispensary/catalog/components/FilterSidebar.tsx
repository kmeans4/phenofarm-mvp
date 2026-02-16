'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface FilterSidebarProps {
  filters: {
    productTypes: string[];
    thcRanges: string[];
    cbdRanges: string[];
    priceRange: { min: number | null; max: number | null };
    inStockOnly: boolean;
  };
  onFilterChange: (filters: any) => void;
  availableProductTypes: string[];
  totalProducts: number;
  filteredCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const THC_RANGES = [
  { label: '15-20%', value: '15-20', min: 15, max: 20 },
  { label: '20-25%', value: '20-25', min: 20, max: 25 },
  { label: '25%+', value: '25+', min: 25, max: 100 },
  { label: 'Under 15%', value: 'under15', min: 0, max: 15 },
];

const CBD_RANGES = [
  { label: '1-5%', value: '1-5', min: 1, max: 5 },
  { label: '5-10%', value: '5-10', min: 5, max: 10 },
  { label: '10%+', value: '10+', min: 10, max: 100 },
  { label: 'Under 1%', value: 'under1', min: 0, max: 1 },
];

const PRICE_RANGES = [
  { label: 'Under $100', value: 'under100', min: 0, max: 100 },
  { label: '$100 - $500', value: '100-500', min: 100, max: 500 },
  { label: '$500 - $1000', value: '500-1000', min: 500, max: 1000 },
  { label: '$1000+', value: '1000plus', min: 1000, max: null },
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableProductTypes,
  totalProducts,
  filteredCount,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    productType: true,
    thc: true,
    cbd: false,
    price: true,
    stock: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleProductTypeToggle = (type: string) => {
    const newTypes = filters.productTypes.includes(type)
      ? filters.productTypes.filter(t => t !== type)
      : [...filters.productTypes, type];
    onFilterChange({ ...filters, productTypes: newTypes });
  };

  const handleThcRangeToggle = (range: string) => {
    const newRanges = filters.thcRanges.includes(range)
      ? filters.thcRanges.filter(r => r !== range)
      : [...filters.thcRanges, range];
    onFilterChange({ ...filters, thcRanges: newRanges });
  };

  const handleCbdRangeToggle = (range: string) => {
    const newRanges = filters.cbdRanges.includes(range)
      ? filters.cbdRanges.filter(r => r !== range)
      : [...filters.cbdRanges, range];
    onFilterChange({ ...filters, cbdRanges: newRanges });
  };

  const handlePriceRangeSelect = (value: string) => {
    const range = PRICE_RANGES.find(r => r.value === value);
    if (range) {
      onFilterChange({
        ...filters,
        priceRange: { min: range.min, max: range.max },
      });
    }
  };

  const clearAllFilters = () => {
    onFilterChange({
      productTypes: [],
      thcRanges: [],
      cbdRanges: [],
      priceRange: { min: null, max: null },
      inStockOnly: false,
    });
  };

  const hasActiveFilters =
    filters.productTypes.length > 0 ||
    filters.thcRanges.length > 0 ||
    filters.cbdRanges.length > 0 ||
    filters.priceRange.min !== null ||
    filters.inStockOnly;

  const activeFilterCount =
    filters.productTypes.length +
    filters.thcRanges.length +
    filters.cbdRanges.length +
    (filters.priceRange.min !== null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
        Showing {filteredCount} of {totalProducts} products
      </div>

      {/* Scrollable filter sections */}
      <div className="flex-1 overflow-y-auto">
        {/* In Stock Only */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('stock')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Availability</span>
            {expandedSections.stock ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandedSections.stock && (
            <div className="px-4 pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) =>
                    onFilterChange({ ...filters, inStockOnly: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-700">In stock only</span>
              </label>
            </div>
          )}
        </div>

        {/* Product Type */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('productType')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Product Type</span>
            {expandedSections.productType ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandedSections.productType && (
            <div className="px-4 pb-4 space-y-2">
              {availableProductTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.productTypes.includes(type)}
                    onChange={() => handleProductTypeToggle(type)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* THC Range */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('thc')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">THC Potency</span>
            {expandedSections.thc ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandedSections.thc && (
            <div className="px-4 pb-4 space-y-2">
              {THC_RANGES.map((range) => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.thcRanges.includes(range.value)}
                    onChange={() => handleThcRangeToggle(range.value)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* CBD Range */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('cbd')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">CBD Content</span>
            {expandedSections.cbd ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandedSections.cbd && (
            <div className="px-4 pb-4 space-y-2">
              {CBD_RANGES.map((range) => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.cbdRanges.includes(range.value)}
                    onChange={() => handleCbdRangeToggle(range.value)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('price')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Price Range</span>
            {expandedSections.price ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandedSections.price && (
            <div className="px-4 pb-4 space-y-2">
              {PRICE_RANGES.map((range) => (
                <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={
                      filters.priceRange.min === range.min &&
                      filters.priceRange.max === range.max
                    }
                    onChange={() => handlePriceRangeSelect(range.value)}
                    className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{range.label}</span>
                </label>
              ))}
              {filters.priceRange.min !== null && (
                <button
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      priceRange: { min: null, max: null },
                    })
                  }
                  className="text-sm text-green-600 hover:text-green-700 mt-2"
                >
                  Clear price filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar (fixed width) */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[calc(100vh-2rem)]">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
