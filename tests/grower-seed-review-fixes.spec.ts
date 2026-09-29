import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { mkdirSync, readFileSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const database = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) || !['localhost', '127.0.0.1'].includes(database.hostname) || !database.pathname.startsWith('/phenofarm_auth_')) throw new Error('Requires an isolated local auth database and app.');
const db = new PrismaClient();
const prefix = `seed-review-${Date.now()}`;
let growerId: string, userId: string, token: string, sourceId: string, strainId: string;
const proofDir = '/tmp/phenoshop-grower-review-proof';
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
test.setTimeout(90000);
test.use({ timezoneId: 'America/New_York' });
test.beforeAll(async () => {
  mkdirSync(proofDir, { recursive: true });
  const user = await db.user.create({ data: { email: `${prefix}@example.test`, role: 'GROWER', emailVerifiedAt: new Date(), policyAcceptances: { create: { ...CURRENT_POLICIES, source: 'signup' } }, grower: { create: { businessName: 'Seed review farm', isVerified: false, licenseExpiry: new Date('2030-01-01') } } }, include: { grower: true } });
  userId = user.id; growerId = user.grower!.id;
  token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: userId, sub: userId, email: user.email, role: 'GROWER', sessionVersion: 0 }, maxAge: 3600 });
  const strain = await db.strain.create({ data: { growerId, name: 'QA strain' } }); strainId = strain.id;
  const batch = await db.batch.create({ data: { growerId, strainId, batchNumber: prefix, harvestDate: new Date('2026-09-01'), thc: 22, cbd: 0.2, testResults: { labDocuments: { cannabinoids: { dataUrl: `data:application/pdf;base64,${pdf.toString('base64')}`, fileName: 'qa.pdf' } } } } });
  const source = await db.product.create({ data: { growerId, strainId, batchId: batch.id, name: 'Original QA Flower', productType: 'Flower', subType: 'A Bud', price: 4, inventoryQty: 20, unit: 'Gram', sku: 'ORIGINAL', brand: 'Seed review farm', description: 'Reusable description', thcMin: 20, thcMax: 23, images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N0AAAAASUVORK5CYII='], status: 'PUBLISHED', isAvailable: true } }); sourceId = source.id;
});
test.afterAll(async () => {
  if (growerId) { await db.product.deleteMany({ where: { growerId } }); await db.batch.deleteMany({ where: { growerId } }); }
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
});
async function auth(page: Page) { await page.context().addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL }]); }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }

