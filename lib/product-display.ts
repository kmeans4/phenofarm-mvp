import { normalizeUnit } from '@/lib/product-payload';

export const PRODUCT_UNITS = ['Gram', 'Half Ounce', 'Ounce', 'Eighth', 'Quarter', 'Unit', 'Pack', 'Each', 'Lb'];

export function productUnitOptions(value?: unknown): string[] {
  const current = normalizeUnit(value);
  return current && !PRODUCT_UNITS.includes(current) ? [...PRODUCT_UNITS, current] : PRODUCT_UNITS;
}

export function formatProductUnit(value?: unknown): string {
  const unit = normalizeUnit(value) || 'Unit';
  return ({ Gram: 'g', Ounce: 'oz', 'Half Ounce': '½ oz', Lb: 'lb', Each: 'ea' } as Record<string, string>)[unit] || unit.toLowerCase();
}

export function formatProductMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
  }).format(value);
}
