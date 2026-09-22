import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { formatBatchMetric, formatHarvestDate, toDateInputValue } from '../lib/batch-utils';
import { normalizeUnit } from '../lib/product-payload';
import { productUnitOptions } from '../lib/product-display';

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
  throw new Error('UI data regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const db = new PrismaClient();
const prefix = `ui-grower-data-${Date.now()}`;
let userId: string, growerId: string, batchId: string, productId: string, token: string;

test.beforeAll(async () => {
  const user = await db.user.create({ data: {
    emailVerifiedAt: new Date(), sessionVersion: 0,
    email: `${prefix}@example.test`, role: 'GROWER', name: 'UI data review',
    grower: { create: { businessName: 'UI Data Farm', licenseNumber: prefix, licenseExpiry: new Date('2030-12-31'), isVerified: true, subscriptionPlan: 'pro', subscriptionStatus: 'active' } },
  }, include: { grower: true } });
  userId = user.id; growerId = user.grower!.id;
  const strain = await db.strain.create({ data: { growerId, name: 'UI data strain', strainType: 'HYBRID' } });
  const batch = await db.batch.create({ data: { growerId, strainId: strain.id, batchNumber: prefix, harvestDate: new Date('2026-09-12T00:00:00Z'), thc: 24.8, cbd: 0, totalCannabinoids: 26.3, terpenes: { myrcene: 0.5 } } });
  batchId = batch.id;
  const product = await db.product.create({ data: { growerId, strainId: strain.id, batchId, name: 'Legacy gram product', productType: 'Flower', subType: 'Indoor', unit: 'gram', price: 12, inventoryQty: 15, status: 'PUBLISHED', isAvailable: true, thcMin: 5, thcMax: 10, harvestDate: new Date('2026-09-12T00:00:00Z') } });
  productId = product.id;
  token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: userId, sub: userId, role: 'GROWER', email: user.email, sessionVersion: user.sessionVersion }, maxAge: 3600 });
});

test.afterAll(async () => {
  if (userId) await db.user.delete({ where: { id: userId } });
  await db.$disconnect();
});

async function signIn(page: Page) {
  await page.context().addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL }]);
}

test('decimal lab strings, zeroes, absent values and harvest calendar days remain distinct', () => {
  expect(formatBatchMetric('24.8')).toBe('24.8%');
  expect(formatBatchMetric('0')).toBe('0.0%');
  expect(formatBatchMetric(0)).toBe('0.0%');
  for (const value of [null, undefined, '', 'not a number', false, {}]) expect(formatBatchMetric(value)).toBe('—');
  const instant = '2026-09-12T00:00:00.000Z';
  expect(toDateInputValue(instant)).toBe('2026-09-12');
  expect(formatHarvestDate(instant)).toBe('Sep 12, 2026');
  expect(formatHarvestDate('invalid')).toBe('—');
  expect(normalizeUnit(' grams ')).toBe('Gram');
  expect(productUnitOptions('custom package')).toContain('custom package');
});

test('real decimal API values render on desktop and narrow mobile without changing the harvest day', async ({ browser }) => {
  for (const timezoneId of ['America/Los_Angeles', 'Asia/Tokyo']) {
    const context = await browser.newContext({ baseURL, timezoneId });
    const page = await context.newPage(); await signIn(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390, 360]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto('/grower/batches');
      await expect(page.locator('p:visible, span:visible, td:visible').filter({ hasText: /^24\.8%$/ }).first()).toBeVisible();
      await expect(page.locator('p:visible, span:visible, td:visible').filter({ hasText: /^0\.0%$/ }).first()).toBeVisible();
      await expect(page.locator('span:visible, td:visible').filter({ hasText: /^Sep 12, 2026$/ }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
      await page.goto('/grower/marketplace');
      const preview = page.getByTestId('marketplace-listing-card').filter({ hasText: 'Legacy gram product' });
      await expect(preview.getByText('THC 24.8%', { exact: true })).toBeVisible();
      await expect(preview.getByText('CBD 0%', { exact: true })).toBeVisible();
    }
    await page.goto(`/grower/batches/${batchId}/edit`);
    await expect(page.locator('#harvestDate')).toHaveValue('2026-09-12');
    await expect(page.getByLabel('Terpene', { exact: true })).toHaveValue('myrcene');
    await context.close();
  }
});

test('editing a legacy lowercase unit preserves stock, price, labs and the calendar day', async ({ page }) => {
  await signIn(page); await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/grower/products/${productId}/edit`);
  await expect(page.locator('#unit')).toHaveValue('Gram');
  await expect(page.locator('#inventoryQty')).toHaveValue('15');
  const saved = page.waitForResponse(response => response.url().endsWith(`/api/products/${productId}`) && response.request().method() === 'PUT');
  await page.locator('#product-form button[type="submit"]').click();
  expect((await saved).ok()).toBe(true);
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  expect(product.unit).toBe('Gram');
  expect(product.inventoryQty).toBe(15);
  expect(Number(product.price)).toBe(12);
  expect(Number(product.thcMin)).toBe(5); expect(Number(product.thcMax)).toBe(10);
  expect(product.harvestDate?.toISOString().slice(0, 10)).toBe('2026-09-12');
});

test('valid customer edits can save optional values after field errors clear', async ({ page }) => {
  const customer = await db.dispensary.create({ data: {
    businessName: 'Mobile contact regression', createdByGrowerId: growerId,
    offPlatformEmail: 'contact@example.test', contactName: 'Test contact',
    phone: '8025551234', licenseNumber: 'VT-TEST-123', state: 'VT', zip: '05401',
  } });
  try {
    await signIn(page); await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/grower/customers/${customer.id}/edit`);
    const details = page.locator('summary').filter({ hasText: 'Website & description' });
    const website = page.getByPlaceholder('https://...');
    const description = page.getByPlaceholder('Brief description...');
    const save = page.getByRole('button', { name: 'Save changes', exact: true });
    await expect(website).not.toBeVisible();
    await details.click();
    await website.fill('invalid'); await description.focus();
    await expect(save).toBeDisabled();
    await expect(details).toContainText('Check fields');
    await website.fill('https://example.test'); await description.fill('Keep this contact note');
    await details.click();
    await expect(website).not.toBeVisible();
    await expect(save).toBeEnabled();
    const saved = page.waitForResponse(response => response.url().endsWith(`/api/customers/${customer.id}`) && response.request().method() === 'PUT');
    await save.click(); expect((await saved).ok()).toBe(true);
    const updated = await db.dispensary.findUniqueOrThrow({ where: { id: customer.id } });
    expect(updated.website).toBe('https://example.test');
    expect(updated.description).toBe('Keep this contact note');
  } finally { await db.dispensary.deleteMany({ where: { id: customer.id } }); }
});
