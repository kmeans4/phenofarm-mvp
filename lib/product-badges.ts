/** Shared visual thresholds for catalog, favorites, and marketplace previews. */
export function getThcBadgeColor(thc: number, variant: 'card' | 'compact' = 'card') {
  const bucket = thc < 15 ? 0 : thc < 20 ? 1 : thc < 25 ? 2 : 3;
  return (variant === 'compact'
    ? ['bg-pf-accent-bg text-pf-accent', 'bg-pf-warning-bg text-pf-warning', 'bg-pf-warning-bg text-pf-warning', 'bg-pf-danger-bg text-pf-danger']
    : ['bg-pf-accent-bg text-pf-accent border-pf-accent-line', 'bg-pf-warning-bg text-pf-warning border-pf-warning-line', 'bg-pf-warning-bg text-pf-warning border-pf-warning-line', 'bg-pf-danger-bg text-pf-danger border-pf-danger-line'])[bucket];
}

export function getCbdBadgeColor(cbd: number) {
  if (cbd < 1) return 'bg-pf-raised text-pf-muted border-pf-line';
  if (cbd < 5) return 'bg-pf-info-bg text-pf-info border-pf-info-line';
  return 'bg-pf-purple-bg text-pf-purple border-pf-purple-line';
}

export function getStrainTypeColor(strainType: string | null, variant: 'card' | 'compact' | 'row' = 'compact', fallback?: string | null) {
  const source = strainType || fallback;
  if (!source) return variant === 'row' ? 'bg-pf-raised text-pf-muted' : 'bg-pf-raised text-pf-muted';
  const lower = source.toLowerCase();
  const bucket = lower.includes('indica') ? 0 : lower.includes('sativa') ? 1 : 2;
  return (variant === 'card'
    ? ['bg-pf-purple-bg text-pf-purple border-pf-purple-line', 'bg-pf-warning-bg text-pf-warning border-pf-warning-line', 'bg-pf-info-bg text-pf-info border-pf-info-line']
    : ['bg-pf-purple-bg text-pf-purple', 'bg-pf-warning-bg text-pf-warning', 'bg-pf-info-bg text-pf-info'])[bucket];
}
