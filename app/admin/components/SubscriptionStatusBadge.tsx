function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

type SubscriptionBadgeLabel = 'Free' | 'Pro' | 'Business' | 'Inactive';

interface SubscriptionStatusBadgeProps {
  plan: string | null;
  status: string | null;
  currentPeriodEnd?: Date | null;
}

function getPlanLabel(plan: string | null): SubscriptionBadgeLabel {
  const normalizedPlan = (plan || '').toLowerCase();
  if (normalizedPlan.includes('business')) return 'Business';
  if (normalizedPlan.includes('pro')) return 'Pro';
  if (normalizedPlan.includes('free')) return 'Free';
  return 'Inactive';
}

export function SubscriptionStatusBadge({ plan, status, currentPeriodEnd }: SubscriptionStatusBadgeProps) {
  const planLabel = getPlanLabel(plan);
  const normalizedStatus = (status || 'inactive').toLowerCase();
  const label: SubscriptionBadgeLabel = planLabel !== 'Free' && normalizedStatus !== 'active' ? 'Inactive' : planLabel;
  const detailParts = [`Plan: ${planLabel}`, `Status: ${normalizedStatus}`];
  if (currentPeriodEnd) detailParts.push(`Renews/ends ${formatDate(currentPeriodEnd)}`);

  const className: Record<SubscriptionBadgeLabel, string> = {
    Free: 'bg-pf-surface text-pf-secondary ring-pf-line',
    Pro: 'bg-pf-accent-bg text-pf-accent ring-pf-accent-line',
    Business: 'bg-pf-info-bg text-pf-info ring-pf-info-line',
    Inactive: 'bg-pf-danger-bg text-pf-danger ring-pf-danger-line',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className[label]}`}
      title={detailParts.join(' · ')}
      aria-label={detailParts.join(', ')}
    >
      {label}
    </span>
  );
}
