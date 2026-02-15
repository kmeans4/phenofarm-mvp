'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts';
import { useToast } from '@/app/hooks/useToast';
import { Button } from '@/app/components/ui/Button';
import { PRODUCT_TYPE_NAMES, getSubTypesForProductType, hasSubTypes } from '@/lib/product-types';

interface Strain {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  strain?: { name: string } | null;
}

interface ProductData {
  id: string;
  name: string;
  strainId?: string | null;
  strainName?: string | null;
  batchId?: string | null;
  batchNumber?: string | null;
  productType?: string | null;
  subType?: string | null;
  categoryLegacy?: string | null;
  subcategoryLegacy?: string | null;
  price: number;
  inventoryQty: number;
  unit: string;
  description?: string | null;
  isAvailable: boolean;
  thc?: number | null;
  cbd?: number | null;
  sku?: string | null;
  brand?: string | null;
  ingredients?: string | null;
  images?: string[];
  isFeatured?: boolean;
}

interface FieldErrors {
  name?: string;
  price?: string;
  inventoryQty?: string;
  sku?: string;
  description?: string;
  brand?: string;
  ingredients?: string;
}

interface EditProductFormProps {
  product: ProductData;
  strains: Strain[];
  batches: Batch[];
  productTypes: string[];
  productTypeConfigs: { type: string; subTypes: string[] }[];
}

interface FormData {
  name: string;
  strainId: string;
  batchId: string;
  productType: string;
  subType: string;
  price: string;
  inventoryQty: string;
  unit: string;
  description: string;
  isAvailable: boolean;
  thc: string;
  cbd: string;
  sku: string;
  brand: string;
  ingredients: string;
  isFeatured: boolean;
}

// Product types imported from lib/product-types.ts

// Validation functions
const validateName = (name: string): string | undefined => {
  if (!name.trim()) return 'Product name is required';
  if (name.trim().length < 2) return 'Product name must be at least 2 characters';
  if (name.trim().length > 100) return 'Product name must be less than 100 characters';
  return undefined;
};

const validatePrice = (price: string): string | undefined => {
  if (!price) return 'Price is required';
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'Please enter a valid number';
  if (numPrice < 0) return 'Price cannot be negative';
  if (numPrice > 999999.99) return 'Price exceeds maximum allowed';
  return undefined;
};

const validateInventoryQty = (qty: string): string | undefined => {
  if (!qty) return 'Inventory quantity is required';
  const numQty = parseInt(qty, 10);
  if (isNaN(numQty)) return 'Please enter a valid whole number';
  if (numQty < 0) return 'Quantity cannot be negative';
  if (numQty > 999999) return 'Quantity exceeds maximum allowed';
  return undefined;
};

const validateSku = (sku: string): string | undefined => {
  if (!sku) return undefined;
  if (sku.length > 50) return 'SKU must be less than 50 characters';
  if (!/^[a-zA-Z0-9-_]+$/.test(sku)) return 'SKU can only contain letters, numbers, hyphens, and underscores';
  return undefined;
};

const validateDescription = (desc: string): string | undefined => {
  if (!desc) return undefined;
  if (desc.length > 2000) return 'Description must be less than 2000 characters';
  return undefined;
};

const validateBrand = (brand: string): string | undefined => {
  if (!brand) return undefined;
  if (brand.length > 100) return 'Brand must be less than 100 characters';
  return undefined;
};

const validateIngredients = (ingredients: string): string | undefined => {
  if (!ingredients) return undefined;
  if (ingredients.length > 1000) return 'Ingredients must be less than 1000 characters';
  return undefined;
};

const INPUT_CLASSES = "block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500";
const INPUT_ERROR_CLASSES = "block w-full rounded-md border border-red-500 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50";

