export function parsePage(value: string | null, fallback = 1, maximum = 100000) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(maximum, Math.max(1, parsed)) : fallback;
}
