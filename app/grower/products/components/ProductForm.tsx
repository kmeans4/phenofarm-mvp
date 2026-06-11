'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { ProductTypeSelector } from '../../components/ProductTypeSelector';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { StrainSelector } from '../../components/StrainSelector';
import { BatchSelector } from '../../components/BatchSelector';
import { useToast } from '@/app/hooks/useToast';
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import {
  DEFAULT_PRODUCT_DEFAULTS,
  PRODUCT_DEFAULTS_STORAGE_KEY,
  ProductDefaults,
} from '@/lib/ux-workflow';

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
  isPriceVisible: boolean;
  images: string[];
  sku: string;
  brand: string;
  ingredients: string;
  isFeatured: boolean;
  thcMin: string;
  thcMax: string;
  cbdMin: string;
  cbdMax: string;
  harvestDate: string;
}

type DirtyBaseline = Omit<ProductFormData, 'id'> & { id: string | undefined };

interface FieldErrors {
  name?: string;
  price?: string;
  inventoryQty?: string;
  productType?: string;
  unit?: string;
  sku?: string;
  description?: string;
  thcMin?: string;
  thcMax?: string;
  cbdMin?: string;
  cbdMax?: string;
  harvestDate?: string;
}

const UNITS = ['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack', 'Each', 'Lb'];
const FORM_STEPS = ['Basics', 'Pricing', 'Inventory', 'Profile', 'Images'];

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

const validateThcRange = (min: string, max: string): { minError?: string; maxError?: string } => {
  const errors: { minError?: string; maxError?: string } = {};
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  
  if (min && (isNaN(minNum) || minNum < 0 || minNum > 100)) {
    errors.minError = 'THC min must be 0-100';
  }
  if (max && (isNaN(maxNum) || maxNum < 0 || maxNum > 100)) {
    errors.maxError = 'THC max must be 0-100';
  }
  if (min && max && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
    errors.maxError = 'THC max must be >= min';
  }
  return errors;
};

const validateCbdRange = (min: string, max: string): { minError?: string; maxError?: string } => {
  const errors: { minError?: string; maxError?: string } = {};
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  
  if (min && (isNaN(minNum) || minNum < 0 || minNum > 100)) {
    errors.minError = 'CBD min must be 0-100';
  }
  if (max && (isNaN(maxNum) || maxNum < 0 || maxNum > 100)) {
    errors.maxError = 'CBD max must be 0-100';
  }
  if (min && max && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
    errors.maxError = 'CBD max must be >= min';
  }
  return errors;
};

const validateHarvestDate = (date: string): string | undefined => {
  if (!date) return undefined;
  const harvestDate = new Date(date);
  const now = new Date();
  if (isNaN(harvestDate.getTime())) return 'Invalid date format';
  if (harvestDate > now) return 'Harvest date cannot be in the future';
  return undefined;
};

const INPUT_CLASSES = "w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent";
const INPUT_ERROR_CLASSES = "w-full h-10 px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";

