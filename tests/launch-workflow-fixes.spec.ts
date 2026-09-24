import { test, expect, type Page } from '@playwright/test';
import { PrismaClient, type OrderStatus, type UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const database = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)
  || database.hostname !== 'localhost' || !database.pathname.startsWith('/phenofarm_auth_')) {
  throw new Error('Launch regressions require a local app and isolated phenofarm_auth_ database.');
}
const db = new PrismaClient();
const prefix = `launch-fixes-${Date.now()}`;
const screenshots = process.env.LAUNCH_FIX_SCREENSHOTS;
if (screenshots) mkdirSync(screenshots, { recursive: true });
test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', video: 'off' });
test.setTimeout(90_000);

async function account(role: UserRole = 'GROWER') {
  const email = `${prefix}-${randomUUID()}@example.test`, password = `QA-${randomUUID()}`;
  const user = await db.user.create({ data: {
    email, name: 'QA launch verification', role, emailVerifiedAt: new Date(), passwordHash: await bcrypt.hash(password, 10),
    ...(role === 'GROWER' ? { grower: { create: { businessName: 'QA Grower', licenseNumber: 'QA-TEST', licenseExpiry: new Date('2030-12-31'), isVerified: true } } }
      : role === 'DISPENSARY' ? { dispensary: { create: { businessName: 'QA Buyer', licenseNumber: 'QA-TEST', licenseExpiry: new Date('2030-12-31'), licenseState: 'VT', isVerified: true, licenseStatus: 'verified' } } } : {}),
  }, include: { grower: true, dispensary: true } });
  return { ...user, password };
}
async function login(page: Page, user: Awaited<ReturnType<typeof account>>) {
  await page.goto('/auth/sign_in');
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill(user.password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(/\/(grower|dispensary|admin)\//);
  expect((await (await page.request.get('/api/auth/session')).json()).user.id).toBe(user.id);
}
async function capture(page: Page, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (screenshots) await page.screenshot({ path: `${screenshots}/${name}.png`, fullPage: true, animations: 'disabled' });
}
test.afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { startsWith: prefix } }, include: { grower: true, dispensary: true } });
  const growers = users.flatMap(u => u.grower ? [u.grower.id] : []), buyers = users.flatMap(u => u.dispensary ? [u.dispensary.id] : []);
  const ownership = { OR: [{ growerId: { in: growers } }, { dispensaryId: { in: buyers } }] };
  await db.order.deleteMany({ where: ownership });
  await db.conversation.deleteMany({ where: ownership });
  await db.product.deleteMany({ where: { growerId: { in: growers } } });
  await db.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } });
  await db.$disconnect();
});

for (const width of [1440, 390]) test(`grower profile saves, reloads, and protects login email at ${width}px`, async ({ page }) => {
  const user = await account();
  await page.setViewportSize({ width, height: 1000 });
  await login(page, user);
  await page.goto('/grower/settings');
  await expect(page.locator('#profile-email')).toHaveValue(user.email);
  await expect(page.locator('#profile-email')).toHaveAttribute('readonly', '');
  await page.locator('#profile-businessName').fill('QA updated grower');
  await page.locator('#profile-contactName').fill('QA updated contact');
  const response = page.waitForResponse(r => r.url().endsWith('/api/grower/settings') && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Save profile', exact: true }).filter({ visible: true }).first().click();
  const saved = await response;
  expect(saved.status(), await saved.text()).toBe(200);
  await expect(page.getByText('Settings saved successfully!', { exact: true })).toBeVisible();
  await capture(page, `profile-saved-${width}`);
  await page.reload();
  await expect(page.locator('#profile-businessName')).toHaveValue('QA updated grower');
  await expect(page.locator('#profile-contactName')).toHaveValue('QA updated contact');
  await expect(page.locator('#profile-email')).toHaveValue(user.email);
  const malicious = await page.request.put('/api/grower/settings', { data: { ...saved.request().postDataJSON(), email: 'other@example.test' } });
  expect(malicious.status()).toBe(400);
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { grower: true } });
  expect(current.email).toBe(user.email);
  expect(current.grower?.businessName).toBe('QA updated grower');
  expect(current.grower?.isVerified).toBe(true);
});

