import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { readFile } from 'node:fs/promises';
import { safeInternalPath } from '../app/components/ui/safeNavigation';
import { isDateInRange } from '../app/components/ui/DateRangeFilter';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3144';
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
  throw new Error('Grower regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const db = new PrismaClient();
const prefix = `grower-ui-${Date.now()}`;
let userId: string, otherUserId: string, growerId: string, buyerId: string, strainId: string, batchId: string, productId: string, orderId: string, token: string;
let otherToken: string;
test.setTimeout(90000);

test.beforeAll(async () => {
  const user = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}@example.test`, role: 'GROWER', name: 'Review grower', grower: { create: { businessName: 'Review Farm', licenseNumber: prefix, licenseExpiry: new Date('2030-12-31'), isVerified: true, subscriptionPlan: 'pro', subscriptionStatus: 'active' } } }, include: { grower: true } });
  userId = user.id; growerId = user.grower!.id;
  const other = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-other@example.test`, role: 'GROWER', grower: { create: { businessName: 'Other Farm', licenseNumber: `${prefix}-other` } } } });
  otherUserId = other.id;
  const customer = await db.dispensary.create({ data: { businessName: 'Review Buyer', createdByGrowerId: growerId, offPlatformEmail: 'buyer@example.test', contactName: 'Review contact' } }); buyerId = customer.id;
  const strain = await db.strain.create({ data: { growerId, name: 'Review Strain', strainType: 'HYBRID' } }); strainId = strain.id;
  const batch = await db.batch.create({ data: { growerId, strainId, batchNumber: `${prefix}-batch`, harvestDate: new Date('2026-08-01'), lotNumber: 'LOT-KEEP', testResults: { retained: 'keep this value', labDocuments: {} } } }); batchId = batch.id;
  await db.product.createMany({ data: Array.from({ length: 55 }, (_, index) => ({ growerId, name: `Review Product ${String(index).padStart(2, '0')}`, price: 10, inventoryQty: 20, unit: 'Gram', productType: 'Flower', status: 'PUBLISHED' as const, isAvailable: true, strainId, batchId, thcMin: 10, thcMax: 20, cbdMin: 1, cbdMax: 2, harvestDate: new Date('2026-08-01') })) });
  productId = (await db.product.findFirstOrThrow({ where: { growerId } })).id;
  await db.order.createMany({ data: Array.from({ length: 105 }, () => ({ growerId, dispensaryId: buyerId, status: 'DELIVERED' as const, totalAmount: 1, subtotal: 1, deliveredAt: new Date() })) });
  const order = await db.order.create({ data: { growerId, dispensaryId: buyerId, status: 'PENDING', totalAmount: 20, subtotal: 20, items: { create: { growerId, productId, quantity: 2, unitPrice: 10, totalPrice: 20 } } } }); orderId = order.id;
  token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: userId, sub: userId, role: 'GROWER', email: user.email, sessionVersion: user.sessionVersion }, maxAge: 3600 });
  otherToken = await encode({ secret: process.env.AUTH_SECRET!, token: { id: otherUserId, sub: otherUserId, role: 'GROWER', email: other.email, sessionVersion: other.sessionVersion }, maxAge: 3600 });
});

