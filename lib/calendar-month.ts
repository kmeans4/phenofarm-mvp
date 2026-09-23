/** Format a YYYY-MM reporting bucket without converting it to a local day. */
export function formatCalendarMonth(value: string | null | undefined, long = false): string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${value}-01T00:00:00Z`));
}
