import { formatMoney, formatQuantity } from '@/lib/format';
import { normalizeUnit } from '@/lib/product-payload';

export const PRODUCT_UNITS = [
  'Gram',
  'Half Ounce',
  'Ounce',
  'Eighth',
  'Quarter',
  'Unit',
  'Pack',
  'Each',
  'Lb',
];

export function productUnitOptions(value?: unknown): string[] {
  const current = normalizeUnit(value);
  return current && !PRODUCT_UNITS.includes(current)
    ? [...PRODUCT_UNITS, current]
    : PRODUCT_UNITS;
}

export function formatProductUnit(value?: unknown): string {
  const unit = normalizeUnit(value) || 'Unit';
  return (
    (
      {
        Gram: 'g',
        Ounce: 'oz',
        'Half Ounce': '½ oz',
        Lb: 'lb',
        Each: 'ea',
      } as Record<string, string>
    )[unit] || unit.toLowerCase()
  );
}

export const formatProductMoney = formatMoney;

export function lowStockThreshold(unit?: unknown): number {
  const normalized = normalizeUnit(unit);
  return normalized === 'Lb'
    ? 1
    : normalized === 'Ounce' || normalized === 'Half Ounce'
      ? 8
      : 10;
}
export function isLowStock(quantity: number, unit?: unknown): boolean {
  return quantity > 0 && quantity <= lowStockThreshold(unit);
}
export function formatProductStock(quantity: number, unit?: unknown): string {
  return formatQuantity(quantity, formatProductUnit(unit));
}
export function productVisibility(product: {
  status?: string;
  inventoryQty: number;
  isAvailable: boolean;
}): string {
  if (product.status === 'DRAFT') return 'Draft';
  if (product.inventoryQty <= 0) return 'Sold out';
  return product.isAvailable ? 'Live' : 'Hidden';
}
