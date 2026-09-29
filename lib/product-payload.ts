import {
  canonicalizeProductType,
  getSubTypesForProductType,
} from '@/lib/product-types';
import {
  validateDocumentReference,
  validateProductImageList,
} from '@/lib/upload-validation';

export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ProductStatusValue =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

const UNIT_ALIASES: Record<string, string> = {
  gram: 'Gram',
  grams: 'Gram',
  g: 'Gram',
  'half ounce': 'Half Ounce',
  '1/2 ounce': 'Half Ounce',
  ounce: 'Ounce',
  oz: 'Ounce',
  eighth: 'Eighth',
  quarter: 'Quarter',
  unit: 'Unit',
  pack: 'Pack',
  each: 'Each',
  lb: 'Lb',
  pound: 'Lb',
  pounds: 'Lb',
  lbs: 'Lb',
  ounces: 'Ounce',
  units: 'Unit',
  packs: 'Pack',
  '1/8': 'Eighth',
  '3.5g': 'Eighth',
  '3.5 g': 'Eighth',
  '1/4': 'Quarter',
  '7g': 'Quarter',
};

export function normalizeUnit(unit?: unknown): string | null {
  if (typeof unit !== 'string') return null;
  const trimmed = unit.trim();
  if (!trimmed) return null;

  const alias = UNIT_ALIASES[trimmed.toLowerCase()];
  return alias || null;
}

export function normalizeSubtype(
  productType?: unknown,
  subType?: unknown
): string | null {
  if (typeof subType !== 'string') return null;
  const trimmedSubType = subType.trim();
  if (!trimmedSubType) return null;

  if (typeof productType !== 'string' || !productType.trim()) {
    return trimmedSubType;
  }

  const canonicalSubTypes = getSubTypesForProductType(productType.trim());
  if (!canonicalSubTypes.length) {
    return trimmedSubType;
  }

  const matched = canonicalSubTypes.find(
    (item) => item.toLowerCase() === trimmedSubType.toLowerCase()
  );

  return matched || trimmedSubType;
}

export function normalizeProductType(productType?: unknown): string | null {
  if (typeof productType !== 'string') return null;
  return canonicalizeProductType(productType);
}

export function normalizeOptionalString(value?: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

// Read the entire value. Never silently turn "100.5" into 100 or "1,200" into 1.
export function parseProductNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value
    .trim()
    .replace(/^\$\s*/, '')
    .replace(
      /\s*(?:%|lbs?|pounds?|grams?|g|oz|ounces?|units?|each|packs?)$/i,
      ''
    )
    .trim();
  if (
    !/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(cleaned) &&
    !/^[+-]?\.\d+$/.test(cleaned)
  )
    return null;
  const parsed = Number(cleaned.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
export function parsePrice(value: unknown): number | null {
  const parsed = parseProductNumber(value);
  return parsed !== null && parsed >= 0 && parsed <= 999999.99 ? parsed : null;
}
export function parseInventoryQty(value: unknown): number | null {
  const parsed = parseProductNumber(value);
  return parsed !== null &&
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= 999999
    ? parsed
    : null;
}

export type ProductPayloadParseOptions = {
  partial?: boolean;
  defaultStatus?: ProductStatusValue;
};

function parseCannabinoidRange(
  min: unknown,
  max: unknown
): { min: number | null; max: number | null } {
  const minVal =
    min === undefined || min === null || min === ''
      ? null
      : parseProductNumber(min);
  const maxVal =
    max === undefined || max === null || max === ''
      ? null
      : parseProductNumber(max);

  return {
    min:
      minVal !== null && !Number.isNaN(minVal) && minVal >= 0 && minVal <= 100
        ? minVal
        : null,
    max:
      maxVal !== null && !Number.isNaN(maxVal) && maxVal >= 0 && maxVal <= 100
        ? maxVal
        : null,
  };
}

function parseHarvestDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date > new Date()) return null;
  return value.trim();
}

