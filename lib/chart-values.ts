import { marketplaceDateKey, shiftDateKey } from './report-range';
import { formatCalendarMonth } from './calendar-month';

export type ValuePoint = { date: string; value: number };
export type ValueBucket = 'day' | 'month';

export function valueDateLabel(
  date: string,
  bucket: ValueBucket,
  full = false
) {
  if (bucket === 'month') return formatCalendarMonth(date, full);
  return new Intl.DateTimeFormat('en-US', {
    month: full ? 'long' : 'short',
    day: 'numeric',
    ...(full ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Four equal currency intervals, starting at zero, with at least a cent per tick. */
export function valueAxisMaximum(values: number[]) {
  const highest = values.reduce(
    (max, value) => Math.max(max, Number.isFinite(value) ? value : 0),
    0
  );
  const rawStep = Math.max(highest / 4, 0.01);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const ratio = rawStep / magnitude;
  const step =
    (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;
  return step * 4;
}

/** Request dates use the same Eastern calendar as the grower reports. */
export function dailyOrderValues(
  orders: { createdAt: Date; totalAmount: unknown }[],
  today: string,
  count = 7
): ValuePoint[] {
  const totals = new Map<string, number>();
  for (const order of orders) {
    const key = marketplaceDateKey(order.createdAt);
    totals.set(key, (totals.get(key) || 0) + Number(order.totalAmount));
  }
  return Array.from({ length: count }, (_, index) => {
    const date = shiftDateKey(today, index - count + 1);
    return { date, value: Math.round((totals.get(date) || 0) * 100) / 100 };
  });
}

export function monthlyDeliveredValues(
  rows: { month: string; revenue: number }[],
  from: string,
  to: string
): { points: ValuePoint[]; activeMonthsOnly: boolean } {
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const start = from.slice(0, 7) || sorted[0]?.month;
  const end = to.slice(0, 7);
  if (
    !start ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(start) ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(end)
  )
    return { points: [], activeMonthsOnly: false };
  const ordinal = (key: string) =>
    Number(key.slice(0, 4)) * 12 + Number(key.slice(5)) - 1;
  const first = ordinal(start);
  const count = ordinal(end) - first + 1;
  // Avoid thousands of artificial empty buckets for an extremely broad custom
  // range. The caller explicitly labels this as months with deliveries.
  if (count > 600)
    return {
      points: sorted.map((row) => ({
        date: row.month,
        value: Number(row.revenue),
      })),
      activeMonthsOnly: true,
    };
  const values = new Map(rows.map((row) => [row.month, Number(row.revenue)]));
  return {
    activeMonthsOnly: false,
    points: Array.from({ length: Math.max(0, count) }, (_, index) => {
      const month = first + index;
      const date = `${String(Math.floor(month / 12)).padStart(4, '0')}-${String((month % 12) + 1).padStart(2, '0')}`;
      return { date, value: values.get(date) || 0 };
    }),
  };
}
