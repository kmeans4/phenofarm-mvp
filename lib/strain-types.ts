export const STRAIN_TYPES = ['INDICA', 'SATIVA', 'HYBRID'] as const;

export type StrainTypeValue = typeof STRAIN_TYPES[number];

export const STRAIN_TYPE_LABELS: Record<StrainTypeValue, string> = {
  INDICA: 'Indica',
  SATIVA: 'Sativa',
  HYBRID: 'Hybrid',
};

export function isStrainType(value: unknown): value is StrainTypeValue {
  return typeof value === 'string' && STRAIN_TYPES.includes(value as StrainTypeValue);
}

export function normalizeStrainType(value: unknown): StrainTypeValue | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return isStrainType(trimmed) ? trimmed : null;
}
