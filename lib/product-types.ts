/**
 * PhenoFarm Product Types and Subtypes
 * Centralized definitions for type safety across the application
 */

export const PRODUCT_TYPES_WITH_SUBTYPES = {
  'Bulk Extract': [
    'Badder',
    'Crude',
    'Crumble',
    'Diamonds',
    'Distillate',
    'Full Plant',
    'Honeycomb',
    'Isolate',
    'Kief',
    'Live Resin',
    'RSO',
    'Shatter',
    'Sugar Wax',
    'Terp Sugar',
    'Terpenes',
    'Water Soluble',
    'Wax',
  ],
  'Cartridge': [
    'CO2',
    'CO2 Disposable',
    'Cured Resin',
    'Distillate',
    'Distillate Disposable',
    'High Terpene',
    'Inhaler',
    'Live Resin',
    'Pax Pods',
    'Syringe',
  ],
  'Edibles': [
    'Brownie',
    'Candy',
    'Chocolate',
    'Coffee',
    'Condiment',
    'Cookie',
    'Cooking',
    'Frozen',
    'Gummies',
    'Popcorn',
    'Snack Food',
    'Tablets',
    'Taffy',
    'Tincture',
  ],
  'Beverages': [],
  'Flower': [
    'A Bud',
    'B Bud',
    'C Bud',
    'Infused Flower',
    'Popcorn',
  ],
  'Live Plant': [
    'Clones',
    'Seedlings',
    'Starts',
    'Teens',
    'Tissue Culture',
  ],
  'Plant Material': [
    'Fresh Frozen',
    'Kief',
    'Shake',
    'Trim',
    'Untrimmed Flower',
    'Whole Plant',
  ],
  'Prepack': [
    'A Bud',
    'B Bud',
    'C Bud',
    'Popcorn',
  ],
  'Preroll': [
    'Infused',
    'Trim/Shake',
    'Whole Flower',
    'Whole Flower Blunt',
    'Whole Flower Infused',
  ],
  'Tincture': [
    'Broad Spectrum',
    'Full Spectrum',
    'Full Spectrum THC Free',
    'Isolate',
    'Isolate THC Free',
    'THC Free',
  ],
  'Topicals & Wellness': [
    'Balm',
    'Bath Bomb',
    'Bath Salt',
    'Capsules',
    'Cleanser',
    'Cream',
    'Essential Oil',
    'Lip Balm',
    'Lotion',
    'Lubricant',
    'Mask',
    'Massage Oil',
    'Muscle Gel',
    'Salve',
    'Serum',
    'Shampoo',
    'Soap',
    'Suppositories',
    'Toner',
    'Transdermal Patches',
  ],
} as const;

export interface ProductTypeOption {
  type: string;
  subTypes: string[];
}

// Type for product type names
export type ProductTypeName = keyof typeof PRODUCT_TYPES_WITH_SUBTYPES;

// Type for subtypes of a given product type
export type SubTypeFor<T extends ProductTypeName> =
  (typeof PRODUCT_TYPES_WITH_SUBTYPES)[T] extends readonly string[]
    ? (typeof PRODUCT_TYPES_WITH_SUBTYPES)[T][number]
    : never;

// Union type of all product types
export const PRODUCT_TYPE_NAMES = Object.keys(PRODUCT_TYPES_WITH_SUBTYPES) as ProductTypeName[];

/**
 * Backward-compatible aliases.
 * Canonical values are keys of PRODUCT_TYPES_WITH_SUBTYPES.
 */
export const PRODUCT_TYPE_ALIASES: Record<string, ProductTypeName> = {
  drink: 'Beverages',
  drinks: 'Beverages',
  beverage: 'Beverages',
  beverages: 'Beverages',

  topical: 'Topicals & Wellness',
  topicals: 'Topicals & Wellness',
  'topicals & wellness': 'Topicals & Wellness',

  'pre-roll': 'Preroll',
  'pre roll': 'Preroll',
  preroll: 'Preroll',

  concentrate: 'Bulk Extract',
  concentrates: 'Bulk Extract',
};

export function canonicalizeProductType(type?: string | null): string | null {
  if (!type) return null;
  const trimmed = type.trim();
  if (!trimmed) return null;

  const aliased = PRODUCT_TYPE_ALIASES[trimmed.toLowerCase()];
  return aliased || trimmed;
}

export function getEquivalentProductTypes(type?: string | null): string[] {
  const canonical = canonicalizeProductType(type);
  if (!canonical) return [];

  const matches = new Set<string>([canonical]);

  for (const [alias, mapped] of Object.entries(PRODUCT_TYPE_ALIASES)) {
    if (mapped === canonical) {
      // keep a presentation-cased version of common aliases used in historical records
      if (alias === 'drink' || alias === 'drinks') matches.add('Drink');
      if (alias === 'topical' || alias === 'topicals') matches.add('Topicals');
      if (alias === 'pre-roll' || alias === 'pre roll') matches.add('Pre-roll');
      if (alias === 'concentrate' || alias === 'concentrates') matches.add('Concentrate');
    }
  }

  return Array.from(matches);
}

export function expandProductTypeFilters(types: string[] = []): string[] {
  const expanded = new Set<string>();

  for (const type of types) {
    for (const value of getEquivalentProductTypes(type)) {
      expanded.add(value);
    }
  }

  return Array.from(expanded);
}

// Canonical defaults represented in API config shape
export function getDefaultProductTypeOptions(): ProductTypeOption[] {
  return PRODUCT_TYPE_NAMES.map((type) => ({
    type,
    subTypes: [...PRODUCT_TYPES_WITH_SUBTYPES[type]],
  }));
}

export function mergeProductTypeOptions(configs: ProductTypeOption[] = []): ProductTypeOption[] {
  const byType = new Map<string, string[]>();

  for (const option of getDefaultProductTypeOptions()) {
    byType.set(option.type, [...option.subTypes]);
  }

  for (const option of configs) {
    const canonicalType = canonicalizeProductType(option?.type);
    if (!canonicalType) continue;

    const existing = byType.get(canonicalType) || [];
    const incoming = Array.isArray(option.subTypes) ? option.subTypes : [];
    byType.set(canonicalType, [...new Set([...existing, ...incoming])]);
  }

  return Array.from(byType.entries()).map(([type, subTypes]) => ({ type, subTypes }));
}

// Helper function to get subtypes for a product type
export function getSubTypesForProductType(
  productType: string
): readonly string[] {
  const canonicalType = canonicalizeProductType(productType);
  if (!canonicalType) return [];

  return (PRODUCT_TYPES_WITH_SUBTYPES as unknown as Record<string, readonly string[]>)[canonicalType] || [];
}

// Helper function to check if a product type has subtypes
export function hasSubTypes(productType: string): boolean {
  const subTypes = getSubTypesForProductType(productType);
  return subTypes.length > 0;
}

// Get all product types as array
export function getAllProductTypes(): string[] {
  return PRODUCT_TYPE_NAMES;
}

// Product type metadata for UI display
export interface ProductTypeInfo {
  name: string;
  hasSubTypes: boolean;
  subTypeCount: number;
}

export function getProductTypeInfo(): ProductTypeInfo[] {
  return PRODUCT_TYPE_NAMES.map((name) => ({
    name,
    hasSubTypes: PRODUCT_TYPES_WITH_SUBTYPES[name].length > 0,
    subTypeCount: PRODUCT_TYPES_WITH_SUBTYPES[name].length,
  }));
}