export default function EditProductForm({ 
  product, 
  strains, 
  batches,
  productTypes,
  productTypeConfigs 
}: EditProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    strainId: product?.strainId || '',
    batchId: product?.batchId || '',
    productType: product?.productType || product?.categoryLegacy || '',
    subType: product?.subType || product?.subcategoryLegacy || '',
    price: product?.price?.toString() || '',
    inventoryQty: product?.inventoryQty?.toString() || '',
    unit: product?.unit || 'gram',
    description: product?.description || '',
    isAvailable: product?.isAvailable ?? true,
    thc: product?.thc?.toString() || '',
    cbd: product?.cbd?.toString() || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    ingredients: product?.ingredients || '',
    isFeatured: product?.isFeatured || false,
  });

  const [initialData, setInitialData] = useState<FormData>({
    name: product?.name || '',
    strainId: product?.strainId || '',
    batchId: product?.batchId || '',
    productType: product?.productType || product?.categoryLegacy || '',
    subType: product?.subType ?? product?.subcategoryLegacy ?? '',
    price: product?.price?.toString() || '',
    inventoryQty: product?.inventoryQty?.toString() || '',
    unit: product?.unit || 'gram',
    description: product?.description || '',
    isAvailable: product?.isAvailable ?? true,
    thc: product?.thc?.toString() || '',
    cbd: product?.cbd?.toString() || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    ingredients: product?.ingredients || '',
    isFeatured: product?.isFeatured || false,
  });

  const availableSubtypes = formData.productType 
    ? getSubTypesForProductType(formData.productType)
    : [];

  const filteredBatches = formData.strainId
    ? batches.filter(b => b.strain?.name === strains.find(s => s.id === formData.strainId)?.name)
    : batches;

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes to this product. Are you sure you want to leave?',
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  }, [formData, initialData, setIsDirty]);


  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {
      name: validateName(formData.name),
      price: validatePrice(formData.price),
      inventoryQty: validateInventoryQty(formData.inventoryQty),
      sku: validateSku(formData.sku),
      description: validateDescription(formData.description),
      brand: validateBrand(formData.brand),
      ingredients: validateIngredients(formData.ingredients),
    };
    
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FieldErrors] === undefined) {
        delete newErrors[key as keyof FieldErrors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'name': return validateName(value);
      case 'price': return validatePrice(value);
      case 'inventoryQty': return validateInventoryQty(value);
      case 'sku': return validateSku(value);
      case 'description': return validateDescription(value);
      case 'brand': return validateBrand(value);
      case 'ingredients': return validateIngredients(value);
      default: return undefined;
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field as string] && typeof value === 'string') {
      const error = validateField(field as keyof FieldErrors, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof FormData] as string;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors below before saving');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          productType: formData.productType || null,
          subType: formData.subType || null,
          strainId: formData.strainId || null,
          batchId: formData.batchId || null,
          price: parseFloat(formData.price),
          inventoryQty: parseInt(formData.inventoryQty),
          unit: formData.unit,
          description: formData.description || null,
          isAvailable: formData.isAvailable,
          strainLegacy: formData.strainId ? strains.find(s => s.id === formData.strainId)?.name || null : null,
          categoryLegacy: formData.productType || null,
          subcategoryLegacy: formData.subType || null,
          thcLegacy: formData.thc ? parseFloat(formData.thc) : null,
          cbdLegacy: formData.cbd ? parseFloat(formData.cbd) : null,
          sku: formData.sku || null,
          brand: formData.brand || null,
          ingredients: formData.ingredients || null,
          isFeatured: formData.isFeatured,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }

      showToast('success', 'Product updated successfully!');
      setInitialData(formData);
      resetDirtyState();
      router.push('/grower/products');
      router.refresh();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts: Ctrl+S to save, Esc to cancel
  useKeyboardShortcuts({
    onSave: handleSubmit,
    onCancel: () => router.push("/grower/products"),
    isDirty,
    enabled: true
  });

  const allProductTypes = [...new Set([...PRODUCT_TYPE_NAMES, ...productTypes])];
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isDirty && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>You have unsaved changes. Do not forget to save before leaving.</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Product Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={errors.name && touched.name ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
          />
          {errors.name && touched.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="productType" className="text-sm font-medium text-gray-900">
              Product Type
            </label>
            <select
              id="productType"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value, subType: '' })}
              className={INPUT_CLASSES}
            >
              <option value="">Select a type</option>
              {allProductTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="subType" className="text-sm font-medium text-gray-900">
              Sub Type
            </label>
            <select
              id="subType"
              value={formData.subType}
              onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
              disabled={!formData.productType}
              className={`${INPUT_CLASSES} disabled:bg-gray-100 disabled:cursor-not-allowed`}
            >
              <option value="">Select a subtype</option>
              {availableSubtypes.map((subtype) => (
                <option key={subtype} value={subtype}>{subtype}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="strain" className="text-sm font-medium text-gray-900">
                Strain
              </label>
              <Link 
                href="/grower/strains/add"
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                + Add Strain
              </Link>
            </div>
            <select
              id="strain"
              value={formData.strainId}
              onChange={(e) => setFormData({ ...formData, strainId: e.target.value, batchId: '' })}
              className={INPUT_CLASSES}
            >
              <option value="">Select a strain</option>
              {strains.map((strain) => (
                <option key={strain.id} value={strain.id}>{strain.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="batch" className="text-sm font-medium text-gray-900">
                Batch
              </label>
              <Link 
                href="/grower/batches/add"
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                + Add Batch
              </Link>
            </div>
            <select
              id="batch"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              disabled={!formData.strainId && filteredBatches.length === 0}
              className={`${INPUT_CLASSES} disabled:bg-gray-100 disabled:cursor-not-allowed`}
            >
              <option value="">Select a batch</option>
              {filteredBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} {batch.strain ? `(${batch.strain.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Pricing &amp; Inventory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-gray-900">
              Price ($) *
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              onBlur={() => handleBlur('price')}
              className={errors.price && touched.price ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
            />
            {errors.price && touched.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="unit" className="text-sm font-medium text-gray-900">
              Unit *
            </label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className={INPUT_CLASSES}
            >
              <option value="gram">Gram</option>
              <option value="eighth">1/8 Oz (3.5g)</option>
              <option value="quarter">1/4 Oz (7g)</option>
              <option value="half">1/2 Oz (14g)</option>
              <option value="ounce">Ounce (28g)</option>
              <option value="pound">Pound (448g)</option>
              <option value="unit">Unit</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="inventoryQty" className="text-sm font-medium text-gray-900">
              Inventory Quantity *
            </label>
            <input
              id="inventoryQty"
              type="number"
              min="0"
              value={formData.inventoryQty}
              onChange={(e) => handleChange('inventoryQty', e.target.value)}
              onBlur={() => handleBlur('inventoryQty')}
              className={errors.inventoryQty && touched.inventoryQty ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
            />
            {errors.inventoryQty && touched.inventoryQty && (
              <p className="text-sm text-red-600 mt-1">{errors.inventoryQty}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="sku" className="text-sm font-medium text-gray-900">
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              onBlur={() => handleBlur('sku')}
              placeholder="Enter product SKU"
              className={errors.sku && touched.sku ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
            />
            {errors.sku && touched.sku && (
              <p className="text-sm text-red-600 mt-1">{errors.sku}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            className={errors.description && touched.description 
              ? "block w-full rounded-md border border-red-500 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50" 
              : INPUT_CLASSES}
          />
          {errors.description && touched.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500 text-right">
            {formData.description.length}/2000 characters
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-gray-900">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            onBlur={() => handleBlur('brand')}
            className={errors.brand && touched.brand ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
          />
          {errors.brand && touched.brand && (
            <p className="text-sm text-red-600 mt-1">{errors.brand}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="ingredients" className="text-sm font-medium text-gray-900">
            Ingredients
          </label>
          <textarea
            id="ingredients"
            rows={3}
            value={formData.ingredients}
            onChange={(e) => handleChange('ingredients', e.target.value)}
            onBlur={() => handleBlur('ingredients')}
            placeholder="List ingredients..."
            className={errors.ingredients && touched.ingredients 
              ? "block w-full rounded-md border border-red-500 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50" 
              : INPUT_CLASSES}
          />
          {errors.ingredients && touched.ingredients && (
            <p className="text-sm text-red-600 mt-1">{errors.ingredients}</p>
          )}
          <p className="text-xs text-gray-500 text-right">
            {formData.ingredients.length}/1000 characters
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Status</h3>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <input
              id="isAvailable"
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => handleChange('isAvailable', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
              Product is available
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-900">
              Feature this product
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x border-gray-200-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={() => router.push('/grower/products')}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isSubmitting || (hasErrors && Object.keys(touched).length > 0)}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