async function product(grower: Awaited<ReturnType<typeof account>>, stock = 10, hidden = false) {
  return db.product.create({ data: { growerId: grower.grower!.id, name: 'QA request product', productType: 'Flower', price: 12, inventoryQty: stock,
    status: 'PUBLISHED', isAvailable: true, isPriceVisible: !hidden, unit: 'Gram', images: [] } });
}
const checkoutItem = (item: Awaited<ReturnType<typeof product>>, quantity = 1) => ({ id: item.id, growerId: item.growerId, price: 12, quantity });
async function quote(grower: Awaited<ReturnType<typeof account>>, buyer: Awaited<ReturnType<typeof account>>, item: Awaited<ReturnType<typeof product>>, quantity: number) {
  const conversation = await db.conversation.create({ data: { growerId: grower.grower!.id, dispensaryId: buyer.dispensary!.id, productId: item.id, createdByUserId: grower.id } });
  const offer = await db.conversationMessage.create({ data: { conversationId: conversation.id, senderUserId: grower.id, messageType: 'OFFER', productId: item.id, body: 'QA quote', offerQuantity: quantity, offerUnitPrice: 7.5, offerStatus: 'ACCEPTED' } });
  return db.acceptedQuote.create({ data: { conversationId: conversation.id, messageId: offer.id, growerId: grower.grower!.id, dispensaryId: buyer.dispensary!.id, productId: item.id, quantity, unitPrice: 7.5, expiresAt: new Date(Date.now() + 3600_000) } });
}

test('request receipts deduplicate concurrent retries and preserve consumed quotes after sellout', async ({ page }) => {
  const grower = await account(), buyer = await account('DISPENSARY');
  const item = await product(grower, 2, true); const accepted = await quote(grower, buyer, item, 2);
  await login(page, buyer);
  const key = randomUUID(), data = { items: [checkoutItem(item, 2)], notes: 'Net 30\nBuyer notes: Keep this agreement' };
  expect((await page.request.post('/api/checkout', { data })).status()).toBe(400);
  const responses = await Promise.all(Array.from({ length: 8 }, () => page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } })));
  for (const response of responses) expect(response.status(), await response.text()).toBe(200);
  const bodies = await Promise.all(responses.map(response => response.json()));
  for (const body of bodies) expect(body).toEqual(bodies[0]);
  expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(1);
  expect((await db.product.findUniqueOrThrow({ where: { id: item.id } })).inventoryQty).toBe(0);
  expect((await db.acceptedQuote.findUniqueOrThrow({ where: { id: accepted.id } })).consumedByOrderId).toBe(bodies[0].orders[0].id);
  expect(Number((await db.order.findUniqueOrThrow({ where: { id: bodies[0].orders[0].id } })).totalAmount)).toBe(15);
  expect(await db.notification.count({ where: { userId: grower.id, type: 'ORDER_CREATED' } })).toBe(1);
  const replay = await page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
  expect(await replay.json()).toEqual(bodies[0]);
  expect((await page.request.post('/api/checkout', { data: { ...data, notes: 'Changed agreement' }, headers: { 'Idempotency-Key': key } })).status()).toBe(409);
});

test('partial requests resume failed growers without repeating successful orders and isolate buyers', async ({ page, browser }) => {
  const one = await account(), two = await account(), buyer = await account('DISPENSARY'), otherBuyer = await account('DISPENSARY');
  const a = await product(one), b = await product(two, 0); const key = randomUUID();
  const data = { items: [checkoutItem(a), checkoutItem(b)] };
  await login(page, buyer);
  const first = await page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
  expect(first.status(), await first.text()).toBe(200); expect((await first.json()).orders).toHaveLength(1);
  await db.product.update({ where: { id: b.id }, data: { inventoryQty: 4 } });
  const second = await page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
  expect(second.status(), await second.text()).toBe(200); expect((await second.json()).orders).toHaveLength(2);
  expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(2);
  expect((await db.product.findUniqueOrThrow({ where: { id: a.id } })).inventoryQty).toBe(9);
  const context = await browser.newContext(), otherPage = await context.newPage();
  try {
    await login(otherPage, otherBuyer);
    const isolated = await otherPage.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
    expect(isolated.status(), await isolated.text()).toBe(200);
    expect((await isolated.json()).orders[0].id).not.toBe((await first.json()).orders[0].id);
  } finally { await context.close(); }
  const another = await page.request.post('/api/checkout', { data: { items: [checkoutItem(a)] }, headers: { 'Idempotency-Key': randomUUID() } });
  expect(another.status(), await another.text()).toBe(200);
  expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(3);
});

