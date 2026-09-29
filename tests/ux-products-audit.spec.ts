import {
  test,
  expect,
  request as requests,
  type APIRequestContext,
} from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Workbook } from 'exceljs';
import { parseInventoryQty, parsePrice } from '../lib/product-payload';
import { validateProductImport } from '../lib/product-import';
import { CURRENT_POLICIES } from '../lib/policies/current';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const target = new URL(process.env.DATABASE_URL || 'http://invalid');
if (
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  !target.pathname.includes('phenofarm_auth_ux_') ||
  !/^http:\/\/(localhost|127\.0\.0\.1):/.test(baseURL)
)
  throw new Error(
    'UX product tests require the isolated local UX database and app.'
  );
const db = new PrismaClient(),
  prefix = `ux-products-${randomUUID()}`;
const uploadedPaths = new Set<string>();
let userId: string,
  growerId: string,
  token: string,
  api: APIRequestContext,
  strainId: string,
  batchId: string;
test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);
test.beforeAll(async () => {
  const user = await db.user.create({
    data: {
      email: `${prefix}@example.test`,
      name: 'TEST — UX grower',
      role: 'GROWER',
      emailVerifiedAt: new Date(),
      grower: {
        create: {
          businessName: 'TEST — UX products',
          isVerified: true,
          licenseNumber: prefix,
          licenseExpiry: new Date('2030-12-31'),
        },
      },
      policyAcceptances: { create: { ...CURRENT_POLICIES, source: 'signup' } },
    },
    include: { grower: true },
  });
  userId = user.id;
  growerId = user.grower!.id;
  await db.user.update({ where: { id: userId }, data: { growerId } });
  token = await encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      id: userId,
      sub: userId,
      email: user.email,
      role: 'GROWER',
      growerId,
      sessionVersion: 0,
    },
  });
  api = await requests.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: `next-auth.session-token=${token}` },
  });
});
test.afterAll(async () => {
  await api?.dispose();
  if (growerId) {
    await db.product.deleteMany({ where: { growerId } });
    await db.batch.deleteMany({ where: { growerId } });
    await db.strain.deleteMany({ where: { growerId } });
  }
  if (userId) await db.user.delete({ where: { id: userId } });
  await Promise.all(
    [...uploadedPaths].map((file) =>
      file.startsWith('/uploads/')
        ? unlink(path.join(process.cwd(), 'public', file)).catch(() => {})
        : Promise.resolve()
    )
  );
  await db.$disconnect();
});
function upload(content: string, dryRun = false, name = 'products.csv') {
  return api.post('/api/products/bulk', {
    multipart: {
      file: {
        name,
        mimeType: 'application/octet-stream',
        buffer: Buffer.from(content),
      },
      ...(dryRun ? { dryRun: 'true' } : {}),
    },
  });
}

test('import numbers never truncate and valid rows keep their original row number', () => {
  expect(parsePrice('$1,200.00')).toBe(1200);
  expect(parseInventoryQty('1,200 units')).toBe(1200);
  expect(parseInventoryQty('100.5')).toBeNull();
  expect(parsePrice('10wrong')).toBeNull();
  expect(parsePrice('1,20')).toBeNull();
  const parsed = validateProductImport(
    'Name;Type;Price;Stock;Unit\nGood;Flowers;$45.00;10 lbs;lbs\n\nBad;Unknown;4;4;unit\nFraction;Flower;4;0.5;lb'
  );
  expect(parsed.records).toHaveLength(1);
  expect(parsed.records[0]).toMatchObject({
    row: 2,
    productType: 'Flower',
    price: 45,
    inventoryQty: 10,
    unit: 'Lb',
  });
  expect(parsed.errors.map((error) => error.row)).toEqual(
    expect.arrayContaining([4, 5])
  );
});

