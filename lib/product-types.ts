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

// Type for product type names
export type ProductTypeName = keyof typeof PRODUCT_TYPES_WITH_SUBTYPES;

// Type for subtypes of a given product type
export type SubTypeFor<T extends ProductTypeName> = 
  (typeof PRODUCT_TYPES_WITH_SUBTYPES)[T] extends readonly string[] 
    ? (typeof PRODUCT_TYPES_WITH_SUBTYPES)[T][number] 
    : never;

// Union type of all product types
export const PRODUCT_TYPE_NAMES = Object.keys(PRODUCT_TYPES_WITH_SUBTYPES) as ProductTypeName[];

// Helper function to get subtypes for a product type
export function getSubTypesForProductType(
  productType: string
): readonly string[] {
  return (PRODUCT_TYPES_WITH_SUBTYPES as unknown as Record<string, readonly string[]>)[productType] || [];
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
