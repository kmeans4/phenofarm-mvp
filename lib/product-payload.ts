import { getSubTypesForProductType } from '@/lib/product-types';

export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ProductStatusValue = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

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
};

export function normalizeUnit(unit?: unknown): string | null {
  if (typeof unit !== 'string') return null;
  const trimmed = unit.trim();
  if (!trimmed) return null;

  const alias = UNIT_ALIASES[trimmed.toLowerCase()];
  return alias || trimmed;
}

export function normalizeSubtype(productType?: unknown, subType?: unknown): string | null {
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
  const trimmed = productType.trim();
  return trimmed || null;
}

export function normalizeOptionalString(value?: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 999999.99) return null;
  return parsed;
}

export function parseInventoryQty(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 0 || parsed > 999999) return null;
  return parsed;
}

export type ProductPayloadParseOptions = {
  partial?: boolean;
  defaultStatus?: ProductStatusValue;
};

export function parseProductPayload(body: Record<string, unknown>, options: ProductPayloadParseOptions = {}) {
  const { partial = false, defaultStatus = PRODUCT_STATUS.PUBLISHED } = options;

  const requestedStatus = body.status;
  const status: ProductStatusValue = requestedStatus === PRODUCT_STATUS.DRAFT ? PRODUCT_STATUS.DRAFT : defaultStatus;
  const isDraft = status === PRODUCT_STATUS.DRAFT;

  const name = normalizeOptionalString(body.name);
  const productType = normalizeProductType(body.productType);
  const subType = normalizeSubtype(productType, body.subType);
  const unit = normalizeUnit(body.unit);
  const price = parsePrice(body.price);
  const inventoryQty = parseInventoryQty(body.inventoryQty);

  const errors: string[] = [];

  if (!partial || body.name !== undefined) {
    if (!name && !isDraft) errors.push('name is required');
    if (name && name.length > 100) errors.push('name must be <= 100 characters');
  }

  if (!partial || body.productType !== undefined) {
    if (!productType && !isDraft) errors.push('productType is required');
  }

  if (!partial || body.unit !== undefined) {
    if (!unit && !isDraft) errors.push('unit is required');
  }

  if (!partial || body.price !== undefined) {
    if (price === null && !isDraft) errors.push('price must be a valid non-negative number');
  }

  if (!partial || body.inventoryQty !== undefined) {
    if (inventoryQty === null && !isDraft) errors.push('inventoryQty must be a valid non-negative integer');
  }

  if (errors.length) {
    return { ok: false as const, errors };
  }

  const normalizedIsAvailable =
    status === PRODUCT_STATUS.DRAFT
      ? false
      : (inventoryQty !== null && inventoryQty <= 0)
        ? false
        : (typeof body.isAvailable === 'boolean' ? body.isAvailable : true);

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
      images: Array.isArray(body.images) ? body.images.filter((v) => typeof v === 'string') : undefined,
      isAvailable: normalizedIsAvailable,
      sku: normalizeOptionalString(body.sku),
      brand: normalizeOptionalString(body.brand),
      ingredients: normalizeOptionalString(body.ingredients),
      ingredientsDocumentUrl: normalizeOptionalString(body.ingredientsDocumentUrl),
      isFeatured: typeof body.isFeatured === 'boolean' ? body.isFeatured : false,
      strainLegacy: normalizeOptionalString(body.strainLegacy),
      categoryLegacy: normalizeOptionalString(body.categoryLegacy),
      subcategoryLegacy: normalizeOptionalString(body.subcategoryLegacy),
      thcLegacy: body.thcLegacy === undefined || body.thcLegacy === null || body.thcLegacy === '' ? null : Number.parseFloat(String(body.thcLegacy)),
      cbdLegacy: body.cbdLegacy === undefined || body.cbdLegacy === null || body.cbdLegacy === '' ? null : Number.parseFloat(String(body.cbdLegacy)),
      status,
    },
  };
}

export function buildProductRequestPayload(formData: Record<string, unknown>, status: ProductStatusValue = PRODUCT_STATUS.PUBLISHED) {
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
    sku: normalizeOptionalString(formData.sku),
    brand: normalizeOptionalString(formData.brand),
    ingredients: normalizeOptionalString(formData.ingredients),
    isFeatured: Boolean(formData.isFeatured),
    status,
  };
}