for (const width of [1440, 390]) test(`lost response is recovered after reload without duplicate order at ${width}px`, async ({ page }) => {
  const grower = await account(), buyer = await account('DISPENSARY'); const item = await product(grower, 2, true); const accepted = await quote(grower, buyer, item, 2);
  await page.setViewportSize({ width, height: 1000 }); await login(page, buyer);
  await page.evaluate(({ item, accepted }) => localStorage.setItem('phenofarm-cart', JSON.stringify({ items: [{ ...item, name: 'QA request product', grower: 'QA Grower', maxQty: 2, acceptedQuoteId: accepted.id, quotedQuantity: 2, quotedUnitPrice: 7.5, unit: 'Gram' }] })), { item: checkoutItem(item, 2), accepted: { id: accepted.id } });
  let responseDropped = false;
  await page.route('**/api/checkout', async route => {
    const response = await route.fetch(); expect(response.status(), await response.text()).toBe(200);
    responseDropped = true; await route.abort('failed');
  }, { times: 1 });
  await page.goto('/dispensary/cart');
  await page.getByRole('button', { name: /^Review request$/i }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Check request', exact: true })).toBeVisible();
  expect(responseDropped).toBe(true); await capture(page, `request-recovery-${width}`);
  const keyBefore = await page.evaluate(id => JSON.parse(localStorage.getItem(`phenofarm:pending-request:${id}`)!).key, buyer.id);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Check request', exact: true })).toBeVisible();
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem(`phenofarm:pending-request:${id}`)!).key, buyer.id)).toBe(keyBefore);
  await page.getByRole('button', { name: 'Check request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Request submitted', exact: true })).toBeVisible(); await capture(page, `request-recovered-${width}`);
  expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(1);
  expect((await db.product.findUniqueOrThrow({ where: { id: item.id } })).inventoryQty).toBe(0);
  expect(await page.evaluate(id => localStorage.getItem(`phenofarm:pending-request:${id}`), buyer.id)).toBeNull();
});

test('server failure after a partial commit recovers with the same receipt and rolls back failed inventory', async ({ page }) => {
  const one = await account(), two = await account(), buyer = await account('DISPENSARY');
  const a = await product(one), b = await product(two), key = randomUUID();
  await login(page, buyer);
  const data = { items: [checkoutItem(a, 2), checkoutItem(b, 3)], notes: 'QA failure recovery' };
  // Local-only suite guard above; throw before the second grower order commits.
  await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION launch_order_failure() RETURNS trigger AS $$ BEGIN IF NEW."growerId" = '${two.grower!.id}' THEN RAISE EXCEPTION 'QA injected storage failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`);
  await db.$executeRawUnsafe('CREATE TRIGGER launch_order_failure BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION launch_order_failure()');
  try {
    const failed = await page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
    expect(failed.status(), await failed.text()).toBe(503);
    expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(1);
    expect((await db.product.findUniqueOrThrow({ where: { id: a.id } })).inventoryQty).toBe(8);
    expect((await db.product.findUniqueOrThrow({ where: { id: b.id } })).inventoryQty).toBe(10);
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS launch_order_failure ON orders');
    await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS launch_order_failure()');
  }
  const recovered = await page.request.post('/api/checkout', { data, headers: { 'Idempotency-Key': key } });
  expect(recovered.status(), await recovered.text()).toBe(200);
  expect((await recovered.json()).orders).toHaveLength(2);
  expect(await db.order.count({ where: { dispensaryId: buyer.dispensary!.id } })).toBe(2);
  expect((await db.product.findUniqueOrThrow({ where: { id: a.id } })).inventoryQty).toBe(8);
  expect((await db.product.findUniqueOrThrow({ where: { id: b.id } })).inventoryQty).toBe(7);
});

