import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { mkdirSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';

const database = new URL(process.env.DATABASE_URL || '');
const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  !database.pathname.startsWith('/phenofarm_auth_') ||
  !['localhost', '127.0.0.1'].includes(origin.hostname) ||
  process.env.AUTH_MAIL_PROVIDER !== 'local-test'
)
  throw Error(
    'Public follow-up checks require the isolated local account database and mail sink.'
  );
const db = new PrismaClient();
const prefix = `uxpublic-${Date.now()}`;
const password = 'UX-Public-September29!';
const shots = '/tmp/phenoshop-ux-20260929/public-followup-screens';
mkdirSync(shots, { recursive: true });
let pendingEmail: string,
  verifiedEmail: string,
  verifiedId: string,
  growerId: string;

async function mail(to: string, subject: string) {
  let result: { subject: string; text: string } | undefined;
  await expect
    .poll(async () => {
      const response = await fetch(
        `${process.env.AUTH_MAIL_TEST_URL}?to=${encodeURIComponent(to)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_MAIL_TEST_KEY}`,
          },
        }
      );
      result = (
        (await response.json()) as Array<{ subject: string; text: string }>
      )
        .reverse()
        .find((message) => message.subject.includes(subject));
      return Boolean(result);
    })
    .toBe(true);
  return result!;
}

async function signIn(page: Page, email: string, callback = '/dashboard') {
  await page.goto(
    `/auth/sign_in?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callback)}`
  );
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test.beforeAll(async () => {
  const hash = await bcrypt.hash(password, 10);
  for (const verified of [false, true]) {
    const user = await db.user.create({
      data: {
        email: `${prefix}-${verified ? 'verified' : 'pending'}@example.test`,
        name: 'UX Public',
        role: 'GROWER',
        passwordHash: hash,
        emailVerifiedAt: verified ? new Date() : null,
        policyAcceptances: {
          create: { ...CURRENT_POLICIES, source: 'signup' },
        },
        grower: {
          create: {
            businessName: `${prefix} ${verified}`,
            licenseNumber: `${prefix}-${verified}`,
            state: 'VT',
            licenseExpiry: new Date('2030-12-31'),
            isVerified: true,
            licenseStatus: 'verified',
          },
        },
      },
      include: { grower: true },
    });
    if (verified) {
      verifiedEmail = user.email;
      verifiedId = user.id;
      growerId = user.grower!.id;
    } else pendingEmail = user.email;
  }
});
test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
});
test.beforeEach(async ({ context, page }, testInfo) => {
  await context.setExtraHTTPHeaders({
    'x-forwarded-for': `192.0.2.${210 + testInfo.parallelIndex + (testInfo.line % 30)}`,
  });
  await page.setViewportSize({ width: 390, height: 844 });
});

test('inline verification resend recovers from failure, delivers locally, and prevents duplicate sends', async ({
  page,
}) => {
  await signIn(page, pendingEmail);
  await expect(page.locator('form').getByRole('alert')).toHaveText(
    'Check your inbox to verify your email.'
  );
  const resend = page.getByRole('button', {
    name: `Send a new link to ${pendingEmail}`,
  });
  await expect(resend).toBeVisible();
  await page.route(
    '**/api/auth/verification/request',
    (route) => route.abort('failed'),
    { times: 1 }
  );
  await resend.click();
  await expect(page.locator('form').getByRole('alert')).toHaveText(
    'Could not send a link. Check your connection and try again.'
  );
  await expect(resend).toBeEnabled();
  await page.route(
    '**/api/auth/verification/request',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error:
            'Email delivery is temporarily unavailable. Please try again later.',
        }),
      }),
    { times: 1 }
  );
  await resend.click();
  await expect(page.locator('form').getByRole('alert')).toContainText(
    'Email delivery is temporarily unavailable'
  );
  await expect(resend).toBeEnabled();
  await page.unroute('**/api/auth/verification/request');
  const [delivery] = await Promise.all([
    page.waitForResponse('**/api/auth/verification/request'),
    resend.click(),
  ]);
  const headers = await delivery.request().allHeaders();
  expect(
    delivery.status(),
    JSON.stringify({
      body: await delivery.text(),
      request: delivery.request().postDataJSON(),
      origin: headers.origin,
      type: headers['content-type'],
      site: headers['sec-fetch-site'],
    })
  ).toBe(200);
  await expect(page.getByRole('status')).toContainText(pendingEmail);
  await expect(
    page.getByRole('button', { name: /Resend in \d+s/ })
  ).toBeDisabled();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );
  expect((await mail(pendingEmail, 'Verify your email')).text).toContain(
    '/auth/verify-email'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.screenshot({ path: `${shots}/inline-resend-mobile.png` });
});

