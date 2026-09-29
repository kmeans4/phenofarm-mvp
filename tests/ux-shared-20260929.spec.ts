import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';
import { licenseReviewKey } from '../lib/admin-verification';

const database = new URL(process.env.DATABASE_URL || '');
const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  !database.pathname.startsWith('/phenofarm_auth_') ||
  !['localhost', '127.0.0.1'].includes(origin.hostname) ||
  process.env.AUTH_MAIL_PROVIDER !== 'local-test'
)
  throw Error(
    'UX account checks require an isolated local database and mail sink.'
  );
const db = new PrismaClient();
const prefix = `uxshared-${Date.now()}`;
const password = 'UX-Account-September29!';
const shots = '/tmp/phenoshop-ux-20260929/shared-screens';
mkdirSync(shots, { recursive: true });
let admin: User,
  grower: User,
  buyer: User,
  pending: User,
  terms: User,
  paused: User;
let growerId: string, buyerId: string, pendingId: string, productId: string;
const actors: string[] = [];
async function mail(to: string, contains: string) {
  let found: { text: string; subject: string } | undefined;
  await expect
    .poll(
      async () => {
        const result = await fetch(
          `${process.env.AUTH_MAIL_TEST_URL}?to=${encodeURIComponent(to)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.AUTH_MAIL_TEST_KEY}`,
            },
          }
        );
        const messages = (await result.json()) as Array<{
          text: string;
          subject: string;
        }>;
        found = messages
          .reverse()
          .find((value) => value.subject.includes(contains));
        return Boolean(found);
      },
      { timeout: 15000 }
    )
    .toBe(true);
  return found!;
}
function link(message: { text: string }) {
  const url = message.text.match(/http:\/\/[^\s]+#token=[A-Za-z0-9_-]+/)?.[0];
  if (!url) throw Error('Local email has no account link');
  return url;
}
async function login(page: Page, user: { email: string }, path = '/dashboard') {
  await page.goto(`/auth/sign_in?callbackUrl=${encodeURIComponent(path)}`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
}
async function isolated(context: BrowserContext, last: number) {
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': `192.0.2.${last}` });
}
async function create(
  role: 'ADMIN' | 'GROWER' | 'DISPENSARY',
  label: string,
  accepted = true,
  approved = true
) {
  const user = await db.user.create({
    data: {
      email: `${prefix}-${label}@example.test`,
      name: `UX ${label}`,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      emailVerifiedAt: new Date(),
      ...(accepted
        ? {
            policyAcceptances: {
              create: { ...CURRENT_POLICIES, source: 'signup' },
            },
          }
        : {}),
      ...(role === 'GROWER'
        ? {
            grower: {
              create: {
                businessName: `${prefix} Grower`,
                licenseNumber: `${prefix}-grower`,
                state: 'VT',
                licenseExpiry: new Date('2030-12-31'),
                isVerified: approved,
                licenseStatus: approved ? 'verified' : 'pending_review',
              },
            },
          }
        : role === 'DISPENSARY'
          ? {
              dispensary: {
                create: {
                  businessName: `${prefix} ${label}`,
                  licenseNumber: `${prefix}-${label}`,
                  licenseState: 'VT',
                  state: 'VT',
                  licenseExpiry: new Date('2030-12-31'),
                  isVerified: approved,
                  licenseStatus: approved ? 'verified' : 'pending_review',
                },
              },
            }
          : {}),
    },
    include: { grower: true, dispensary: true },
  });
  actors.push(user.id);
  return user;
}
test.beforeAll(async () => {
  admin = await create('ADMIN', 'admin');
  const g = await create('GROWER', 'grower');
  grower = g;
  growerId = g.grower!.id;
  const b = await create('DISPENSARY', 'buyer');
  buyer = b;
  buyerId = b.dispensary!.id;
  const p = await create('DISPENSARY', 'pending', true, false);
  pending = p;
  pendingId = p.dispensary!.id;
  terms = await create('DISPENSARY', 'terms', false);
  paused = await create('DISPENSARY', 'paused');
  const product = await db.product.create({
    data: {
      growerId,
      name: `${prefix} Flower`,
      price: 1200,
      inventoryQty: 20,
      unit: 'lb',
      status: 'PUBLISHED',
      isAvailable: true,
      productType: 'Flower',
    },
  });
  productId = product.id;
  await db.dispensary.create({
    data: {
      businessName: `${prefix} Phone only`,
      isOffPlatform: true,
      createdByGrowerId: growerId,
    },
  });
});
test.afterAll(async () => {
  await db.order.deleteMany({ where: { growerId } });
  await db.dispensary.deleteMany({
    where: { createdByGrowerId: growerId, isOffPlatform: true },
  });
  await db.user.deleteMany({
    where: { OR: [{ id: { in: actors } }, { email: { startsWith: prefix } }] },
  });
  await db.$disconnect();
});

test('signup validates inline and verifies once in the same browser without retyping a password', async ({
  page,
  context,
}) => {
  await isolated(context, 101);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/sign_up');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByText('Choose Grower or Dispensary.')).toBeVisible();
  await expect(page.locator('#businessType')).toBeFocused();
  await page.getByRole('radio', { name: /Dispensary/ }).check();
  await page.getByLabel('First name').fill('UX');
  await page.getByLabel('Last name').fill('Signup');
  await page
    .getByLabel('Business name', { exact: true })
    .fill(`${prefix} Signup`);
  const email = `${prefix}-signup@example.test`;
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('#acceptTerms').check();
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page).toHaveURL(/verify-email\?sent=1/);
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText(email);
  const url = link(await mail(email, 'Verify your email'));
  await page.goto(url);
  await expect(
    page.getByRole('button', { name: 'Verify and sign in' })
  ).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.screenshot({ path: `${shots}/verify-mobile.png` });
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await expect(page).toHaveURL(/dispensary\/dashboard/);
  const session = await page.request
    .get('/api/auth/session')
    .then((r) => r.json());
  expect(session.user.email).toBe(email);
  const token = new URLSearchParams(new URL(url).hash.slice(1)).get('token');
  expect(
    (
      await page.request.post('/api/auth/verification/confirm', {
        data: { token },
      })
    ).status()
  ).toBe(400);
  const dupe = await page.request.post('/api/auth/register', {
    data: {
      email,
      password,
      businessName: 'Do not overwrite',
      businessType: 'grower',
      acceptTerms: true,
      ...CURRENT_POLICIES,
    },
  });
  expect(dupe.status()).toBe(201);
  expect((await mail(email, 'Your PhenoShop account')).text).toContain(
    '/auth/forgot-password'
  );
  expect((await db.user.findUniqueOrThrow({ where: { email } })).role).toBe(
    'DISPENSARY'
  );
});

test('verification from another browser secures the password; reset signs in and revokes old sessions', async ({
  page,
  context,
  browser,
}) => {
  await isolated(context, 102);
  const email = `${prefix}-cross@example.test`;
  expect(
    (
      await page.request.post('/api/auth/register', {
        data: {
          email,
          password,
          businessName: 'Cross-browser UX',
          businessType: 'grower',
          acceptTerms: true,
          ...CURRENT_POLICIES,
        },
      })
    ).status()
  ).toBe(201);
  const verification = link(await mail(email, 'Verify your email'));
  const other = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '192.0.2.103' },
  });
  const second = await other.newPage();
  await second.goto(verification);
  await expect(
    second.getByLabel('New password', { exact: true })
  ).toBeVisible();
  await second
    .getByLabel('New password', { exact: true })
    .fill(`${password}New`);
  await second.getByRole('button', { name: 'Verify and sign in' }).click();
  await expect(second).toHaveURL(/grower\/dashboard/);
  expect(
    (await second.request.get('/api/auth/session').then((r) => r.json())).user
      .email
  ).toBe(email);
  const original = await db.user.findUniqueOrThrow({ where: { email } });
  expect(await bcrypt.compare(password, original.passwordHash!)).toBe(false);
  expect(
    (
      await page.request.post('/api/auth/forgot-password', { data: { email } })
    ).status()
  ).toBe(200);
  const reset = link(await mail(email, 'Reset your password'));
  await page.goto(reset);
  await page
    .getByLabel('New password', { exact: true })
    .fill(`${password}Reset`);
  await page
    .getByRole('button', { name: 'Reset password and sign in' })
    .click();
  await expect(page).toHaveURL(/grower\/dashboard/);
  expect(
    (await page.request.get('/api/auth/session').then((r) => r.json())).user
      .email
  ).toBe(email);
  expect(
    (await second.request.get('/api/auth/session').then((r) => r.json())).user
  ).toBeUndefined();
  await other.close();
  await page.goto('/auth/reset-password#token=bad');
  await expect(
    page.getByText(/invalid, already used, or expired/)
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Request a new link' })
  ).toBeVisible();
});