test.afterAll(async () => {
  if (growerId) {
    await db.order.deleteMany({ where: { growerId } });
    await db.dispensary.deleteMany({ where: { createdByGrowerId: growerId } });
  }
  await db.user.deleteMany({ where: { id: { in: [userId, otherUserId].filter(Boolean) } } });
  await db.$disconnect();
});
async function authenticate(page: Page, nextToken = token) {
  await page.context().addCookies([{ name: 'next-auth.session-token', value: nextToken, url: baseURL }]);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('paged catalog keeps focus, avoids session refetch and applies bulk changes locally', async ({ page }) => {
  await authenticate(page);
  let listRequests = 0;
  page.on('request', request => { if (request.url().includes('/api/products?paged=')) listRequests++; });
  const responsePromise = page.waitForResponse(response => response.url().includes('/api/products?paged='));
  await page.goto('/grower/products');
  const payload = await (await responsePromise).json();
  expect(payload.products).toHaveLength(50); expect(payload.total).toBe(55); expect(payload.counts.all).toBe(55);
  expect(payload.products[0].description).toBeUndefined(); expect(payload.products[0].images).toEqual([]);
  expect(await page.getByRole('checkbox', { name: /^Select Review Product/ }).count()).toBe(50);
  const first = page.getByRole('checkbox', { name: /^Select Review Product/ }).first();
  await first.focus(); await page.keyboard.press('Space'); await expect(first).toBeFocused();
  const requestsBefore = listRequests;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('button', { name: 'Disable', exact: true }).click();
  await expect(page.getByText('Disabled for 1 product.')).toBeVisible();
  expect(listRequests).toBe(requestsBefore);
  const active = await db.product.count({ where: { growerId, isAvailable: true } }); expect(active).toBe(54);
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /^Select Review Product/ })).toHaveCount(5);
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 2 of 2');
  await page.screenshot({ path: '/tmp/phenofarm-remediation/grower-products-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 500));
  expect((await page.locator('.pf-portal > .fixed.top-0').first().boundingBox())?.y).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/phenofarm-remediation/grower-products-mobile.png', fullPage: true });
});

test('product lists default to bounded pages and inventory and pickers reach later products', async ({ page, request }) => {
  await authenticate(page);
  const response = await request.get('/api/products', { headers: { Cookie: `next-auth.session-token=${token}` } });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.products).toHaveLength(50);
  expect(result.total).toBe(55);
  await page.goto('/grower/inventory');
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 1 of 3');
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 2 of 3');
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 3 of 3');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.goto('/grower/inventory/add');
  await page.getByPlaceholder('Search products').fill('Review Product 00');
  await page.getByRole('button', { name: /Review Product 00/ }).click();
  await expect(page.locator('#stock-quantity')).toHaveValue('20');
  await page.goto('/grower/orders/add');
  await page.getByPlaceholder('Search products').fill('Review Product 54');
  await expect(page.getByRole('button', { name: 'Add item', exact: true })).toBeEnabled();
  await expect.poll(async () => page.locator('#order-product-search').inputValue()).toBe('Review Product 54');
  await page.waitForResponse(response => response.url().includes('search=Review+Product+54'));
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(page.locator('select').first().locator('option:checked')).toHaveText('Review Product 54');
  await noOverflow(page);
});

test('marketplace preview pages published in-stock listings and keeps global totals', async ({ page }) => {
  await authenticate(page);
  await db.product.updateMany({ where: { growerId }, data: { isAvailable: true } });
  await db.product.update({ where: { id: productId }, data: { status: 'DRAFT' } });
  try {
    await page.goto('/grower/marketplace');
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('54 listings');
    await expect(page.getByRole('link', { name: 'Edit listing', exact: true })).toHaveCount(24);
    await page.getByRole('link', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 2 of 3');
    await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page);
  } finally { await db.product.update({ where: { id: productId }, data: { status: 'PUBLISHED' } }); }
});

test('product drafts restore explicitly, exclude images, stay account scoped and survive unavailable storage', async ({ page }) => {
  await authenticate(page);
  await page.goto('/grower/products/add');
  await page.locator('#name').fill('Unsent private product');
  await expect.poll(async () => page.evaluate(() => Object.entries(localStorage).some(([key, value]) => key.includes('draft:product') && value.includes('Unsent private product')))).toBe(true);
  const stored = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('draft:product')));
  expect(stored[0][0]).toContain(userId); expect(JSON.parse(stored[0][1]).value.images).toEqual([]);
  page.on('dialog', dialog => dialog.accept());
  await page.reload();
  await expect(page.locator('#name')).toHaveValue('');
  await page.getByRole('button', { name: 'Restore draft', exact: true }).click();
  await expect(page.locator('#name')).toHaveValue('Unsent private product');
  await authenticate(page, otherToken); await page.goto('/grower/products/add');
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Restore draft', exact: true })).toHaveCount(0);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.locator('#name').fill('Still editable');
  await expect(page.getByText(/draft could not be stored/)).toBeVisible();
  await expect(page.locator('#name')).toHaveValue('Still editable');
});

