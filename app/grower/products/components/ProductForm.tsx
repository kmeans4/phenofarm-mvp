'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  prepareImageUpload,
  uploadFile,
} from '@/app/components/uploads/uploadFile';
import Link from 'next/link';
import { getTodayDateInputValue } from '@/lib/batch-utils';
import {
  canonicalizeProductType,
  defaultUnitForProductType,
} from '@/lib/product-types';
import {
  normalizeUnit,
  parsePrice,
  parseInventoryQty,
  parseProductNumber,
} from '@/lib/product-payload';
import { formatProductUnit, productUnitOptions } from '@/lib/product-display';
import { Button } from '@/app/components/ui/Button';
import { ProductTypeSelector } from '../../components/ProductTypeSelector';
import { useUnsavedChanges } from '@/app/hooks/useUnsavedChanges';
import { StrainSelector } from '../../components/StrainSelector';
import { BatchSelector } from '../../components/BatchSelector';
import { useToast } from '@/app/hooks/useToast';
import { SaveShortcutHint } from '@/app/components/ux/SaveShortcutHint';
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts';
import { StickyMobileActionBar } from '@/app/components/ux/StickyMobileActionBar';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import {
  DEFAULT_PRODUCT_DEFAULTS,
  PRODUCT_DEFAULTS_STORAGE_KEY,
  ProductDefaults,
} from '@/lib/ux-workflow';
import {
  FILE_UPLOAD_LIMITS,
  IMAGE_MIME_TYPES,
  formatBytes,
  validateProductImageFile,
} from '@/lib/upload-validation';

export interface ProductFormData {
  id?: string;
  status?: 'DRAFT' | 'PUBLISHED';
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
  strainId?: string;
  batchId?: string;
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
  images?: string;
}

const FIELD_FOCUS_ORDER: (keyof FieldErrors)[] = [
  'name',
  'productType',
  'strainId',
  'batchId',
  'price',
  'unit',
  'inventoryQty',
  'sku',
  'thcMin',
  'thcMax',
  'cbdMin',
  'cbdMax',
  'harvestDate',
  'description',
  'images',
];
const SUBMIT_ERROR_ID = 'product-form-submit-error';

const ERROR_FIELD_MATCHERS: Array<[keyof FieldErrors, RegExp]> = [
  ['name', /name/i],
  ['productType', /product\s*type|productType/i],
  ['strainId', /strain/i],
  ['batchId', /batch/i],
  ['price', /price/i],
  ['inventoryQty', /inventory|quantity|inventoryQty|stock/i],
  ['unit', /unit/i],
  ['sku', /sku/i],
  ['thcMin', /thcMin|thc min/i],
  ['thcMax', /thcMax|thc max/i],
  ['cbdMin', /cbdMin|cbd min/i],
  ['cbdMax', /cbdMax|cbd max/i],
  ['harvestDate', /harvest/i],
  ['images', /image/i],
  ['description', /description/i],
];

// Validation functions
const validateName = (name: string): string | undefined => {
  if (!name.trim()) return 'Product name is required';
  if (name.trim().length < 2)
    return 'Product name must be at least 2 characters';
  if (name.trim().length > 100)
    return 'Product name must be less than 100 characters';
  return undefined;
};

const validatePrice = (price: string): string | undefined => {
  if (!price) return 'Price is required';
  const numPrice = parsePrice(price);
  if (numPrice === null) return 'Please enter a valid number';
  if (numPrice < 0) return 'Price cannot be negative';
  if (numPrice > 999999.99) return 'Price exceeds maximum allowed';
  return undefined;
};

const validateInventoryQty = (qty: string): string | undefined => {
  if (!qty) return 'Inventory quantity is required';
  const numQty = parseInventoryQty(qty);
  if (numQty === null)
    return 'Stock counts whole units. Use 8 oz instead of 0.5 lb, for example.';
  if (numQty < 0) return 'Quantity cannot be negative';
  if (numQty > 999999) return 'Quantity exceeds maximum allowed';
  return undefined;
};

const validateProductType = (type: string): string | undefined => {
  if (!type) return 'Product type is required';
  return undefined;
};

const validateUnit = (unit: string): string | undefined => {
  if (!normalizeUnit(unit)) return 'Choose a supported unit.';
  return undefined;
};

const validateSku = (sku: string): string | undefined => {
  if (!sku) return undefined;
  if (sku.length > 50) return 'SKU must be less than 50 characters';
  if (!/^[a-zA-Z0-9-_]+$/.test(sku))
    return 'SKU can only contain letters, numbers, hyphens, and underscores';
  return undefined;
};

const validateDescription = (desc: string): string | undefined => {
  if (!desc) return undefined;
  if (desc.length > 2000)
    return 'Description must be less than 2000 characters';
  return undefined;
};

const validateThcRange = (
  min: string,
  max: string
): { minError?: string; maxError?: string } => {
  const errors: { minError?: string; maxError?: string } = {};
  const minNum = parseProductNumber(min);
  const maxNum = parseProductNumber(max);

  if (min && (minNum === null || minNum < 0 || minNum > 100)) {
    errors.minError = 'Enter a minimum THC percentage from 0 to 100.';
  }
  if (max && (maxNum === null || maxNum < 0 || maxNum > 100)) {
    errors.maxError = 'Enter a maximum THC percentage from 0 to 100.';
  }
  if (min && max && minNum !== null && maxNum !== null && minNum > maxNum) {
    errors.maxError = 'Maximum THC must be at least the minimum.';
  }
  return errors;
};