test('deep links survive sign-in and Terms; Terms and contact failures are recoverable', async ({
  page,
  context,
}) => {
  await isolated(context, 104);
  await page.goto('/dispensary/saved?tab=alerts');
  await expect(page).toHaveURL(/auth\/sign_in\?callbackUrl=/);
  await page.getByLabel('Email', { exact: true }).fill(terms.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/account\/terms\?callbackUrl=/);
  await page.waitForLoadState('networkidle');
  await page.route(
    '**/api/account/policy-acceptance',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'text/html',
        body: 'Unavailable',
      }),
    { times: 1 }
  );
  await page.locator('#acceptTerms').check();
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page.locator('p[role=alert]')).toHaveText(
    'Unable to save. Please try again.'
  );
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await expect(page).toHaveURL(/dispensary\/saved\?tab=alerts/);
  await page.goto('/contact');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'UX terms'
  );
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    terms.email
  );
  await page
    .getByLabel('Message', { exact: true })
    .fill(`${prefix} contact delivery check`);
  await page.route('**/api/contact', (route) => route.abort(), { times: 1 });
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('p[role=alert]')).toContainText('connect');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Message sent' })
  ).toBeVisible();
  expect(
    (await mail('support@phenoshop.app', 'support request')).text
  ).toContain(`${prefix} contact delivery check`);
});

