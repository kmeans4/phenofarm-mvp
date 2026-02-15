'use client';

import { useState, useEffect } from 'react';

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
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/product-type-config');
        if (response.ok) {
          const data = await response.json();
          setConfigs(data);
        }
      } catch (err) {
        console.error('Error fetching product type configs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const selectedConfig = configs.find(c => c.type === productType);
  const subTypes = selectedConfig?.subTypes || [];
  const hasSubTypes = subTypes.length > 0;

  useEffect(() => {
    // Check if current subType is not in the list (custom)
    if (productType && subType && !subTypes.includes(subType) && subType !== 'Other' && subType !== '') {
      setShowOtherInput(true);
      setCustomSubType(subType);
    }
  }, [productType, subType, subTypes]);

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
            value={productType}
            onChange={(e) => handleProductTypeChange(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Select a product type</option>
            {configs.map(config => (
              <option key={config.id} value={config.type}>{config.type}</option>
            ))}
          </select>
        </div>

        {/* Sub Type - Only show if product type has subtypes */}
        {productType && hasSubTypes && (
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
        {productType && !hasSubTypes && (
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
        {!productType && (
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
