/** Shared display formats. Date-only values must not move to the prior calendar day. */
export function formatMoney(
  value: number | string | { toString(): string } | null | undefined
) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
export function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—';
  const dateOnly =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date);
}
export function formatQuantity(value: number, unit = 'unit') {
  const units: Record<string, string> = {
    gram: 'g',
    grams: 'g',
    g: 'g',
    pound: 'lb',
    pounds: 'lb',
    lbs: 'lb',
    lb: 'lb',
    ounce: 'oz',
    ounces: 'oz',
    oz: 'oz',
    units: 'unit',
  };
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value)} ${units[unit.toLowerCase()] || unit.toLowerCase()}`;
}
