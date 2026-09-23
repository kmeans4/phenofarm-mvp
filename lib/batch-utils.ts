export function getTodayDateInputValue(now = new Date()) {
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split('T')[0];
}

export function toDateInputValue(value: string | Date | null | undefined) {
  if (!value) return '';

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
  }

  const raw = String(value);
  const dateOnlyMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateOnlyMatch) return dateOnlyMatch[0];

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

export function isFutureDateInput(value: string, today = getTodayDateInputValue()) {
  return Boolean(value) && value > today;
}

export function suggestBatchNumber(existingBatchNumbers: string[], harvestDate: string) {
  const datePart = toDateInputValue(harvestDate) || getTodayDateInputValue();
  const compactDate = datePart.replaceAll('-', '');
  const prefix = `BATCH-${compactDate}-`;
  const maxSequence = existingBatchNumbers.reduce((max, batchNumber) => {
    if (!batchNumber.startsWith(prefix)) return max;

    const suffix = batchNumber.slice(prefix.length);
    if (!/^\d+$/.test(suffix)) return max;

    return Math.max(max, Number(suffix));
  }, 0);

  return `${prefix}${String(maxSequence + 1).padStart(2, '0')}`;
}

export function parseOptionalBatchMetric(value: unknown) {
  if (value === undefined || value === null || value === '') return null;

  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '') return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatBatchMetric(value: unknown): string {
  const metric = typeof value === 'number' || typeof value === 'string'
    ? parseOptionalBatchMetric(value)
    : null;
  return metric === null ? '—' : `${metric.toFixed(1)}%`;
}

/** Harvest dates are calendar days, not timestamps in the viewer's timezone. */
export function formatHarvestDate(value: string | Date | null | undefined): string {
  const dateOnly = toDateInputValue(value);
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (!dateOnly || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(date);
}