const validateCbdRange = (
  min: string,
  max: string
): { minError?: string; maxError?: string } => {
  const errors: { minError?: string; maxError?: string } = {};
  const minNum = parseProductNumber(min);
  const maxNum = parseProductNumber(max);

  if (min && (minNum === null || minNum < 0 || minNum > 100)) {
    errors.minError = 'Enter a minimum CBD percentage from 0 to 100.';
  }
  if (max && (maxNum === null || maxNum < 0 || maxNum > 100)) {
    errors.maxError = 'Enter a maximum CBD percentage from 0 to 100.';
  }
  if (min && max && minNum !== null && maxNum !== null && minNum > maxNum) {
    errors.maxError = 'Maximum CBD must be at least the minimum.';
  }
  return errors;
};

const validateHarvestDate = (date: string): string | undefined => {
  if (!date) return undefined;
  const harvestDate = new Date(date);
  const now = new Date();
  if (isNaN(harvestDate.getTime())) return 'Enter a valid date.';
  if (harvestDate > now) return 'Harvest date cannot be in the future';
  return undefined;
};

const validateImages = (images: string[]): string | undefined => {
  if (images.length > FILE_UPLOAD_LIMITS.productImagesMaxCount) {
    return `Use at most ${FILE_UPLOAD_LIMITS.productImagesMaxCount} product images. Remove ${images.length - FILE_UPLOAD_LIMITS.productImagesMaxCount} before saving.`;
  }
  return undefined;
};

const INPUT_CLASSES =
  'min-w-0 w-full h-11 px-3 py-2 text-base sm:px-4 border border-pf-line-strong rounded-lg focus:ring-2 focus:ring-pf-accent focus:border-transparent';
const INPUT_ERROR_CLASSES =
  'min-w-0 w-full h-11 px-3 py-2 text-base sm:px-4 border border-pf-danger rounded-lg focus:ring-2 focus:ring-pf-danger focus:border-transparent bg-pf-danger-bg';