test('admin review excludes managed contacts; approval, Undo, decline and stale-review protection work', async ({
  page,
  context,
}) => {
  await isolated(context, 105);
  await login(page, admin, '/admin/review');
  await page.goto(`/admin/review?q=${prefix}`);
  await expect(page.getByText(`${prefix} Phone only`)).toHaveCount(0);
  const row = page
    .locator('article:visible')
    .filter({ hasText: `${prefix} pending` });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.dispensary.findUniqueOrThrow({ where: { id: pendingId } }))
          .isVerified
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.dispensary.findUniqueOrThrow({ where: { id: pendingId } }))
          .isVerified
    )
    .toBe(false);
  await expect(row).toBeVisible();
  await row
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await page
    .getByLabel('Reason', { exact: true })
    .selectOption('Details do not match');
  await page
    .getByLabel('Note (optional)')
    .fill('Please check the expiry date.');
  await page.getByRole('button', { name: 'Send changes needed' }).click();
  await expect
    .poll(
      async () =>
        (await db.dispensary.findUniqueOrThrow({ where: { id: pendingId } }))
          .licenseStatus
    )
    .toBe('rejected');
  expect(
    await db.notification.count({
      where: {
        userId: pending.id,
        type: 'VERIFICATION_DECISION',
        body: { contains: 'Please check' },
      },
    })
  ).toBe(1);
  const before = await db.dispensary.findUniqueOrThrow({
    where: { id: pendingId },
  });
  const payload = {
    decision: 'approve',
    expectedLicenseKey: licenseReviewKey(before),
  };
  await db.dispensary.update({
    where: { id: pendingId },
    data: { phone: '8025550199' },
  });
  expect(
    (
      await page.request.post(`/admin/dispensaries/${pendingId}/verify`, {
        data: payload,
      })
    ).status()
  ).toBe(200);
  await db.dispensary.update({
    where: { id: pendingId },
    data: {
      licenseNumber: `${prefix}-updated`,
      isVerified: false,
      licenseStatus: 'pending_review',
    },
  });
  expect(
    (
      await page.request.post(`/admin/dispensaries/${pendingId}/verify`, {
        data: payload,
      })
    ).status()
  ).toBe(409);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/admin/review/dispensary/${pendingId}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/admin-review-${width}.png`,
      fullPage: true,
    });
  }
});

test('admin account tools are visible on mobile and revoke access without exposing credentials', async ({
  page,
  context,
  browser,
}) => {
  await isolated(context, 106);
  const ownerContext = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '192.0.2.107' },
  });
  const owner = await ownerContext.newPage();
  await login(owner, paused);
  await login(page, admin);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/admin/users?q=${encodeURIComponent(paused.email)}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Email verified', { exact: true })).toBeVisible();
  const resetResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/admin/users/${paused.id}`) &&
      response.request().method() === 'POST'
  );
  await page.getByLabel('Account actions').selectOption('reset-password');
  const resetResult = await resetResponse;
  expect(resetResult.status(), await resetResult.text()).toBe(200);
  await mail(paused.email, 'Reset your password');
  await page.getByLabel('Account actions').selectOption('suspend');
  await page
    .getByRole('button', { name: 'Pause account', exact: true })
    .click();
  await expect(page.getByText('Account paused', { exact: true })).toBeVisible();
  expect(
    (await owner.request.get('/api/auth/session').then((r) => r.json())).user
  ).toBeUndefined();
  await page.screenshot({
    path: `${shots}/admin-users-mobile.png`,
    fullPage: true,
  });
  await page.getByLabel('Account actions').selectOption('resume');
  await expect(page.getByText('Email verified', { exact: true })).toBeVisible();
  await ownerContext.close();
});