test('duplicate stays unsaved, preserves reusable details and supports draft save then explicit publish', async ({ page }) => {
  await auth(page); await page.goto('/grower/products');
  const before = await db.product.count({ where: { growerId } });
  await page.getByRole('button', { name: 'More actions for Original QA Flower' }).click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page).toHaveURL(/duplicate=/);
  await expect(page.locator('#name')).toHaveValue('Original QA Flower Copy');
  expect(await db.product.count({ where: { growerId } })).toBe(before);
  await expect(page.locator('#inventoryQty')).toHaveValue('0'); await expect(page.locator('#sku')).toHaveValue('');
  await expect(page.locator('#brand')).toHaveValue('Seed review farm'); await expect(page.locator('#description')).toHaveValue('Reusable description');
  await expect(page.locator('#thcMax')).toHaveValue('23'); await expect(page.getByAltText('Product image preview 1')).toBeVisible();
  await page.locator('#name').fill('Draft QA copy'); await page.locator('#inventoryQty').fill('10');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/grower\/products$/);
  const draft = await db.product.findFirstOrThrow({ where: { growerId, name: 'Draft QA copy' } });
  expect(draft.status).toBe('DRAFT'); expect(draft.isAvailable).toBe(false);
  await expect(page.getByText('Draft', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.goto(`/grower/products/${draft.id}/edit`); await page.locator('#description').fill('Edited draft');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await expect(page).toHaveURL(/\/grower\/products$/);
  expect((await db.product.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe('DRAFT');
  await page.goto(`/grower/products/${draft.id}/edit`); await page.getByRole('button', { name: 'Publish draft', exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/grower\/products$/);
  const published = await db.product.findUniqueOrThrow({ where: { id: draft.id } }); expect(published.status).toBe('PUBLISHED'); expect(published.isAvailable).toBe(true); expect(published.description).toBe('Edited draft');
});

test('quick details creates a draft with grower brand and quote-only explains internal price', async ({ page }) => {
  await auth(page); await page.goto('/grower/products'); await page.getByRole('button', { name: 'Quick add', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Quick QA'); await page.getByLabel('Price', { exact: true }).fill('12'); await page.getByLabel('Inventory', { exact: true }).fill('15');
  await page.getByRole('button', { name: 'Create draft and add details' }).click(); await expect(page).toHaveURL(/\/edit$/);
  await expect(page.locator('#brand')).toHaveValue('Seed review farm');
  const draft = await db.product.findFirstOrThrow({ where: { growerId, name: 'Quick QA' } }); expect(draft.status).toBe('DRAFT'); expect(draft.isAvailable).toBe(false);
  await page.getByRole('button', { name: 'Quote only', exact: true }).click();
  await expect(page.getByLabel('Internal reference price ($) *', { exact: true })).toBeVisible();
  await expect(page.getByText(/Used to calculate your stock value/)).toBeVisible();
});

test('publish and add another clears item details and stock while retaining chosen defaults', async ({ page }) => {
  await auth(page); await page.goto('/grower/products/add');
  await page.locator('#name').fill('Repeat entry QA'); await page.locator('#productType').selectOption({ label: 'Flower' });
  await page.locator('#price').fill('19'); await page.locator('#inventoryQty').fill('7');
  await page.getByLabel('Add another after publishing').check();
  await page.getByRole('button', { name: 'Publish and add another', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('#name')).toHaveValue(''); await expect(page.locator('#inventoryQty')).toHaveValue('0'); await expect(page.locator('#price')).toHaveValue('19');
  expect(await db.product.count({ where: { growerId, name: 'Repeat entry QA' } })).toBe(1);
  await expect(page.getByRole('button', { name: 'Use last listing settings' })).toBeVisible();
});

test('preview explains review gate and owner downloads lab PDF without exposing it cross-account', async ({ page, browser }) => {
  await auth(page); await page.goto('/grower/catalog');
  await expect(page.getByText('Published listings are awaiting license review.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Buyer preview/ })).toContainText('awaiting review');
  await page.goto('/grower/marketplace');
  const card = page.getByTestId('marketplace-listing-card').filter({ hasText: 'Original QA Flower' });
  const href = `/api/grower/products/${sourceId}/labs/cannabinoids`;
  const button = card.getByRole('button', { name: /Download Potency PDF/ });
  await page.route(`**${href}`, route => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Report temporarily unavailable. Please try again.' }) }), { times: 1 });
  await button.click(); await expect(card.getByRole('alert')).toContainText('temporarily unavailable');
  const downloadPromise = page.waitForEvent('download');
  await button.click(); const download = await downloadPromise;
  expect(readFileSync((await download.path())!)).toEqual(pdf);
  await expect(card.getByRole('alert')).toHaveCount(0);
  await expect(card.getByRole('status')).toContainText('PDF sent to your browser');
  const response = await page.request.get(href!); expect(response.status()).toBe(200); expect(await response.body()).toEqual(pdf);
  const anonymous = await browser.newContext(); expect((await anonymous.request.get(baseURL + href)).status()).toBe(401); await anonymous.close();
  const other = await db.user.create({ data: { email: `${prefix}-other@example.test`, role: 'GROWER', emailVerifiedAt: new Date(), grower: { create: { businessName: 'Other' } } } });
  const otherToken = await encode({ secret: process.env.AUTH_SECRET!, token: { id: other.id, sub: other.id, email: other.email, role: 'GROWER', sessionVersion: 0 }, maxAge: 3600 });
  const context = await browser.newContext(); await context.addCookies([{ name: 'next-auth.session-token', value: otherToken, url: baseURL }]);
  expect((await context.request.get(baseURL + href)).status()).toBe(404); await context.close();
  await page.screenshot({ path: `${proofDir}/preview-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await page.screenshot({ path: `${proofDir}/preview-mobile.png`, fullPage: true });
});

test('inline batch captures terpenes and explains inherited metrics', async ({ page }) => {
  // UTC is already tomorrow while the grower is still on September 24.
  await page.clock.setFixedTime(new Date('2026-09-25T00:30:00Z'));
  await auth(page); await page.goto(`/grower/products/${sourceId}/edit`);
  await expect(page.getByText(/From batch/)).toBeVisible(); await expect(page.getByText(/Harvest: 2026-09-01/)).toBeVisible();
  await page.getByRole('button', { name: '+ New', exact: true }).nth(1).click();
  const dialog = page.getByRole('dialog', { name: 'New batch' });
  await expect(dialog.getByLabel('Harvest date *', { exact: true })).toHaveValue('2026-09-24');
  await dialog.getByLabel('Batch # *', { exact: true }).fill('Inline QA terpenes');
  await dialog.getByText('Terpenes (optional)', { exact: true }).click(); await dialog.getByRole('button', { name: 'Add terpene', exact: true }).click();
  await dialog.getByLabel('Terpene 1', { exact: true }).fill('Limonene'); await dialog.getByLabel('Percentage 1', { exact: true }).fill('0.65');
  await dialog.getByRole('button', { name: 'Add batch', exact: true }).click(); await expect(dialog).not.toBeVisible();
  const batch = await db.batch.findFirstOrThrow({ where: { growerId, batchNumber: 'Inline QA terpenes' } }); expect(batch.terpenes).toEqual({ Limonene: 0.65 });
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await page.screenshot({ path: `${proofDir}/editor-mobile.png`, fullPage: true });
});

test('free plan is ready and settings save scopes expose unsaved terms', async ({ page }) => {
  await auth(page); await page.goto('/grower/dashboard'); await expect(page.getByText('Choose a plan for your business.')).toHaveCount(0);
  await page.goto('/grower/settings'); await expect(page.getByText(/Logo changes save immediately/)).toBeVisible();
  await page.getByLabel('Minimum order').fill('QA minimum'); await expect(page.getByText('Unsaved order terms', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save terms', exact: true }).click(); await expect(page.getByText('Order terms saved', { exact: true })).toBeVisible();
});

test('signup carries email to verification and resend remains on page with cooldown', async ({ page }) => {
  await page.goto('/auth/sign_up');
  await page.locator('#firstName').fill('QA'); await page.locator('#lastName').fill('Signup');
  const email = `${prefix}-signup@example.test`;
  await page.locator('#email').fill(email); await page.locator('#password').fill('Isolated test password 123!'); await page.locator('#confirmPassword').fill('Isolated test password 123!');
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/verify-email\?sent=1/); await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email);
  await page.getByRole('button', { name: 'Send verification link', exact: true }).click(); await expect(page.getByRole('button', { name: /Resend available in/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Use a different email' }).click(); await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await page.screenshot({ path: `${proofDir}/verification-mobile.png`, fullPage: true });
});
