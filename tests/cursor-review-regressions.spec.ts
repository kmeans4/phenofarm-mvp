import { test, expect, request as requests, type APIRequestContext } from '@playwright/test';
import { PrismaClient, type UserRole } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { readFileSync } from 'node:fs';
import { applySubscriptionEvent } from '../lib/subscription-events';
import { getGrowerPlan } from '../lib/plans';
import { STRIPE_CONFIG } from '../lib/stripe';
import type Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { authOptions } from '../lib/auth';
import { consumeAuthLimit } from '../lib/auth-rate-limit';
import { isLicenseExpired, startOfLicenseDay, formatLicenseExpiry, marketplaceGrowerWhere } from '../lib/license';
import { beginSubscriptionCheckout } from '../lib/subscription-checkout';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = /^(AUTH_SECRET|DATABASE_URL)=(.*)$/.exec(line.trim());
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
function isLocalTestTarget(value: string, database = false) {
  try {
    const target = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
      && (database
        ? /^postgres(?:ql)?:$/.test(target.protocol) && /^phenofarm_(?:auth|ui_fixes|test)_[a-zA-Z0-9_-]+$/.test(target.pathname.slice(1))
        : /^https?:$/.test(target.protocol));
  } catch { return false; }
}
if (!isLocalTestTarget(baseURL) || !isLocalTestTarget(process.env.DATABASE_URL || '', true)) {
  throw new Error('Review regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const db = new PrismaClient();
const prefix = `review-${Date.now()}`;
const users: string[] = [];
const apis: APIRequestContext[] = [];
const eventIds: string[] = [];
let sequence = 0;

test.setTimeout(60000);

async function account(role: UserRole, profile = true) {
  const key = `${prefix}-${++sequence}`;
  const user = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${key}@example.test`, name: key, role,
    ...(profile && role === 'GROWER' ? { grower: { create: { businessName: key, isVerified: true, licenseNumber: key, licenseExpiry: new Date('2030-12-31') } } } : {}),
    ...(profile && role === 'DISPENSARY' ? { dispensary: { create: { businessName: key, licenseStatus: 'verified', isVerified: true, licenseNumber: key, licenseState: 'VT', licenseExpiry: new Date('2030-12-31') } } } : {}),
  }, include: { grower: true, dispensary: true } });
  users.push(user.id);
  const token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: user.id, sub: user.id, role, email: user.email, sessionVersion: user.sessionVersion }, maxAge: 3600 });
  const api = await requests.newContext({ baseURL, extraHTTPHeaders: { Cookie: `next-auth.session-token=${token}` } });
  apis.push(api);
  return { ...user, api };
}
async function product(growerId: string, fields = {}) {
  return db.product.create({ data: { growerId, name: `${prefix} Product`, price: 12.50, inventoryQty: 10, unit: 'gram', productType: 'Flower', status: 'PUBLISHED', isAvailable: true, ...fields } });
}
async function order(growerId: string, dispensaryId: string, productId: string, quantity = 3) {
  return db.order.create({ data: { growerId, dispensaryId, status: 'PENDING', subtotal: quantity * 12.5, totalAmount: quantity * 12.5, items: { create: { growerId, productId, quantity, unitPrice: 12.5, totalPrice: quantity * 12.5 } } } });
}

test.afterAll(async () => {
  await Promise.all(apis.map(api => api.dispose()));
  const growers = await db.grower.findMany({ where: { userId: { in: users } }, select: { id: true } });
  const ids = growers.map(row => row.id);
  await db.order.deleteMany({ where: { growerId: { in: ids } } });
  await db.dispensary.deleteMany({ where: { createdByGrowerId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.user.deleteMany({ where: { email: { startsWith: `${prefix}-register` } } });
  await db.stripeWebhookEvent.deleteMany({ where: { id: { in: eventIds } } });
  await db.$disconnect();
});

test('ownerless and foreign accounts cannot read or mutate grower data', async () => {
  const owner = await account('GROWER');
  const stranger = await account('GROWER');
  const orphan = await account('GROWER', false);
  const item = await product(owner.grower!.id);
  for (const url of ['/api/inventory', `/api/products/${item.id}`, '/api/customers']) expect((await orphan.api.get(url)).status()).toBe(403);
  expect((await stranger.api.get(`/api/products/${item.id}`)).status()).toBe(404);
  expect((await orphan.api.post('/api/inventory', { data: { productId: item.id, quantityAvailable: 999 } })).status()).toBe(403);
  expect((await db.product.findUniqueOrThrow({ where: { id: item.id } })).inventoryQty).toBe(10);
});

test('customer edits are owner scoped and cannot delete platform accounts or history', async () => {
  const owner = await account('GROWER'); const stranger = await account('GROWER'); const buyer = await account('DISPENSARY');
  const created = await owner.api.post('/api/customers', { data: { businessName: 'Owned contact', email: ' Contact@Example.test ', contactName: 'Jane' } });
  expect(created.status(), await created.text()).toBe(201);
  const customer = await created.json();
  expect(customer.offPlatformEmail).toBe('contact@example.test');
  expect((await stranger.api.get(`/api/customers/${customer.id}`)).status()).toBe(404);
  expect((await stranger.api.put(`/api/customers/${customer.id}`, { data: { businessName: 'Stolen' } })).status()).toBe(403);
  expect((await owner.api.put(`/api/customers/${customer.id}`, { data: { businessName: 'Updated contact', zipCode: '05401' } })).status()).toBe(200);
  expect((await owner.api.put(`/api/customers/${buyer.dispensary!.id}`, { data: { email: 'stolen@example.test' } })).status()).toBe(403);
  expect((await owner.api.delete(`/api/customers/${buyer.dispensary!.id}`)).status()).toBe(409);
  const item = await product(owner.grower!.id);
  await order(owner.grower!.id, customer.id, item.id);
  expect((await owner.api.delete(`/api/customers/${customer.id}`)).status()).toBe(409);
  expect(await db.dispensary.findUnique({ where: { id: customer.id } })).not.toBeNull();
});

test('settings reject direct email changes atomically, normalize unchanged email, reset license verification, and isolate logo saves', async () => {
  const owner = await account('GROWER'); const other = await account('GROWER'); const buyer = await account('DISPENSARY');
  const body = { businessName: 'Changed', licenseNumber: owner.grower!.licenseNumber, licenseExpiry: '2030-12-31', email: other.email, state: 'VT' };
  for (const email of [other.email, `${prefix}-unused-email@example.test`]) {
    expect((await owner.api.put('/api/grower/settings', { data: { ...body, email } })).status()).toBe(400);
  }
  expect((await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } })).businessName).toBe(owner.grower!.businessName);
  expect(await db.user.findUniqueOrThrow({ where: { id: owner.id }, select: { email: true, emailVerifiedAt: true, sessionVersion: true } }))
    .toEqual({ email: owner.email, emailVerifiedAt: owner.emailVerifiedAt, sessionVersion: owner.sessionVersion });
  expect((await owner.api.put('/api/grower/settings', { data: { ...body, email: ` ${owner.email.toUpperCase()} `, licenseNumber: 'NEW-LICENSE' } })).status()).toBe(200);
  expect((await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } })).isVerified).toBe(false);
  expect((await owner.api.patch('/api/grower/settings', { data: { logo: '' } })).status()).toBe(200);
  const buyerBefore = await db.dispensary.findUniqueOrThrow({ where: { id: buyer.dispensary!.id } });
  for (const email of [other.email, `${prefix}-unused-buyer-email@example.test`]) {
    expect((await buyer.api.put('/api/dispensary/settings', { data: { businessName: 'Must not save', licenseNumber: buyerBefore.licenseNumber, licenseExpiry: '2030-12-31', licenseState: 'VT', email } })).status()).toBe(400);
  }
  expect(await db.dispensary.findUniqueOrThrow({ where: { id: buyer.dispensary!.id } })).toEqual(buyerBefore);
  expect(await db.user.findUniqueOrThrow({ where: { id: buyer.id }, select: { email: true, emailVerifiedAt: true, sessionVersion: true } }))
    .toEqual({ email: buyer.email, emailVerifiedAt: buyer.emailVerifiedAt, sessionVersion: buyer.sessionVersion });
  const response = await buyer.api.put('/api/dispensary/settings', { data: { businessName: buyer.dispensary!.businessName, licenseNumber: 'NEW-BUYER-LICENSE', licenseExpiry: '2030-12-31', licenseState: 'VT', email: buyer.email } });
  expect(response.status(), await response.text()).toBe(200);
  const updated = await db.dispensary.findUniqueOrThrow({ where: { id: buyer.dispensary!.id } });
  expect(updated.licenseStatus).toBe('pending_review'); expect(updated.isVerified).toBe(false); expect(updated.verifiedAt).toBeNull();
  const today = startOfLicenseDay().toISOString().slice(0, 10);
  const todayBody = { businessName: buyer.dispensary!.businessName, licenseNumber: 'TODAY-LICENSE', licenseExpiry: today, licenseState: 'VT', email: buyer.email };
  const todaySave = await buyer.api.put('/api/dispensary/settings', { data: todayBody });
  expect(todaySave.status(), await todaySave.text()).toBe(200);
  const yesterday = new Date(startOfLicenseDay().getTime() - 86400000).toISOString().slice(0, 10);
  expect((await buyer.api.put('/api/dispensary/settings', { data: { ...todayBody, licenseExpiry: yesterday } })).status()).toBe(400);
  expect((await buyer.api.put('/api/dispensary/settings', { data: { ...todayBody, licenseExpiry: '2030-02-31' } })).status()).toBe(400);
});

test('license dates remain valid through Vermont midnight across UTC and daylight-saving boundaries', () => {
  const expiry = '2026-09-17';
  expect(isLicenseExpired(expiry, new Date('2026-09-18T03:59:59Z'))).toBe(false);
  expect(isLicenseExpired(expiry, new Date('2026-09-18T04:00:00Z'))).toBe(true);
  expect(isLicenseExpired('2026-12-17', new Date('2026-12-18T04:59:59Z'))).toBe(false);
  expect(isLicenseExpired('2026-12-17', new Date('2026-12-18T05:00:00Z'))).toBe(true);
  expect(formatLicenseExpiry(expiry)).toBe('09/17/2026');
  expect(marketplaceGrowerWhere(new Date('2026-09-18T03:59:59Z'))).toEqual({ isVerified: true, OR: [{ licenseExpiry: null }, { licenseExpiry: { gte: new Date('2026-09-17T00:00:00Z') } }] });
});

test('product edits preserve profile fields and restore only eligible stock visibility', async () => {
  const owner = await account('GROWER'); const item = await product(owner.grower!.id, { inventoryQty: 0, isAvailable: false });
  const response = await owner.api.put(`/api/products/${item.id}`, { data: { thcMin: 10, thcMax: 20, cbdMin: 1, cbdMax: 2, harvestDate: '2026-08-01', inventoryQty: 4 } });
  expect(response.status(), await response.text()).toBe(200);
  const saved = await db.product.findUniqueOrThrow({ where: { id: item.id } });
  expect([Number(saved.thcMin), Number(saved.thcMax), Number(saved.cbdMin), Number(saved.cbdMax)]).toEqual([10,20,1,2]);
  expect(saved.harvestDate!.toISOString()).toContain('2026-08-01'); expect(saved.isAvailable).toBe(true);
  const draft = await product(owner.grower!.id, { inventoryQty: 0, isAvailable: false, status: 'DRAFT' });
  expect((await owner.api.post('/api/inventory', { data: { productId: draft.id, quantityAvailable: 4 } })).status()).toBe(201);
  expect((await db.product.findUniqueOrThrow({ where: { id: draft.id } })).isAvailable).toBe(false);
  expect((await owner.api.post('/api/inventory', { data: { productId: 'missing', quantityAvailable: 1 } })).status()).toBe(404);
});

test('checkout validates input, reports partial success, and blocks hidden prices without quotes', async () => {
  const one = await account('GROWER'); const two = await account('GROWER'); const buyer = await account('DISPENSARY');
  const available = await product(one.grower!.id); const soldOut = await product(two.grower!.id, { inventoryQty: 0 }); const hidden = await product(one.grower!.id, { isPriceVisible: false });
  expect((await buyer.api.post('/api/checkout', { data: '{broken', headers: { 'content-type': 'application/json' } })).status()).toBe(400);
  expect((await buyer.api.post('/api/checkout', { data: { items: [{ id: hidden.id, growerId: one.grower!.id, price: 0, quantity: 1 }] } })).status()).toBe(409);
  expect((await db.product.findUniqueOrThrow({ where: { id: hidden.id } })).inventoryQty).toBe(10);
  const response = await buyer.api.post('/api/checkout', { data: { items: [available,soldOut].map(item => ({ id: item.id, growerId: item.growerId, price: Number(item.price), quantity: 1 })) } });
  expect(response.status(), await response.text()).toBe(200);
  const data = await response.json(); expect(data.orders).toHaveLength(1); expect(data.orders[0].orderedProductIds).toEqual([available.id]); expect(data.orders[0].growerId).toBe(one.grower!.id); expect(data.issues[0].productId).toBe(soldOut.id);
  expect((await one.api.post('/api/orders', { data: { dispensaryId: buyer.dispensary!.id, items: [{ productId: available.id, quantity: 1, unitPrice: 1 }], shippingFee: -1 } })).status()).toBe(400);
});

test('overlapping cancellations restore inventory once and DELETE retains the order', async () => {
  const owner = await account('GROWER'); const buyer = await account('DISPENSARY'); const item = await product(owner.grower!.id, { inventoryQty: 0, isAvailable: false });
  const existing = await order(owner.grower!.id, buyer.dispensary!.id, item.id);
  const replies = await Promise.all([owner.api.delete(`/api/orders/${existing.id}`), owner.api.patch(`/api/orders/${existing.id}/status`, { data: { status: 'CANCELLED' } }), owner.api.patch('/api/orders/batch-status', { data: { orderIds: [existing.id], status: 'CANCELLED' } })]);
  for (const reply of replies) expect([200,409]).toContain(reply.status());
  const saved = await db.product.findUniqueOrThrow({ where: { id: item.id } }); expect(saved.inventoryQty).toBe(3); expect(saved.isAvailable).toBe(true);
  expect((await db.order.findUniqueOrThrow({ where: { id: existing.id } })).status).toBe('CANCELLED');
  expect(await db.orderStatusEvent.count({ where: { orderId: existing.id, toStatus: 'CANCELLED' } })).toBe(1);
});

test('message creation is race safe and incremental reads cannot impersonate system messages', async () => {
  const owner = await account('GROWER'); const stranger = await account('GROWER'); const buyer = await account('DISPENSARY'); const foreign = await product(stranger.grower!.id);
  const replies = await Promise.all([1,2].map(() => buyer.api.post('/api/messages/conversations', { data: { growerId: owner.grower!.id } })));
  const ids = await Promise.all(replies.map(async response => { expect([200,201], await response.text()).toContain(response.status()); return (await response.json()).conversationId; }));
  expect(ids[0]).toBe(ids[1]); const url = `/api/messages/conversations/${ids[0]}/messages`;
  expect((await buyer.api.post(url, { data: { body: 'spoofed', messageType: 'SYSTEM' } })).status()).toBe(400);
  expect((await buyer.api.post(url, { data: { body: 'foreign', productId: foreign.id } })).status()).toBe(400);
  expect((await buyer.api.post(url, { data: { body: 'x'.repeat(5001) } })).status()).toBe(400);
  const first = await (await buyer.api.post(url, { data: { body: 'first' } })).json();
  const second = await (await buyer.api.post(url, { data: { body: 'second' } })).json();
  const after = await (await buyer.api.get(`${url}?after=${encodeURIComponent(first.createdAt)}&afterId=${first.id}`)).json();
  expect(after.messages.map((row: {id:string}) => row.id)).toEqual([second.id]); expect(after.offerUpdates).toEqual([]);
  const readUrl = `/api/messages/conversations/${ids[0]}/read`;
  expect((await owner.api.post(readUrl, { data: {} })).status()).toBe(400);
  expect((await stranger.api.post(readUrl, { data: { throughMessageId: first.id } })).status()).toBe(403);
  expect((await buyer.api.post(readUrl, { data: { throughMessageId: first.id } })).status()).toBe(404);
  const sameTime = new Date(first.createdAt);
  await db.conversationMessage.update({ where: { id: second.id }, data: { createdAt: sameTime } });
  const [earlier, later] = [first.id, second.id].sort();
  const limited = await owner.api.post(readUrl, { data: { throughMessageId: earlier } });
  expect(limited.status(), await limited.text()).toBe(200); expect((await limited.json()).unreadCount).toBe(2);
  const complete = await owner.api.post(readUrl, { data: { throughMessageId: later } });
  expect((await complete.json()).unreadCount).toBe(0);
  const newer = await db.conversationMessage.create({ data: { conversationId: ids[0], senderUserId: buyer.id, body: 'not yet displayed', createdAt: new Date(sameTime.getTime() + 1000) } });
  const retry = await owner.api.post(readUrl, { data: { throughMessageId: earlier } });
  expect((await retry.json()).unreadCount).toBe(1);
  expect((await db.conversation.findUniqueOrThrow({ where: { id: ids[0] } })).growerLastReadAt).toEqual(sameTime);
  expect(newer.id).not.toBe(later);
});

test('billing deduplicates events and prevents old checkout or subscription events restoring access', async () => {
  const owner = await account('GROWER');
  const unsignedPayload = { id: `${prefix}-forged`, type: 'checkout.session.completed', data: { object: { mode: 'subscription', customer: 'cus_forged', subscription: 'sub_forged', metadata: { growerId: owner.grower!.id } } } };
  for (const headers of [{}, { 'stripe-signature': 'invalid' }] as Record<string, string>[]) {
    const rejected = await owner.api.post('/api/stripe/webhooks', { data: unsignedPayload, headers });
    expect([400, 503]).toContain(rejected.status());
  }
  expect((await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } })).stripeCustomerId).toBeNull();
  STRIPE_CONFIG.proPriceId = 'price_review_pro';
  function event(type: string, created: number, object: unknown) {
    const id = `${prefix}-event-${++sequence}`; eventIds.push(id);
    return { id, type, created, data: { object } } as Stripe.Event;
  }
  const subscription = { id: 'sub_review', customer: 'cus_review', metadata: { growerId: owner.grower!.id, plan: 'malicious-plan' }, status: 'active', cancel_at_period_end: false, items: { data: [{ price: { id: STRIPE_CONFIG.proPriceId }, current_period_end: 1900000000 }] } } as unknown as Stripe.Subscription;
  const active = event('customer.subscription.updated', 100, subscription);
  expect(await applySubscriptionEvent(active, subscription)).toBe('processed'); expect(await applySubscriptionEvent(active, subscription)).toBe('duplicate');
  expect(getGrowerPlan(await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } }))).toBe('pro');
  await applySubscriptionEvent(event('customer.subscription.deleted', 200, subscription), { ...subscription, status: 'canceled' });
  await applySubscriptionEvent(event('checkout.session.completed', 150, { mode: 'subscription', customer: 'cus_old', subscription: 'sub_old', metadata: { growerId: owner.grower!.id, plan: 'business' } }));
  await applySubscriptionEvent(event('customer.subscription.updated', 100, subscription), subscription);
  const saved = await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } });
  expect(saved.subscriptionPlan).toBe('free'); expect(saved.subscriptionStatus).toBe('canceled'); expect(saved.stripeSubscriptionId).toBe('sub_review'); expect(getGrowerPlan(saved)).toBe('free');
  expect(getGrowerPlan({ subscriptionPlan: 'business', subscriptionStatus: 'unpaid' })).toBe('free');
  expect(await applySubscriptionEvent(event('checkout.session.completed', 300, { mode: 'subscription', metadata: { growerId: 'missing' } }))).toBe('processed');
});

test('subscription checkout serializes plan changes and recovers ambiguous Stripe responses without duplicates', async () => {
  const owner = await account('GROWER');
  STRIPE_CONFIG.proPriceId = 'price_review_pro'; STRIPE_CONFIG.businessPriceId = 'price_review_business';
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const idempotency = new Map<string, { body: string; session: Stripe.Checkout.Session }>();
  let createdCustomers = 0; let ambiguousResponse = false;
  const fakeStripe = {
    customers: { create: async () => ({ id: `cus_review_${++createdCustomers}` }) },
    checkout: { sessions: {
      retrieve: async (id: string) => sessions.get(id),
      expire: async (id: string) => { const session = sessions.get(id)!; if (session.status !== 'open') throw new Error('Cannot expire a completed session'); session.status = 'expired'; return session; },
      create: async (params: Stripe.Checkout.SessionCreateParams, options: Stripe.RequestOptions) => {
        const key = options.idempotencyKey!; const body = JSON.stringify(params); const prior = idempotency.get(key);
        if (prior) { if (prior.body !== body) throw new Error('Idempotency parameters differ'); return prior.session; }
        await new Promise(resolve => setTimeout(resolve, 25));
        const id = `cs_review_${sessions.size + 1}`;
        const session = { id, url: `https://checkout.stripe.test/${id}`, status: 'open', metadata: params.metadata, subscription: null } as Stripe.Checkout.Session;
        sessions.set(id, session); idempotency.set(key, { body, session });
        if (ambiguousResponse) { ambiguousResponse = false; throw new Error('Connection lost after creation'); }
        return session;
      },
    } },
  } as unknown as Stripe;
  const same = await Promise.all([1, 2].map(() => beginSubscriptionCheckout(owner.grower!.id, 'pro', fakeStripe)));
  expect(same[0]).toBe(same[1]); expect(sessions.size).toBe(1); expect(createdCustomers).toBe(1);
  await Promise.all(['business', 'pro'].map(plan => beginSubscriptionCheckout(owner.grower!.id, plan as 'pro' | 'business', fakeStripe)));
  expect([...sessions.values()].filter(row => row.status === 'open')).toHaveLength(1);
  const pendingId = (await db.grower.findUniqueOrThrow({ where: { id: owner.grower!.id } })).stripeCheckoutSessionId!;
  const completed = sessions.get(pendingId)!; completed.status = 'complete'; completed.subscription = 'sub_checkout_review';
  await expect(beginSubscriptionCheckout(owner.grower!.id, 'business', fakeStripe)).rejects.toMatchObject({ status: 409 });
  await db.grower.update({ where: { id: owner.grower!.id }, data: { stripeSubscriptionId: 'sub_checkout_review', subscriptionStatus: 'canceled', subscriptionEventCreatedAt: 500 } });
  ambiguousResponse = true;
  const before = sessions.size;
  await expect(beginSubscriptionCheckout(owner.grower!.id, 'business', fakeStripe)).rejects.toThrow('Connection lost');
  await expect(beginSubscriptionCheckout(owner.grower!.id, 'pro', fakeStripe)).rejects.toThrow('Idempotency parameters differ');
  await beginSubscriptionCheckout(owner.grower!.id, 'business', fakeStripe);
  expect(sessions.size).toBe(before + 1);
  expect([...sessions.values()].filter(row => row.status === 'open')).toHaveLength(1);
  await db.grower.update({ where: { id: owner.grower!.id }, data: { subscriptionStatus: 'active' } });
  await expect(beginSubscriptionCheckout(owner.grower!.id, 'pro', fakeStripe)).rejects.toMatchObject({ status: 409 });
});