test('general conversation quotes, decline Undo, accepted cart replacement and quote-to-order link work', async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(90000);
  await isolated(context, 108);
  await login(page, grower);
  const conv = await page.request
    .post('/api/messages/conversations', { data: { dispensaryId: buyerId } })
    .then((r) => r.json());
  expect(conv.conversationId).toBeTruthy();
  await page.reload();
  await page.getByTestId('chat-button').click();
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
  await page.getByTestId('toggle-offer-composer').click();
  await page
    .getByLabel('Quote product', { exact: true })
    .selectOption(productId);
  await page.getByLabel('Unit price', { exact: true }).fill('$1,100.00');
  await page.getByLabel('Quantity (optional)', { exact: true }).fill('3');
  await page.getByTestId('send-offer').click();
  await expect(page.getByTestId('offer-message').last()).toContainText('1,100');
  const bc = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '192.0.2.109' },
  });
  const bp = await bc.newPage();
  await login(bp, buyer);
  await bp.request.patch('/api/dispensary/cart', {
    data: {
      changed: [
        {
          id: productId,
          name: `${prefix} Flower`,
          growerId,
          grower: `${prefix} Grower`,
          price: 1200,
          quantity: 2,
          unit: 'lb',
          maxQty: 20,
        },
      ],
      removed: [],
    },
  });
  await bp.reload();
  await bp.getByTestId('chat-button').click();
  await expect(bp.getByTestId('offer-message').last()).toBeVisible();
  await bp.getByRole('button', { name: 'Decline', exact: true }).click();
  await bp.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    bp.getByRole('button', { name: 'Accept & add to cart', exact: true })
  ).toBeVisible();
  await bp
    .getByRole('button', { name: 'Accept & add to cart', exact: true })
    .click();
  await expect(
    bp.getByRole('dialog', { name: 'Replace cart item?' })
  ).toBeVisible();
  await bp
    .getByRole('button', { name: 'Use agreed quote', exact: true })
    .click();
  await expect(bp).toHaveURL(/dispensary\/cart/);
  await expect(bp.locator(`#qty-${productId}`)).toHaveValue('3');
  const quote = await db.acceptedQuote.findFirstOrThrow({
    where: { conversationId: conv.conversationId },
  });
  expect(Number(quote.unitPrice)).toBe(1100);
  await expect
    .poll(
      async () =>
        (await bp.request.get('/api/dispensary/cart').then((r) => r.json()))
          .cart.items[0]?.acceptedQuoteId
    )
    .toBe(quote.id);
  await page.reload();
  await page.getByTestId('chat-button').click();
  await expect(
    page.getByRole('link', { name: 'Create order from quote' })
  ).toHaveAttribute('href', `/grower/orders/add?quote=${quote.id}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${shots}/quote-mobile.png` });
  await bc.close();
});

