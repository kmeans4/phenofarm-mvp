import { test, expect, type BrowserContext, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import fs from 'node:fs';
import { startOfLicenseDay } from '../lib/license';
import { calculateTotals, mergeCartItems, normalizeCart, removeOrderedItems } from '../lib/cart';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
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
  throw new Error('Dispensary regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const db = new PrismaClient();
const prefix = `buyer-review-${Date.now()}`;
let growerId: string;
let buyerId: string;
let buyerUserId: string;
let growerUserId: string;
let hiddenId: string;
let stockId: string;
let unavailableId: string;
let deletedId: string;
let draftId: string;
let cookie: string;
const cartLine = (id: string, grower = 'grower') => ({ id, name: id, grower, growerId: grower, price: 12.5, quantity: 2, maxQty: 10, unit: 'unit' });

async function authenticate(context: BrowserContext) {
  await context.addCookies([{ name: 'next-auth.session-token', value: cookie, url: baseURL }]);
}
async function buyerRequest(request: APIRequestContext, url: string) {
  return request.get(url, { headers: { Cookie: `next-auth.session-token=${cookie}` } });
}

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  const growerUser = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-grower@example.test`, role: 'GROWER', name: prefix } });
  growerUserId = growerUser.id;
  const grower = await db.grower.create({ data: { userId: growerUserId, businessName: prefix, licenseNumber: `${prefix}-G`, isVerified: true } });
  growerId = grower.id;
  await db.user.update({ where: { id: growerUserId }, data: { growerId } });
  const buyerUser = await db.user.create({ data: { emailVerifiedAt: new Date(), sessionVersion: 0, email: `${prefix}-buyer@example.test`, role: 'DISPENSARY', name: prefix } });
  buyerUserId = buyerUser.id;
  const buyer = await db.dispensary.create({ data: { userId: buyerUserId, businessName: `${prefix} Buyer`, licenseNumber: `${prefix}-D`, isVerified: true, licenseStatus: 'verified' } });
  buyerId = buyer.id;
  await db.user.update({ where: { id: buyerUserId }, data: { dispensaryId: buyerId } });
  const products = await Promise.all([
    db.product.create({ data: { growerId, name: `${prefix} available`, price: 12.5, productType: 'Flower', unit: 'Gram', inventoryQty: 10, thcMin: 20, thcMax: 20, isAvailable: true } }),
    db.product.create({ data: { growerId, name: `${prefix} hidden`, price: 1234.56, productType: 'Flower', unit: 'Gram', inventoryQty: 10, isAvailable: true, isPriceVisible: false } }),
    db.product.create({ data: { growerId, name: `${prefix} unavailable`, price: 8, productType: 'Flower', unit: 'Gram', inventoryQty: 0, isAvailable: false } }),
    db.product.create({ data: { growerId, name: `${prefix} draft`, price: 8, status: 'DRAFT', productType: 'Flower', unit: 'Gram', inventoryQty: 5, isAvailable: true } }),
    db.product.create({ data: { growerId, name: `${prefix} deleted`, price: 8, productType: 'Flower', unit: 'Gram', inventoryQty: 5, isAvailable: true, isDeleted: true } }),
  ]);
  [stockId, hiddenId, unavailableId, draftId, deletedId] = products.map(product => product.id);
  cookie = await encode({ secret: process.env.AUTH_SECRET!, maxAge: 3600, token: { sub: buyerUserId, id: buyerUserId, email: buyerUser.email, role: 'DISPENSARY', dispensaryId: buyerId, sessionVersion: buyerUser.sessionVersion } });
});
test.afterAll(async () => {
  if (buyerId) {
    await db.conversation.deleteMany({ where: { dispensaryId: buyerId } });
    await db.order.deleteMany({ where: { dispensaryId: buyerId } });
    await db.dispensary.deleteMany({ where: { id: buyerId } });
  }
  if (growerId) { await db.product.deleteMany({ where: { growerId } }); await db.grower.deleteMany({ where: { id: growerId } }); }
  await db.user.deleteMany({ where: { id: { in: [buyerUserId, growerUserId].filter(Boolean) } } });
  await db.$disconnect();
});

test('cart normalization preserves valid items, zero tax, merges and removes only ordered products', () => {
  expect(normalizeCart({ items: 'invalid' }).items).toEqual([]);
  expect(normalizeCart({ items: [null, {}, cartLine('a')] }).items.map(item => item.id)).toEqual(['a']);
  const cart = normalizeCart({ items: [cartLine('a'), cartLine('b', 'other')], tax: 9 });
  expect(calculateTotals(cart.items)).toEqual({ subtotal: 50, tax: 0, total: 50 });
  expect(mergeCartItems(cart, [cartLine('a')]).items.find(item => item.id === 'a')?.quantity).toBe(4);
  expect(removeOrderedItems(cart, [{ orderedProductIds: ['a'] }]).items.map(item => item.id)).toEqual(['b']);
});

test('grower storefront loads authenticated thumbnails and legacy logos in grid and list at desktop and mobile widths', async ({ page, context }) => {
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD6sAAAAASUVORK5CYII=';
  await db.product.update({ where: { id: stockId }, data: { images: [tinyPng] } });
  await db.grower.update({ where: { id: growerId }, data: { logo: tinyPng } });
  await authenticate(context);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(`/dispensary/grower/${growerId}`);
    expect(response?.status()).toBe(200);
    const logo = page.getByRole('img', { name: prefix, exact: true });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    for (const mode of ['Grid view', 'List view']) {
      const toggle = page.getByRole('button', { name: mode, exact: true });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      const thumbnail = page.getByRole('img', { name: `${prefix} available`, exact: true });
      await thumbnail.scrollIntoViewIfNeeded();
      await expect.poll(() => thumbnail.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('catalog sends direct image URLs without forwarding legacy image bodies', async ({ request }) => {
  const previous = await db.product.findUniqueOrThrow({ where: { id: stockId }, select: { images: true } });
  const url = 'https://example.com/catalog-photo.png';
  try {
    await db.product.update({ where: { id: stockId }, data: { images: [url, 'data:image/png;base64,' + 'A'.repeat(2000000)] } });
    const response = await buyerRequest(request, `/api/dispensary/catalog?productIds=${stockId}&search=${prefix}`);
    expect(response.status()).toBe(200);
    const products = (await response.json()).products;
    expect(products.find((row: { id: string }) => row.id === stockId).images).toEqual([url]);
    expect(JSON.stringify(products).length).toBeLessThan(10000);
    await db.product.update({ where: { id: stockId }, data: { images: [] } });
    const empty = await buyerRequest(request, `/api/dispensary/catalog?search=${prefix}`);
    expect((await empty.json()).products.find((row: { id: string }) => row.id === stockId).images).toEqual([]);
  } finally { await db.product.update({ where: { id: stockId }, data: { images: previous.images } }); }
});

test('buyer catalog safely paginates, combines filters and suppresses hidden/deleted/unverified products', async ({ request }) => {
  const response = await buyerRequest(request, `/api/dispensary/catalog?search=${prefix}&page=abc&limit=abc`);
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.page).toBe(1); expect(result.limit).toBe(20);
  expect(result.products.map((item: { id: string }) => item.id).sort()).toEqual([stockId, hiddenId].sort());
  expect(result.products.find((item: { id: string }) => item.id === hiddenId).price).toBeNull();
  expect(result.products.every((item: { images: string[] }) => item.images.every(image => image.startsWith('/api/dispensary/products/')))).toBe(true);
  const combined = await buyerRequest(request, `/api/dispensary/products?search=${prefix}&thcRanges=high&priceRanges=standard`);
  expect((await combined.json()).products.map((item: { id: string }) => item.id)).toEqual([stockId]);
  await db.grower.update({ where: { id: growerId }, data: { isVerified: false } });
  try { expect((await (await buyerRequest(request, `/api/dispensary/catalog?search=${prefix}`)).json()).total).toBe(0); }
  finally { await db.grower.update({ where: { id: growerId }, data: { isVerified: true } }); }
});

test('cart validation targets exact IDs and retains unavailable products without hidden prices', async ({ request }) => {
  const response = await request.post('/api/dispensary/cart/validate', { headers: { Cookie: `next-auth.session-token=${cookie}` }, data: { productIds: [stockId, unavailableId, deletedId, hiddenId, draftId] } });
  expect(response.status()).toBe(200);
  const { products } = await response.json();
  expect(products).toHaveLength(5);
  expect(products.find((item: { id: string }) => item.id === draftId).isAvailable).toBe(false);
  expect(products.find((item: { id: string }) => item.id === unavailableId)).toMatchObject({ inventoryQty: 0, isAvailable: false });
  expect(products.find((item: { id: string }) => item.id === hiddenId).price).toBeNull();
  expect(products.find((item: { id: string }) => item.id === deletedId).isAvailable).toBe(false);
});

test('collection diffs preserve existing IDs, out-of-stock favorites, and stored alerts on bad payloads', async ({ request }) => {
  const headers = { Cookie: `next-auth.session-token=${cookie}` };
  expect((await request.patch('/api/dispensary/favorites', { headers, data: { added: [stockId, unavailableId], removed: [] } })).ok()).toBe(true);
  const filters = [{ name: 'High potency', filters: { productTypes: ['Flower'], thcRanges: ['high'], priceRanges: [], recentlyAdded: true, trending: true }, searchQuery: prefix, sortBy: 'default' }];
  expect((await request.put('/api/dispensary/saved-filters', { headers, data: { filters } })).ok()).toBe(true);
  const savedFilter = await db.dispensarySavedFilter.findFirstOrThrow({ where: { dispensaryId: buyerId } });
  expect((await request.put('/api/dispensary/saved-filters', { headers, data: { filters } })).ok()).toBe(true);
  expect((await db.dispensarySavedFilter.findFirstOrThrow({ where: { dispensaryId: buyerId } })).id).toBe(savedFilter.id);
  const original = await db.dispensaryFavoriteProduct.findMany({ where: { dispensaryId: buyerId } });
  expect((await request.patch('/api/dispensary/favorites', { headers, data: { added: [hiddenId], removed: [] } })).ok()).toBe(true);
  const retained = await db.dispensaryFavoriteProduct.findFirstOrThrow({ where: { dispensaryId: buyerId, productId: stockId } });
  expect(retained.id).toBe(original.find(item => item.productId === stockId)?.id);
  const details = await request.post('/api/dispensary/favorites', { headers, data: { productIds: [unavailableId, hiddenId] } });
  const products = (await details.json()).products;
  expect(products.find((item: { id: string }) => item.id === unavailableId).inventoryQty).toBe(0);
  expect(products.find((item: { id: string }) => item.id === hiddenId).price).toBeNull();
  expect((await request.patch('/api/dispensary/price-alerts', { headers, data: { added: [{ productId: stockId, targetPrice: 10 }], removed: [] } })).ok()).toBe(true);
  const alert = await db.dispensaryPriceAlert.findFirstOrThrow({ where: { dispensaryId: buyerId } });
  expect((await request.put('/api/dispensary/price-alerts', { headers, data: {} })).status()).toBe(400);
  const refresh = await request.post('/api/dispensary/price-alerts/refresh', { headers, data: { alerts: [] } });
  expect((await refresh.json()).alerts.map((item: { id: string }) => item.id)).toContain(alert.id);
});

test('catalog latest search wins; mounting does not write collections', async ({ page, context }) => {
  await authenticate(context);
  const writes: string[] = [];
  page.on('request', request => { if (/\/api\/dispensary\/(favorites|saved-filters|price-alerts)$/.test(new URL(request.url()).pathname) && ['PATCH', 'PUT'].includes(request.method())) writes.push(request.url()); });
  let initialStarted = false;
  await page.route('**/api/dispensary/catalog?*', async route => {
    const search = new URL(route.request().url()).searchParams.get('search') || '';
    if (search === 'old') initialStarted = true;
    await new Promise(resolve => setTimeout(resolve, search === 'old' ? 700 : 30));
    await route.fulfill({ json: { products: [{ id: search === 'old' ? 'stale' : 'latest', name: search === 'old' ? 'Old result' : search, price: 10, isPriceVisible: true, inventoryQty: 10, isAvailable: true, images: [], unit: 'unit', grower: { id: growerId, businessName: prefix } }], total: 1, hasMore: false, productTypeCounts: {} } }).catch(() => {});
  });
  await page.goto('/dispensary/catalog');
  await page.getByPlaceholder('Search products or growers').fill('old');
  await expect.poll(() => initialStarted).toBe(true);
  await page.getByPlaceholder('Search products or growers').fill('og kush');
  await expect(page.getByRole('heading', { name: 'og kush', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('heading', { name: 'Old result', exact: true })).toHaveCount(0);
  expect(writes).toEqual([]);
  await expect(page).toHaveURL(/search=og/);
});

test('settings and first catalog page arrive from the server without duplicate browser fetches', async ({ page, context }) => {
  await authenticate(context);
  const duplicateReads: string[] = [];
  page.on('request', request => {
    if (request.method() === 'GET' && ['/api/dispensary/settings', '/api/dispensary/catalog'].includes(new URL(request.url()).pathname)) duplicateReads.push(request.url());
  });
  await page.goto('/dispensary/settings');
  await expect(page.getByLabel('Business Name', { exact: false })).toHaveValue(`${prefix} Buyer`);
  await page.goto(`/dispensary/catalog?search=${prefix}`);
  await expect(page.getByRole('heading', { name: `${prefix} available`, exact: true })).toBeVisible();
  await page.getByPlaceholder('Search products or growers').focus();
  expect(duplicateReads).toEqual([]);
});

test('slow inventory response cannot erase saved draft on navigation', async ({ page, context }) => {
  await authenticate(context);
  const draft = normalizeCart({ items: [{ ...cartLine(stockId, growerId), name: 'Retained draft item' }] });
  await page.addInitScript(cart => { if (!sessionStorage.getItem('buyer-cart-initialized')) { localStorage.setItem('phenofarm-cart', JSON.stringify(cart)); sessionStorage.setItem('buyer-cart-initialized', 'true'); } }, draft);
  await page.route('**/api/dispensary/cart/validate', async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ json: { products: [{ id: stockId, price: 12.5, isPriceVisible: true, inventoryQty: 10, isAvailable: true }] } }).catch(() => {});
  });
  await page.goto('/dispensary/cart');
  await expect(page.getByText('Retained draft item', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('phenofarm-cart') || '{}').items.length)).toBe(1);
  await page.goto('/dispensary/catalog');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('phenofarm-cart') || '{}').items.length)).toBe(1);
});

test('partial checkout keeps rejected items and submits once', async ({ page, context }) => {
  await authenticate(context);
  const draft = normalizeCart({ items: [{ ...cartLine(stockId, growerId), name: 'Ordered fixture' }, { ...cartLine(hiddenId, 'other-grower'), name: 'Retained fixture' }] });
  await page.addInitScript(cart => { if (!sessionStorage.getItem('buyer-cart-initialized')) { localStorage.setItem('phenofarm-cart', JSON.stringify(cart)); sessionStorage.setItem('buyer-cart-initialized', 'true'); } }, draft);
  await page.route('**/api/dispensary/cart/validate', route => route.fulfill({ json: { products: draft.items.map(item => ({ id: item.id, price: 12.5, isPriceVisible: true, inventoryQty: 10, isAvailable: true })) } }));
  let submits = 0;
  await page.route('**/api/checkout', async route => {
    submits++;
    await new Promise(resolve => setTimeout(resolve, 150));
    await route.fulfill({ json: { orders: [{ id: 'ordered', growerId, orderedProductIds: [stockId] }], issues: [{ productId: hiddenId, productName: 'Retained fixture', requested: 2, available: 0 }] } });
  });
  await page.goto('/dispensary/cart');
  await expect(page.getByText('Ordered fixture', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Review request$/i }).first()).toBeEnabled();
  await page.getByRole('button', { name: /^Review request$/i }).first().click();
  await page.getByRole('button', { name: 'Submit request', exact: true }).dblclick({ delay: 20 });
  await expect(page.getByText('Some requests were submitted.', { exact: false })).toBeVisible();
  expect(submits).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('phenofarm-cart') || '{}').items.map((item: { name: string }) => item.name))).toEqual(['Retained fixture']);
});

test('saved alert refresh rejects malformed data without deleting alerts; tab switches retain collection state', async ({ page, context }) => {
  await authenticate(context);
  let favoriteReads = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/dispensary/favorites' && request.method() === 'GET') favoriteReads++; });
  await page.route('**/api/dispensary/price-alerts/refresh', route => route.fulfill({ json: { alerts: { invalid: true } } }));
  await page.goto('/dispensary/saved?tab=alerts');
  await expect(page.getByText(`${prefix} available`, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'saved alerts have been kept' })).toBeVisible();
  await page.getByRole('tab', { name: /^Favorites \(/ }).click();
  await expect.poll(() => favoriteReads).toBe(1);
  await page.getByRole('tab', { name: /^Alerts \(/ }).click();
  await page.getByRole('tab', { name: /^Favorites \(/ }).click();
  await page.waitForTimeout(400);
  expect(favoriteReads).toBe(1);
});


test('history counts distinct requests and paginates without capping summary totals', async ({ page, context, request }) => {
  const order = await db.order.create({ data: { growerId, dispensaryId: buyerId, orderId: `${prefix}-split-lines`, subtotal: 25, totalAmount: 25, status: 'DELIVERED', deliveredAt: new Date(), items: { create: [
    { growerId, productId: stockId, quantity: 1, unitPrice: 10, totalPrice: 10 },
    { growerId, productId: stockId, quantity: 1, unitPrice: 15, totalPrice: 15 },
  ] } } });
  await db.order.createMany({ data: Array.from({ length: 101 }, (_, index) => ({ growerId, dispensaryId: buyerId, orderId: `${prefix}-history-${index}`, subtotal: 10, totalAmount: 10, status: 'PENDING' as const })) });
  await authenticate(context);
  const recent = await buyerRequest(request, '/api/dispensary/recent-products');
  // The API selects the latest fifty requests, so explicitly make the split request current.
  await db.order.update({ where: { id: order.id }, data: { createdAt: new Date() } });
  expect(recent.ok()).toBe(true);
  const refreshed = await buyerRequest(request, '/api/dispensary/recent-products');
  expect((await refreshed.json()).products.find((product: { id: string }) => product.id === stockId).orderCount).toBe(1);
  await page.goto('/dispensary/saved?tab=recent');
  await expect(page.getByText(/· 1 request ·/)).toBeVisible();
  await page.goto('/dispensary/orders');
  await expect(page.getByText('Requests', { exact: true }).locator('..').getByText('102', { exact: true })).toBeVisible();
  await expect(page.getByText('102 requests · Page 1', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page.getByText('102 requests · Page 2', { exact: true })).toBeVisible();
});

test('settings restores editable text only, saves compact drafts, and accepts expiry today', async ({ page, context, request }) => {
  await authenticate(context);
  const todayDate = startOfLicenseDay().toISOString().slice(0, 10);
  const settingsResponse = await request.patch('/api/dispensary/settings', { headers: { Cookie: `next-auth.session-token=${cookie}` }, data: { licenseNumber: `${prefix}-D`, licenseExpiry: todayDate } });
  expect(settingsResponse.status()).toBe(200);
  const savedSettings = await db.dispensary.findUniqueOrThrow({ where: { id: buyerId } });
  expect(savedSettings.licenseExpiry?.toISOString().slice(0, 10)).toBe(todayDate);
  expect(savedSettings.licenseStatus).toBe('pending_review');
  const draftKey = `phenofarm:user:${encodeURIComponent(buyerUserId)}:phenofarm:draft:dispensary-settings`;
  await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), value: { businessName: 'Restored editable name', licenseStatus: 'rejected', licenseReviewNotes: 'Stale review', logo: 'data:image/png;base64,AAAA' } })), { key: draftKey });
  await page.goto('/dispensary/settings');
  await expect(page.getByLabel('Business Name', { exact: false })).toHaveValue('Restored editable name');
  await expect(page.getByText('Stale review', { exact: true })).toHaveCount(0);
  await page.getByLabel('Business Name', { exact: false }).fill('Compact changed draft');
  await expect.poll(async () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').value, draftKey)).toMatchObject({ businessName: 'Compact changed draft' });
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').value, draftKey);
  expect(saved).not.toHaveProperty('logo'); expect(saved).not.toHaveProperty('licenseStatus'); expect(saved).not.toHaveProperty('licenseReviewNotes');
  const today = todayDate;
  await page.getByLabel('Expiry', { exact: false }).fill(today);
  await page.getByLabel('Business Name', { exact: false }).focus();
  await expect(page.getByText('License expiry cannot be in the past')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Business Name', { exact: false })).toHaveValue('Compact changed draft');
});

test('mobile catalog filters stage changes and dialog Escape restores scrolling', async ({ page, context }) => {
  await authenticate(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/dispensary/catalog?search=${prefix}`);
  await expect(page.getByRole('heading', { name: `${prefix} available`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: /filters/i, exact: false }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Catalog filters' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '< 15%', exact: true }).click();
  await dialog.getByRole('button', { name: 'Clear All Filters' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/thcRanges/);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Open .* navigation menu/i }).click();
  const menu = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.screenshot({ path: '/tmp/phenofarm-remediation/dispensary-catalog-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/phenofarm-remediation/dispensary-catalog-desktop.png', fullPage: true });
});