test('nested creation and search Escape keep a dirty product on its current page', async ({ page }) => {
  await authenticate(page); await page.goto('/grower/products/add');
  await page.locator('#name').fill('Keep unsaved changes');
  let posts = 0; page.on('request', request => { if (request.url().endsWith('/api/products') && request.method() === 'POST') posts++; });
  await page.getByRole('button', { name: '+ New', exact: true }).first().click();
  await page.getByPlaceholder('Strain name *').fill('Enter only edits strain');
  await page.getByPlaceholder('Strain name *').press('Enter');
  expect(posts).toBe(0); await expect(page.locator('#name')).toHaveValue('Keep unsaved changes');
  await page.keyboard.press('Meta+k');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/grower\/products\/add/);
  await expect(page.locator('#name')).toHaveValue('Keep unsaved changes');
});

test('mobile search Escape returns focus to the visible trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await authenticate(page);
  await page.goto('/grower/products');
  const trigger = page.locator('button[aria-label="Search"]:visible').first();
  await trigger.focus(); await trigger.click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('server pages serialize safely, use whole-history aggregates and preload settings', async ({ page }) => {
  await authenticate(page);
  const runtimeErrors: string[] = []; page.on('pageerror', error => runtimeErrors.push(`${new URL(page.url()).pathname}: ${error.message}`));
  for (const path of ['/grower/dashboard', '/grower/reports', '/grower/orders', '/grower/orders/history', `/grower/orders/${orderId}`, `/grower/orders/${orderId}/edit`, '/grower/customers', '/grower/catalog', '/grower/marketplace', `/grower/products/${productId}/edit`, `/grower/batches/${batchId}/edit`]) {
    const response = await page.goto(path); expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/Application error/)).toHaveCount(0);
    if (path === '/grower/dashboard') await expect(page.getByText('$105', { exact: true }).first()).toBeVisible();
    if (path === '/grower/orders/history') await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('105 requests');
    if (path.endsWith(`${productId}/edit`)) { await expect(page.locator('#thcMin')).toHaveValue('10'); await expect(page.locator('#harvestDate')).toHaveValue('2026-08-01'); }
  }
  const settingsRequests: string[] = [];
  page.on('request', request => { if (/\/api\/(grower\/settings|subscription|grower\/commercial-terms)/.test(request.url())) settingsRequests.push(request.url()); });
  await page.goto('/grower/settings');
  await expect(page.locator('input[type="text"]').first()).toHaveValue('Review Farm');
  expect(settingsRequests).toEqual([]); expect(runtimeErrors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page);
  await page.screenshot({ path: '/tmp/phenofarm-remediation/grower-settings-mobile.png', fullPage: true });
});

function conversation(id: string) {
  return { id, growerId: 'grower', dispensaryId: 'buyer', productId: null, product: null, lastMessageAt: '2026-09-17T10:00:00.000Z', unreadCount: 1, lastMessagePreview: `Preview ${id}`, counterpart: { id: `buyer-${id}`, name: `Buyer ${id}`, role: 'DISPENSARY' } };
}
function message(id: string, body: string) {
  return { id, senderUserId: 'buyer', sender: { id: 'buyer', name: 'Buyer', email: 'buyer@example.test', role: 'DISPENSARY' }, messageType: 'TEXT', body, productId: null, product: null, offerQuantity: null, offerUnitPrice: null, offerNote: null, offerStatus: null, respondedToMessageId: null, acceptedQuote: null, createdAt: '2026-09-17T10:00:00.000Z' };
}
test('chat loads only visible threads, ignores late responses and keeps drafts separated', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await authenticate(page);
  const conversationRequests: string[] = [], messageRequests: string[] = [], reads: string[] = [];
  await page.route('**/api/messages/conversations', async route => { conversationRequests.push(route.request().url()); await route.fulfill({ json: { conversations: [conversation('A'), conversation('B')] } }); });
  await page.route('**/api/messages/conversations/*/messages*', async route => {
    const url = route.request().url(); messageRequests.push(url);
    if (route.request().method() === 'POST') { await route.fulfill({ status: 201, json: { ...message('sent', route.request().postDataJSON().body), senderUserId: userId, createdAt: '2026-09-17T10:01:00.000Z' } }); return; }
    if (url.includes('/A/')) await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ json: { messages: [message(url.includes('/A/') ? 'a' : 'b', url.includes('/A/') ? 'Thread A body' : 'Thread B body')], offerUpdates: [] } });
  });
  await page.route('**/api/messages/conversations/*/read', async route => { reads.push(route.request().url()); await route.fulfill({ json: { ok: true } }); });
  await page.goto('/grower/products');
  expect(conversationRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Open messages', exact: true }).click();
  await expect(page.getByTestId('conversation-item')).toHaveCount(2);
  expect(messageRequests).toHaveLength(0); expect(reads).toHaveLength(0);
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.getByRole('button', { name: /Back to conversations/ }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await expect(page.getByText('Thread B body', { exact: true })).toBeVisible();
  await expect(page.getByText('Thread A body', { exact: true })).toHaveCount(0);
  expect(reads.every(url => url.includes('/B/'))).toBe(true);
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Private B draft');
  await page.getByRole('button', { name: /Back to conversations/ }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: /Back to conversations/ }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Private B draft');
  const beforeSend = conversationRequests.length;
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByText('Private B draft', { exact: true }).last()).toBeVisible();
  expect(conversationRequests).toHaveLength(beforeSend);
  await noOverflow(page); await page.screenshot({ path: '/tmp/phenofarm-remediation/grower-chat-mobile.png' });
  await page.getByRole('button', { name: 'Close messages', exact: true }).click();
  const count = messageRequests.length;
  await page.clock.install(); await page.clock.fastForward(35000);
  expect(messageRequests).toHaveLength(count); expect(conversationRequests).toHaveLength(beforeSend);
});