export function parseProductPayload(
  body: Record<string, unknown>,
  options: ProductPayloadParseOptions = {}
) {
  const { partial = false, defaultStatus = PRODUCT_STATUS.PUBLISHED } = options;

  const requestedStatus = body.status;
  const status: ProductStatusValue =
    requestedStatus === PRODUCT_STATUS.DRAFT
      ? PRODUCT_STATUS.DRAFT
      : defaultStatus;
  const isDraft = status === PRODUCT_STATUS.DRAFT;

  const name = normalizeOptionalString(body.name);
  const productType = normalizeProductType(body.productType);
  const subType = normalizeSubtype(productType, body.subType);
  const unit = normalizeUnit(body.unit);
  const price = parsePrice(body.price);
  const inventoryQty = parseInventoryQty(body.inventoryQty);

  const errors: string[] = [];

  if (!partial || body.name !== undefined) {
    if (!name && !isDraft) errors.push('Product name is required.');
    if (name && name.length > 100)
      errors.push('Product name must be 100 characters or fewer.');
  }

  if (!partial || body.productType !== undefined) {
    if (!productType && !isDraft) errors.push('Product type is required.');
  }

  if (!partial || body.unit !== undefined) {
    if (
      !unit &&
      (!isDraft ||
        (body.unit !== undefined && body.unit !== null && body.unit !== ''))
    )
      errors.push('Choose a unit.');
  }

  if (!partial || body.price !== undefined) {
    if (
      price === null &&
      (!isDraft ||
        (body.price !== undefined && body.price !== null && body.price !== ''))
    )
      errors.push('Price must be a number like 45.00, from $0 to $999,999.99.');
  }

  if (!partial || body.inventoryQty !== undefined) {
    if (
      inventoryQty === null &&
      (!isDraft ||
        (body.inventoryQty !== undefined &&
          body.inventoryQty !== null &&
          body.inventoryQty !== ''))
    )
      errors.push(
        'Stock must be a whole number of units. For partial weights, choose a smaller unit (for example, 8 oz instead of 0.5 lb).'
      );
  }

  // Validate THC/CBD ranges if provided
  const thcMin = body.thcMin;
  const thcMax = body.thcMax;
  const cbdMin = body.cbdMin;
  const cbdMax = body.cbdMax;

  if (!partial || body.thcMin !== undefined || body.thcMax !== undefined) {
    const thcRange = parseCannabinoidRange(thcMin, thcMax);
    if (
      thcMin !== undefined &&
      thcMin !== null &&
      thcMin !== '' &&
      thcRange.min === null
    ) {
      errors.push('THC minimum must be from 0 to 100.');
    }
    if (
      thcMax !== undefined &&
      thcMax !== null &&
      thcMax !== '' &&
      thcRange.max === null
    ) {
      errors.push('THC maximum must be from 0 to 100.');
    }
    if (
      thcRange.min !== null &&
      thcRange.max !== null &&
      thcRange.min > thcRange.max
    ) {
      errors.push('THC maximum must be at least the minimum.');
    }
  }

  if (!partial || body.cbdMin !== undefined || body.cbdMax !== undefined) {
    const cbdRange = parseCannabinoidRange(cbdMin, cbdMax);
    if (
      cbdMin !== undefined &&
      cbdMin !== null &&
      cbdMin !== '' &&
      cbdRange.min === null
    ) {
      errors.push('CBD minimum must be from 0 to 100.');
    }
    if (
      cbdMax !== undefined &&
      cbdMax !== null &&
      cbdMax !== '' &&
      cbdRange.max === null
    ) {
      errors.push('CBD maximum must be from 0 to 100.');
    }
    if (
      cbdRange.min !== null &&
      cbdRange.max !== null &&
      cbdRange.min > cbdRange.max
    ) {
      errors.push('CBD maximum must be at least the minimum.');
    }
  }

  if (!partial || body.harvestDate !== undefined) {
    const harvestDate = parseHarvestDate(body.harvestDate);
    if (
      body.harvestDate !== undefined &&
      body.harvestDate !== null &&
      body.harvestDate !== '' &&
      harvestDate === null
    ) {
      errors.push('Harvest date must be today or earlier.');
    }
  }

  if (!partial || body.images !== undefined) {
    const imageValidation = validateProductImageList(body.images);
    if (!imageValidation.ok) errors.push(imageValidation.error);
  }

  if (!partial || body.ingredientsDocumentUrl !== undefined) {
    const documentValidation = validateDocumentReference(
      body.ingredientsDocumentUrl
    );
    if (!documentValidation.ok) errors.push(documentValidation.error);
  }

  if (errors.length) {
    return { ok: false as const, errors };
  }

  const normalizedIsAvailable =
    status === PRODUCT_STATUS.DRAFT
      ? false
      : inventoryQty !== null && inventoryQty <= 0
        ? false
        : typeof body.isAvailable === 'boolean'
          ? body.isAvailable
          : true;

  const normalizedIsPriceVisible =
    typeof body.isPriceVisible === 'boolean' ? body.isPriceVisible : true;

  const thcRange = parseCannabinoidRange(body.thcMin, body.thcMax);
  const cbdRange = parseCannabinoidRange(body.cbdMin, body.cbdMax);
  const harvestDate = parseHarvestDate(body.harvestDate);

  return {
    ok: true as const,
    data: {
      name,
      productType,
      subType,
      strainId: normalizeOptionalString(body.strainId),
      batchId: normalizeOptionalString(body.batchId),
      price,
      inventoryQty,
      unit,
      description: normalizeOptionalString(body.description),
      images: Array.isArray(body.images)
        ? body.images.filter((v) => typeof v === 'string')
        : undefined,
      isAvailable: normalizedIsAvailable,
      isPriceVisible: normalizedIsPriceVisible,
      sku: normalizeOptionalString(body.sku),
      brand: normalizeOptionalString(body.brand),
      ingredients: normalizeOptionalString(body.ingredients),
      ingredientsDocumentUrl: normalizeOptionalString(
        body.ingredientsDocumentUrl
      ),
      isFeatured:
        typeof body.isFeatured === 'boolean' ? body.isFeatured : false,
      thcMin: thcRange.min,
      thcMax: thcRange.max,
      cbdMin: cbdRange.min,
      cbdMax: cbdRange.max,
      harvestDate,
      status,
    },
  };
}

