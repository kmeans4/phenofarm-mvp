import type { Prisma } from '@prisma/client';
export function marketplaceDateKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}
export function shiftDateKey(key: string, days: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function marketplaceDayStart(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return undefined;
  const utc = new Date(`${key}T00:00:00Z`);
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== key)
    return undefined;
  const zone = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(utc)
    .find((p) => p.type === 'timeZoneName')?.value;
  const offset = Number(zone?.match(/GMT([+-]\d+)/)?.[1] || -5);
  return new Date(utc.getTime() - offset * 3600000);
}
export function reportRange(params: {
  range?: string;
  from?: string;
  to?: string;
}) {
  const today = marketplaceDateKey();
  const key = params.range || '30d';
  const validFrom =
    params.from && marketplaceDayStart(params.from) ? params.from : undefined;
  const validTo =
    params.to && marketplaceDayStart(params.to) ? params.to : undefined;
  const from =
    validFrom ||
    (key === 'all'
      ? ''
      : shiftDateKey(today, key === '90d' ? -89 : key === '12m' ? -364 : -29));
  const to = validTo || today;
  return {
    from,
    to,
    since: from ? marketplaceDayStart(from) : undefined,
    until: marketplaceDayStart(shiftDateKey(to, 1)),
    label:
      params.from || params.to
        ? 'Custom range'
        : key === 'all'
          ? 'All time'
          : key === '90d'
            ? 'Last 90 days'
            : key === '12m'
              ? 'Last 12 months'
              : 'Last 30 days',
  };
}
/** Delivered value is dated on fulfillment, including older orders without deliveredAt. Other statuses use createdAt. */
export function reportOrderDateWhere(
  since?: Date,
  until?: Date
): Prisma.OrderWhereInput {
  const range = {
    ...(since ? { gte: since } : {}),
    ...(until ? { lt: until } : {}),
  };
  if (!Object.keys(range).length) return {};
  return {
    OR: [
      { status: 'DELIVERED', deliveredAt: range },
      { status: 'DELIVERED', deliveredAt: null, updatedAt: range },
      { status: { not: 'DELIVERED' }, createdAt: range },
    ],
  };
}