async function pngFixture(page: Page) {
  const data = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#00aa55'; ctx.fillRect(0, 0, 2, 2); return canvas.toDataURL('image/png').split(',')[1]; });
  return { name: 'review.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}

test('image uploads are separate requests and a rapid draft save posts only once', async ({ page }) => {
  await authenticate(page); await page.goto('/grower/products/add');
  const uploads: string[] = []; const creates: Record<string, unknown>[] = [];
  await page.route('**/api/products/upload', async route => { uploads.push(route.request().headers()['content-type']); await route.fulfill({ json: { url: `/uploads/review-${uploads.length}.png` } }); });
  await page.route('**/api/products', async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    creates.push(route.request().postDataJSON());
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ status: 201, json: { ...creates[0], id: 'new-product' } });
  });
  await page.locator('#name').fill('Uploaded separate images');
  const fixture = await pngFixture(page);
  await page.locator('#productImagesInput').setInputFiles(fixture);
  await expect.poll(() => uploads.length).toBe(1);
  await expect(page.getByText(/Uploading/)).toHaveCount(0);
  await page.locator('#productImagesInput').setInputFiles(fixture);
  await expect.poll(() => uploads.length).toBe(2);
  await expect(page.getByText(/Uploading/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Save draft', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect.poll(() => creates.length).toBe(1);
  expect(uploads.every(type => type.startsWith('multipart/form-data'))).toBe(true);
  expect(creates[0].images).toEqual(['/uploads/review-1.png', '/uploads/review-2.png']);
  expect(JSON.stringify(creates[0])).not.toContain('base64');
  await expect(page).toHaveURL(/\/grower\/products$/);
});

test('logo-only saves do not submit unrelated invalid fields and Escape preserves settings', async ({ page }) => {
  await authenticate(page); await page.goto('/grower/settings');
  const saves: Record<string, unknown>[] = [];
  await page.route('**/api/products/upload', route => route.fulfill({ json: { url: '/uploads/review-logo.png' } }));
  await page.route('**/api/grower/settings', async route => { saves.push(route.request().postDataJSON()); await route.fulfill({ json: { grower: { logo: '/uploads/review-logo.png' } } }); });
  const businessName = page.locator('input[type="text"]').first();
  await businessName.fill('');
  await page.locator('input[type="file"]').first().setInputFiles(await pngFixture(page));
  await expect.poll(() => saves.length).toBe(1);
  expect(saves[0]).toEqual({ logo: '/uploads/review-logo.png' });
  await expect(businessName).toHaveValue('');
  await businessName.fill('Unsaved settings stay');
  await page.keyboard.press('Escape');
  await expect(businessName).toHaveValue('Unsaved settings stay');
});

test('logo preview follows a newer saved prop after a delayed upload', async ({ page }) => {
  await authenticate(page); await page.goto('/grower/settings');
  let releaseUpload!: () => void;
  const uploadGate = new Promise<void>(resolve => { releaseUpload = resolve; });
  await page.route('**/api/products/upload', async route => {
    await uploadGate;
    await route.fulfill({ json: { url: '/uploads/stale-logo.png' } });
  });
  await page.route('**/api/grower/settings', async route => {
    if (route.request().method() !== 'PATCH') { await route.continue(); return; }
    await route.fulfill({ json: { logo: '/uploads/newer-logo.png' } });
  });
  await page.locator('input[type="file"]').first().setInputFiles(await pngFixture(page));
  await expect(page.getByText('Uploading...', { exact: true })).toBeVisible();
  releaseUpload();
  await expect.poll(() => page.locator('img[alt="Company logo"]').getAttribute('src')).toBe('/uploads/newer-logo.png');
});

test('subscription readiness rejects canceled and unpaid plans and permits trialing', async ({ page }) => {
  await authenticate(page);
  for (const status of ['canceled', 'unpaid', 'trialing']) {
    await db.grower.update({ where: { id: growerId }, data: { subscriptionPlan: 'pro', subscriptionStatus: status } });
    await page.goto('/grower/dashboard');
    const setup = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: /^Setup ·/ }) });
    await setup.locator('summary').click();
    if (status === 'trialing') await expect(setup).toContainText(/Complete:.*Subscription/);
    else await expect(setup.getByRole('link', { name: 'Review subscription', exact: true })).toBeVisible();
  }
  await db.grower.update({ where: { id: growerId }, data: { subscriptionStatus: 'active' } });
});