test('partial import updates by SKU/name and concurrent retry cannot duplicate products', async () => {
  const csv =
    'Name,Type,Price,Stock,Unit,SKU\nAlpha,Flowers,"$1,200.00",4,lbs,UX-A\nBad,Unknown,20,4,unit,BAD\nFraction,Flower,20,0.5,lb,FRACTION';
  const preview = await upload(csv, true);
  expect(preview.status()).toBe(200);
  expect(await preview.json()).toMatchObject({
    createCount: 1,
    updateCount: 0,
    validRows: 1,
    errorRows: 2,
  });
  const result = await upload(csv);
  expect(result.status()).toBe(200);
  expect(await result.json()).toMatchObject({
    createCount: 1,
    successCount: 1,
    errorRows: 2,
  });
  expect(await db.product.count({ where: { growerId } })).toBe(1);
  const saved = await db.product.findFirstOrThrow({
    where: { growerId, sku: 'UX-A' },
  });
  expect(Number(saved.price)).toBe(1200);
  await db.product.update({
    where: { id: saved.id },
    data: {
      description: 'Preserve description',
      images: ['https://example.test/a.png'],
    },
  });
  const changed = 'Name,Type,Price,SKU\nAlpha renamed,flower,1500,UX-A';
  const responses = await Promise.all([upload(changed), upload(changed)]);
  for (const response of responses) {
    expect(response.status(), await response.text()).toBe(200);
  }
  const products = await db.product.findMany({ where: { growerId } });
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    name: 'Alpha renamed',
    inventoryQty: 4,
    description: 'Preserve description',
    images: ['https://example.test/a.png'],
  });
  expect(Number(products[0].price)).toBe(1500);
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Products');
  sheet.addRows([
    ['Name', 'Type', 'Price', 'Stock'],
    ['Excel vape', 'Vape', 50, 3],
  ]);
  const excel = await api.post('/api/products/bulk', {
    multipart: {
      file: {
        name: 'products.xlsx',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      },
    },
  });
  expect(excel.status(), await excel.text()).toBe(200);
  expect(
    await db.product.findFirst({ where: { growerId, name: 'Excel vape' } })
  ).toMatchObject({ productType: 'Cartridge', unit: 'Unit', inventoryQty: 3 });
  for (const [status, available] of [
    ['Hidden', false],
    ['Live', true],
    ['Draft', false],
  ] as const) {
    const response = await upload(
      `Name,Type,Price,SKU,Status\nAlpha renamed,Flower,1500,UX-A,${status}`
    );
    expect(response.status()).toBe(200);
    expect(
      await db.product.findUnique({ where: { id: saved.id } })
    ).toMatchObject({
      inventoryQty: 4,
      status: status === 'Draft' ? 'DRAFT' : 'PUBLISHED',
      isAvailable: available,
    });
  }
  const makeLive = await upload(
    'Name,Type,Price,SKU,Status,Available\nAlpha renamed,Flower,1500,UX-A,Live,yes'
  );
  expect(makeLive.status()).toBe(200);
  expect(
    await db.product.findUnique({ where: { id: saved.id } })
  ).toMatchObject({ inventoryQty: 4, isAvailable: true });
});

