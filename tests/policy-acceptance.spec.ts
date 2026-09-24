import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CURRENT_POLICIES } from '../lib/policies/current';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const db = new PrismaClient();
const prefix = `policy-qa-${Date.now()}`;
const password = 'Local policy acceptance test 123!';
const payload = { acceptTerms: true, termsVersion: CURRENT_POLICIES.termsVersion, privacyVersion: CURRENT_POLICIES.privacyVersion };
test.use({ trace: 'off', video: 'off' });
test.beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL || '');
  if (url.hostname !== 'localhost' || url.pathname !== '/phenofarm_auth_monitoring') throw Error('Requires isolated policy test database');
});
test.afterAll(async () => { await db.user.deleteMany({ where: { email: { startsWith: prefix } } }); await db.$disconnect(); });

test('policy fingerprints match the exact archived and rendered text', () => {
  for (const kind of ['terms', 'privacy'] as const) {
    expect(createHash('sha256').update(readFileSync(`lib/policies/2026-09-24/${kind}.json`)).digest('hex')).toBe(CURRENT_POLICIES[`${kind}Sha256`]);
  }
});

test('registration requires explicit current agreement and duplicate requests preserve one record', async ({ request }) => {
  const email = `${prefix}-new@example.test`;
  const account = { email, password, businessName: prefix, businessType: 'grower' };
  for (const acceptance of [{}, { ...payload, acceptTerms: false }, { ...payload, acceptTerms: 'true' }, { ...payload, termsVersion: 'old' }]) {
    expect((await request.post('/api/auth/register', { data: { ...account, ...acceptance } })).status()).toBe(400);
  }
  expect(await db.user.count({ where: { email } })).toBe(0);
  const before = Date.now();
  for (const response of await Promise.all([1, 2].map(() => request.post('/api/auth/register', { data: { ...account, ...payload, acceptedAt: '2000-01-01', termsSha256: 'forged' } })))) expect(response.status()).toBe(201);
  const user = await db.user.findUniqueOrThrow({ where: { email }, include: { policyAcceptances: true, grower: true } });
  expect(user.grower).toBeTruthy(); expect(user.policyAcceptances).toHaveLength(1);
  expect(user.policyAcceptances[0]).toMatchObject({ ...CURRENT_POLICIES, source: 'signup' });
  expect(user.policyAcceptances[0].acceptedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
});

for (const role of ['GROWER', 'DISPENSARY', 'ADMIN'] as const) test(`${role}: existing user must actively agree, failures retry, and history cannot be forged`, async ({ page, baseURL }) => {
  const email = `${prefix}-${role.toLowerCase()}@example.test`;
  const user = await db.user.create({ data: { email, role, passwordHash: await bcrypt.hash(password, 10), emailVerifiedAt: new Date(),
    ...(role === 'GROWER' ? { grower: { create: { businessName: prefix } } } : role === 'DISPENSARY' ? { dispensary: { create: { businessName: prefix } } } : {}),
  } });
  const api = page.request;
  const csrfToken = (await (await api.get('/api/auth/csrf')).json()).csrfToken;
  const login = await api.post('/api/auth/callback/credentials', { form: { csrfToken, email, password, json: 'true', callbackUrl: `${baseURL}/dashboard` } });
  expect((await login.json()).url).not.toContain('error');
  await page.setViewportSize({ width: role === 'GROWER' ? 1440 : 320, height: 900 });
  await page.goto(`/${role.toLowerCase()}/dashboard`);
  await expect(page).toHaveURL(/\/account\/terms$/);
  expect(await db.policyAcceptance.count({ where: { userId: user.id } })).toBe(0);
  await expect(page.getByRole('button', { name: 'Agree and continue' })).toBeDisabled();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/policy-${role.toLowerCase()}.png`, fullPage: true });
  expect((await api.post('/api/account/policy-acceptance', { data: { ...payload, acceptTerms: false } })).status()).toBe(400);
  expect((await api.post('/api/account/policy-acceptance', { data: payload, headers: { Origin: 'https://attacker.test' } })).status()).toBe(400);
  if (role === 'GROWER') {
    await page.route('**/api/account/policy-acceptance', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Unable to save your agreement. Please try again.' }) }), { times: 1 });
    await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Agree and continue' }).click();
    await expect(page.locator('p[role=alert]')).toContainText('Unable to save');
    expect(await db.policyAcceptance.count({ where: { userId: user.id } })).toBe(0);
  }
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}/dashboard$`), { timeout: 30000 });
  const acceptance = await db.policyAcceptance.findFirstOrThrow({ where: { userId: user.id } });
  for (const response of await Promise.all([1, 2, 3].map(() => api.post('/api/account/policy-acceptance', { data: { ...payload, userId: 'someone-else', acceptedAt: '2000-01-01' } })))) expect(response.status()).toBe(200);
  expect(await db.policyAcceptance.findMany({ where: { userId: user.id } })).toEqual([acceptance]);
  await page.reload(); await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}/dashboard$`));
});

test('signup agreement is visible and required on small screens; signed-out users cannot record agreement', async ({ page, request }) => {
  expect((await request.post('/api/account/policy-acceptance', { data: payload })).status()).toBe(401);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/auth/sign_up');
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    await expect(page.getByRole('checkbox')).toHaveAttribute('required', '');
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('target', '_blank');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/signup-policy-${width}.png`, fullPage: true });
  }
});

test('monitor health and drill require a secret, health reflects the actual database', async ({ request }) => {
  expect((await request.get('/api/ops/health')).status()).toBe(401);
  expect((await request.post('/api/ops/drill')).status()).toBe(401);
  const response = await request.get('/api/ops/health', { headers: { Authorization: `Bearer ${process.env.MONITORING_TOKEN}` } });
  expect(response.status()).toBe(200); expect(await response.json()).toMatchObject({ ok: true, monitoring: false, serverErrors: { count: 0 } });
});

 test('mobile signup saves agreement through the real form', async ({ page }) => {
  const email = `${prefix}-form@example.test`;
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/auth/sign_up');
  await page.locator('#firstName').fill('Policy'); await page.locator('#lastName').fill('Review');
  await page.locator('#email').fill(email); await page.locator('#password').fill(password); await page.locator('#confirmPassword').fill(password);
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/verify-email\?sent=1/);
  const user = await db.user.findUniqueOrThrow({ where: { email }, include: { policyAcceptances: true } });
  expect(user.policyAcceptances).toHaveLength(1); expect(user.policyAcceptances[0]).toMatchObject({ ...CURRENT_POLICIES, source: 'signup' });
 });