async function recordedOrder(grower: Awaited<ReturnType<typeof account>>, buyer: Awaited<ReturnType<typeof account>>, status: OrderStatus = 'DELIVERED') {
  const item = await product(grower);
  return db.order.create({ data: { orderId: `QA-${randomUUID()}`, growerId: grower.grower!.id, dispensaryId: buyer.dispensary!.id,
    status, totalAmount: 24, subtotal: 24, notes: 'Fulfillment method: Pickup\nRequested window: Friday 10:00\nPayment terms: Net 30\nBuyer notes: Keep the original agreement',
    items: { create: { productId: item.id, growerId: item.growerId, quantity: 2, unitPrice: 12, totalPrice: 24 } } } });
}

for (const width of [1440, 390]) {
  for (const status of ['SHIPPED', 'DELIVERED', 'CANCELLED'] as const) {
    test(`locked order editor preserves items and pricing for ${status} at ${width}px`, async ({ page }) => {
      const grower = await account(), buyer = await account('DISPENSARY');
      const order = await recordedOrder(grower, buyer, status);
      await db.order.update({ where: { id: order.id }, data: { shippingFee: 5, tax: 2, totalAmount: 31 } });
      const line = await db.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
      const stock = (await db.product.findUniqueOrThrow({ where: { id: line.productId } })).inventoryQty;
      await page.setViewportSize({ width, height: 1000 });
      await login(page, grower);
      await page.goto(`/grower/orders/${order.id}/edit`);
      await expect(page.getByRole('button', { name: '+', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: '-', exact: true })).toHaveCount(0);
      await expect(page.getByTitle('Remove item')).toHaveCount(0);
      await expect(page.getByRole('spinbutton')).toHaveCount(0);
      await expect(page.getByText('2 g × $12.00', { exact: true })).toBeVisible();
      await expect(page.getByText('$31.00', { exact: true }).first()).toBeVisible();
      await capture(page, `locked-editor-${status}-${width}`);

      // Hidden controls do not replace the server's protection against forged edits.
      for (const data of [{ items: [{ id: line.id, quantity: 3 }] }, { shippingFee: 6 }, { tax: 3 }]) {
        expect((await page.request.put(`/api/orders/${order.id}`, { data })).status()).toBe(409);
      }
      const notes = `${order.notes}\nSettlement recorded: reference QA-2042`;
      await page.getByPlaceholder('Instructions or notes', { exact: true }).fill(notes);
      const response = page.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}`) && r.request().method() === 'PUT');
      await page.getByRole('button', { name: 'Save changes', exact: true }).filter({ visible: true }).first().click();
      const saved = await response;
      expect(saved.status(), await saved.text()).toBe(200);
      expect(saved.request().postDataJSON()).toEqual({ status, notes });
      await page.waitForURL(`**/grower/orders/${order.id}`);
      await page.reload();
      await expect(page.getByText('Keep the original agreement', { exact: false })).toContainText('QA-2042');
      const persisted = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
      expect(persisted.notes).toBe(notes);
      expect(persisted.status).toBe(status);
      expect(persisted.items).toEqual([line]);
      expect([persisted.subtotal, persisted.shippingFee, persisted.tax, persisted.totalAmount].map(Number)).toEqual([24, 5, 2, 31]);
      expect((await db.product.findUniqueOrThrow({ where: { id: line.productId } })).inventoryQty).toBe(stock);

      if (status === 'SHIPPED') {
        await page.goto(`/grower/orders/${order.id}/edit`);
        await page.getByText('Delivered', { exact: true }).click();
        const delivery = page.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}`) && r.request().method() === 'PUT');
        await page.getByRole('button', { name: 'Save changes', exact: true }).filter({ visible: true }).first().click();
        expect((await delivery).status()).toBe(200);
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('DELIVERED');
      }
    });
  }

  for (const status of ['PENDING', 'CONFIRMED', 'PROCESSING'] as const) {
    test(`active order editor saves quantity and pricing for ${status} at ${width}px`, async ({ page }) => {
      const grower = await account(), buyer = await account('DISPENSARY');
      const order = await recordedOrder(grower, buyer, status);
      const line = await db.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
      await page.setViewportSize({ width, height: 1000 });
      await login(page, grower);
      await page.goto(`/grower/orders/${order.id}/edit`);
      await expect(page.getByTitle('Remove item').filter({ visible: true })).toBeVisible();
      await page.getByRole('button', { name: '+', exact: true }).filter({ visible: true }).click();
      await page.getByLabel('Shipping ($)', { exact: true }).fill('5');
      await page.getByLabel('Tax ($)', { exact: true }).fill('2');
      await capture(page, `active-editor-${status}-${width}`);
      const response = page.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}`) && r.request().method() === 'PUT');
      await page.getByRole('button', { name: 'Save changes', exact: true }).filter({ visible: true }).first().click();
      const saved = await response; expect(saved.status(), await saved.text()).toBe(200);
      const persisted = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
      expect(persisted.status).toBe(status);
      expect(persisted.items[0].quantity).toBe(3);
      expect([persisted.subtotal, persisted.shippingFee, persisted.tax, persisted.totalAmount].map(Number)).toEqual([36, 5, 2, 43]);
      expect((await db.product.findUniqueOrThrow({ where: { id: line.productId } })).inventoryQty).toBe(9);
    });
  }
}

for (const width of [1440, 390]) test(`saved settlement notes remain visible for both businesses at ${width}px`, async ({ page, browser }) => {
  const grower = await account(), buyer = await account('DISPENSARY'), order = await recordedOrder(grower, buyer);
  const longGrowerName = 'QA Grower with a long business name ' + 'LongName'.repeat(12);
  await db.grower.update({ where: { id: grower.grower!.id }, data: { businessName: longGrowerName } });
  const appended = '\nSecond buyer note\n\nSettlement recorded directly: check #1042, reference "QA"\nPayment terms: buyer requested a follow-up receipt';
  await page.setViewportSize({ width, height: 1000 }); await login(page, grower);
  await page.goto(`/grower/orders/${order.id}/edit`);
  await page.getByPlaceholder('Instructions or notes', { exact: true }).fill(order.notes + appended);
  const response = page.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}`) && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Save changes', exact: true }).filter({ visible: true }).first().click();
  const saved = await response; expect(saved.status(), await saved.text()).toBe(200);
  await page.goto(`/grower/orders/${order.id}`); await page.reload();
  await expect(page.getByText('Keep the original agreement', { exact: false })).toContainText('check #1042');
  await expect(page.getByText('Keep the original agreement', { exact: false })).toContainText('Payment terms: buyer requested a follow-up receipt');
  await expect(page.getByText('Net 30', { exact: true })).toBeVisible();
  await capture(page, `grower-notes-${width}`);
  const context = await browser.newContext({ viewport: { width, height: 1000 } }); const buyerPage = await context.newPage();
  try {
    await login(buyerPage, buyer); await buyerPage.goto(`/dispensary/orders/${order.id}`); await buyerPage.reload();
    await expect(buyerPage.getByText('Keep the original agreement', { exact: false })).toContainText('Second buyer note');
    await expect(buyerPage.getByText('Keep the original agreement', { exact: false })).toContainText('check #1042');
    await expect(buyerPage.getByText('Net 30', { exact: true })).toBeVisible();
    const growerLabel = buyerPage.getByText(longGrowerName, { exact: true }).first();
    await expect(growerLabel).toBeVisible();
    const bounds = await growerLabel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await growerLabel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const dateRow = buyerPage.getByText('Request date', { exact: true }).locator('..');
    expect(await dateRow.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await capture(buyerPage, `buyer-notes-${width}`);
  } finally { await context.close(); }
  const persisted = await db.order.findUniqueOrThrow({ where: { id: order.id } });
  expect(persisted.notes).toBe(order.notes + appended); expect(persisted.status).toBe('DELIVERED'); expect(Number(persisted.totalAmount)).toBe(24);
});