test('throttled inline resend explains the wait and keeps the address', async ({
  page,
}) => {
  await signIn(page, pendingEmail);
  await page.route('**/api/auth/verification/request', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Too many requests. Try again in an hour.',
      }),
    })
  );
  await page
    .getByRole('button', { name: `Send a new link to ${pendingEmail}` })
    .click();
  await expect(page.locator('form').getByRole('alert')).toHaveText(
    'Too many requests. Try again in an hour.'
  );
  await expect(
    page.getByRole('button', { name: 'Resend in 60m' })
  ).toBeDisabled();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );
});

test('recovery navigation preserves the address and new-password feedback is shared', async ({
  page,
}) => {
  await page.goto(
    `/auth/verify-email?email=${encodeURIComponent(pendingEmail)}`
  );
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );
  await page.getByRole('link', { name: 'Reset password', exact: true }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );
  await page
    .getByRole('link', { name: 'Forgot password?', exact: true })
    .click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    pendingEmail
  );

  await page.goto('/auth/sign_up');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await expect(page.getByText('7 more characters needed.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await expect(page.getByText('Minimum length met.')).toBeVisible();
  await expect(page.getByLabel(/Confirm.*password/i)).toHaveCount(0);

  expect(
    (
      await page.request.post('/api/auth/forgot-password', {
        data: { email: verifiedEmail },
      })
    ).status()
  ).toBe(200);
  const reset = (await mail(verifiedEmail, 'Reset your password')).text.match(
    /http:\/\/[^\s]+#token=[A-Za-z0-9_-]+/
  )?.[0];
  expect(reset).toBeTruthy();
  await page.goto(reset!);
  await page.getByLabel('New password', { exact: true }).fill('short');
  await expect(page.getByText('7 more characters needed.')).toBeVisible();
  await page.getByLabel('New password', { exact: true }).fill(password);
  await expect(page.getByText('Minimum length met.')).toBeVisible();
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(
    page.getByLabel('New password', { exact: true })
  ).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('New password', { exact: true })).toHaveValue(
    password
  );
  await page.screenshot({ path: `${shots}/password-feedback-mobile.png` });
});

test('signed-in landing links and touch targets work across widths without reduced-motion hydration warnings', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /hydration|hydrated|did not match/i.test(message.text())
    )
      errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const token = await encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      id: verifiedId,
      sub: verifiedId,
      role: 'GROWER',
      email: verifiedEmail,
      name: 'UX Public',
      growerId,
      sessionVersion: 0,
    },
  });
  await context.addCookies([
    { name: 'next-auth.session-token', value: token, url: origin.origin },
  ]);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('a[href^="/auth/sign_"]')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /Open dashboard/ }).first()
    ).toBeVisible();
    await expect(page.locator('main section').first().getByRole('link', { name: 'Open dashboard', exact: true }).locator('..')).toHaveCSS('opacity', '1');
    const header = page.locator('nav').first();
    const targets = await header.locator('a, button').evaluateAll(elements => elements
      .map(element => { const rect = element.getBoundingClientRect(); return { text: element.textContent?.trim(), left: rect.left, right: rect.right, height: rect.height, width: rect.width }; })
      .filter(rect => rect.width > 0 && rect.height > 0)
      .sort((left, right) => left.left - right.left));
    expect(targets.every(target => target.height >= 44 && target.left >= 0 && target.right <= width), JSON.stringify(targets)).toBe(true);
    expect(targets.every((target, index) => index === 0 || targets[index - 1].right <= target.left), JSON.stringify(targets)).toBe(true);
    await page.screenshot({ path: `${shots}/landing-header-${width}.png` });
    const featureGroup = page.getByRole('group', { name: 'PhenoShop features' });
    const vignetteCopy = [/View contact and license details in one place/, /Buyers and growers can discuss a price/, /Both sides can see the request status/, /Growers can add batch details and lab reports/, /Growers can see delivered request totals/];
    for (const [index, button] of (await featureGroup.getByRole('button').all()).entries()) {
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      const vignette = page.locator('#workflow').getByText(vignetteCopy[index]);
      await expect(vignette).toBeVisible();
      await expect(vignette.locator('xpath=../..')).toHaveCSS('opacity', '1');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(header).toHaveClass(/backdrop-blur/);
    const heights = await page
      .locator('footer a')
      .evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().height)
      );
    expect(heights.every((height) => height >= 44)).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page.screenshot({ path: `${shots}/landing-footer-${width}.png` });
  }
  expect(errors).toEqual([]);
});

test('sign-in preserves change-email destinations and rejects external destinations', async ({
  page,
  context,
}) => {
  await signIn(page, verifiedEmail, '/auth/change-email');
  await expect(page).toHaveURL(/\/auth\/change-email$/);
  await expect(page.getByLabel('New email', { exact: true })).toBeVisible();
  await context.clearCookies();
  await signIn(page, verifiedEmail, 'https://example.invalid/steal');
  await expect(page).toHaveURL(/\/grower\/dashboard$/);
  expect(new URL(page.url()).origin).toBe(origin.origin);
});