test('bulk visibility counts skipped rows correctly and delete/restore preserve the product', async () => {
  const draft = await db.product.create({
    data: {
      growerId,
      name: 'Draft fixture',
      productType: 'Flower',
      price: 10,
      inventoryQty: 0,
      unit: 'Lb',
      status: 'DRAFT',
      isAvailable: false,
      images: [],
    },
  });
  const live = await db.product.findFirstOrThrow({
    where: { growerId, sku: 'UX-A' },
  });
  const response = await api.patch('/api/products/bulk-update', {
    data: {
      productIds: [draft.id, live.id, 'not-owned'],
      updates: { isAvailable: true },
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toMatchObject({ updatedCount: 1, skippedCount: 2 });
  expect(data.skipped).toContainEqual({ id: draft.id, reason: 'draft' });
  expect(
    (
      await api.patch('/api/products/bulk-update', {
        data: { productIds: [live.id], updates: { pricePercent: '-10' } },
      })
    ).status()
  ).toBe(200);
  expect(
    Number(
      (await db.product.findUniqueOrThrow({ where: { id: live.id } })).price
    )
  ).toBe(1350);
  expect((await api.delete(`/api/products/${live.id}`)).status()).toBe(200);
  expect((await api.get('/api/products?view=deleted')).status()).toBe(200);
  expect(
    (
      await api.put(`/api/products/${live.id}`, { data: { restore: true } })
    ).status()
  ).toBe(200);
  expect(await db.product.findUnique({ where: { id: live.id } })).toMatchObject(
    { isDeleted: false, isAvailable: false, inventoryQty: 4 }
  );
  const conflict = await api.post('/api/inventory', {
    data: { productId: live.id, quantityAvailable: 7, expectedQuantity: 3 },
  });
  expect(conflict.status()).toBe(409);
});

test('mobile strain and batch creation validate inline, preserve context, and prefill product lab values', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/grower/strains/add');
  const strainName = page.getByRole('textbox', { name: 'Name', exact: true });
  await expect(strainName).toHaveCount(1);
  await page.getByRole('button', { name: 'Save strain', exact: true }).click();
  await expect(page.getByText('Enter a strain name.')).toBeVisible();
  await expect(strainName).toBeFocused();
  await strainName.fill('UX No type');
  await page.getByRole('button', { name: 'Save strain', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Strain saved' })
  ).toBeVisible();
  const strain = await db.strain.findFirstOrThrow({
    where: { growerId, name: 'UX No type' },
  });
  strainId = strain.id;
  expect(strain.strainType).toBeNull();
  await page.getByRole('link', { name: 'Add batch', exact: true }).click();
  await expect(page.locator('#strainId')).toHaveValue(strainId);
  await expect(page.locator('#batchNumber')).not.toHaveValue('');
  await page.locator('#thc').fill('22%');
  await page.locator('#cbd').fill('1');
  await page.getByRole('button', { name: 'Save batch', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Batch saved' })
  ).toBeVisible();
  const batch = await db.batch.findFirstOrThrow({
    where: { growerId, strainId },
  });
  batchId = batch.id;
  await page.getByRole('link', { name: 'Add product from this batch' }).click();
  await expect(page.locator('#batchId')).toHaveValue(batchId);
  await expect(page.locator('#thcMin')).toHaveValue('22');
  await expect(page.locator('#cbdMin')).toHaveValue('1');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBeTruthy();
  const bar = await page.locator('[data-sticky-action-bar]').boundingBox(),
    tabs = await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .boundingBox();
  expect(bar).not.toBeNull();
  expect(tabs).not.toBeNull();
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(tabs!.y + 1);
  expect(
    await page
      .getByRole('button', { name: 'Publish product', exact: true })
      .evaluate((element) => element.getBoundingClientRect().height)
  ).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: '/tmp/phenoshop-ux-20260929/products-mobile-form.png',
    fullPage: true,
  });
});

test('inline stock coalesces taps and product list works on desktop and mobile', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.goto('/grower/products?search=Alpha&sortBy=name&sortOrder=asc');
  await expect(
    page.getByRole('heading', { name: 'Products', exact: true })
  ).toBeVisible();
  const current = await db.product.findFirstOrThrow({
    where: { growerId, sku: 'UX-A' },
  });
  let writes = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/inventory') && request.method() === 'POST')
      writes++;
  });
  for (let i = 0; i < 3; i++)
    await page
      .getByRole('button', {
        name: 'Increase Alpha renamed stock',
        exact: true,
      })
      .click();
  await expect
    .poll(
      async () =>
        (await db.product.findUniqueOrThrow({ where: { id: current.id } }))
          .inventoryQty
    )
    .toBe(current.inventoryQty + 3);
  expect(writes).toBe(1);
  await page
    .getByRole('textbox', { name: 'Alpha renamed price', exact: true })
    .fill('$1,800.00');
  await page
    .getByRole('textbox', { name: 'Alpha renamed price', exact: true })
    .press('Tab');
  await expect
    .poll(async () =>
      Number(
        (await db.product.findUniqueOrThrow({ where: { id: current.id } }))
          .price
      )
    )
    .toBe(1800);
  await db.product.update({
    where: { id: current.id },
    data: { inventoryQty: 50 },
  });
  await page
    .getByRole('button', { name: 'Increase Alpha renamed stock', exact: true })
    .click();
  await expect(
    page.getByText(
      'Stock changed elsewhere. Latest quantity shown; edit it to try again.'
    )
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Alpha renamed stock in lb' })
  ).toHaveValue('50');
  await page
    .getByRole('button', { name: 'Increase Alpha renamed stock', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await db.product.findUniqueOrThrow({ where: { id: current.id } }))
          .inventoryQty
    )
    .toBe(51);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole('textbox', { name: 'Alpha renamed stock in lb' })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBeTruthy();
    await page.screenshot({
      path: `/tmp/phenoshop-ux-20260929/products-list-${width}.png`,
      fullPage: true,
    });
  }
});

