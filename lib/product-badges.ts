/** Shared visual thresholds for catalog, favorites, and marketplace previews. */
export function getThcBadgeColor(thc: number, variant: 'card' | 'compact' = 'card') {
  const bucket = thc < 15 ? 0 : thc < 20 ? 1 : thc < 25 ? 2 : 3;
  return (variant === 'compact'
    ? ['bg-emerald-50 text-emerald-700', 'bg-yellow-50 text-yellow-700', 'bg-orange-50 text-orange-700', 'bg-red-50 text-red-700']
    : ['bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'bg-orange-100 text-orange-800 border-orange-200', 'bg-red-100 text-red-800 border-red-200'])[bucket];
}

export function getCbdBadgeColor(cbd: number) {
  if (cbd < 1) return 'bg-gray-100 text-gray-600 border-gray-200';
  if (cbd < 5) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-indigo-100 text-indigo-800 border-indigo-200';
}

export function getStrainTypeColor(strainType: string | null, variant: 'card' | 'compact' | 'row' = 'compact', fallback?: string | null) {
  const source = strainType || fallback;
  if (!source) return variant === 'row' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-700';
  const lower = source.toLowerCase();
  const bucket = lower.includes('indica') ? 0 : lower.includes('sativa') ? 1 : 2;
  return (variant === 'card'
    ? ['bg-purple-100 text-purple-800 border-purple-200', 'bg-amber-100 text-amber-800 border-amber-200', 'bg-blue-100 text-blue-800 border-blue-200']
    : ['bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700'])[bucket];
}