test('trending sums eligible order quantities and suggestions exclude strains without listings', async ({ request }) => {
  const listed = await db.strain.create({ data: { growerId, name: `${prefix} Listed Strain` } });
  await db.strain.create({ data: { growerId, name: `${prefix} Unlisted Strain` } });
  await db.product.update({ where: { id: stockId }, data: { strainId: listed.id } });
  await db.order.create({ data: { growerId, dispensaryId: buyerId, orderId: `${prefix}-trending`, subtotal: 12.5, totalAmount: 12.5, items: { create: { growerId, productId: hiddenId, quantity: 5, unitPrice: 2.5, totalPrice: 12.5 } } } });
  await db.order.create({ data: { growerId, dispensaryId: buyerId, orderId: `${prefix}-cancelled`, status: 'CANCELLED', subtotal: 1000, totalAmount: 1000, items: { create: { growerId, productId: stockId, quantity: 100, unitPrice: 10, totalPrice: 1000 } } } });
  const trending = await buyerRequest(request, `/api/dispensary/catalog?search=${prefix}&trending=true&limit=1`);
  expect(trending.status()).toBe(200);
  expect((await trending.json()).products[0].id).toBe(hiddenId);
  const suggestions = await buyerRequest(request, `/api/dispensary/search-suggestions?q=${prefix}&limit=10`);
  const texts = (await suggestions.json()).suggestions.map((item: { text: string }) => item.text);
  expect(texts).toContain(`${prefix} Listed Strain`);
  expect(texts).not.toContain(`${prefix} Unlisted Strain`);
  const limited = await buyerRequest(request, `/api/dispensary/search-suggestions?q=${prefix}&limit=2`);
  expect((await limited.json()).suggestions).toHaveLength(2);
  const search = await buyerRequest(request, `/api/search?q=${prefix}-trending`);
  expect((await search.json()).results[0].subtitle).toContain('$12.50');
});


