'use client';

import { useState, useEffect, useMemo } from 'react';
import { canonicalizeProductType, mergeProductTypeOptions } from '@/lib/product-types';

interface ProductTypeConfig {
  id: string;
  type: string;
  subTypes: string[];
  isCustom: boolean;
}

interface ProductTypeSelectorProps {
  productType: string;
  subType: string;
  onProductTypeChange: (type: string) => void;
  onSubTypeChange: (subType: string) => void;
}

// Consistent input/select styles - h-10 matches text inputs
const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const ALLOWED_PRODUCT_TYPES = ['Bulk Extract', 'Flower', 'Cartridge'];

export function ProductTypeSelector({
  productType,
  subType,
  onProductTypeChange,
  onSubTypeChange
}: ProductTypeSelectorProps) {
  const [configs, setConfigs] = useState<ProductTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customSubType, setCustomSubType] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/product-type-config', { signal: controller.signal });
        if (!isActive) return;

        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setConfigs(data);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchConfigs();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const mergedConfigs = useMemo(() => mergeProductTypeOptions(configs), [configs]);

  const normalizedProductType = useMemo(() => canonicalizeProductType(productType) || '', [productType]);

  const typeOptions = useMemo(() => {
    const mergedTypes = mergedConfigs
      .map((config) => config.type)
      .filter((type) => ALLOWED_PRODUCT_TYPES.includes(type));

    if (normalizedProductType && !mergedTypes.includes(normalizedProductType)) {
      return [normalizedProductType, ...mergedTypes];
    }

    return mergedTypes;
  }, [mergedConfigs, normalizedProductType]);

  const subTypes = useMemo(() => {
    const selected = mergedConfigs.find((config) => config.type === normalizedProductType);
    const mergedSubTypes = selected?.subTypes || [];

    // Preserve older/custom existing product records even if subtype is no longer in config.
    if (subType && !mergedSubTypes.includes(subType) && subType !== 'Other') {
      return [subType, ...mergedSubTypes];
    }

    return mergedSubTypes;
  }, [mergedConfigs, normalizedProductType, subType]);

  const hasSubTypes = subTypes.length > 0;

  useEffect(() => {
    if (productType && normalizedProductType && productType !== normalizedProductType) {
      onProductTypeChange(normalizedProductType);
    }
  }, [productType, normalizedProductType, onProductTypeChange]);

  useEffect(() => {
    // Check if current subType is not in the list (custom)
    if (normalizedProductType && subType && !subTypes.includes(subType) && subType !== 'Other' && subType !== '') {
      setShowOtherInput(true);
      setCustomSubType(subType);
    }
  }, [normalizedProductType, subType, subTypes]);

  const handleProductTypeChange = (type: string) => {
    onProductTypeChange(type);
    onSubTypeChange(''); // Reset sub-type when product type changes
    setShowOtherInput(false);
    setCustomSubType('');
  };

  const handleSubTypeChange = (value: string) => {
    if (value === 'Other') {
      setShowOtherInput(true);
      onSubTypeChange('Other');
    } else {
      setShowOtherInput(false);
      onSubTypeChange(value);
    }
  };

  const handleCustomSubTypeChange = (value: string) => {
    setCustomSubType(value);
    onSubTypeChange(value);
  };

  if (loading) {
    return (
      <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Type */}
        <div className="space-y-2">
          <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
            Product Type *
          </label>
          <select
            id="productType"
            value={normalizedProductType}
            onChange={(e) => handleProductTypeChange(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Select a product type</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Sub Type - Only show if product type has subtypes */}
        {normalizedProductType && hasSubTypes && (
          <div className="space-y-2">
            <label htmlFor="subType" className="block text-sm font-medium text-gray-700">
              Sub Type
            </label>
            <select
              id="subType"
              value={showOtherInput ? 'Other' : subType}
              onChange={(e) => handleSubTypeChange(e.target.value)}
              className={INPUT_CLASSES}
            >
              <option value="">Select a sub type</option>
              {subTypes.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="Other">Other (custom)</option>
            </select>
            
            {showOtherInput && (
              <input
                type="text"
                value={customSubType}
                onChange={(e) => handleCustomSubTypeChange(e.target.value)}
                className={INPUT_CLASSES}
                placeholder="Enter custom sub-type"
              />
            )}
          </div>
        )}

        {/* Show placeholder when product type selected but no subtypes */}
        {normalizedProductType && !hasSubTypes && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">
              Sub Type
            </label>
            <input
              type="text"
              disabled
              value="N/A"
              className="w-full h-10 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
            />
          </div>
        )}

        {/* Placeholder when no product type selected */}
        {!normalizedProductType && (
          <div className="space-y-2">
            <label htmlFor="subType" className="block text-sm font-medium text-gray-700">
              Sub Type
            </label>
            <input
              type="text"
              disabled
              value=""
              className="w-full h-10 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              placeholder="Select a product type first"
            />
          </div>
        )}
      </div>
    </div>
  );
}
