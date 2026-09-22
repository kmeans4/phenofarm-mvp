import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { createNotification } from '@/lib/notifications';
import { buyerProductWhere } from '@/lib/buyer-products';
import { buyerAlertInclude, serializeBuyerAlert } from '@/lib/buyer-alerts';

export async function POST() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const dispensaryId = session.user.dispensaryId;
  try {
    const alerts = await db.dispensaryPriceAlert.findMany({ where: { dispensaryId, product: { ...buyerProductWhere(), isPriceVisible: true } }, include: buyerAlertInclude });
    await db.$transaction(async tx => {
      for (const alert of alerts) {
        const currentPrice = Number(alert.product.price);
        const previousPrice = Number(alert.currentPrice);
        const triggeredNow = currentPrice <= Number(alert.targetPrice) && currentPrice < previousPrice;
        if (currentPrice === previousPrice) continue;
        const update = await tx.dispensaryPriceAlert.updateMany({ where: { id: alert.id, currentPrice: alert.currentPrice, targetPrice: alert.targetPrice, isTriggered: alert.isTriggered },
          data: { currentPrice, isTriggered: alert.isTriggered || triggeredNow, triggeredAt: triggeredNow ? new Date() : alert.triggeredAt, originalPrice: triggeredNow ? previousPrice : alert.originalPrice },
        });
        if (update.count && triggeredNow && !alert.isTriggered) await createNotification(tx, { userId: session.user.id, type: 'PRICE_ALERT_TRIGGERED', title: 'Price dropped', body: `${alert.product.name} reached your target price.`, href: '/dispensary/saved?tab=alerts' });
      }
    });
    const refreshed = await db.dispensaryPriceAlert.findMany({ where: { dispensaryId, product: buyerProductWhere() }, orderBy: { createdAt: 'desc' }, include: buyerAlertInclude });
    return NextResponse.json({ alerts: refreshed.map(serializeBuyerAlert) });
  } catch (error) { console.error('Unable to refresh alerts', error); return NextResponse.json({ error: 'Unable to refresh alerts. Existing alerts are unchanged.' }, { status: 500 }); }
}