test('quantity input permits editing before blur and inventory submits validated numbers', async ({ page }) => {
  await authenticate(page); await page.goto('/grower/orders/add');
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  const quantity = page.locator('input[max]').first();
  await quantity.fill(''); await expect(quantity).toHaveValue('');
  await quantity.pressSequentially('12'); await expect(quantity).toHaveValue('12');
  await quantity.fill('999'); await quantity.blur(); await expect(quantity).toHaveValue('20');
  await page.goto('/grower/inventory/add');
  await page.getByLabel('Product *', { exact: true }).fill('Review Product');
  await page.getByRole('button', { name: /Review Product/ }).first().click();
  const quantities: unknown[] = [];
  await page.route('**/api/inventory', async route => { quantities.push(route.request().postDataJSON().quantityAvailable); await route.fulfill({ status: 201, json: { ok: true } }); });
  await page.getByLabel('Stock on hand *', { exact: true }).fill('12');
  await page.locator('button[type="submit"]').click();
  await expect.poll(() => quantities.length).toBe(1); expect(quantities[0]).toBe(12);
});

test('report CSV neutralizes customer formulas and dates use calendar day boundaries', async ({ page }) => {
  expect(safeInternalPath('javascript:alert(1)', '/grower/batches')).toBe('/grower/batches');
  expect(safeInternalPath('//external.example/path', '/grower/batches')).toBe('/grower/batches');
  expect(safeInternalPath('/\\external.example', '/grower/batches')).toBe('/grower/batches');
  expect(safeInternalPath('/grower/products/add?strainId=1', '/grower/batches')).toBe('/grower/products/add?strainId=1');
  const now = new Date();
  expect(isDateInRange(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), 'last7days')).toBe(true);
  expect(isDateInRange(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59), 'last7days')).toBe(false);
  await db.dispensary.update({ where: { id: buyerId }, data: { businessName: '=2+3' } });
  await authenticate(page); await page.goto('/grower/reports');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const download = await downloadPromise;
  const file = await download.path(); expect(file).not.toBeNull();
  const csv = await readFile(file!, 'utf8'); expect(csv).toContain("'=2+3"); expect(csv).not.toContain('\n=2+3,');
});

