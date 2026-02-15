'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { ProductTypeSelector } from '../../components/ProductTypeSelector';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { StrainSelector } from '../../components/StrainSelector';
import { BatchSelector } from '../../components/BatchSelector';
import { useToast } from '@/app/hooks/useToast';

interface ProductFormData {
  id?: string;
  name: string;
  productType: string;
  subType: string;
  strainId: string;
  batchId: string;
  price: string;
  inventoryQty: string;
  unit: string;
  description: string;
  isAvailable: boolean;
  images: string[];
  sku: string;
  brand: string;
  ingredients: string;
  isFeatured: boolean;
}

interface FieldErrors {
  name?: string;
  price?: string;
  inventoryQty?: string;
  productType?: string;
  unit?: string;
  sku?: string;
  description?: string;
}

const UNITS = ['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack', 'Each', 'Lb'];

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

const validateProductType = (type: string): string | undefined => {
  if (!type) return 'Product type is required';
  return undefined;
};

const validateUnit = (unit: string): string | undefined => {
  if (!unit) return 'Unit is required';
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

const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const INPUT_ERROR_CLASSES = "w-full h-10 px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";

interface ProductFormProps {
  growerBrand?: string;
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  growerBrand,
  isSubmitting = false 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    id: initialData.id,
    name: initialData.name || '',
    productType: initialData.productType || '',
    subType: initialData.subType || '',
    strainId: initialData.strainId || '',
    batchId: initialData.batchId || '',
    price: initialData.price || '',
    inventoryQty: initialData.inventoryQty || '0',
    unit: initialData.unit || 'Gram',
    description: initialData.description || '',
    isAvailable: initialData.isAvailable !== undefined ? initialData.isAvailable : true,
    images: initialData.images || [],
    sku: initialData.sku || '',
    brand: initialData.brand || '',
    ingredients: initialData.ingredients || '',
    isFeatured: initialData.isFeatured || false,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData.images || []);
  const { showToast } = useToast();

  const initialDataState = {
    id: initialData?.id,
    name: initialData?.name || '',
    productType: initialData?.productType || '',
    subType: initialData?.subType || '',
    strainId: initialData?.strainId || '',
    batchId: initialData?.batchId || '',
    price: initialData?.price || '',
    inventoryQty: initialData?.inventoryQty || '0',
    unit: initialData?.unit || 'Gram',
    description: initialData?.description || '',
    isAvailable: initialData?.isAvailable !== undefined ? initialData.isAvailable : true,
    images: initialData?.images || [],
    sku: initialData?.sku || '',
    brand: initialData?.brand || '',
    ingredients: initialData?.ingredients || '',
    isFeatured: initialData?.isFeatured || false,
  };

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: true,
    message: 'You have unsaved changes in this product. Are you sure you want to leave?',
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataState);
    setIsDirty(hasChanges);
  }, [formData, setIsDirty]);

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {
      name: validateName(formData.name),
      price: validatePrice(formData.price),
      inventoryQty: validateInventoryQty(formData.inventoryQty),
      productType: validateProductType(formData.productType),
      unit: validateUnit(formData.unit),
      sku: validateSku(formData.sku),
      description: validateDescription(formData.description),
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
      case 'productType': return validateProductType(value);
      case 'unit': return validateUnit(value);
      case 'sku': return validateSku(value);
      case 'description': return validateDescription(value);
      default: return undefined;
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    if (field === 'strainId') {
      setFormData(prev => ({ ...prev, strainId: String(value), batchId: '' }));
    } else if (typeof value === 'boolean') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (touched[field as string] && typeof value === 'string') {
      const error = validateField(field as keyof FieldErrors, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field] as string;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPreviews: string[] = [];
      
      const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        showToast('error', 'Some images exceed 5MB limit and were skipped');
      }
      
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          newPreviews.push(result);
          if (newPreviews.length === validFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
            showToast('success', `Added ${validFiles.length} image(s)`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    showToast('info', 'Image has been removed from the product');
  };

  const getBase64Images = () => {
    return imagePreviews.map(preview => {
      if (preview.startsWith('data:image/')) {
        return preview;
      }
      return preview;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    
    onSubmit({
      ...formData,
      images: getBase64Images(),
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {initialData.id ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {initialData.id ? 'Update your product details' : 'List a new cannabis product for your inventory'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={errors.name && touched.name ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                placeholder="e.g., Blueberries NF - 3.5g Jar"
              />
              {errors.name && touched.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <ProductTypeSelector
                productType={formData.productType}
                subType={formData.subType}
                onProductTypeChange={(type) => {
                  handleChange('productType', type);
                  if (touched.productType) {
                    const error = validateProductType(type);
                    setErrors(prev => ({ ...prev, productType: error }));
                  }
                }}
                onSubTypeChange={(subType) => handleChange('subType', subType)}
              />
              {errors.productType && touched.productType && (
                <p className="text-sm text-red-600 mt-1">{errors.productType}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Strain
              </label>
              <StrainSelector
                strainId={formData.strainId}
                onStrainChange={(id) => handleChange('strainId', id || '')}
              />
              <p className="text-xs text-gray-500">Link to a strain for better inventory tracking</p>
            </div>

            {formData.strainId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Batch
                </label>
                <BatchSelector
                  strainId={formData.strainId}
                  batchId={formData.batchId}
                  onBatchChange={(id) => handleChange('batchId', id || '')}
                />
                <p className="text-xs text-gray-500">Link to a harvest batch for lab results</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($) *
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  onBlur={() => handleBlur('price')}
                  className={errors.price && touched.price ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="e.g., 45.00"
                />
                {errors.price && touched.price && (
                  <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit *
                </label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => {
                    handleChange('unit', e.target.value);
                    if (touched.unit) {
                      const error = validateUnit(e.target.value);
                      setErrors(prev => ({ ...prev, unit: error }));
                    }
                  }}
                  onBlur={() => handleBlur('unit')}
                  className={errors.unit && touched.unit ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                >
                  <option value="">Select a unit</option>
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unit && touched.unit && (
                  <p className="text-sm text-red-600 mt-1">{errors.unit}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="inventoryQty" className="block text-sm font-medium text-gray-700">
                Initial Inventory Quantity *
              </label>
              <input
                id="inventoryQty"
                type="number"
                min="0"
                value={formData.inventoryQty}
                onChange={(e) => handleChange('inventoryQty', e.target.value)}
                onBlur={() => handleBlur('inventoryQty')}
                className={errors.inventoryQty && touched.inventoryQty ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                placeholder="e.g., 100"
              />
              {errors.inventoryQty && touched.inventoryQty && (
                <p className="text-sm text-red-600 mt-1">{errors.inventoryQty}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  id="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  onBlur={() => handleBlur('sku')}
                  className={errors.sku && touched.sku ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                  placeholder="e.g., BERRY-3.5G"
                />
                {errors.sku && touched.sku && (
                  <p className="text-sm text-red-600 mt-1">{errors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="e.g., Your Business Name"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <label className="text-sm font-medium text-gray-700">Availability Status</label>
                <p className="text-sm text-gray-600">Make product available for purchase</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('isAvailable', !formData.isAvailable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isAvailable ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={errors.description && touched.description 
                  ? "w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50" 
                  : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"}
                placeholder="Describe the product, effects, aroma, etc."
              />
              {errors.description && touched.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 text-right">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Images
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    cursor-pointer"
                />
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting || (hasErrors && Object.keys(touched).length > 0)}
              >
                {isSubmitting ? 'Saving...' : (initialData.id ? 'Update Product' : 'Create Product')}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
