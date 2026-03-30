import { normalizeProductType, normalizeUnit } from '@/lib/product-payload';

const DEFAULT_PRODUCT_NAME = 'Untitled Product';
const DEFAULT_UNIT = 'Gram';

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function toSafeNonNegativeNumber(value: unknown, fallback = 0): number {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0) return fallback;
  return parsed;
}

export function toSafeNonNegativeInteger(value: unknown, fallback = 0): number {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0) return fallback;
  return Math.floor(parsed);
}

export function toSafeOptionalNumber(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return null;
  return parsed;
}

export function toSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toSafeProductName(value: unknown): string {
  return toTrimmedString(value) || DEFAULT_PRODUCT_NAME;
}

export function toSafeProductType(value: unknown, legacyValue?: unknown): string | null {
  const canonical = normalizeProductType(value);
  if (canonical) return canonical;

  const fallback = toTrimmedString(value) || toTrimmedString(legacyValue);
  return fallback || null;
}

export function toSafeUnit(value: unknown): string {
  return normalizeUnit(value) || DEFAULT_UNIT;
}

export function toSafeOptionalString(value: unknown): string | null {
  return toTrimmedString(value);
}

export function toSafeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function toSafeAvailability(value: unknown, inventoryQty: number): boolean {
  if (inventoryQty <= 0) return false;
  return toSafeBoolean(value, true);
}
