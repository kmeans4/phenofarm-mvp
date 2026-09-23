import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { buyerProductWhere, normalizeProductIds } from '@/lib/buyer-products';
import { buyerAlertInclude, serializeBuyerAlerts } from '@/lib/buyer-alerts';
import { Prisma } from '@prisma/client';

async function requireDispensary() {
  const session = await getAuthSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user: session.user, dispensaryId: session.user.dispensaryId };
}
export async function GET() {
  const auth = await requireDispensary(); if ('error' in auth) return auth.error;
  try {
    const alerts = await db.dispensaryPriceAlert.findMany({ where: { dispensaryId: auth.dispensaryId, product: buyerProductWhere() }, orderBy: { createdAt: 'desc' }, include: buyerAlertInclude });
    return NextResponse.json({ alerts: await serializeBuyerAlerts(alerts) });
  } catch (error) { console.error('Error loading alerts', error); return NextResponse.json({ error: 'Unable to load alerts.' }, { status: 500 }); }
}
async function save(request: Request, replace: boolean) {
  const auth = await requireDispensary(); if ('error' in auth) return auth.error;
  const body = await request.json().catch(() => null);
  const input = replace ? body?.alerts : body?.added;
  if (!Array.isArray(input) || input.length > 20 || (!replace && !Array.isArray(body?.removed))) return NextResponse.json({ error: 'Invalid alert list.' }, { status: 400 });
  const entries = new Map<string, number>();
  const dismissed = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw.productId !== 'string' || !Number.isFinite(Number(raw.targetPrice)) || Number(raw.targetPrice) <= 0) return NextResponse.json({ error: 'Each alert requires a product and positive target price.' }, { status: 400 });
    entries.set(raw.productId, Number(raw.targetPrice));
    if (raw.isTriggered === false) dismissed.add(raw.productId);
  }
  const removed = normalizeProductIds(body?.removed);
  try {
    await db.$transaction(async tx => {
      // Serialize same-account edits to preserve the alert limit under concurrent writes.
      await tx.$queryRaw(Prisma.sql`SELECT id FROM dispensaries WHERE id = ${auth.dispensaryId} FOR UPDATE`);
      const existing = await tx.dispensaryPriceAlert.findMany({ where: { dispensaryId: auth.dispensaryId }, select: { productId: true, targetPrice: true, isTriggered: true } });
      const products = await tx.product.findMany({ where: { id: { in: [...entries.keys()] }, ...buyerProductWhere(), isPriceVisible: true }, select: { id: true, price: true } });
      const toRemove = replace ? existing.filter(alert => !entries.has(alert.productId)).map(alert => alert.productId) : removed;
      await tx.dispensaryPriceAlert.deleteMany({ where: { dispensaryId: auth.dispensaryId, productId: { in: toRemove } } });
      const retained = new Set(existing.filter(alert => !toRemove.includes(alert.productId)).map(alert => alert.productId));
      if (retained.size + products.filter(product => !retained.has(product.id)).length > 20) throw new Error('ALERT_LIMIT');
      for (const product of products) {
        const previous = existing.find(alert => alert.productId === product.id);
        const targetPrice = entries.get(product.id)!;
        if (previous && Number(previous.targetPrice) === targetPrice && !toRemove.includes(product.id) && !(previous.isTriggered && dismissed.has(product.id))) continue;
        await tx.dispensaryPriceAlert.upsert({ where: { dispensaryId_productId: { dispensaryId: auth.dispensaryId, productId: product.id } },
          create: { dispensaryId: auth.dispensaryId, productId: product.id, targetPrice, currentPrice: product.price },
          update: { targetPrice, isTriggered: false, triggeredAt: null },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'ALERT_LIMIT' ? 'You can save up to 20 alerts.' : 'Unable to save alerts.' }, { status: error instanceof Error && error.message === 'ALERT_LIMIT' ? 400 : 500 }); }
}
export async function PUT(request: Request) { return save(request, true); }
export async function PATCH(request: Request) { return save(request, false); }
