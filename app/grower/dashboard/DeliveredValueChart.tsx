import { ValueChart } from '@/app/components/charts/ValueChart';

export function DeliveredValueChart({
  days,
}: {
  days: { date: string; revenue: number }[];
}) {
  return (
    <ValueChart
      title="Delivered value"
      points={days.map((day) => ({ date: day.date, value: day.revenue }))}
      variant="area"
      dayRanges={[7, 30]}
      description="Delivered orders, by delivery date (Eastern time)."
      emptyMessage="No delivered orders in this period."
    />
  );
}
