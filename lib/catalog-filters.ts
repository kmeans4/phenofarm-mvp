export interface FilterState {
  productTypes: string[];
  thcRanges: string[];
  priceRanges: string[];
  recentlyAdded: boolean;
  trending: boolean;
  strainType?: string;
  growerId?: string;
  inStock?: boolean;
  hasLabs?: boolean;
  priceUnit?: string;
}

export const THC_RANGES = [
  { label: '< 15%', min: 0, max: 15, id: 'low' },
  { label: '15% - 20%', min: 15, max: 20, id: 'medium' },
  { label: '20% - 25%', min: 20, max: 25, id: 'high' },
  { label: '25%+', min: 25, max: 100, id: 'very-high' },
];

export const PRICE_RANGES = [
  { label: 'Under $10 per unit', min: 0, max: 10, id: 'budget' },
  { label: '$10 - $25 per unit', min: 10, max: 25, id: 'standard' },
  { label: '$25 - $50 per unit', min: 25, max: 50, id: 'premium' },
  { label: '$50+ per unit', min: 50, max: 10000, id: 'luxury' },
];

export function priceRangesForUnit(unit?: string) {
  const value = unit?.toLowerCase();
  if (['lb', 'pound', 'pounds'].includes(value || ''))
    return [
      { label: 'Under $500 / lb', min: 0, max: 500, id: 'budget' },
      { label: '$500–$1,000 / lb', min: 500, max: 1000, id: 'standard' },
      { label: '$1,000–$2,000 / lb', min: 1000, max: 2000, id: 'premium' },
      { label: '$2,000+ / lb', min: 2000, max: 10000000, id: 'luxury' },
    ];
  if (['oz', 'ounce'].includes(value || ''))
    return [
      { label: 'Under $50 / oz', min: 0, max: 50, id: 'budget' },
      { label: '$50–$100 / oz', min: 50, max: 100, id: 'standard' },
      { label: '$100–$200 / oz', min: 100, max: 200, id: 'premium' },
      { label: '$200+ / oz', min: 200, max: 10000000, id: 'luxury' },
    ];
  return PRICE_RANGES;
}