interface ProductFormProps {
  growerBrand?: string;
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onSaveDraft?: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ 
  initialData = {}, 
  onSubmit,
  onSaveDraft,
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
    isPriceVisible: initialData.isPriceVisible !== undefined ? initialData.isPriceVisible : true,
    images: initialData.images || [],
    sku: initialData.sku || '',
    brand: initialData.brand || growerBrand || '',
    ingredients: initialData.ingredients || '',
    isFeatured: initialData.isFeatured || false,
    thcMin: initialData.thcMin || '',
    thcMax: initialData.thcMax || '',
    cbdMin: initialData.cbdMin || '',
    cbdMax: initialData.cbdMax || '',
    harvestDate: initialData.harvestDate || '',
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData.images || []);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [savedDefaults, setSavedDefaults] = useState<ProductDefaults | null>(null);
  const { showToast } = useToast();

  const initialDataState = useMemo<DirtyBaseline>(() => ({
    id: initialData?.id ?? undefined,
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
    isPriceVisible: initialData?.isPriceVisible !== undefined ? initialData.isPriceVisible : true,
    images: initialData?.images || [],
    sku: initialData?.sku || '',
    brand: initialData?.brand || growerBrand || '',
    ingredients: initialData?.ingredients || '',
    isFeatured: initialData?.isFeatured || false,
    thcMin: initialData?.thcMin || '',
    thcMax: initialData?.thcMax || '',
    cbdMin: initialData?.cbdMin || '',
    cbdMax: initialData?.cbdMax || '',
    harvestDate: initialData?.harvestDate || '',
  }), [growerBrand, initialData]);

  const [dirtyBaseline, setDirtyBaseline] = useState<DirtyBaseline>(initialDataState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(PRODUCT_DEFAULTS_STORAGE_KEY) || 'null') as ProductDefaults | null;
        setSavedDefaults(parsed);
      } catch {
        setSavedDefaults(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const { isDirty, setIsDirty, resetDirtyState } = useUnsavedChanges({
    enabled: !!initialData.id,
    message: 'You have unsaved changes in this product. Are you sure you want to leave?',
  });

  const browserDraft = useLocalDraft<ProductFormData>({
    key: initialData.id ? `phenofarm:draft:product:${initialData.id}` : 'phenofarm:draft:product:new',
    value: { ...formData, images: imagePreviews },
    onRestore: (value) => {
      setFormData((prev) => ({
        ...prev,
        ...value,
        id: prev.id ?? value.id,
        images: value.images || [],
      }));
      setImagePreviews(value.images || []);
    },
    shouldSave: (value) => JSON.stringify(value) !== JSON.stringify(dirtyBaseline),
  });

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(dirtyBaseline);
    setIsDirty(hasChanges);
  }, [formData, dirtyBaseline, setIsDirty]);

  useEffect(() => {
    if (!initialData.id && typeof window !== 'undefined') {
      const hasDraft = JSON.stringify(formData) !== JSON.stringify(initialDataState);
      if (hasDraft) {
        window.sessionStorage.setItem('addProductDraft', JSON.stringify({ ...formData, images: imagePreviews }));
      } else {
        window.sessionStorage.removeItem('addProductDraft');
      }
    }
  }, [formData, imagePreviews, initialData.id, initialDataState]);

  useEffect(() => {
    if (initialData.id || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [initialData.id, isDirty]);

  const validateForm = (): boolean => {
    const thcErrors = validateThcRange(formData.thcMin, formData.thcMax);
    const cbdErrors = validateCbdRange(formData.cbdMin, formData.cbdMax);
    
    const newErrors: FieldErrors = {
      name: validateName(formData.name),
      price: validatePrice(formData.price),
      inventoryQty: validateInventoryQty(formData.inventoryQty),
      productType: validateProductType(formData.productType),
      unit: validateUnit(formData.unit),
      sku: validateSku(formData.sku),
      description: validateDescription(formData.description),
      thcMin: thcErrors.minError,
      thcMax: thcErrors.maxError,
      cbdMin: cbdErrors.minError,
      cbdMax: cbdErrors.maxError,
      harvestDate: validateHarvestDate(formData.harvestDate),
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
      case 'thcMin': return validateThcRange(value, formData.thcMax).minError;
      case 'thcMax': return validateThcRange(formData.thcMin, value).maxError;
      case 'cbdMin': return validateCbdRange(value, formData.cbdMax).minError;
      case 'cbdMax': return validateCbdRange(formData.cbdMin, value).maxError;
      case 'harvestDate': return validateHarvestDate(value);
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

  const persistProductDefaults = (source: ProductFormData) => {
    const nextDefaults: ProductDefaults = {
      productType: source.productType || DEFAULT_PRODUCT_DEFAULTS.productType,
      unit: source.unit || DEFAULT_PRODUCT_DEFAULTS.unit,
      price: source.price || '',
      isPriceVisible: source.isPriceVisible,
    };

    setSavedDefaults(nextDefaults);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PRODUCT_DEFAULTS_STORAGE_KEY, JSON.stringify(nextDefaults));
    }
  };

  const applyProductDefaults = (defaults: ProductDefaults) => {
    setFormData((prev) => ({
      ...prev,
      productType: defaults.productType || prev.productType,
      unit: defaults.unit || prev.unit,
      price: defaults.price || prev.price,
      isPriceVisible: defaults.isPriceVisible,
    }));
    showToast('info', 'Product defaults applied');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors below before saving');
      return;
    }
    
    const wasDirty = isDirty;
    setIsDirty(false);

    try {
      await onSubmit({
        ...formData,
        images: getBase64Images(),
      });
      persistProductDefaults(formData);
      browserDraft.clearDraft();
      if (!initialData.id && typeof window !== 'undefined') {
        window.sessionStorage.removeItem('addProductDraft');
      }
      setDirtyBaseline({ ...formData, id: formData.id ?? undefined });
      resetDirtyState();
    } catch {
      if (wasDirty) setIsDirty(true);
      // Parent handles user-facing submit errors.
    }
  };

  const handleLeavePage = () => {
    setShowExitPrompt(false);
    onCancel();
  };

  const handleSaveDraftAndExit = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('addProductDraft', JSON.stringify({ ...formData, images: imagePreviews }));
    }
    setShowExitPrompt(false);
    onCancel();
  };

  const handleCancelRequest = () => {
    if (!initialData.id && isDirty) {
      setShowExitPrompt(true);
      return;
    }
    onCancel();
  };

  // Keyboard shortcuts: Ctrl+S to save, Esc to cancel
  useKeyboardShortcuts({
    onSave: async () => {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    },
    onCancel: handleCancelRequest,
    isDirty,
    enabled: true
  });

  const hasErrors = Object.values(errors).some(Boolean);
  const liveThcErrors = validateThcRange(formData.thcMin, formData.thcMax);
  const liveCbdErrors = validateCbdRange(formData.cbdMin, formData.cbdMax);
  const liveHarvestDateError = validateHarvestDate(formData.harvestDate);
  const shouldOpenAdvanced = Boolean(
    initialData.id ||
    formData.thcMin ||
    formData.thcMax ||
    formData.cbdMin ||
    formData.cbdMax ||
    formData.harvestDate ||
    formData.description ||
    imagePreviews.length
  );

  const handleSaveDraft = async () => {
    if (!onSaveDraft || isSubmitting) return;
    const wasDirty = isDirty;
    setIsDirty(false);

    try {
      await onSaveDraft({
        ...formData,
        images: getBase64Images(),
      });
      persistProductDefaults(formData);
      browserDraft.clearDraft();
      showToast('success', 'Draft saved');
      setDirtyBaseline({ ...formData, id: formData.id ?? undefined });
      resetDirtyState();
    } catch {
      if (wasDirty) setIsDirty(true);
      // Parent handles errors
    }
  };

  const saveSummary = [
    { label: 'Listing', value: formData.name.trim() || 'Unnamed product' },
    { label: 'Type', value: formData.productType || 'Not selected' },
    { label: 'Price', value: formData.price ? `$${formData.price}/${formData.unit || 'unit'}` : 'Not priced' },
    { label: 'Inventory', value: `${formData.inventoryQty || '0'} ${formData.unit || 'units'}` },
    { label: 'Visibility', value: formData.isAvailable ? 'Available to buyers' : 'Hidden from buyers' },
    { label: 'Pricing display', value: formData.isPriceVisible ? 'Price visible' : 'Pricing by request' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Guided listing setup</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {FORM_STEPS.map((step, index) => (
                <div key={step} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-green-100">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-800">{step}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-green-800">
              Fill the core listing first. Optional profile, lab, and image details stay grouped so mobile setup stays easier to scan.
            </p>
          </div>

          <DraftAutosaveStatus
            savedAt={browserDraft.savedAt}
            label="Product browser draft"
            onClear={browserDraft.clearDraft}
          />

          {!initialData.id && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Smart defaults</p>
                  <p className="text-xs text-gray-600">Reuse your last product type, unit, price, and pricing visibility.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedDefaults && (
                    <button
                      type="button"
                      onClick={() => applyProductDefaults(savedDefaults)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Use previous listing
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => applyProductDefaults(DEFAULT_PRODUCT_DEFAULTS)}
                    className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50"
                  >
                    Use starter defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {initialData.id && isDirty && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>You have unsaved changes. Don&apos;t forget to save before leaving.</span>
            </div>
          )}

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 1</p>
                <h3 className="text-base font-semibold text-gray-900">Basics</h3>
                <p className="text-sm text-gray-500">Name the product and connect it to strain and batch context when available.</p>
              </div>

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
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 2</p>
                <h3 className="text-base font-semibold text-gray-900">Pricing</h3>
                <p className="text-sm text-gray-500">Set the buyer-facing unit price or require a pricing request.</p>
              </div>

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

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pricing Display</label>
                <p className="text-xs text-gray-500 mt-1">Choose whether dispensaries see your price or must request pricing via message.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('isPriceVisible', true)}
                  className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                    formData.isPriceVisible
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="block text-sm font-medium">Show Price</span>
                  <span className="block text-xs text-gray-500">Display public product price</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('isPriceVisible', false)}
                  className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                    !formData.isPriceVisible
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="block text-sm font-medium">Request Pricing</span>
                  <span className="block text-xs text-gray-500">Hide price and require inquiry</span>
                </button>
              </div>
            </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 3</p>
                <h3 className="text-base font-semibold text-gray-900">Inventory and status</h3>
                <p className="text-sm text-gray-500">Add the starting quantity and decide whether this listing is available now.</p>
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
                <p className="text-sm text-gray-600">Make product available for buyer requests</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('isAvailable', !formData.isAvailable)}
                aria-label={formData.isAvailable ? 'Mark product unavailable' : 'Mark product available'}
                aria-pressed={formData.isAvailable}
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
            </div>

            <details open={shouldOpenAdvanced} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps 4 and 5</p>
                    <h3 className="text-base font-semibold text-gray-900">Optional profile, compliance, and images</h3>
                    <p className="text-sm text-gray-500">Add cannabinoids, harvest details, descriptions, and product imagery when needed.</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">Optional</span>
                </div>
              </summary>
              <div className="mt-5 space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Cannabinoid Profile (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="thcMin" className="block text-xs font-medium text-gray-600">
                    THC Min (%)
                  </label>
                  <input
                    id="thcMin"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.thcMin}
                    onChange={(e) => handleChange('thcMin', e.target.value)}
                    onBlur={() => handleBlur('thcMin')}
                    className={liveThcErrors.minError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                    placeholder="e.g., 15"
                  />
                  {liveThcErrors.minError && (
                    <p className="text-xs text-red-600 mt-1">{liveThcErrors.minError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="thcMax" className="block text-xs font-medium text-gray-600">
                    THC Max (%)
                  </label>
                  <input
                    id="thcMax"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.thcMax}
                    onChange={(e) => handleChange('thcMax', e.target.value)}
                    onBlur={() => handleBlur('thcMax')}
                    className={liveThcErrors.maxError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                    placeholder="e.g., 25"
                  />
                  {liveThcErrors.maxError && (
                    <p className="text-xs text-red-600 mt-1">{liveThcErrors.maxError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="cbdMin" className="block text-xs font-medium text-gray-600">
                    CBD Min (%)
                  </label>
                  <input
                    id="cbdMin"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.cbdMin}
                    onChange={(e) => handleChange('cbdMin', e.target.value)}
                    onBlur={() => handleBlur('cbdMin')}
                    className={liveCbdErrors.minError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                    placeholder="e.g., 0"
                  />
                  {liveCbdErrors.minError && (
                    <p className="text-xs text-red-600 mt-1">{liveCbdErrors.minError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="cbdMax" className="block text-xs font-medium text-gray-600">
                    CBD Max (%)
                  </label>
                  <input
                    id="cbdMax"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.cbdMax}
                    onChange={(e) => handleChange('cbdMax', e.target.value)}
                    onBlur={() => handleBlur('cbdMax')}
                    className={liveCbdErrors.maxError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
                    placeholder="e.g., 1"
                  />
                  {liveCbdErrors.maxError && (
                    <p className="text-xs text-red-600 mt-1">{liveCbdErrors.maxError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700">
                Harvest Date
              </label>
              <input
                id="harvestDate"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={formData.harvestDate}
                onChange={(e) => handleChange('harvestDate', e.target.value)}
                onBlur={() => handleBlur('harvestDate')}
                className={liveHarvestDateError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
              />
              {errors.harvestDate && touched.harvestDate && (
                <p className="text-sm text-red-600 mt-1">{errors.harvestDate}</p>
              )}
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
                        width={80}
                        height={80}
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
              </div>
            </details>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Save summary</p>
                  <h3 className="text-base font-semibold text-gray-900">Review before saving</h3>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                  {formData.isAvailable ? 'Buyer visible' : 'Hidden'}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {saveSummary.map((item) => (
                  <div key={item.label} className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                    <p className="text-xs font-medium text-gray-500">{item.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={isSubmitting || (hasErrors && Object.keys(touched).length > 0)}
              >
                {isSubmitting ? 'Saving...' : (initialData.id ? 'Update Product' : 'Create Product')}
              </Button>
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCancelRequest}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showExitPrompt && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-product-dialog-title"
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 id="leave-product-dialog-title" className="text-lg font-semibold text-gray-900">Leave product creation?</h3>
              <p className="text-sm text-gray-600 mt-1">You have unsaved changes on this new product.</p>
            </div>
            <div className="p-6 space-y-3 text-sm text-gray-700">
              <p>Choose what you want to do:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong>Save draft & exit</strong> keeps your progress for this session.</li>
                <li><strong>Exit without saving</strong> clears this draft.</li>
                <li><strong>Continue editing</strong> stays on this page.</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-gray-200">
              <Button type="button" variant="primary" onClick={handleSaveDraftAndExit}>
                Save draft & exit
              </Button>
              <Button type="button" variant="destructive" onClick={() => {
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem('addProductDraft');
                }
                handleLeavePage();
              }}>
                Exit without saving
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowExitPrompt(false)}>
                Continue editing
              </Button>
            </div>
          </div>
        </div>
      )}

      <StickyMobileActionBar
        primaryLabel={isSubmitting ? 'Saving...' : initialData.id ? 'Save product' : 'Publish product'}
        primaryType="submit"
        form="product-form"
        disabled={isSubmitting || hasErrors}
        helperText={hasErrors ? 'Fix highlighted fields before saving.' : 'Product drafts save in this browser.'}
        secondary={
          <button
            type="button"
            onClick={handleCancelRequest}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
        }
      />
    </div>
  );
}
