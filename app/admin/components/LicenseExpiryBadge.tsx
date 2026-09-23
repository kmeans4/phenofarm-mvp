function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface LicenseExpiryBadgeProps {
  expiresAt: Date | null;
}

export function LicenseExpiryBadge({ expiresAt }: LicenseExpiryBadgeProps) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center rounded-full bg-pf-surface px-2.5 py-1 text-xs font-medium text-pf-secondary">
        Not on file
      </span>
    );
  }

  const daysUntilExpiry = getDaysUntil(expiresAt);
  const formattedDate = formatDate(expiresAt);

  if (daysUntilExpiry < 0) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-pf-danger-bg px-2.5 py-1 text-xs font-medium text-pf-danger ring-1 ring-inset ring-pf-danger-line"
        title={`Expired ${Math.abs(daysUntilExpiry)} days ago`}
      >
        Expired {formattedDate}
      </span>
    );
  }

  if (daysUntilExpiry <= 30) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-pf-warning-bg px-2.5 py-1 text-xs font-medium text-pf-warning ring-1 ring-inset ring-pf-warning-line"
        title={`${daysUntilExpiry} days until expiry`}
      >
        Expires {formattedDate}
      </span>
    );
  }

  return (
    <time dateTime={formatDateTime(expiresAt)} className="text-sm text-pf-secondary" title="License expiry is current">
      {formattedDate}
    </time>
  );
}