interface ProductFormProps {
  growerBrand?: string;
  draftKey?: string;
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData, addAnother?: boolean) => Promise<void>;
  allowAddAnother?: boolean;
  onSaveDraft?: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  initialData = {},
  draftKey = 'new',
  onSubmit,
  onSaveDraft,
  allowAddAnother = false,
  onCancel,
  growerBrand,
  isSubmitting = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    id: initialData.id,
    name: initialData.name || '',
    productType: canonicalizeProductType(initialData.productType) || '',
    subType: initialData.subType || '',
    strainId: initialData.strainId || '',
    batchId: initialData.batchId || '',
    price: initialData.price || '',
    inventoryQty: initialData.inventoryQty || '',
    unit:
      normalizeUnit(initialData.unit) ||
      defaultUnitForProductType(initialData.productType || 'Flower'),
    description: initialData.description || '',
    isAvailable:
      initialData.isAvailable !== undefined ? initialData.isAvailable : true,
    isPriceVisible:
      initialData.isPriceVisible !== undefined
        ? initialData.isPriceVisible
        : true,
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

  useEffect(() => {
    if (initialData.id || !initialData.batchId) return;
    const controller = new AbortController();
    fetch(`/api/batches/${encodeURIComponent(initialData.batchId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load selected batch.');
        return response.json();
      })
      .then((batch) => {
        if (!controller.signal.aborted)
          setFormData((prev) => ({
            ...prev,
            strainId: batch.strainId,
            thcMin: batch.thc == null ? '' : String(batch.thc),
            thcMax: batch.thc == null ? '' : String(batch.thc),
            cbdMin: batch.cbd == null ? '' : String(batch.cbd),
            cbdMax: batch.cbd == null ? '' : String(batch.cbd),
            harvestDate: String(batch.harvestDate).slice(0, 10),
          }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [initialData.id, initialData.batchId]);

  const [addAnother, setAddAnother] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData.images || []
  );
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const uploadRef = useRef(false);
  const { data: session } = useSession();
  const defaultsKey = session?.user?.id
    ? `${PRODUCT_DEFAULTS_STORAGE_KEY}:${session.user.id}`
    : null;
  const { showToast } = useToast();

  const initialDataState = useMemo<DirtyBaseline>(
    () => ({
      id: initialData?.id ?? undefined,
      name: initialData?.name || '',
      productType: canonicalizeProductType(initialData?.productType) || '',
      subType: initialData?.subType || '',
      strainId: initialData?.strainId || '',
      batchId: initialData?.batchId || '',
      price: initialData?.price || '',
      inventoryQty: initialData?.inventoryQty || '',
      unit:
        normalizeUnit(initialData?.unit) ||
        defaultUnitForProductType(initialData?.productType || 'Flower'),
      description: initialData?.description || '',
      isAvailable:
        initialData?.isAvailable !== undefined ? initialData.isAvailable : true,
      isPriceVisible:
        initialData?.isPriceVisible !== undefined
          ? initialData.isPriceVisible
          : true,
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
    }),
    [growerBrand, initialData]
  );

  const [dirtyBaseline, setDirtyBaseline] =
    useState<DirtyBaseline>(initialDataState);

  const { isDirty, setIsDirty, resetDirtyState, confirmNavigation } =
    useUnsavedChanges({
      enabled: true,
      message:
        'You have unsaved changes in this product. Are you sure you want to leave?',
    });

  const draftValue = useMemo(() => ({ ...formData, images: [] }), [formData]);
  const browserDraft = useLocalDraft<ProductFormData>({
    key: initialData.id
      ? `phenofarm:draft:product:${initialData.id}`
      : `phenofarm:draft:product:${draftKey}`,
    value: draftValue,
    autoRestore: false,
    onRestore: (value) => {
      if (!value || typeof value !== 'object') return;
      setFormData((prev) => ({
        ...prev,
        ...value,
        unit: normalizeUnit(value.unit) || prev.unit,
        id: prev.id,
        images: prev.images,
      }));
    },
    shouldSave: () => isDirty,
  });

  useEffect(() => {
    const hasChanges =
      JSON.stringify({ ...formData, images: imagePreviews }) !==
      JSON.stringify(dirtyBaseline);
    setIsDirty(hasChanges);
  }, [formData, imagePreviews, dirtyBaseline, setIsDirty]);

  const collectFormErrors = (): FieldErrors => {
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
      images: validateImages(imagePreviews),
    };

    Object.keys(newErrors).forEach((key) => {
      if (newErrors[key as keyof FieldErrors] === undefined) {
        delete newErrors[key as keyof FieldErrors];
      }
    });

    return newErrors;
  };

  const validateForm = (): FieldErrors => {
    const newErrors = collectFormErrors();
    setErrors(newErrors);
    return newErrors;
  };

  const focusElementById = (id: string) => {
    if (typeof window === 'undefined') return;

    window.setTimeout(() => {
      const element = document.getElementById(id) as HTMLElement | null;
      if (!element) return;
      const details = element.closest('details');
      if (details) details.open = true;
      element.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'center',
      });
      window.setTimeout(() => element.focus({ preventScroll: true }), 220);
    }, 0);
  };

  const focusFirstInvalidField = (fieldErrors: FieldErrors) => {
    const firstInvalid = FIELD_FOCUS_ORDER.find((field) =>
      Boolean(fieldErrors[field])
    );
    if (!firstInvalid) return;
    focusElementById(
      firstInvalid === 'images' ? 'productImages' : firstInvalid
    );
  };

  const getSubmitErrorField = (message: string): keyof FieldErrors | null => {
    const match = ERROR_FIELD_MATCHERS.find(([, pattern]) =>
      pattern.test(message)
    );
    return match?.[0] || null;
  };

  const validateField = (
    field: keyof FieldErrors,
    value: string
  ): string | undefined => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'price':
        return validatePrice(value);
      case 'inventoryQty':
        return validateInventoryQty(value);
      case 'productType':
        return validateProductType(value);
      case 'unit':
        return validateUnit(value);
      case 'sku':
        return validateSku(value);
      case 'description':
        return validateDescription(value);
      case 'thcMin':
        return validateThcRange(value, formData.thcMax).minError;
      case 'thcMax':
        return validateThcRange(formData.thcMin, value).maxError;
      case 'cbdMin':
        return validateCbdRange(value, formData.cbdMax).minError;
      case 'cbdMax':
        return validateCbdRange(formData.cbdMin, value).maxError;
      case 'harvestDate':
        return validateHarvestDate(value);
      default:
        return undefined;
    }
  };

  const handleChange = (
    field: keyof ProductFormData,
    value: string | boolean
  ) => {
    setSubmitError(null);

    if (field === 'productType') {
      let unit = defaultUnitForProductType(String(value));
      try {
        if (defaultsKey)
          unit =
            normalizeUnit(
              window.localStorage.getItem(`${defaultsKey}:unit:${value}`)
            ) || unit;
      } catch {}
      setFormData((prev) => ({ ...prev, productType: String(value), unit }));
    } else if (field === 'strainId') {
      setFormData((prev) => ({
        ...prev,
        strainId: String(value),
        batchId: '',
      }));
    } else if (typeof value === 'boolean') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (touched[field as string] && typeof value === 'string') {
      const error = validateField(field as keyof FieldErrors, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const persistProductDefaults = (source: ProductFormData) => {
    const nextDefaults: ProductDefaults = {
      productType: source.productType || DEFAULT_PRODUCT_DEFAULTS.productType,
      unit: normalizeUnit(source.unit) || DEFAULT_PRODUCT_DEFAULTS.unit,
      price: source.price || '',
      isPriceVisible: source.isPriceVisible,
    };

    try {
      if (defaultsKey) {
        window.localStorage.setItem(defaultsKey, JSON.stringify(nextDefaults));
        window.localStorage.setItem(
          `${defaultsKey}:unit:${source.productType}`,
          nextDefaults.unit
        );
      }
    } catch {
      /* Saving the product still succeeds if browser storage is full. */
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field] as string;
    if (
      [
        'price',
        'inventoryQty',
        'thcMin',
        'thcMax',
        'cbdMin',
        'cbdMax',
      ].includes(field)
    ) {
      const parsed = parseProductNumber(value);
      if (parsed !== null)
        setFormData((prev) => ({ ...prev, [field]: String(parsed) }));
    }
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length || uploadRef.current) return;
    if (
      files.length + imagePreviews.length >
      FILE_UPLOAD_LIMITS.productImagesMaxCount
    ) {
      showToast(
        'error',
        `Use at most ${FILE_UPLOAD_LIMITS.productImagesMaxCount} images.`
      );
      return;
    }
    uploadRef.current = true;
    setImageUploadProgress(0);
    setSubmitError(null);
    try {
      const urls: string[] = [];
      // Upload separately so each request stays below the platform body limit.
      for (const file of files) {
        const prepared = await prepareImageUpload(
          file,
          FILE_UPLOAD_LIMITS.productImageMaxBytes
        );
        const validation = validateProductImageFile(prepared);
        if (!validation.ok) throw new Error(validation.error);
        urls.push(await uploadFile(prepared, 'image'));
        setImageUploadProgress(Math.round((urls.length / files.length) * 100));
      }
      setImagePreviews((prev) => [...prev, ...urls]);
      setErrors((prev) => ({ ...prev, images: undefined }));
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Could not upload the images.'
      );
    } finally {
      uploadRef.current = false;
      setImageUploadProgress(null);
    }
  };

  const removeImage = (index: number) => {
    setSubmitError(null);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, images: undefined }));
    showToast('info', 'Image has been removed from the product');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || submitRef.current || uploadRef.current) return;
    setSubmitError(null);

    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    allTouched.images = true;
    setTouched(allTouched);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast('error', 'Check the highlighted fields before saving.');
      focusFirstInvalidField(validationErrors);
      return;
    }

    submitRef.current = true;
    const wasDirty = isDirty;

    try {
      await onSubmit(
        {
          ...formData,
          images: imagePreviews,
        },
        addAnother
      );
      persistProductDefaults(formData);
      browserDraft.clearDraft();
      setDirtyBaseline({ ...formData, id: formData.id ?? undefined });
      resetDirtyState();
    } catch (err) {
      if (wasDirty) setIsDirty(true);
      const message =
        err instanceof Error ? err.message : 'Unable to save product';
      const submitErrorField = getSubmitErrorField(message);
      const localErrors = collectFormErrors();
      const serverMessages = (err as { errors?: string[] })?.errors || [];
      for (const text of serverMessages) {
        const field = getSubmitErrorField(text);
        if (field) localErrors[field] = text;
      }
      if (serverMessages.length)
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(localErrors).map((key) => [key, true])
          ),
        }));

      if (submitErrorField) {
        const nextErrors = { ...localErrors, [submitErrorField]: message };
        setErrors(nextErrors);
        setTouched((prev) => ({ ...prev, [submitErrorField]: true }));
        focusFirstInvalidField(nextErrors);
      } else if (Object.keys(localErrors).length > 0) {
        setErrors(localErrors);
        focusFirstInvalidField(localErrors);
      } else if (Object.keys(localErrors).length) {
        setErrors(localErrors);
        focusFirstInvalidField(localErrors);
      } else {
        setSubmitError(message);
        focusElementById(SUBMIT_ERROR_ID);
      }
      showToast('error', message);
    } finally {
      submitRef.current = false;
    }
  };

  const handleCancelRequest = async () => {
    if (await confirmNavigation()) {
      browserDraft.saveDraft();
      onCancel();
    }
  };

  // Keyboard shortcut: Ctrl+S or Cmd+S saves; Escape stays on the form.
  useKeyboardShortcuts({
    onSave: async () => {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    },
    isDirty,
    enabled: true,
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
    if (!onSaveDraft || isSubmitting || submitRef.current || uploadRef.current)
      return;
    const validationErrors = collectFormErrors();
    // Drafts may omit required fields, but supplied values must still be valid.
    for (const field of Object.keys(
      validationErrors
    ) as (keyof FieldErrors)[]) {
      if (
        field !== 'name' &&
        field !== 'images' &&
        !formData[field as keyof ProductFormData]
      )
        delete validationErrors[field];
    }
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setTouched(
        Object.fromEntries(
          Object.keys(validationErrors).map((field) => [field, true])
        )
      );
      focusFirstInvalidField(validationErrors);
      return;
    }
    submitRef.current = true;
    setSubmitError(null);
    const wasDirty = isDirty;

    try {
      await onSaveDraft({
        ...formData,
        images: imagePreviews,
      });
      persistProductDefaults(formData);
      browserDraft.clearDraft();
      showToast('success', 'Draft saved');
      setDirtyBaseline({ ...formData, id: formData.id ?? undefined });
      resetDirtyState();
    } catch (err) {
      if (wasDirty) setIsDirty(true);
      const message =
        err instanceof Error ? err.message : 'Unable to save draft';
      const submitErrorField = getSubmitErrorField(message);
      const localErrors = collectFormErrors();
      const serverMessages = (err as { errors?: string[] })?.errors || [];
      for (const text of serverMessages) {
        const field = getSubmitErrorField(text);
        if (field) localErrors[field] = text;
      }
      if (serverMessages.length)
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(localErrors).map((key) => [key, true])
          ),
        }));

      if (submitErrorField) {
        const nextErrors = { ...localErrors, [submitErrorField]: message };
        setErrors(nextErrors);
        setTouched((prev) => ({ ...prev, [submitErrorField]: true }));
        focusFirstInvalidField(nextErrors);
      } else if (Object.keys(localErrors).length) {
        setErrors(localErrors);
        focusFirstInvalidField(localErrors);
      } else {
        setSubmitError(message);
        focusElementById(SUBMIT_ERROR_ID);
      }
      showToast('error', message);
    } finally {
      submitRef.current = false;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {browserDraft.availableDraft && (
        <div className="mb-4 rounded-lg border border-pf-warning-line bg-pf-warning-bg p-4">
          <p className="text-sm text-pf-warning">
            You have unfinished product details saved on this device. Restore
            them to continue. Photos will need to be added again.
          </p>
          <div className="mt-3 flex gap-3">
            <Button type="button" onClick={browserDraft.restoreDraft}>
              Restore draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={browserDraft.clearDraft}
            >
              Discard draft
            </Button>
          </div>
        </div>
      )}
      {browserDraft.storageError && (
        <p role="status" className="mb-4 text-sm text-pf-warning">
          {browserDraft.storageError}
        </p>
      )}
      <form
        id="product-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(270px,1fr)] lg:items-start lg:gap-6 lg:space-y-0"
      >
        <div className="space-y-3 sm:space-y-6">
          {submitError && (
            <div
              id={SUBMIT_ERROR_ID}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-pf-danger-line bg-pf-danger-bg px-4 py-3 text-sm text-pf-danger focus:outline-none focus:ring-2 focus:ring-pf-danger"
            >
              {submitError}
              {/free plan|upgrade/i.test(submitError) ? (
                <>
                  {' '}
                  <Link
                    href="/grower/pricing"
                    className="font-semibold underline"
                  >
                    Compare plans
                  </Link>
                </>
              ) : null}
            </div>
          )}

          <section
            id="product-basics"
            className="scroll-mt-20 rounded-xl border border-pf-line bg-pf-surface p-3 shadow-sm space-y-3 sm:p-4 sm:space-y-4"
          >
            <h2 className="text-base font-semibold text-pf-text">Basics</h2>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-pf-secondary"
              >
                Name *
              </label>
              <input
                id="name"
                aria-invalid={Boolean(errors.name && touched.name)}
                aria-describedby={
                  errors.name && touched.name ? 'name-error' : undefined
                }
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={
                  errors.name && touched.name
                    ? INPUT_ERROR_CLASSES
                    : INPUT_CLASSES
                }
              />
              {errors.name && touched.name && (
                <p id="name-error" className="text-sm text-pf-danger mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <ProductTypeSelector
                productType={formData.productType}
                subType={formData.subType}
                onProductTypeChange={(type) => {
                  handleChange('productType', type);
                  if (touched.productType) {
                    const error = validateProductType(type);
                    setErrors((prev) => ({ ...prev, productType: error }));
                  }
                }}
                onSubTypeChange={(subType) => handleChange('subType', subType)}
              />
              {errors.productType && touched.productType && (
                <p
                  id="productType-error"
                  className="text-sm text-pf-danger mt-1"
                >
                  {errors.productType}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="strainId"
                className="block text-sm font-medium text-pf-secondary"
              >
                Strain
              </label>
              <StrainSelector
                strainId={formData.strainId}
                onStrainChange={(id) => handleChange('strainId', id || '')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="batchId" className="text-sm font-medium">
                Batch
              </label>
              <BatchSelector
                strainId={formData.strainId}
                batchId={formData.batchId}
                onBatchChange={(id, batch) => {
                  setFormData((prev) => ({
                    ...prev,
                    batchId: id || '',
                    ...(batch
                      ? {
                          strainId: batch.strainId,
                          thcMin: batch.thc == null ? '' : String(batch.thc),
                          thcMax: batch.thc == null ? '' : String(batch.thc),
                          cbdMin: batch.cbd == null ? '' : String(batch.cbd),
                          cbdMax: batch.cbd == null ? '' : String(batch.cbd),
                          harvestDate: batch.harvestDate.slice(0, 10),
                        }
                      : {}),
                  }));
                }}
              />
              {formData.batchId && (
                <p className="text-sm text-pf-muted">
                  THC, CBD and harvest date copied from batch. You can adjust
                  the product details below.
                </p>
              )}
            </div>
            <div
              id="productImages"
              tabIndex={-1}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (imageUploadProgress !== null) return;
                const input = document.getElementById(
                  'productImagesInput'
                ) as HTMLInputElement | null;
                if (input && event.dataTransfer.files.length) {
                  input.files = event.dataTransfer.files;
                  void handleImageChange({
                    currentTarget: input,
                  } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
              className="space-y-2 rounded-lg border-2 border-dashed border-pf-line-strong bg-pf-raised p-4 focus:outline-none focus:ring-2 focus:ring-pf-accent focus:ring-offset-2"
            >
              <label
                htmlFor="productImagesInput"
                className="block text-sm font-medium text-pf-secondary"
              >
                Product photos — drop files here
              </label>
              <p className="text-sm text-pf-muted">
                Up to {FILE_UPLOAD_LIMITS.productImagesMaxCount} photos · JPG,
                PNG, WebP ·{' '}
                {formatBytes(FILE_UPLOAD_LIMITS.productImageMaxBytes)} each
              </p>
              <div className="flex items-center gap-4">
                <input
                  id="productImagesInput"
                  type="file"
                  accept={IMAGE_MIME_TYPES.join(',')}
                  multiple
                  onChange={handleImageChange}
                  disabled={
                    imagePreviews.length >=
                      FILE_UPLOAD_LIMITS.productImagesMaxCount ||
                    imageUploadProgress !== null
                  }
                  className="block w-full text-base text-pf-muted sm:text-sm
                    file:mr-4 file:min-h-11 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-pf-accent-bg file:text-pf-accent
                    hover:file:bg-pf-accent-bg
                    cursor-pointer
                    disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {imageUploadProgress !== null && (
                <div className="rounded-lg border border-pf-accent-line bg-pf-accent-bg p-3">
                  <div className="flex items-center justify-between text-sm font-medium text-pf-accent">
                    <span>Preparing images</span>
                    <span>{imageUploadProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-pf-accent-bg">
                    <div
                      className="h-full rounded-full bg-pf-accent transition-all"
                      style={{ width: `${imageUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className="group rounded-xl border border-pf-line bg-pf-surface p-2 shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Upload previews also support legacy data URLs. */}
                      <img
                        src={preview}
                        alt={`Product image preview ${index + 1}`}
                        width={160}
                        height={120}
                        className="h-28 w-full rounded-lg border border-pf-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="mt-2 min-h-11 w-full rounded-lg border border-pf-danger-line px-3 py-2 text-sm font-semibold text-pf-danger hover:bg-pf-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.images && (
                <p className="text-sm text-pf-danger mt-1">{errors.images}</p>
              )}
            </div>
          </section>

          <section
            id="product-pricing"
            className="scroll-mt-20 rounded-xl border border-pf-line bg-pf-surface p-3 shadow-sm space-y-3 sm:p-4 sm:space-y-4"
          >
            <h2 className="text-base font-semibold text-pf-text">Pricing</h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  {formData.isPriceVisible
                    ? 'Price ($) *'
                    : 'Internal reference price ($) *'}
                </label>
                <input
                  id="price"
                  aria-invalid={Boolean(errors.price && touched.price)}
                  aria-describedby={
                    errors.price && touched.price ? 'price-error' : undefined
                  }
                  type="text"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  onBlur={() => handleBlur('price')}
                  className={
                    errors.price && touched.price
                      ? INPUT_ERROR_CLASSES
                      : INPUT_CLASSES
                  }
                />
                {!formData.isPriceVisible && (
                  <p className="text-sm text-pf-muted">
                    Used to calculate your stock value. Buyers see “Price on
                    request” instead of this amount.
                  </p>
                )}
                {errors.price && touched.price && (
                  <p id="price-error" className="text-sm text-pf-danger mt-1">
                    {errors.price}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  Unit *
                </label>
                <select
                  id="unit"
                  aria-invalid={Boolean(errors.unit && touched.unit)}
                  aria-describedby={
                    errors.unit && touched.unit ? 'unit-error' : undefined
                  }
                  value={formData.unit}
                  onChange={(e) => {
                    handleChange('unit', e.target.value);
                    if (touched.unit) {
                      const error = validateUnit(e.target.value);
                      setErrors((prev) => ({ ...prev, unit: error }));
                    }
                  }}
                  onBlur={() => handleBlur('unit')}
                  className={
                    errors.unit && touched.unit
                      ? INPUT_ERROR_CLASSES
                      : INPUT_CLASSES
                  }
                >
                  <option value="">Select a unit</option>
                  {productUnitOptions(formData.unit).map((unit) => (
                    <option key={unit} value={unit}>
                      {formatProductUnit(unit)}
                    </option>
                  ))}
                </select>
                {errors.unit && touched.unit && (
                  <p id="unit-error" className="text-sm text-pf-danger mt-1">
                    {errors.unit}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 border border-pf-line rounded-lg bg-pf-canvas space-y-2 sm:p-4 sm:space-y-3">
              <div>
                <h3 className="text-sm font-medium text-pf-secondary">
                  Price visibility
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={formData.isPriceVisible}
                  onClick={() => handleChange('isPriceVisible', true)}
                  className={`min-h-11 text-left px-3 py-2 rounded-lg border transition-colors ${
                    formData.isPriceVisible
                      ? 'border-pf-accent bg-pf-accent-bg text-pf-accent'
                      : 'border-pf-line-strong bg-pf-surface text-pf-secondary hover:bg-pf-hover'
                  }`}
                >
                  <span className="block text-sm font-medium">Show price</span>
                </button>
                <button
                  type="button"
                  aria-pressed={!formData.isPriceVisible}
                  onClick={() => handleChange('isPriceVisible', false)}
                  className={`min-h-11 text-left px-3 py-2 rounded-lg border transition-colors ${
                    !formData.isPriceVisible
                      ? 'border-pf-accent bg-pf-accent-bg text-pf-accent'
                      : 'border-pf-line-strong bg-pf-surface text-pf-secondary hover:bg-pf-hover'
                  }`}
                >
                  <span className="block text-sm font-medium">
                    Price on request
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section
            id="product-stock"
            className="scroll-mt-20 rounded-xl border border-pf-line bg-pf-surface p-3 shadow-sm space-y-3 sm:p-4 sm:space-y-4"
          >
            <h2 className="text-base font-semibold text-pf-text">Stock</h2>

            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="inventoryQty"
                className="block text-sm font-medium text-pf-secondary"
              >
                Stock *
              </label>
              <input
                id="inventoryQty"
                aria-invalid={Boolean(
                  errors.inventoryQty && touched.inventoryQty
                )}
                aria-describedby={
                  errors.inventoryQty && touched.inventoryQty
                    ? 'inventoryQty-error'
                    : undefined
                }
                type="text"
                inputMode="decimal"
                min="0"
                value={formData.inventoryQty}
                onChange={(e) => handleChange('inventoryQty', e.target.value)}
                onBlur={() => handleBlur('inventoryQty')}
                className={
                  errors.inventoryQty && touched.inventoryQty
                    ? INPUT_ERROR_CLASSES
                    : INPUT_CLASSES
                }
              />
              {errors.inventoryQty && touched.inventoryQty && (
                <p
                  id="inventoryQty-error"
                  className="text-sm text-pf-danger mt-1"
                >
                  {errors.inventoryQty}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  SKU
                </label>
                <input
                  id="sku"
                  aria-invalid={Boolean(errors.sku && touched.sku)}
                  aria-describedby={
                    errors.sku && touched.sku ? 'sku-error' : undefined
                  }
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  onBlur={() => handleBlur('sku')}
                  className={
                    errors.sku && touched.sku
                      ? INPUT_ERROR_CLASSES
                      : INPUT_CLASSES
                  }
                />
                {errors.sku && touched.sku && (
                  <p id="sku-error" className="text-sm text-pf-danger mt-1">
                    {errors.sku}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="brand"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="Business name"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-pf-line rounded-lg bg-pf-canvas">
              <div>
                <span
                  id="product-visibility-label"
                  className="text-sm font-medium text-pf-secondary"
                >
                  Visible to buyers
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange('isAvailable', !formData.isAvailable)
                }
                aria-labelledby="product-visibility-label"
                role="switch"
                aria-checked={formData.isAvailable}
                className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full transition-colors ${
                  formData.isAvailable ? 'bg-pf-accent' : 'bg-pf-raised'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full transition-transform ${
                    formData.isAvailable
                      ? 'translate-x-7 bg-pf-canvas'
                      : 'translate-x-1 bg-pf-text'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-pf-muted">
              Stock counts whole selling units. For partial pounds, choose oz or
              g and price that unit.{' '}
              {formData.inventoryQty === '0'
                ? 'Zero stock saves hidden from buyers.'
                : ''}
            </p>
          </section>

          <details
            id="product-details"
            open={shouldOpenAdvanced}
            className="group/details rounded-xl border border-pf-line bg-pf-canvas p-3 shadow-sm sm:p-4"
          >
            <summary className="min-h-11 cursor-pointer list-none py-2 sm:py-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-pf-text">
                    Details
                  </h2>
                </div>
                <span className="flex shrink-0 items-center gap-2 text-sm text-pf-muted">
                  <span className="rounded-full bg-pf-surface px-2 py-1 ring-1 ring-pf-line">
                    Optional
                  </span>
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-open/details:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </summary>
            <div className="mt-3 space-y-4 sm:mt-5 sm:space-y-6">
              <div className="p-3 border border-pf-line rounded-lg bg-pf-surface sm:p-4">
                <h3 className="text-sm font-medium text-pf-secondary mb-3">
                  Cannabinoids
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label
                      htmlFor="thcMin"
                      className="block text-sm font-medium text-pf-muted"
                    >
                      Minimum THC (%)
                    </label>
                    <input
                      id="thcMin"
                      aria-invalid={Boolean(errors.thcMin)}
                      type="text"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.thcMin}
                      onChange={(e) => handleChange('thcMin', e.target.value)}
                      onBlur={() => handleBlur('thcMin')}
                      className={
                        liveThcErrors.minError
                          ? INPUT_ERROR_CLASSES
                          : INPUT_CLASSES
                      }
                    />
                    {liveThcErrors.minError && (
                      <p className="text-sm text-pf-danger mt-1">
                        {liveThcErrors.minError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label
                      htmlFor="thcMax"
                      className="block text-sm font-medium text-pf-muted"
                    >
                      Maximum THC (%)
                    </label>
                    <input
                      id="thcMax"
                      aria-invalid={Boolean(errors.thcMax)}
                      type="text"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.thcMax}
                      onChange={(e) => handleChange('thcMax', e.target.value)}
                      onBlur={() => handleBlur('thcMax')}
                      className={
                        liveThcErrors.maxError
                          ? INPUT_ERROR_CLASSES
                          : INPUT_CLASSES
                      }
                    />
                    {liveThcErrors.maxError && (
                      <p className="text-sm text-pf-danger mt-1">
                        {liveThcErrors.maxError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label
                      htmlFor="cbdMin"
                      className="block text-sm font-medium text-pf-muted"
                    >
                      Minimum CBD (%)
                    </label>
                    <input
                      id="cbdMin"
                      aria-invalid={Boolean(errors.cbdMin)}
                      type="text"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.cbdMin}
                      onChange={(e) => handleChange('cbdMin', e.target.value)}
                      onBlur={() => handleBlur('cbdMin')}
                      className={
                        liveCbdErrors.minError
                          ? INPUT_ERROR_CLASSES
                          : INPUT_CLASSES
                      }
                    />
                    {liveCbdErrors.minError && (
                      <p className="text-sm text-pf-danger mt-1">
                        {liveCbdErrors.minError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label
                      htmlFor="cbdMax"
                      className="block text-sm font-medium text-pf-muted"
                    >
                      Maximum CBD (%)
                    </label>
                    <input
                      id="cbdMax"
                      aria-invalid={Boolean(errors.cbdMax)}
                      type="text"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.cbdMax}
                      onChange={(e) => handleChange('cbdMax', e.target.value)}
                      onBlur={() => handleBlur('cbdMax')}
                      className={
                        liveCbdErrors.maxError
                          ? INPUT_ERROR_CLASSES
                          : INPUT_CLASSES
                      }
                    />
                    {liveCbdErrors.maxError && (
                      <p className="text-sm text-pf-danger mt-1">
                        {liveCbdErrors.maxError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="harvestDate"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  Harvest date
                </label>
                <input
                  id="harvestDate"
                  aria-invalid={Boolean(
                    errors.harvestDate && touched.harvestDate
                  )}
                  aria-describedby={
                    errors.harvestDate && touched.harvestDate
                      ? 'harvestDate-error'
                      : undefined
                  }
                  type="date"
                  max={getTodayDateInputValue()}
                  value={formData.harvestDate}
                  onChange={(e) => handleChange('harvestDate', e.target.value)}
                  onBlur={() => handleBlur('harvestDate')}
                  className={
                    liveHarvestDateError ? INPUT_ERROR_CLASSES : INPUT_CLASSES
                  }
                />
                {errors.harvestDate && touched.harvestDate && (
                  <p
                    id="harvestDate-error"
                    className="text-sm text-pf-danger mt-1"
                  >
                    {errors.harvestDate}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-pf-secondary"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  aria-invalid={Boolean(
                    errors.description && touched.description
                  )}
                  aria-describedby={
                    errors.description && touched.description
                      ? 'description-error'
                      : undefined
                  }
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  className={
                    errors.description && touched.description
                      ? 'w-full px-4 py-2 border border-pf-danger rounded-lg focus:ring-2 focus:ring-pf-danger focus:border-transparent bg-pf-danger-bg'
                      : 'w-full px-4 py-2 border border-pf-line-strong rounded-lg focus:ring-2 focus:ring-pf-accent focus:border-transparent'
                  }
                  placeholder="Describe the product, effects, aroma, etc."
                />
                {errors.description && touched.description && (
                  <p
                    id="description-error"
                    className="text-sm text-pf-danger mt-1"
                  >
                    {errors.description}
                  </p>
                )}
                <p className="text-sm text-pf-muted text-right">
                  {formData.description.length}/2000 characters
                </p>
              </div>
            </div>
          </details>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {allowAddAnother && (
            <label className="mb-3 flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addAnother}
                onChange={(event) => setAddAnother(event.target.checked)}
              />
              Add another after publishing
            </label>
          )}
          {initialData.status === 'DRAFT' && (
            <p className="mb-3 text-sm text-pf-muted">
              This draft is hidden from buyers. Save it to finish later, or
              publish when you are ready.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <div className="hidden sm:block">
              <Button
                type="submit"
                variant="primary"
                className="hidden sm:inline-flex"
                disabled={imageUploadProgress !== null || isSubmitting}
              >
                {isSubmitting
                  ? 'Saving...'
                  : addAnother
                    ? 'Publish and add another'
                    : initialData.status === 'DRAFT'
                      ? 'Publish draft'
                      : initialData.id
                        ? 'Save changes'
                        : 'Publish product'}
              </Button>
            </div>
            <SaveShortcutHint />
            {onSaveDraft && (
              <div className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleSaveDraft}
                  disabled={imageUploadProgress !== null || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save draft'}
                </Button>
              </div>
            )}
            <div className="hidden sm:block">
              <Button
                type="button"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={handleCancelRequest}
                disabled={imageUploadProgress !== null || isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </aside>
      </form>

      <StickyMobileActionBar
        primaryLabel={
          isSubmitting
            ? 'Saving...'
            : addAnother
              ? 'Publish and add another'
              : initialData.status === 'DRAFT'
                ? 'Publish draft'
                : initialData.id
                  ? 'Save changes'
                  : 'Publish product'
        }
        primaryType="submit"
        form="product-form"
        disabled={imageUploadProgress !== null || isSubmitting}
        helperText={
          hasErrors ? 'Fix highlighted fields before saving.' : undefined
        }
        secondary={
          <button
            type="button"
            onClick={handleCancelRequest}
            className="rounded-lg border border-pf-line-strong px-4 py-3 text-sm font-semibold text-pf-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        }
      />
    </div>
  );
}