test('deleting a cached saved filter while canonical IDs load does not restore it', async ({ page, context }) => {
  await authenticate(context);
  const savedFilter = { id: 'local-pending-id', name: 'Remove during hydration', filters: { productTypes: ['Flower'], thcRanges: [], priceRanges: [], recentlyAdded: false, trending: false }, searchQuery: '', sortBy: 'default', createdAt: new Date().toISOString() };
  await page.addInitScript(({ key, filter }) => localStorage.setItem(key, JSON.stringify([filter])), { key: `phenofarm:${buyerUserId}:saved-filters`, filter: savedFilter });
  let releaseLoad: () => void = () => {};
  const loadReleased = new Promise<void>(resolve => { releaseLoad = resolve; });
  let savedPayload: unknown = null;
  await page.route('**/api/dispensary/saved-filters', async route => {
    if (route.request().method() === 'GET') {
      await loadReleased;
      await route.fulfill({ json: { filters: [{ ...savedFilter, id: 'canonical-server-id' }] } });
    } else {
      savedPayload = route.request().postDataJSON();
      await route.fulfill({ json: { filters: [] } });
    }
  });
  await page.goto('/dispensary/catalog');
  await page.getByRole('button', { name: 'Toggle filters', exact: true }).click();
  const removeButton = page.getByRole('button', { name: 'Delete saved filter Remove during hydration', exact: true });
  await expect(removeButton).toBeVisible();
  await removeButton.click();
  expect(savedPayload).toBeNull();
  releaseLoad();
  await expect.poll(() => savedPayload).toEqual({ filters: [] });
  await expect(removeButton).toHaveCount(0);
});