test('import dialog recovers from network failure and supports importing good rows only', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/grower/products');
  await page.getByRole('button', { name: 'Import spreadsheet' }).click();
  await page
    .getByLabel('Product spreadsheet')
    .setInputFiles({
      name: 'too-large.csv',
      mimeType: 'text/csv',
      buffer: Buffer.alloc(4_300_000),
    });
  await expect(
    page.getByText('Choose a spreadsheet smaller than 4MB.')
  ).toBeVisible();
  await page
    .getByLabel('Product spreadsheet')
    .setInputFiles({
      name: 'partial.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Name,Type,Price,Stock\nDialog good,Flower,20,2\nDialog bad,Unknown,20,1'
      ),
    });
  await page.route('**/api/products/bulk', (route) => route.abort(), {
    times: 1,
  });
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Preview', exact: true })
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText('Create 1 · Update 0 · Skip 1')).toBeVisible();
  await page.getByRole('button', { name: 'Import 1 good row, skip 1' }).click();
  await expect(
    page.getByText('Created 1 · Updated 0 · Skipped 1')
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Import 1 good row, skip 1' })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download skipped rows' })
  ).toBeVisible();
  expect(
    await db.product.count({ where: { growerId, name: 'Dialog good' } })
  ).toBe(1);
});

test('full COA upload accepts a scan above 2MB and is downloadable from a draft preview', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/grower/batches/${batchId}/edit`);
  await expect(page.getByRole('heading', { name: 'Edit batch' })).toBeVisible();
  const pdf = Buffer.concat([
    Buffer.from('%PDF-1.4\n% synthetic test scan\n'),
    Buffer.alloc(2_500_000, 32),
    Buffer.from('\n%%EOF'),
  ]);
  await page
    .getByLabel('Full COA', { exact: true })
    .setInputFiles({
      name: 'full-coa.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });
  await expect(
    page.getByRole('link', { name: 'View', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save batch', exact: true }).click();
  await expect(page).toHaveURL(/\/grower\/batches$/);
  const batch = await db.batch.findUniqueOrThrow({ where: { id: batchId } });
  expect(batch.coaDocumentUrl).toMatch(/^\/uploads\//);
  if (batch.coaDocumentUrl) uploadedPaths.add(batch.coaDocumentUrl);
  const product = await db.product.create({
    data: {
      growerId,
      name: 'Draft with complete COA',
      productType: 'Flower',
      price: 75,
      inventoryQty: 0,
      unit: 'Lb',
      status: 'DRAFT',
      isAvailable: false,
      strainId,
      batchId,
      images: [],
    },
  });
  await page.goto(`/grower/products/${product.id}/preview`);
  await expect(
    page.getByRole('heading', { name: 'Draft with complete COA', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Hybrid', { exact: true })).toHaveCount(0);
  const download = await api.get(`/api/grower/products/${product.id}/labs/coa`);
  expect(download.status()).toBe(200);
  expect((await download.body()).length).toBe(pdf.length);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBeTruthy();
  await page.screenshot({
    path: '/tmp/phenoshop-ux-20260929/product-draft-preview-mobile.png',
    fullPage: true,
  });
});

test('zero-stock quick save is honest and edit preserves the filtered return path', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/grower/products?search=Zero&sortBy=name&sortOrder=asc');
  await page
    .getByRole('button', { name: 'Add product', exact: true })
    .first()
    .click();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Zero stock UX');
  await page
    .getByRole('textbox', { name: 'Price ($)', exact: true })
    .fill('$2,000.00');
  await page.getByRole('textbox', { name: 'Stock', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Saved but hidden: no stock', { exact: true })
  ).toBeVisible();
  const product = await db.product.findFirstOrThrow({
    where: { growerId, name: 'Zero stock UX' },
  });
  expect(product.isAvailable).toBe(false);
  await page.getByRole('link', { name: 'Zero stock UX', exact: true }).click();
  await expect(page).toHaveURL(/returnTo=/);
  await page.locator('#price').fill('2100');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL(
    /\/grower\/products\?search=Zero&sortBy=name&sortOrder=asc#product-/
  );
  expect(
    Number(
      (await db.product.findUniqueOrThrow({ where: { id: product.id } })).price
    )
  ).toBe(2100);
});

test('dirty batch dialog ignores backdrop and used records offer a useful View action', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/grower/products/add');
  await page
    .locator('#batchId')
    .locator('..')
    .getByRole('button', { name: '+ New', exact: true })
    .click();
  const modal = page.getByRole('dialog', { name: 'New batch', exact: true });
  await modal.locator('#batchNumber').fill('UNSAVED-BATCH');
  await page.mouse.click(1, 1);
  await expect(modal).toBeVisible();
  await expect(modal.locator('#batchNumber')).toHaveValue('UNSAVED-BATCH');
  await page.keyboard.press('Escape');
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: 'Close New batch' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Leave without saving?' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await page.goto('/grower/batches');
  const used = page
    .locator('article')
    .filter({ has: page.getByRole('link', { name: /BATCH-/ }) });
  await expect(
    used.getByRole('link', { name: /Used by 1 product/ })
  ).toBeVisible();
  await expect(
    used.getByRole('button', { name: 'Delete', exact: true })
  ).toHaveCount(0);
  await page.goto('/grower/strains');
  await page.getByRole('searchbox', { name: 'Search strains' }).fill('No type');
  await expect(
    page.getByRole('link', { name: 'UX No type', exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: '/tmp/phenoshop-ux-20260929/strains-mobile.png',
    fullPage: true,
  });
});

test('product photos accept six uploads including an image above the old 1MB limit', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: baseURL },
  ]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/grower/products/add');
  await page.locator('#name').fill('Six photo UX');
  await page.locator('#productType').selectOption('Flower');
  await page.locator('#price').fill('100');
  await page.locator('#inventoryQty').fill('2');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
    'base64'
  );
  await page
    .locator('#productImagesInput')
    .setInputFiles(
      Array.from({ length: 6 }, (_, index) => ({
        name: `photo-${index}.png`,
        mimeType: 'image/png',
        buffer:
          index === 0 ? Buffer.concat([png, Buffer.alloc(1_200_000)]) : png,
      }))
    );
  await expect(
    page.getByRole('img', { name: /Product image preview/ })
  ).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Publish product', exact: true })
    .click();
  await expect(page).toHaveURL(/\/grower\/products$/);
  const product = await db.product.findFirstOrThrow({
    where: { growerId, name: 'Six photo UX' },
  });
  expect(product.images).toHaveLength(6);
  product.images.forEach((url) => uploadedPaths.add(url));
  expect(
    product.images.every((url) => url.startsWith('/uploads/'))
  ).toBeTruthy();
});
