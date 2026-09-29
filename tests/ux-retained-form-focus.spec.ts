import { test, expect, type Page, type Locator } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const database = new URL(process.env.DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1'].includes(database.hostname) || !database.pathname.startsWith('/phenofarm_auth_ux_') || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(baseURL)) throw new Error('Retained-form checks require the isolated local UX app and database.');
const db = new PrismaClient(); const prefix = `ux-focus-${randomUUID()}`;
let userId: string, growerId: string, customerId: string, productId: string, orderId: string, token: string;
test.setTimeout(60_000);
test.use({ video: 'off' });
test.beforeAll(async () => {
  const user = await db.user.create({ data: { email: `${prefix}@example.test`, role: 'GROWER', emailVerifiedAt: new Date(), policyAcceptances: { create: { ...CURRENT_POLICIES, source: 'signup' } }, grower: { create: { businessName: prefix, isVerified: true, licenseNumber: prefix } } }, include: { grower: true } });
  userId = user.id; growerId = user.grower!.id;
  await db.user.update({ where: { id: userId }, data: { growerId } });
  token = await encode({ secret: process.env.AUTH_SECRET!, maxAge: 3600, token: { id: userId, sub: userId, email: user.email, role: 'GROWER', growerId, sessionVersion: 0 } });
  const customer = await db.dispensary.create({ data: { businessName: prefix, createdByGrowerId: growerId, isOffPlatform: true, offPlatformEmail: `${prefix}-customer@example.test` } }); customerId = customer.id;
  const product = await db.product.create({ data: { growerId, name: prefix, price: 100, inventoryQty: 20, unit: 'lb', productType: 'Flower', status: 'PUBLISHED' } }); productId = product.id;
  const order = await db.order.create({ data: { growerId, dispensaryId: customerId, status: 'CONFIRMED', createdBy: 'GROWER', subtotal: 100, totalAmount: 100, items: { create: { productId, growerId, quantity: 1, unitPrice: 100, totalPrice: 100 } } } }); orderId = order.id;
});
test.afterAll(async () => {
  if (growerId) { await db.order.deleteMany({ where: { growerId } }); await db.dispensary.deleteMany({ where: { createdByGrowerId: growerId } }); await db.product.deleteMany({ where: { growerId } }); }
  if (userId) await db.user.deleteMany({ where: { id: userId } }); await db.$disconnect();
});
test.beforeEach(async ({ context, page }) => { await context.addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL }]); await page.setViewportSize({ width: 1440, height: 1000 }); });
async function nav(page: Page, name: string) { await page.locator('aside:visible').getByRole('link', { name, exact: true }).click(); }
async function checkLabel(page: Page, input: Locator, text: RegExp) {
  const path = test.info().outputPath('form-dom.json');
  writeFileSync(path, JSON.stringify(await page.evaluate(() => Array.from(document.querySelectorAll('input[id],form[id],section[id]')).map(element => ({ id: element.id, visible: element.getClientRects().length > 0, value: (element as HTMLInputElement).value }))), null, 2));
  await test.info().attach('form-dom', { contentType: 'application/json', path });
  const label = page.locator('label:visible').filter({ hasText: text }).first();
  await label.click({ position: { x: 8, y: 8 } }); await expect.soft(input).toBeFocused();
}
test('retained add-customer form does not capture edit-customer labels or validation focus', async ({ page }) => {
  await page.goto('/grower/customers/add'); await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toBeVisible(); await nav(page, 'Customers');
  await page.locator(`a[href="/grower/customers/${customerId}"]:visible`).click(); await page.getByRole('link', { name: 'Edit', exact: true }).click();
  const input = page.getByRole('textbox', { name: /^Business name/ }); await expect(input).toHaveValue(prefix);
  await checkLabel(page, input, /^Business name/); await input.fill(''); await page.getByRole('button', { name: 'Save customer', exact: true }).click(); await expect(input).toBeFocused();
});
test('inline customer labels and validation focus stay in the current order', async ({ page }) => {
  await page.goto('/grower/customers/add'); await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toBeVisible(); await nav(page, 'Customers');
  await page.getByRole('link', { name: 'New order', exact: true }).click(); await page.getByRole('button', { name: /New customer/i }).click();
  const input = page.getByRole('textbox', { name: /^Business name/ }); await expect(input).toBeVisible();
  await checkLabel(page, input, /^Business name/); await page.getByRole('button', { name: 'Add customer', exact: true }).click(); await expect(input).toBeFocused();
});
test('retained order form does not capture edit-order labels or validation focus', async ({ page }) => {
  await page.goto(`/grower/orders/add?from=${orderId}`); await expect(page.getByRole('textbox', { name: /Quantity/ })).toHaveValue('1'); await nav(page, 'Orders');
  await page.locator(`a[href="/grower/orders/${orderId}"]:visible`).first().click(); await page.getByRole('link', { name: /Edit/ }).click();
  const input = page.getByRole('textbox', { name: /Quantity/ }); await expect(input).toHaveValue('1');
  await checkLabel(page, input, /^Quantity/); await input.fill('0'); await page.getByRole('button', { name: 'Save order', exact: true }).click(); await expect(input).toBeFocused();
});
test('retained product form does not capture edit-product labels or validation focus', async ({ page }) => {
  await page.goto('/grower/products/add'); await expect(page.getByRole('textbox', { name: 'Name *', exact: true })).toBeVisible(); await nav(page, 'Products');
  await page.locator(`a[href^="/grower/products/${productId}/edit"]:visible`).first().click();
  const input = page.getByRole('textbox', { name: 'Name *', exact: true }); await expect(input).toHaveValue(prefix);
  await checkLabel(page, input, /^Name \*/); await input.fill(''); await page.getByRole('button', { name: 'Save changes', exact: true }).click(); await expect(input).toBeFocused();
});