for (const width of [1440, 390]) test(`CSV preserves settlement details without asserting payment at ${width}px`, async ({ page, browser }) => {
  const grower = await account(), buyer = await account('DISPENSARY'), order = await recordedOrder(grower, buyer, 'PENDING');
  const note = 'Keep the original agreement\nReference "check #1042", follow up Friday\nSecond line';
  await db.order.update({ where: { id: order.id }, data: { notes: order.notes + '\nReference "check #1042", follow up Friday\nSecond line' } });
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  const buyerPage = await context.newPage();
  await page.setViewportSize({ width, height: 1000 });
  try {
    for (const [target, user, path] of [[page, grower, 'grower'], [buyerPage, buyer, 'dispensary']] as const) {
      await login(target, user); await target.goto(`/${path}/orders/${order.id}`);
      if (path === 'grower') await target.getByText('Actions', { exact: true }).click();
      const download = target.waitForEvent('download');
      await target.getByRole('button', { name: 'Export CSV', exact: true }).filter({ visible: true }).first().click();
      const file = await download; const stream = await file.createReadStream(); const chunks = [];
      for await (const chunk of stream!) chunks.push(chunk);
      const { parse } = await import('csv-parse/sync');
      const rows = parse<Record<string, string>>(Buffer.concat(chunks).toString(), { columns: true });
      expect(rows).toHaveLength(1); expect(rows[0]['Status']).toBe('Submitted');
      expect(rows[0]['Fulfillment method']).toBe('Pickup'); expect(rows[0]['Requested window']).toBe('Friday 10:00');
      expect(rows[0]['Payment terms']).toBe('Net 30'); expect(rows[0]['Notes']).toBe(note);
      expect(rows[0]['Settlement']).toContain('payment status not tracked'); expect(rows[0]['Settlement']).not.toContain('Settled');
      expect(rows[0]['Total']).toBe('24.00'); await capture(target, `${path}-csv-${width}`);
    }
    await db.order.update({ where: { id: order.id }, data: { notes: '=HYPERLINK("https://example.test", "unsafe formula")' } });
    await buyerPage.reload(); const download = buyerPage.waitForEvent('download');
    await buyerPage.getByRole('button', { name: 'Export CSV', exact: true }).click();
    const stream = await (await download).createReadStream(); const chunks = []; for await (const chunk of stream!) chunks.push(chunk);
    const { parse } = await import('csv-parse/sync'); const rows = parse<Record<string, string>>(Buffer.concat(chunks).toString(), { columns: true });
    expect(rows[0]['Notes'].startsWith("'=HYPERLINK")).toBe(true);
  } finally { await context.close(); }
});

