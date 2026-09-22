export const STRAIN_TYPES = ['INDICA', 'SATIVA', 'HYBRID', 'SATIVA_DOM_HYBRID', 'INDICA_DOM_HYBRID'] as const;

export type StrainTypeValue = typeof STRAIN_TYPES[number];

export const STRAIN_TYPE_LABELS: Record<StrainTypeValue, string> = {
  INDICA: 'Indica',
  SATIVA: 'Sativa',
  HYBRID: 'Hybrid',
  SATIVA_DOM_HYBRID: 'Sativa Dom. Hybrid',
  INDICA_DOM_HYBRID: 'Indica Dom. Hybrid',
};

export const STRAIN_TYPE_FULL_LABELS: Record<StrainTypeValue, string> = {
  INDICA: 'Indica',
  SATIVA: 'Sativa',
  HYBRID: 'Hybrid',
  SATIVA_DOM_HYBRID: 'Sativa dominant hybrid',
  INDICA_DOM_HYBRID: 'Indica dominant hybrid',
};

export const STRAIN_TYPE_DESCRIPTIONS: Record<StrainTypeValue, string> = {
  INDICA: 'Generally selected for indica-leaning genetics and buyer expectations.',
  SATIVA: 'Generally selected for sativa-leaning genetics and buyer expectations.',
  HYBRID: 'Balanced hybrid genetics without a strong indica or sativa lean.',
  SATIVA_DOM_HYBRID: 'Hybrid genetics that lean sativa in growth traits or buyer positioning.',
  INDICA_DOM_HYBRID: 'Hybrid genetics that lean indica in growth traits or buyer positioning.',
};

export const COMMON_STRAIN_NAMES = [
  'Blue Dream',
  'Sour Diesel',
  'OG Kush',
  'Girl Scout Cookies',
  'Gelato',
  'Wedding Cake',
  'Gorilla Glue #4',
  'Northern Lights',
  'Granddaddy Purple',
  'Jack Herer',
  'Pineapple Express',
  'White Widow',
  'Durban Poison',
  'Green Crack',
  'Purple Punch',
  'Runtz',
  'Zkittlez',
  'Biscotti',
  'MAC 1',
  'Ice Cream Cake',
  'Kush Mints',
  'Gary Payton',
  'Apple Fritter',
  'Chem Dawg',
  'Do-Si-Dos',
  'Tropicana Cookies',
  'Mimosa',
  'Super Lemon Haze',
  'Forbidden Fruit',
  'Blueberries NF',
];

export function isStrainType(value: unknown): value is StrainTypeValue {
  return typeof value === 'string' && STRAIN_TYPES.includes(value as StrainTypeValue);
}

export function normalizeStrainType(value: unknown): StrainTypeValue | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return isStrainType(trimmed) ? trimmed : null;
}
