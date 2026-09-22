import { test, expect, request as requests, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient, type UserRole } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const databaseURL = process.env.DATABASE_URL || '';
const db = new PrismaClient();
const prefix = `review-local-${randomUUID()}`;
const users: string[] = [];
const apis: APIRequestContext[] = [];
const uploadedPaths: string[] = [];
let sequence = 0;

function isLocalHost(value: string) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && /^https?:$/.test(url.protocol);
  } catch {
    return false;
  }
}

function isLocalPhenofarmDatabase(value: string) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      && /^postgres(?:ql)?:$/.test(url.protocol)
      && /^phenofarm_(?:auth|ui_fixes|test)_[a-zA-Z0-9_-]+$/.test(url.pathname.slice(1));
  } catch {
    return false;
  }
}

if (!isLocalHost(baseURL) || !isLocalPhenofarmDatabase(databaseURL)) {
  throw new Error('Review regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
test.setTimeout(90_000);

async function account(role: UserRole, profile = true, keyPrefix = prefix) {
  const key = `${keyPrefix}-${++sequence}`;
  const user = await db.user.create({
    data: {
      emailVerifiedAt: new Date(),
      sessionVersion: 0,
      email: `${key}@example.test`,
      name: key,
      role,
      ...(profile && role === 'GROWER'
        ? {
            grower: {
              create: {
                businessName: key,
                isVerified: false,
                licenseNumber: key,
                licenseExpiry: new Date('2030-12-31'),
              },
            },
          }
        : {}),
      ...(profile && role === 'DISPENSARY'
        ? {
            dispensary: {
              create: {
                businessName: key,
                licenseStatus: 'pending_review',
                isVerified: false,
                licenseNumber: key,
                licenseState: 'VT',
                licenseExpiry: new Date('2030-12-31'),
              },
            },
          }
        : {}),
    },
    include: { grower: true, dispensary: true },
  });
  users.push(user.id);
  const token = await encode({
    secret: process.env.AUTH_SECRET!,
    token: { id: user.id, sub: user.id, role, email: user.email, sessionVersion: user.sessionVersion },
    maxAge: 3600,
  });
  const api = await requests.newContext({
    baseURL,
    extraHTTPHeaders: { Cookie: `next-auth.session-token=${token}` },
  });
  apis.push(api);
  return { ...user, api, token };
}

async function addAdminCookie(page: Page, token: string) {
  await page.context().addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL }]);
}