test('authentication normalizes email, refreshes roles, and enforces atomic rate limits', async () => {
  const owner = await account('GROWER');
  await db.user.update({ where: { id: owner.id }, data: { passwordHash: await bcrypt.hash('a-valid-password-123', 10) } });
  const provider = authOptions.providers[0] as unknown as { options: { authorize: (credentials: unknown, request: unknown) => Promise<{ id: string; email: string } | null> } };
  const signedIn = await provider.options.authorize({ email: `  ${owner.email.toUpperCase()} `, password: 'a-valid-password-123' }, { headers: { 'x-forwarded-for': prefix } });
  expect(signedIn?.id).toBe(owner.id);
  const counts = await Promise.all(Array.from({ length: 9 }, () => consumeAuthLimit('review-counter', prefix, 3, 60)));
  expect(counts.filter(Boolean)).toHaveLength(3);
  const jwt = authOptions.callbacks!.jwt as unknown as (params: unknown) => Promise<{ role: string; email: string; growerId?: string }>;
  await db.user.update({ where: { id: owner.id }, data: { role: 'ADMIN', email: `${prefix}-role@example.test` } });
  const refreshed = await jwt({ token: { id: owner.id, role: 'GROWER', email: owner.email, sessionVersion: owner.sessionVersion, refreshedAt: 0 }, trigger: 'update' });
  expect(refreshed.role).toBe('ADMIN'); expect(refreshed.email).toBe(`${prefix}-role@example.test`);
});

