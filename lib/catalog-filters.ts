export interface FilterState {
  productTypes: string[];
  thcRanges: string[];
  priceRanges: string[];
  recentlyAdded: boolean;
  trending: boolean;
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
