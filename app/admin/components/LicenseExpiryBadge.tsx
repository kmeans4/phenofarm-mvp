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
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
        Not on file
      </span>
    );
  }

  const daysUntilExpiry = getDaysUntil(expiresAt);
  const formattedDate = formatDate(expiresAt);

  if (daysUntilExpiry < 0) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200"
        title={`Expired ${Math.abs(daysUntilExpiry)} days ago`}
      >
        Expired {formattedDate}
      </span>
    );
  }

  if (daysUntilExpiry <= 30) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
        title={`${daysUntilExpiry} days until expiry`}
      >
        Expires {formattedDate}
      </span>
    );
  }

  return (
    <time dateTime={formatDateTime(expiresAt)} className="text-sm text-gray-700" title="License expiry is current">
      {formattedDate}
    </time>
  );
}