export function buildProductRequestPayload(
  formData: Record<string, unknown>,
  status: ProductStatusValue = PRODUCT_STATUS.PUBLISHED
) {
  const thcRange = parseCannabinoidRange(formData.thcMin, formData.thcMax);
  const cbdRange = parseCannabinoidRange(formData.cbdMin, formData.cbdMax);
  const harvestDate = parseHarvestDate(formData.harvestDate);

  return {
    name: normalizeOptionalString(formData.name),
    productType: normalizeProductType(formData.productType),
    subType: normalizeSubtype(formData.productType, formData.subType),
    strainId: normalizeOptionalString(formData.strainId),
    batchId: normalizeOptionalString(formData.batchId),
    price: parsePrice(formData.price),
    inventoryQty: parseInventoryQty(formData.inventoryQty),
    unit: normalizeUnit(formData.unit),
    description: normalizeOptionalString(formData.description),
    images: Array.isArray(formData.images) ? formData.images : [],
    isAvailable: Boolean(formData.isAvailable),
    isPriceVisible:
      typeof formData.isPriceVisible === 'boolean'
        ? formData.isPriceVisible
        : true,
    sku: normalizeOptionalString(formData.sku),
    brand: normalizeOptionalString(formData.brand),
    ingredients: normalizeOptionalString(formData.ingredients),
    isFeatured: Boolean(formData.isFeatured),
    thcMin: thcRange.min,
    thcMax: thcRange.max,
    cbdMin: cbdRange.min,
    cbdMax: cbdRange.max,
    harvestDate,
    status,
  };
}