for (const role of ['GROWER', 'DISPENSARY'] as const) for (const width of [1440, 390]) test(`approval retries preserve ${role} access at ${width}px`, async ({ page }) => {
  const admin = await account('ADMIN'), owner = await account(role);
  const kind = role === 'GROWER' ? 'growers' : 'dispensaries'; const id = owner.grower?.id || owner.dispensary!.id;
  const profile = role === 'GROWER'
    ? await db.grower.update({ where: { id }, data: { isVerified: false } })
    : await db.dispensary.update({ where: { id }, data: { isVerified: false, licenseStatus: 'pending_review', verifiedAt: null } });
  const decision = { verified: true, expectedUpdatedAt: profile.updatedAt.toISOString() }; const url = `/admin/${kind}/${id}/verify`;
  await page.setViewportSize({ width, height: 1000 }); await login(page, admin);
  await page.goto(`/admin/${kind}?q=${encodeURIComponent(owner.email)}`);
  expect((await page.request.post(url, { data: {}, headers: { Accept: 'application/json' } })).status()).toBe(400);
  await page.getByRole('button', { name: /^Verify(?: grower| dispensary)?$/ }).filter({ visible: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, `approval-dialog-${kind}-${width}`);
  await page.route(`**${url}`, async route => {
    const response = await route.fetch(); expect(response.status(), await response.text()).toBe(200); await route.abort('failed');
  }, { times: 1 });
  await page.getByRole('dialog').getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Verify', exact: true })).toBeEnabled();
  await page.getByRole('dialog').getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Unverify', exact: true }).filter({ visible: true }).first()).toBeVisible();
  const repeated = await Promise.all(Array.from({ length: 3 }, () => page.request.post(url, { data: decision, headers: { Accept: 'application/json' } })));
  for (const response of repeated) expect(response.status(), await response.text()).toBe(200);
  expect(await db.notification.count({ where: { userId: owner.id, type: 'VERIFICATION_DECISION' } })).toBe(1);
  await page.reload(); await capture(page, `approval-confirmed-${kind}-${width}`);
  const approved = role === 'GROWER' ? await db.grower.findUniqueOrThrow({ where: { id } }) : await db.dispensary.findUniqueOrThrow({ where: { id } });
  expect(approved.isVerified).toBe(true);
  if ('licenseStatus' in approved) { expect(approved.licenseStatus).toBe('verified'); expect(approved.verifiedAt).not.toBeNull(); }
  const revoke = { verified: false, expectedUpdatedAt: approved.updatedAt.toISOString() };
  for (let i = 0; i < 2; i++) expect((await page.request.post(url, { data: revoke, headers: { Accept: 'application/json' } })).status()).toBe(200);
  expect((await page.request.post(url, { data: decision, headers: { Accept: 'application/json' } })).status()).toBe(409);
  const revoked = role === 'GROWER' ? await db.grower.findUniqueOrThrow({ where: { id } }) : await db.dispensary.findUniqueOrThrow({ where: { id } });
  expect(revoked.isVerified).toBe(false);
  expect(await db.notification.count({ where: { userId: owner.id, type: 'VERIFICATION_DECISION' } })).toBe(2);
  if ('licenseStatus' in revoked) { expect(revoked.licenseStatus).toBe('pending_review'); expect(revoked.verifiedAt).toBeNull(); }
});

test('approval requires admin access, reviews changed licenses, and repairs inconsistent buyer approval', async ({ page }) => {
  const admin = await account('ADMIN'), buyer = await account('DISPENSARY'); const id = buyer.dispensary!.id;
  const url = `/admin/dispensaries/${id}/verify`;
  await login(page, buyer);
  expect((await page.request.post(url, { data: { verified: true, expectedUpdatedAt: buyer.dispensary!.updatedAt.toISOString() } })).status()).toBe(401);
  await page.context().clearCookies(); await login(page, admin);
  const inconsistent = await db.dispensary.update({ where: { id }, data: { isVerified: true, licenseStatus: 'pending_review', verifiedAt: null } });
  const repaired = await page.request.post(url, { data: { verified: true, expectedUpdatedAt: inconsistent.updatedAt.toISOString() }, headers: { Accept: 'application/json' } });
  expect(repaired.status(), await repaired.text()).toBe(200);
  expect((await db.dispensary.findUniqueOrThrow({ where: { id } })).licenseStatus).toBe('verified');
  const changed = await db.dispensary.update({ where: { id }, data: { licenseNumber: 'QA-CHANGED', isVerified: false, licenseStatus: 'pending_review' } });
  expect((await page.request.post(url, { data: { verified: true, expectedUpdatedAt: inconsistent.updatedAt.toISOString() }, headers: { Accept: 'application/json' } })).status()).toBe(409);
  const expired = await db.dispensary.update({ where: { id }, data: { licenseExpiry: new Date('2020-01-01') } });
  expect((await page.request.post(url, { data: { verified: true, expectedUpdatedAt: expired.updatedAt.toISOString() }, headers: { Accept: 'application/json' } })).status()).toBe(409);
  expect((await db.dispensary.findUniqueOrThrow({ where: { id } })).isVerified).toBe(false); expect(changed.licenseNumber).toBe('QA-CHANGED');
});
