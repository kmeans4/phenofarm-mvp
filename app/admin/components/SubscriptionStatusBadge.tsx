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
    Free: 'bg-gray-100 text-gray-700 ring-gray-200',
    Pro: 'bg-green-50 text-green-700 ring-green-200',
    Business: 'bg-blue-50 text-blue-700 ring-blue-200',
    Inactive: 'bg-red-50 text-red-700 ring-red-200',
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