test.afterAll(async () => {
  await Promise.all(apis.map((api) => api.dispose()));
  const growers = await db.grower.findMany({ where: { userId: { in: users } }, select: { id: true } });
  const growerIds = growers.map(({ id }) => id);
  await db.batch.deleteMany({ where: { growerId: { in: growerIds } } });
  await db.strain.deleteMany({ where: { growerId: { in: growerIds } } });
  await db.productTypeConfig.deleteMany({ where: { growerId: { in: growerIds } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await Promise.all(
    uploadedPaths.map(async (url) => {
      if (!url.startsWith('/uploads/')) return;
      await unlink(path.join(process.cwd(), 'public', url.slice(1))).catch(() => undefined);
    }),
  );
  await db.$disconnect();
});

test('product, strain, and batch APIs validate boundaries, races, and list payload shape', async () => {
  const grower = await account('GROWER');
  expect((await grower.api.post('/api/product-type-config', { data: { type: 'Flower', subTypes: ['Bud', 42] } })).status()).toBe(400);
  expect((await grower.api.post('/api/product-type-config', { data: { type: 'x'.repeat(101), subTypes: ['Bud'] } })).status()).toBe(400);

  const boundedName = `${prefix}-trimmed-strain`;
  const strainResponse = await grower.api.post('/api/strains', {
    data: { name: `  ${boundedName}  `, genetics: '  Hybrid  ', strainType: 'hybrid' },
  });
  expect(strainResponse.status()).toBe(201);
  const strain = await strainResponse.json();
  expect(strain.name).toBe(boundedName);
  expect(strain.genetics).toBe('Hybrid');
  expect(strain.strainType).toBe('HYBRID');
  expect((await grower.api.post('/api/strains', { data: { name: 'x'.repeat(121) } })).status()).toBe(400);

  const raceStrainName = `${prefix}-race-strain`;
  const raceStrains = await Promise.all([1, 2].map(() => grower.api.post('/api/strains', { data: { name: raceStrainName } })));
  expect(raceStrains.map((response) => response.status()).sort()).toEqual([201, 409]);

  const summaryResponse = await grower.api.get('/api/strains?summary=true');
  expect(summaryResponse.status()).toBe(200);
  const summary = await summaryResponse.json();
  const summaryRow = summary.find((row: { id: string }) => row.id === strain.id);
  expect(Object.keys(summaryRow).sort()).toEqual(['genetics', 'id', 'name', 'strainType']);

  expect((await grower.api.post('/api/batches', { data: { batchNumber: `${prefix}-invalid-metric`, harvestDate: '2026-08-01', strainId: strain.id, thc: 'NaN' } })).status()).toBe(400);
  expect((await grower.api.post('/api/batches', { data: { batchNumber: `${prefix}-invalid-date`, harvestDate: '2026-02-31', strainId: strain.id } })).status()).toBe(400);
  expect((await grower.api.post('/api/batches', { data: { batchNumber: `${prefix}-oversized-json`, harvestDate: '2026-08-01', strainId: strain.id, terpenes: 'x'.repeat(50_001) } })).status()).toBe(400);

  const pdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjQK';
  const batchNumber = `${prefix}-batch`;
  const createdBatchResponse = await grower.api.post('/api/batches', {
    data: {
      batchNumber: `  ${batchNumber}  `,
      lotNumber: '  LOT-1  ',
      harvestDate: '2026-08-01',
      strainId: strain.id,
      thc: '18.50',
      cbd: 1.25,
      totalCannabinoids: 19.75,
      testResults: { labDocuments: { coa: { dataUrl: pdfDataUrl, fileName: 'coa.pdf' } } },
    },
  });
  expect(createdBatchResponse.status()).toBe(201);
  const createdBatch = await createdBatchResponse.json();
  const persistedDataUrl = createdBatch.testResults.labDocuments.coa.dataUrl as string;
  expect(persistedDataUrl).not.toBe(pdfDataUrl);
  expect(persistedDataUrl).toMatch(/^\/uploads\/|^https?:\/\//);
  if (persistedDataUrl.startsWith('/uploads/')) uploadedPaths.push(persistedDataUrl);
  expect(createdBatch.batchNumber).toBe(batchNumber);

  const raceBatchNumber = `${prefix}-race-batch`;
  const raceBatches = await Promise.all([1, 2].map(() => grower.api.post('/api/batches', {
    data: { batchNumber: raceBatchNumber, harvestDate: '2026-08-01', strainId: strain.id },
  })));
  expect(raceBatches.map((response) => response.status()).sort()).toEqual([201, 409]);

  const batchListResponse = await grower.api.get('/api/batches');
  expect(batchListResponse.status()).toBe(200);
  const batchList = await batchListResponse.json();
  const listedBatch = batchList.find((row: { id: string }) => row.id === createdBatch.id);
  expect(listedBatch).toBeTruthy();
  expect(listedBatch).not.toHaveProperty('testResults');
  expect(listedBatch).not.toHaveProperty('terpenes');
  expect(listedBatch.labDocumentCount).toBe(1);

  const batchDetailResponse = await grower.api.get(`/api/batches/${createdBatch.id}`);
  expect(batchDetailResponse.status()).toBe(200);
  const batchDetail = await batchDetailResponse.json();
  expect(batchDetail.testResults.labDocuments.coa.dataUrl).toBe(persistedDataUrl);
  for (const [labDocuments, expected] of [[null, 0], [[], 0], [{ coa: { dataUrl: 'x'.repeat(1000000) }, bad: 'text', invalid: [] }, 1]] as const) {
    await db.batch.update({ where: { id: createdBatch.id }, data: { testResults: { labDocuments }, terpenes: { legacy: 'x'.repeat(1000000) } } });
    const summary = await grower.api.get('/api/batches');
    expect(summary.status()).toBe(200);
    const row = (await summary.json()).find((batch: { id: string }) => batch.id === createdBatch.id);
    expect(row.labDocumentCount).toBe(expected);
    expect(JSON.stringify(row).length).toBeLessThan(3000);
  }
});

test('admin access, pagination, mobile navigation, seed method guard, and verification redirects work', async ({ page }) => {
  const admin = await account('ADMIN', false);
  const grower = await account('GROWER');
  const dispensary = await account('DISPENSARY');
  const directoryPrefix = `${prefix}-directory`;
  const directoryUsers = await Promise.all(Array.from({ length: 26 }, () => account('ADMIN', false, directoryPrefix)));
  expect(directoryUsers).toHaveLength(26);

  const anon = await requests.newContext({ baseURL });
  apis.push(anon);
  const denied = await anon.get('/admin/users', { maxRedirects: 0 });
  expect(denied.status()).toBe(307);
  expect(denied.headers().location).toContain('/auth/sign_in');
  expect((await grower.api.get('/api/admin/seed')).status()).toBe(405);
  expect((await grower.api.post('/api/admin/seed')).status()).toBe(403);

  const growerRedirect = await admin.api.post(`/admin/growers/${grower.grower!.id}/verify`, { maxRedirects: 0 });
  expect(growerRedirect.status()).toBe(303);
  expect(growerRedirect.headers().location).toContain('/admin/growers');
  expect((await db.grower.findUniqueOrThrow({ where: { id: grower.grower!.id } })).isVerified).toBe(true);
  expect((await admin.api.post(`/admin/growers/${grower.grower!.id}/verify`, { headers: { accept: 'application/json' } })).status()).toBe(200);

  const dispensaryRedirect = await admin.api.post(`/admin/dispensaries/${dispensary.dispensary!.id}/verify`, { maxRedirects: 0 });
  expect(dispensaryRedirect.status()).toBe(303);
  expect(dispensaryRedirect.headers().location).toContain('/admin/dispensaries');
  expect((await db.dispensary.findUniqueOrThrow({ where: { id: dispensary.dispensary!.id } })).isVerified).toBe(true);
  expect((await admin.api.post(`/admin/dispensaries/${dispensary.dispensary!.id}/verify`, { headers: { accept: 'application/json' } })).status()).toBe(200);

  const q = encodeURIComponent(directoryPrefix);
  await addAdminCookie(page, admin.token);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/admin/users?q=${q}`);
  await expect(page.getByText('26 matches', { exact: true })).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(25);
  await expect(page.getByRole('navigation', { name: 'User pages' })).toBeVisible();
  await page.getByRole('link', { name: 'Next' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/users\\?q=${q}&page=2$`));
  await expect(page.getByText('26 matches', { exact: true })).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/admin/users?q=${q}`);
  await expect(page.getByRole('button', { name: 'Open Admin Panel navigation menu' })).toBeVisible();
  await expect(page.locator('table')).toBeHidden();
  await expect(page.locator('article').first()).toBeVisible();
  await page.getByRole('button', { name: 'Open Admin Panel navigation menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Admin Panel navigation' })).toBeVisible();
});