test('concurrent registration is non-enumerating and creates one unverified account with consistent business-name fallback', async ({ request }) => {
  expect(process.env.AUTH_MAIL_PROVIDER, 'Registration regression must use the local captured-mail adapter.').toBe('local-test');
  const data = { email: `${prefix}-register@example.test`, password: 'a-valid-password-123', firstName: 'New', lastName: 'Business', businessName: '', businessType: 'dispensary' };
  const responses = await Promise.all([1,2].map(() => request.post('/api/auth/register', { data, headers: { 'x-forwarded-for': `${prefix}-register` } })));
  expect(responses.map(response => response.status())).toEqual([201, 201]);
  const bodies = await Promise.all(responses.map(response => response.json()));
  expect(bodies[0]).toEqual(bodies[1]);
  expect(Object.keys(bodies[0]).sort()).toEqual(['message', 'success']);
  expect(bodies[0]).toMatchObject({ success: true, message: expect.any(String) });
  for (const response of responses) expect(response.headers()['set-cookie']).toBeUndefined();
  await expect.poll(() => db.user.count({ where: { email: data.email } }), { timeout: 15000 }).toBe(1);
  const saved = await db.user.findUniqueOrThrow({ where: { email: data.email }, include: { dispensary: true } });
  expect(saved.dispensary?.businessName).toBe('New Business');
  expect(saved.emailVerifiedAt).toBeNull();
  expect(saved.sessionVersion).toBe(0);
  expect((await request.post('/api/auth/register', { data: { ...data, email: `${prefix}-register-short@example.test`, password: 'short' }, headers: { 'x-forwarded-for': `${prefix}-register` } })).status()).toBe(400);
});

