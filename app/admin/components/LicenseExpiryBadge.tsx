import { startOfLicenseDay } from '@/lib/license';
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
  return Math.ceil((date.getTime() - startOfLicenseDay().getTime()) / 86400000);
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
    <time
      dateTime={formatDateTime(expiresAt)}
      className="text-sm text-pf-secondary"
      title="License expiration is current"
    >
      {formattedDate}
    </time>
  );
}
