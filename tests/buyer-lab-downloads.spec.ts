import { test, expect, type Page } from '@playwright/test';
import { PrismaClient, type UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const database = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1'].includes(new URL(process.env.PLAYWRIGHT_BASE_URL || '').hostname)
  || database.hostname !== 'localhost' || !database.pathname.startsWith('/phenofarm_auth_')) {
  throw new Error('Lab workflow tests require a local app and an isolated phenofarm_auth_ database.');
}
const db = new PrismaClient();
const prefix = `labs-${Date.now()}`;
const localFiles: string[] = [];
const screenshots = process.env.LAB_SCREENSHOTS;
if (screenshots) mkdirSync(screenshots, { recursive: true });
test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', video: 'off' });
test.setTimeout(90_000);

async function account(role: UserRole) {
  const password = `QA-${randomUUID()}`;
  const user = await db.user.create({ data: {
    email: `${prefix}-${randomUUID()}@example.test`, name: 'QA Labs', role, emailVerifiedAt: new Date(), passwordHash: await bcrypt.hash(password, 10),
    ...(role === 'GROWER' ? { grower: { create: { businessName: `${prefix} Grower`, isVerified: true, licenseNumber: prefix, licenseExpiry: new Date('2030-12-31') } } }
      : { dispensary: { create: { businessName: `${prefix} Buyer`, isVerified: true, licenseStatus: 'verified', licenseNumber: prefix, licenseExpiry: new Date('2030-12-31') } } }),
  }, include: { grower: true, dispensary: true } });
  return { ...user, password };
}
async function login(page: Page, user: Awaited<ReturnType<typeof account>>) {
  await page.goto('/auth/sign_in');
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill(user.password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(/\/(grower|dispensary)\//);
}
const pdf = (name: string) => Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n% ${name}\n%%EOF\n`);
const reportPath = (id: string, report = 'cannabinoids') => `/api/dispensary/products/${id}/labs/${report}`;
let grower: Awaited<ReturnType<typeof account>>, buyer: Awaited<ReturnType<typeof account>>;
let withLabs: string, withoutLabs: string, batchId: string;

test.beforeAll(async () => {
  grower = await account('GROWER'); buyer = await account('DISPENSARY');
  const strain = await db.strain.create({ data: { name: prefix, growerId: grower.grower!.id } });
  const batch = await db.batch.create({ data: { batchNumber: prefix, strainId: strain.id, growerId: grower.grower!.id, harvestDate: new Date('2026-01-01') } });
  batchId = batch.id;
  for (const hasLabs of [true, false]) {
    const product = await db.product.create({ data: { name: `${prefix} ${hasLabs ? 'Reports' : 'No labs'}`, growerId: grower.grower!.id,
      batchId: hasLabs ? batchId : null, status: 'PUBLISHED', isAvailable: true, inventoryQty: 20, price: 4, unit: 'Gram', productType: 'Flower' } });
    if (hasLabs) withLabs = product.id; else withoutLabs = product.id;
  }
});
test.afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { startsWith: prefix } }, select: { id: true, grower: { select: { id: true } } } });
  const growers = users.flatMap(user => user.grower ? [user.grower.id] : []);
  await db.product.deleteMany({ where: { growerId: { in: growers } } });
  await db.batch.deleteMany({ where: { growerId: { in: growers } } });
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  await db.$disconnect();
  for (const file of localFiles) { try { unlinkSync(file); } catch { /* Already removed. */ } }
});

test('grower uploads all three PDFs and buyers download matching bytes with bounded catalog payloads', async ({ page, browser }) => {
  await login(page, grower);
  const documents: Record<string, object> = {};
  for (const key of ['cannabinoids', 'pesticides', 'microbials']) {
    const uploaded = await page.request.post('/api/products/upload-document', { multipart: { file: { name: `${key}.pdf`, mimeType: 'application/pdf', buffer: pdf(key) } } });
    expect(uploaded.status(), await uploaded.text()).toBe(200);
    const { url } = await uploaded.json();
    expect(url).toMatch(/^\/uploads\/[a-zA-Z0-9-]+\.pdf$/);
    localFiles.push(path.join(process.cwd(), 'public', url));
    documents[key] = { label: key, fileName: `${key}.pdf`, mimeType: 'application/pdf', dataUrl: url, uploadedAt: new Date().toISOString() };
  }
  const saved = await page.request.put(`/api/batches/${batchId}`, { data: { testResults: { labDocuments: documents } } });
  expect(saved.status(), await saved.text()).toBe(200);
  const savedBatch = await db.batch.findUniqueOrThrow({ where: { id: batchId } });
  expect(savedBatch.testResults).toEqual({ labDocuments: documents });
  expect((await page.request.get(reportPath(withLabs))).status()).toBe(403);
  const anonymous = await browser.newContext();
  expect((await anonymous.request.get(`${process.env.PLAYWRIGHT_BASE_URL}${reportPath(withLabs)}`)).status()).toBe(401);
  await anonymous.close();
  await login(page, buyer);
  const catalog = await page.request.get(`/api/dispensary/catalog?search=${prefix}`);
  expect(catalog.status(), await catalog.text()).toBe(200);
  const body = await catalog.json();
  expect(body.products.find((p: { id: string }) => p.id === withLabs).labReports).toEqual(['cannabinoids', 'pesticides', 'microbials']);
  expect(body.products.find((p: { id: string }) => p.id === withoutLabs).labReports).toEqual([]);
  expect((await catalog.body()).length).toBeLessThan(10_000);
  expect(await catalog.text()).not.toContain('dataUrl');
  for (const key of Object.keys(documents)) {
    const downloaded = await page.request.get(reportPath(withLabs, key));
    expect(downloaded.status(), await downloaded.text()).toBe(200);
    expect(downloaded.headers()['content-type']).toBe('application/pdf');
    expect(downloaded.headers()['content-disposition']).toMatch(/^attachment;/);
    expect(downloaded.headers()['cache-control']).toBe('private, no-store');
    expect(await downloaded.body()).toEqual(pdf(key));
  }
  expect((await page.request.get(reportPath(withoutLabs))).status()).toBe(404);
  expect((await page.request.get(reportPath(withLabs, 'secret'))).status()).toBe(404);
});

for (const width of [1440, 390, 320]) test(`downloads appear only with files across buyer views at ${width}px; failures retry`, async ({ page }) => {
  await page.setViewportSize({ width, height: 950 }); await login(page, buyer);
  const favorite = await page.request.put('/api/dispensary/favorites', { data: { productIds: [withLabs, withoutLabs] } });
  expect(favorite.status()).toBe(200);
  for (const [name, url] of [['catalog', `/dispensary/catalog?search=${prefix}`], ['shop', `/dispensary/grower/${grower.grower!.id}`], ['saved', '/dispensary/saved?tab=favorites']]) {
    await page.goto(url);
    await page.getByRole('button', { name: /grid view/i }).click();
    const buttons = page.getByRole('group', { name: `Lab reports for ${prefix} Reports`, exact: true });
    await expect(buttons).toBeVisible();
    await expect(buttons.getByRole('button')).toHaveCount(3);
    await expect(page.getByRole('group', { name: `Lab reports for ${prefix} No labs`, exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await buttons.getByRole('button').all()) {
      const box = await button.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(40); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    if (screenshots) await page.screenshot({ path: `${screenshots}/${name}-grid-${width}.png`, fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await buttons.getByRole('button', { name: /^Download Potency/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Potency.pdf');
    expect(readFileSync((await download.path())!)).toEqual(pdf('cannabinoids'));
    await page.getByRole('button', { name: /list view/i }).click();
    await expect(buttons).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (screenshots) await page.screenshot({ path: `${screenshots}/${name}-list-${width}.png`, fullPage: true });
  }
  await page.goto(`/dispensary/catalog?search=${prefix}`);
  await page.getByRole('button', { name: `Compare ${prefix} Reports`, exact: true }).click();
  await page.getByRole('button', { name: `Compare ${prefix} No labs`, exact: true }).click();
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  const comparison = page.getByRole('dialog', { name: 'Compare (2)' });
  await expect(comparison).toBeVisible();
  await expect(comparison.getByRole('button', { name: /^Download/ })).toHaveCount(3);
  expect(await comparison.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  if (screenshots) await page.screenshot({ path: `${screenshots}/comparison-${width}.png` });
  const compareDownload = page.waitForEvent('download');
  await comparison.getByRole('button', { name: /^Download Potency/ }).click(); await compareDownload;
  await comparison.getByRole('button', { name: 'Close product comparison' }).click();
  await page.route(`**${reportPath(withLabs)}`, route => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'This report is temporarily unavailable. Please try again.' }) }), { times: 1 });
  const button = page.getByRole('button', { name: /^Download Potency/ });
  await button.click();
  await expect(page.getByRole('alert').filter({ hasText: 'temporarily unavailable' })).toBeVisible();
  const retry = page.waitForEvent('download'); await button.click(); await retry;
  await expect(page.getByRole('alert').filter({ hasText: 'temporarily unavailable' })).toHaveCount(0);
});

test('legacy COAs, duplicate references, removal, visibility changes, and unsafe references', async ({ page }) => {
  await login(page, buyer);
  const original = await db.batch.findUniqueOrThrow({ where: { id: batchId } });
  const legacy = `data:application/pdf;base64,${pdf('legacy').toString('base64')}`;
  const metadata = async () => (await (await page.request.get(`/api/dispensary/catalog?search=${prefix}`)).json()).products.find((p: { id: string }) => p.id === withLabs)?.labReports;
  try {
    await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: legacy, testResults: { labDocuments: { cannabinoids: { dataUrl: legacy } } } } });
    expect(await metadata()).toEqual(['cannabinoids']);
    expect(await (await page.request.get(reportPath(withLabs, 'coa'))).body()).toEqual(pdf('legacy'));
    await db.batch.update({ where: { id: batchId }, data: { testResults: { labDocuments: {} } } });
    expect(await metadata()).toEqual(['coa']);
    for (const source of ['http://127.0.0.1:1/private.pdf', 'https://example.com/file.pdf', 'https://test.public.blob.vercel-storage.com/products/another-grower/documents/file.pdf', 'https://test.public.blob.vercel-storage.com/products/x/../../private.pdf']) {
      await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: source } });
      expect(await metadata()).toEqual([]);
      expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
    }
    await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: legacy } });
    for (const update of [{ status: 'DRAFT' as const }, { isDeleted: true }]) {
      await db.product.update({ where: { id: withLabs }, data: update });
      expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
      await db.product.update({ where: { id: withLabs }, data: { status: 'PUBLISHED', isDeleted: false } });
    }
    await db.grower.update({ where: { id: grower.grower!.id }, data: { isVerified: false } });
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
    await db.grower.update({ where: { id: grower.grower!.id }, data: { isVerified: true } });
    await db.grower.update({ where: { id: grower.grower!.id }, data: { licenseExpiry: new Date('2020-01-01') } });
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
    await db.grower.update({ where: { id: grower.grower!.id }, data: { licenseExpiry: new Date('2030-12-31') } });
    await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: 'data:application/pdf;base64,aW52YWxpZA==' } });
    expect(await metadata()).toEqual([]);
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(422);
    await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: `data:application/pdf;base64,${Buffer.concat([pdf('large'), Buffer.alloc(2_000_001)]).toString('base64')}` } });
    expect(await metadata()).toEqual([]);
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
    await db.batch.update({ where: { id: batchId }, data: { coaDocumentUrl: legacy } });
    const other = await account('GROWER');
    await db.batch.update({ where: { id: batchId }, data: { growerId: other.grower!.id } });
    expect(await metadata()).toEqual([]);
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
    await db.batch.update({ where: { id: batchId }, data: { growerId: grower.grower!.id, coaDocumentUrl: null } });
    expect(await metadata()).toEqual([]);
    expect((await page.request.get(reportPath(withLabs, 'coa'))).status()).toBe(404);
  } finally {
    await db.grower.update({ where: { id: grower.grower!.id }, data: { isVerified: true, licenseExpiry: new Date('2030-12-31') } });
    await db.product.update({ where: { id: withLabs }, data: { status: 'PUBLISHED', isDeleted: false } });
    await db.batch.update({ where: { id: batchId }, data: { growerId: original.growerId, coaDocumentUrl: original.coaDocumentUrl, testResults: original.testResults! } });
  }
});