test('admin decisions resist concurrent review and never reuse another business note', async ({
  page,
  context,
}) => {
  await isolated(context, 111);
  const first = await create('DISPENSARY', 'review-first', true, false);
  const second = await create('DISPENSARY', 'review-second', true, false);
  await login(page, admin, `/admin/review?q=${prefix}`);
  const row = page
    .locator('article:visible')
    .filter({ hasText: `${prefix} review-first` });
  await row
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await page.getByLabel('Note (optional)').fill('Only for the first business');
  await page
    .getByRole('button', { name: 'Close Request license changes', exact: true })
    .click();
  await page
    .locator('article:visible')
    .filter({ hasText: `${prefix} review-second` })
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await expect(page.getByLabel('Note (optional)')).toHaveValue('');
  await page.keyboard.press('Escape');
  const path = `/admin/dispensaries/${first.dispensary!.id}/verify`;
  const originalKey = licenseReviewKey(first.dispensary!);
  const declined = await page.request.post(path, {
    data: {
      decision: 'decline',
      reason: 'Check the number',
      expectedLicenseKey: originalKey,
    },
  });
  expect(declined.status()).toBe(200);
  expect(
    (
      await page.request.post(path, {
        data: { decision: 'approve', expectedLicenseKey: originalKey },
      })
    ).status()
  ).toBe(409);
  const latest = await db.dispensary.findUniqueOrThrow({
    where: { id: first.dispensary!.id },
  });
  expect(
    (
      await page.request.post(path, {
        data: {
          decision: 'decline',
          reason: 'Check the number and expiry',
          expectedLicenseKey: licenseReviewKey(latest),
        },
      })
    ).status()
  ).toBe(200);
  expect(
    (
      await db.dispensary.findUniqueOrThrow({
        where: { id: first.dispensary!.id },
      })
    ).licenseReviewNotes
  ).toBe('Check the number and expiry');
  expect(second.dispensary!.isVerified).toBe(false);
});

test('quote drafts retain the chosen product and typing does not restart polling', async ({
  page,
  context,
}) => {
  await isolated(context, 112);
  await login(page, grower);
  const productB = await db.product.create({
    data: {
      growerId,
      name: `${prefix} Product B`,
      price: 50,
      unit: 'unit',
      inventoryQty: 10,
      status: 'PUBLISHED',
      isAvailable: true,
    },
  });
  const conversation = await page.request
    .post('/api/messages/conversations', {
      data: { dispensaryId: buyerId, productId },
    })
    .then((r) => r.json());
  await page.getByTestId('chat-button').click();
  await expect(page.getByRole('dialog', { name: 'Messages' })).toBeVisible();
  await page.evaluate(
    (id) =>
      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: { conversationId: id },
        })
      ),
    conversation.conversationId
  );
  await page.getByTestId('toggle-offer-composer').click();
  await page
    .getByLabel('Quote product', { exact: true })
    .selectOption(productB.id);
  await page.getByLabel('Unit price', { exact: true }).fill('45');
  await page.getByLabel('Quantity (optional)', { exact: true }).fill('2');
  const key = `phenofarm:user:${grower.id}:phenofarm:draft:message:${conversation.conversationId}`;
  await expect
    .poll(async () =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) || '{}').value?.offerProductId,
        key
      )
    )
    .toBe(productB.id);
  await page.reload();
  await page.getByTestId('chat-button').click();
  await expect(page.getByRole('dialog', { name: 'Messages' })).toBeVisible();
  await page.evaluate(
    (id) =>
      window.dispatchEvent(
        new CustomEvent('phenofarm-open-chat', {
          detail: { conversationId: id },
        })
      ),
    conversation.conversationId
  );
  await page
    .getByRole('button', { name: 'Restore draft', exact: true })
    .click();
  await page.getByTestId('toggle-offer-composer').click();
  await expect(page.getByLabel('Quote product', { exact: true })).toHaveValue(
    productB.id
  );
  await expect(page.getByLabel('Unit price', { exact: true })).toHaveValue(
    '45'
  );
  await page.waitForLoadState('networkidle');
  let listRequests = 0;
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/api/messages/conversations' &&
      request.method() === 'GET'
    )
      listRequests++;
  });
  await page.getByLabel('Quantity (optional)', { exact: true }).fill('3');
  await page
    .getByLabel('Unit price', { exact: true })
    .pressSequentially('.00', { delay: 80 });
  await page.waitForTimeout(600);
  expect(listRequests).toBeLessThanOrEqual(1);
  // Hold polling: the newly sent message must already contain the correct product.
  await page.route(
    `**/api/messages/conversations/${conversation.conversationId}/messages?*`,
    (route) => route.abort()
  );
  await page.getByTestId('send-offer').click();
  await expect(page.getByTestId('offer-message').last()).toContainText(
    productB.name
  );
  expect(
    (
      await db.conversationMessage.findFirstOrThrow({
        where: {
          conversationId: conversation.conversationId,
          messageType: 'OFFER',
        },
        orderBy: { createdAt: 'desc' },
      })
    ).productId
  ).toBe(productB.id);
});

