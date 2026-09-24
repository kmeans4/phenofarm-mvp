import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function deliveredValueByDay(growerId: string, since: Date, until: Date, timeZone: string) {
  // Prisma timestamps are UTC without a SQL timezone. Convert explicitly to the
  // same server calendar zone used for chart labels and period boundaries.
  // Date parameters arrive as timestamptz; normalize bounds to UTC timestamps
  // too, so comparison does not depend on the database connection's timezone.
  const rows = await db.$queryRaw<{ date: string; revenue: Prisma.Decimal }[]>(Prisma.sql`
    SELECT to_char((COALESCE("deliveredAt", "updatedAt") AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS date,
      SUM("totalAmount") AS revenue
    FROM orders WHERE "growerId" = ${growerId} AND status = 'DELIVERED'
      AND COALESCE("deliveredAt", "updatedAt") >= (${since} AT TIME ZONE 'UTC')
      AND COALESCE("deliveredAt", "updatedAt") < (${until} AT TIME ZONE 'UTC')
    GROUP BY date ORDER BY date
  `);
  return rows.map(row => ({ date: row.date, revenue: Number(row.revenue) }));
}
