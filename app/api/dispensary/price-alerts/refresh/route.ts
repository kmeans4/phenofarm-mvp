import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';
import { startOfLicenseDay } from '@/lib/license';
import { buyerProductWhere } from '@/lib/buyer-products';
import { buyerAlertInclude, serializeBuyerAlerts } from '@/lib/buyer-alerts';

export async function POST() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const dispensaryId = session.user.dispensaryId;
  try {
    await db.$transaction(async tx => {
      // Lock and update all changed alerts together. Concurrent refreshes cannot
      // both emit the same transition notification.
      const changed = await tx.$queryRaw<Array<{ name: string; notify: boolean }>>(Prisma.sql`
        WITH candidates AS (
          SELECT a.id, a."currentPrice" AS previous, a."isTriggered" AS triggered,
            p.price, p.name, (p.price <= a."targetPrice" AND p.price < a."currentPrice") AS dropped
          FROM dispensary_price_alerts a
          JOIN products p ON p.id = a."productId"
          JOIN growers g ON g.id = p."growerId"
          WHERE a."dispensaryId" = ${dispensaryId} AND NOT p."isDeleted"
            AND p.status = 'PUBLISHED' AND p."isPriceVisible" AND g."isVerified"
            AND (g."licenseExpiry" IS NULL OR g."licenseExpiry" >= ${startOfLicenseDay()})
            AND a."currentPrice" IS DISTINCT FROM p.price
          ORDER BY a.id FOR UPDATE OF a
        )
        UPDATE dispensary_price_alerts a SET "currentPrice" = c.price,
          "isTriggered" = a."isTriggered" OR c.dropped,
          "triggeredAt" = CASE WHEN c.dropped THEN CURRENT_TIMESTAMP ELSE a."triggeredAt" END,
          "originalPrice" = CASE WHEN c.dropped THEN c.previous ELSE a."originalPrice" END,
          "updatedAt" = CURRENT_TIMESTAMP
        FROM candidates c WHERE a.id = c.id
        RETURNING c.name, (c.dropped AND NOT c.triggered) AS notify`);
      const notifications = changed.filter(row => row.notify).map(row => ({
        userId: session.user.id, type: 'PRICE_ALERT_TRIGGERED', title: 'Price dropped',
        body: `${row.name} reached your target price.`, href: '/dispensary/saved?tab=alerts',
      }));
      if (notifications.length) await tx.notification.createMany({ data: notifications });
    });
    const refreshed = await db.dispensaryPriceAlert.findMany({ where: { dispensaryId, product: buyerProductWhere() }, orderBy: { createdAt: 'desc' }, include: buyerAlertInclude });
    return NextResponse.json({ alerts: await serializeBuyerAlerts(refreshed) });
  } catch (error) { console.error('Unable to refresh alerts', error); return NextResponse.json({ error: 'Unable to refresh alerts. Existing alerts are unchanged.' }, { status: 500 }); }
}