test('batch PDFs upload separately and editing preserves existing batch metadata', async ({ page }) => {
  await authenticate(page); await page.goto(`/grower/batches/${batchId}/edit`);
  let releaseUpload!: () => void;
  const uploadGate = new Promise<void>(resolve => { releaseUpload = resolve; });
  let uploads = 0;
  await page.route('**/api/products/upload-document', async route => { uploads++; await uploadGate; await route.fulfill({ json: { url: '/uploads/review-lab.pdf' } }); });
  await page.getByLabel('Potency', { exact: true }).setInputFiles({ name: 'review-lab.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nlocal test fixture\n%%EOF') });
  await expect.poll(() => uploads).toBe(1);
  await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeDisabled();
  releaseUpload();
  await expect(page.getByText('review-lab.pdf', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/\/grower\/batches$/);
  const batch = await db.batch.findUniqueOrThrow({ where: { id: batchId } });
  const results = batch.testResults as { retained: string; labDocuments: { cannabinoids: { dataUrl: string } } };
  expect(batch.lotNumber).toBe('LOT-KEEP'); expect(results.retained).toBe('keep this value');
  expect(results.labDocuments.cannabinoids.dataUrl).toBe('/uploads/review-lab.pdf');
  const response = await page.request.get('/api/batches'); const list = await response.json();
  const summary = list.find((row: { id: string }) => row.id === batchId);
  expect(summary.labDocumentCount).toBe(1); expect(summary.testResults).toBeUndefined();
});

for (const failure of ['non-ok', 'aborted'] as const) {
  test(`chat retries ${failure} read acknowledgement on reopen with the same visible message bound`, async ({ page }) => {
    await authenticate(page); await page.setViewportSize({ width: 390, height: 844 });
    const readBodies: Array<{ throughMessageId: string }> = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>(resolve => { releaseFirst = resolve; });
    const urls: string[] = [];
    await page.route('**/api/messages/conversations', route => route.fulfill({ json: { conversations: [conversation('A')] } }));
    await page.route('**/api/messages/conversations/A/messages*', route => {
      urls.push(route.request().url());
      return route.fulfill({ json: { messages: route.request().url().includes('after=') ? [] : [message('seen-A', 'Visible incoming message')], offerUpdates: [] } });
    });
    await page.route('**/api/messages/conversations/A/read', async route => {
      readBodies.push(route.request().postDataJSON());
      if (readBodies.length === 1) {
        if (failure === 'aborted') await firstGate;
        await route.fulfill({ status: 503, json: { error: 'Try again' } }).catch(() => undefined);
      } else await route.fulfill({ json: { ok: true, throughMessageId: 'seen-A', unreadCount: 1 } });
    });
    await page.goto('/grower/products');
    await page.getByRole('button', { name: 'Open messages', exact: true }).click();
    await page.getByTestId('conversation-item').click();
    await expect.poll(() => readBodies.length).toBe(1);
    await page.getByRole('button', { name: 'Close messages', exact: true }).click();
    releaseFirst();
    await page.getByRole('button', { name: 'Open messages', exact: true }).click();
    await expect.poll(() => readBodies.length).toBe(2);
    expect(readBodies).toEqual([{ throughMessageId: 'seen-A' }, { throughMessageId: 'seen-A' }]);
    expect(urls.at(-1)).toContain('afterId=seen-A');
    await page.getByRole('button', { name: 'Back to conversations' }).click();
    // The server still reports one newer unread message; never blindly zero it.
    await expect(page.getByTestId('conversation-item')).toContainText('1');
  });
}