test('product summaries tolerate invalid sort/pagination and upload references cannot target another grower', async () => {
  const owner = await account('GROWER'); const stranger = await account('GROWER');
  const item = await product(owner.grower!.id, { images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n3sAAAAASUVORK5CYII='], description: 'Private full description' });
  const response = await owner.api.get('/api/products?sortBy=bad-key&sortOrder=bad&paged=true&page=2&pageSize=2.5');
  expect(response.status(), await response.text()).toBe(200);
  const data = await response.json(); expect(data.total).toBe(1); expect(data.products).toHaveLength(1); expect(data.products[0].description).toBeUndefined(); expect(data.products[0].images).toEqual([]);
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n3sAAAAASUVORK5CYII=', 'base64');
  expect((await stranger.api.post('/api/products/upload', { multipart: { productId: item.id, file: { name: 'image.png', mimeType: 'image/png', buffer: bytes } } })).status()).toBe(404);
  expect((await stranger.api.post('/api/products/upload-document', { multipart: { productId: item.id, file: { name: 'lab.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') } } })).status()).toBe(404);
  expect((await owner.api.patch('/api/grower/settings', { data: { logo: { invalid: true } } })).status()).toBe(400);
});

test('hidden-price quote must cover the full order quantity and offer acceptance is claimed once', async () => {
  const owner = await account('GROWER'); const buyer = await account('DISPENSARY'); const item = await product(owner.grower!.id, { isPriceVisible: false });
  const conversation = await db.conversation.create({ data: { growerId: owner.grower!.id, dispensaryId: buyer.dispensary!.id, productId: item.id, createdByUserId: owner.id } });
  const offer = await db.conversationMessage.create({ data: { conversationId: conversation.id, senderUserId: owner.id, productId: item.id, messageType: 'OFFER', body: 'Quote', offerStatus: 'PENDING', offerQuantity: 1, offerUnitPrice: 10 } });
  const accepted = await Promise.all([1,2].map(() => buyer.api.post(`/api/messages/messages/${offer.id}/offer-action`, { data: { action: 'ACCEPT' } })));
  expect(accepted.map(response => response.status()).sort()).toEqual([200,409]);
  expect(await db.acceptedQuote.count({ where: { messageId: offer.id } })).toBe(1);
  const data = { items: [{ id: item.id, growerId: owner.grower!.id, price: 0, quantity: 2 }] };
  expect((await buyer.api.post('/api/checkout', { data })).status()).toBe(409);
  expect((await db.product.findUniqueOrThrow({ where: { id: item.id } })).inventoryQty).toBe(10);
  expect((await db.acceptedQuote.findUniqueOrThrow({ where: { messageId: offer.id } })).consumedByOrderId).toBeNull();
  data.items[0].quantity = 1;
  expect((await buyer.api.post('/api/checkout', { data })).status()).toBe(200);
});
