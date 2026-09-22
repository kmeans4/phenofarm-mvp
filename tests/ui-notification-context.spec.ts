import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

function isLocalTestTarget(value: string, database = false) {
  try {
    const target = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
      && (database
        ? /^postgres(?:ql)?:$/.test(target.protocol) && /^phenofarm_(?:auth|ui_fixes|test)_[a-zA-Z0-9_-]+$/.test(target.pathname.slice(1))
        : /^https?:$/.test(target.protocol));
  } catch { return false; }
}

test('notification context identifies both parties and never enriches an unrelated request', async ({ playwright }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3144';
  if (!isLocalTestTarget(baseURL) || !isLocalTestTarget(process.env.DATABASE_URL || '', true)) {
    throw new Error('Notification regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
  }
  const db = new PrismaClient(); const prefix = `notification-ui-${Date.now()}`; const userIds: string[] = []; let orderId: string | undefined;
  try {
    const growerUser = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-grower@example.test`, role: 'GROWER', grower: { create: { businessName: 'Context Farm', licenseNumber: `${prefix}-g`, isVerified: true, licenseExpiry: new Date('2030-12-31') } } }, include: { grower: true } }); userIds.push(growerUser.id);
    const buyerUser = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-buyer@example.test`, role: 'DISPENSARY', dispensary: { create: { businessName: 'Context Buyer', licenseNumber: `${prefix}-b`, isVerified: true, licenseExpiry: new Date('2030-12-31') } } }, include: { dispensary: true } }); userIds.push(buyerUser.id);
    const outsider = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-other@example.test`, role: 'GROWER' } }); userIds.push(outsider.id);
    const product = await db.product.create({ data: { growerId: growerUser.grower!.id, name: 'Context Flower', productType: 'Flower', price: 12, unit: 'Gram', inventoryQty: 100, status: 'PUBLISHED', isAvailable: true } });
    const conversation = await db.conversation.create({ data: { growerId: growerUser.grower!.id, dispensaryId: buyerUser.dispensary!.id, productId: product.id } });
    async function client(user: typeof outsider) {
      const token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: user.id, sub: user.id, role: user.role, email: user.email, sessionVersion: user.sessionVersion }, maxAge: 3600 });
      return playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `next-auth.session-token=${token}` } });
    }
    const grower = await client(growerUser), buyer = await client(buyerUser), other = await client(outsider);
    try {
      const sent = await grower.post(`/api/messages/conversations/${conversation.id}/messages`, { data: { messageType: 'OFFER', body: 'Fixture quote', productId: product.id, offer: { unitPrice: 11, quantity: 2 } } });
      expect(sent.status()).toBe(201); const offer = await sent.json();
      const buyerNotes = await (await buyer.get('/api/notifications')).json();
      expect(buyerNotes.notifications.find((item: { type: string }) => item.type === 'QUOTE_SENT')).toMatchObject({ title: 'New quote', body: 'Context Farm · Context Flower' });
      const accepted = await buyer.post(`/api/messages/messages/${offer.id}/offer-action`, { data: { action: 'ACCEPT' } }); expect(accepted.ok()).toBe(true);
      const growerNotes = await (await grower.get('/api/notifications')).json();
      expect(growerNotes.notifications.find((item: { type: string }) => item.type === 'QUOTE_ACCEPTED')).toMatchObject({ title: 'Quote accepted', body: 'Context Buyer · Context Flower' });
      const order = await db.order.create({ data: { growerId: growerUser.grower!.id, dispensaryId: buyerUser.dispensary!.id, totalAmount: 22, subtotal: 22, status: 'PENDING' } }); orderId = order.id;
      await db.notification.createMany({ data: [growerUser, outsider].map(user => ({ userId: user.id, type: 'ORDER_TEST', title: 'Request update', body: 'Original history', href: `/grower/orders/${order.id}` })) });
      const own = await (await grower.get('/api/notifications')).json();
      expect(own.notifications.find((item: { type: string }) => item.type === 'ORDER_TEST').body).toMatch(/^Context Buyer · #.+ · \$22\.00$/);
      const unrelated = await (await other.get('/api/notifications')).json();
      expect(unrelated.notifications.find((item: { type: string }) => item.type === 'ORDER_TEST').body).toBe('Original history');
    } finally { await grower.dispose(); await buyer.dispose(); await other.dispose(); }
  } finally {
    if (orderId) await db.order.delete({ where: { id: orderId } });
    await db.user.deleteMany({ where: { id: { in: userIds } } }); await db.$disconnect();
  }
});