test('chat clears a sent origin draft after switching chats while keeping the other draft and sent response', async ({ page }) => {
  await authenticate(page); await page.setViewportSize({ width: 390, height: 844 });
  let releaseSend!: () => void;
  const sendGate = new Promise<void>(resolve => { releaseSend = resolve; });
  let posts = 0;
  await page.route('**/api/messages/conversations', route => route.fulfill({ json: { conversations: [conversation('A'), conversation('B')] } }));
  await page.route('**/api/messages/conversations/*/read', route => route.fulfill({ json: { ok: true, unreadCount: 0 } }));
  await page.route('**/api/messages/conversations/*/messages*', async route => {
    if (route.request().method() === 'POST') {
      posts++; await sendGate;
      await route.fulfill({ status: 201, json: { ...message('sent-A', route.request().postDataJSON().body), senderUserId: userId, createdAt: '2026-09-17T10:01:00.000Z' } });
    } else await route.fulfill({ json: { messages: [], offerUpdates: [] } });
  });
  await page.goto('/grower/products'); await page.getByRole('button', { name: 'Open messages', exact: true }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Keep B draft');
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Delivered from A');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect.poll(() => posts).toBe(1);
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Keep B draft');
  releaseSend();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeEnabled();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Keep B draft');
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('');
  await expect(page.getByText('Delivered from A', { exact: true }).last()).toBeVisible();
  expect(await page.evaluate(id => localStorage.getItem(`phenofarm:user:${encodeURIComponent(id)}:phenofarm:draft:message:A`), userId)).toBeNull();
});

test('chat preserves newer origin quote edits when an earlier send completes', async ({ page }) => {
  await authenticate(page); await page.setViewportSize({ width: 390, height: 844 });
  let releaseSend!: () => void;
  const sendGate = new Promise<void>(resolve => { releaseSend = resolve; });
  let posts = 0;
  await page.route('**/api/messages/conversations', route => route.fulfill({ json: { conversations: [...['A', 'B'].map(id => ({ ...conversation(id), productId: 'quote-product', product: { id: 'quote-product', name: 'Purple Haze', unit: 'Gram' } }))] } }));
  await page.route('**/api/messages/conversations/*/messages*', async route => {
    if (route.request().method() === 'POST') { posts++; await sendGate; await route.fulfill({ status: 201, json: { ...message('sent-offer', 'Quote terms'), senderUserId: userId, messageType: 'OFFER', offerUnitPrice: 12, offerQuantity: 2, offerStatus: 'PENDING', createdAt: '2026-09-17T10:01:00.000Z' } }); }
    else await route.fulfill({ json: { messages: [], offerUpdates: [] } });
  });
  await page.goto('/grower/products'); await page.getByRole('button', { name: 'Open messages', exact: true }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.locator('summary').filter({ hasText: /^Quote$/ }).click();
  await page.getByTestId('toggle-offer-composer').click();
  await page.getByPlaceholder('Quote unit price').fill('12');
  await page.getByPlaceholder('Qty (optional)', { exact: true }).fill('2');
  await page.getByPlaceholder('Quote terms note (optional)').fill('Original terms');
  await page.getByTestId('send-offer').click(); await expect.poll(() => posts).toBe(1);
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.locator('summary').filter({ hasText: /^Quote$/ }).click();
  await page.getByTestId('toggle-offer-composer').click();
  await page.getByPlaceholder('Quote unit price').fill('13');
  releaseSend();
  await expect(page.getByTestId('send-offer')).toBeEnabled();
  await expect(page.getByPlaceholder('Quote unit price')).toHaveValue('13');
  await expect(page.getByPlaceholder('Qty (optional)', { exact: true })).toHaveValue('2');
  await expect(page.getByPlaceholder('Quote terms note (optional)')).toHaveValue('Original terms');
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.locator('summary').filter({ hasText: /^Quote$/ }).click();
  await page.getByTestId('toggle-offer-composer').click();
  await expect(page.getByPlaceholder('Quote unit price')).toHaveValue('13');
});

test('chat keeps a delayed send failure scoped to its originating conversation', async ({ page }) => {
  await authenticate(page); await page.setViewportSize({ width: 390, height: 844 });
  let releaseSend!: () => void;
  const sendGate = new Promise<void>(resolve => { releaseSend = resolve; });
  let posts = 0;
  await page.route('**/api/messages/conversations', route => route.fulfill({ json: { conversations: [conversation('A'), conversation('B')] } }));
  await page.route('**/api/messages/conversations/*/messages*', async route => {
    if (route.request().method() === 'POST') { posts++; await sendGate; await route.fulfill({ status: 503, json: { error: 'Delayed A failure' } }); }
    else await route.fulfill({ json: { messages: [], offerUpdates: [] } });
  });
  await page.goto('/grower/products'); await page.getByRole('button', { name: 'Open messages', exact: true }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Unsent A message');
  await page.getByRole('button', { name: 'Send message', exact: true }).click(); await expect.poll(() => posts).toBe(1);
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer B' }).click();
  releaseSend();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeEnabled();
  await expect(page.getByText('Delayed A failure', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await page.getByTestId('conversation-item').filter({ hasText: 'Buyer A' }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Unsent A message');
});