test('expired links, concurrent recovery, cross-site requests and throttled logins are handled safely', async ({
  page,
  context,
}) => {
  await isolated(context, 113);
  const target = await create('DISPENSARY', 'recovery');
  const raw = randomBytes(32).toString('base64url');
  const token = await db.accountActionToken.create({
    data: {
      userId: target.id,
      email: target.email,
      purpose: 'RESET_PASSWORD',
      sessionVersion: 0,
      tokenHash: createHash('sha256').update(raw).digest('hex'),
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  await page.goto(`/auth/reset-password#token=${raw}`);
  await expect(
    page.getByText(/invalid, already used, or expired/)
  ).toBeVisible();
  await db.accountActionToken.update({
    where: { id: token.id },
    data: { expiresAt: new Date(Date.now() + 60000) },
  });
  expect(
    (
      await page.request.post('/api/auth/reset-password', {
        headers: { origin: 'https://untrusted.example' },
        data: { token: raw, password },
      })
    ).status()
  ).toBe(400);
  const results = await Promise.all(
    [1, 2].map(() =>
      page.request.post('/api/auth/reset-password', {
        data: { token: raw, password },
      })
    )
  );
  expect(results.map((r) => r.status()).sort()).toEqual([200, 400]);
  await context.clearCookies();
  const csrf = await page.request.get('/api/auth/csrf').then((r) => r.json());
  for (let i = 0; i < 12; i++)
    await page.request.post('/api/auth/callback/credentials', {
      form: {
        csrfToken: csrf.csrfToken,
        email: target.email,
        password: 'wrong-password',
        json: 'true',
      },
    });
  await page.goto('/auth/sign_in');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email', { exact: true }).fill(target.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toContainText(
    'Wait 15 minutes'
  );
  expect(
    (await page.request.get('/api/auth/session').then((r) => r.json())).user
  ).toBeUndefined();
});

test('notifications still navigate when marking read fails', async ({
  page,
  context,
}) => {
  await isolated(context, 114);
  await db.notification.create({
    data: {
      userId: buyer.id,
      type: 'UX_TEST',
      title: 'Open saved items',
      body: 'Navigation recovery',
      href: '/dispensary/saved?tab=alerts',
    },
  });
  await login(page, buyer);
  await page.setViewportSize({ width: 390, height: 844 });
  const bell = page
    .getByRole('button', { name: /Notifications, .* unread/ })
    .filter({ visible: true });
  await bell.click();
  await expect(
    page.getByRole('button', { name: /Open saved items/ })
  ).toBeVisible();
  await page.route('**/api/notifications', (route) =>
    route.request().method() === 'PATCH' ? route.abort() : route.continue()
  );
  await page.getByRole('button', { name: /Open saved items/ }).click();
  await expect(page).toHaveURL(/dispensary\/saved\?tab=alerts/);
});

test('public and admin pages remain readable with one heading, no overflow or rendering errors', async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await isolated(context, 115);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /hydration|hydrated|React error|uncaught/i.test(message.text())
    )
      errors.push(message.text());
  });
  for (const path of [
    '/',
    '/auth/sign_in',
    '/auth/sign_up?type=dispensary',
    '/auth/forgot-password',
    '/contact',
    '/help',
    '/legal/terms',
    '/legal/privacy',
  ]) {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1:visible')).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        path: `${shots}/public-${path.replace(/\W+/g, '-') || 'home'}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await login(page, admin);
  for (const path of [
    '/admin/dashboard',
    `/admin/growers?q=${prefix}`,
    `/admin/dispensaries?q=${prefix}`,
    `/admin/users?q=${prefix}`,
    '/admin/settings',
  ]) {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1:visible')).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        path: `${shots}/admin-${path.split('/')[2]?.split('?')[0]}-${width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
