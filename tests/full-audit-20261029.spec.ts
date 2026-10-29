import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import { CURRENT_POLICIES } from '../lib/policies/current';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const target = new URL(process.env.DATABASE_URL || 'http://invalid');
if (
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  !target.pathname.startsWith('/phenofarm_auth_') ||
  !/^http:\/\/(localhost|127\.0\.0\.1):/.test(baseURL)
) {
  throw new Error(
    'Full audit regressions require an isolated local audit database and app.'
  );
}

const db = new PrismaClient();
const prefix = `responsive-audit-${randomUUID()}`;
let userId: string,
  growerId: string,
  buyerId: string,
  productId: string,
  orderId: string,
  buyerUserId: string,
  buyerToken: string,
  token: string;
const productName = `TEST — ${'LongProductName'.repeat(11)}`;
test.describe.configure({ mode: 'default' });
test.use({ trace: 'off', video: 'off', actionTimeout: 15_000 });
test.setTimeout(90_000);
test.beforeAll(async () => {
  const user = await db.user.create({
    data: {
      email: `${prefix}@example.test`,
      role: 'GROWER',
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      grower: {
        create: {
          businessName: 'TEST — Responsive audit',
          licenseNumber: prefix,
          licenseExpiry: new Date('2030-12-31'),
          isVerified: true,
        },
      },
    },
    include: { grower: true },
  });
  userId = user.id;
  growerId = user.grower!.id;
  await db.user.update({ where: { id: userId }, data: { growerId } });
  const buyer = await db.dispensary.create({
    data: {
      businessName: 'TEST — Long customer name for layout review',
      createdByGrowerId: growerId,
      isOffPlatform: true,
    },
  });
  buyerId = buyer.id;
  const product = await db.product.create({
    data: {
      growerId,
      name: productName,
      productType: 'Flower',
      price: 100,
      unit: 'lb',
      inventoryQty: 10,
      isAvailable: true,
      status: 'PUBLISHED',
      harvestDate: new Date('2025-01-01'),
    },
  });
  productId = product.id;
  const order = await db.order.create({
    data: {
      orderId: randomUUID().replaceAll('-', ''),
      growerId,
      dispensaryId: buyerId,
      status: 'PENDING',
      inventoryState: 'NOT_DEDUCTED',
      subtotal: 100,
      totalAmount: 100,
      items: {
        create: {
          productId,
          growerId,
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      },
    },
  });
  orderId = order.id;
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
  const buyerUser = await db.user.create({
    data: {
      email: `${prefix}-buyer@example.test`,
      role: 'DISPENSARY',
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      dispensary: {
        create: {
          businessName: 'TEST — Responsive buyer',
          licenseNumber: prefix,
          licenseExpiry: new Date('2030-12-31'),
          isVerified: true,
          licenseStatus: 'verified',
        },
      },
    },
    include: { dispensary: true },
  });
  buyerUserId = buyerUser.id;
  await db.user.update({
    where: { id: buyerUser.id },
    data: { dispensaryId: buyerUser.dispensary!.id },
  });
  buyerToken = await encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      id: buyerUser.id,
      sub: buyerUser.id,
      email: buyerUser.email,
      role: 'DISPENSARY',
      dispensaryId: buyerUser.dispensary!.id,
      sessionVersion: 0,
    },
  });
});
test.afterAll(async () => {
  if (growerId) {
    await db.order.deleteMany({ where: { growerId } });
    await db.product.deleteMany({ where: { growerId } });
    await db.strain.deleteMany({ where: { growerId } });
    await db.dispensary.deleteMany({ where: { createdByGrowerId: growerId } });
  }
  if (userId) await db.user.delete({ where: { id: userId } });
  if (buyerUserId) await db.user.delete({ where: { id: buyerUserId } });
  await db.$disconnect();
});
for (const width of [1440, 834, 390]) {
  test(`actions, nested fields and safe discard remain usable at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: token, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/grower/products');
    const trigger = page.getByRole('button', {
      name: `Actions for ${productName}`,
      exact: true,
    });
    await trigger.click();
    const actions = page.getByRole('dialog', {
      name: `Actions for ${productName}`,
      exact: true,
    });
    await expect(
      actions.getByRole('button', { name: 'Delete', exact: true })
    ).toBeInViewport();
    expect(
      await actions.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(actions).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.goto(`/grower/products/${productId}/edit`);
    const outerDate = page.locator('#harvestDate:visible');
    const originalDate = await outerDate.inputValue();
    await page
      .locator('#batchId')
      .locator('..')
      .getByRole('button', { name: '+ New', exact: true })
      .click();
    const batch = page.getByRole('dialog', { name: 'New batch', exact: true });
    await batch.getByLabel('Harvest date', { exact: true }).fill('2025-02-01');
    await expect(outerDate).toHaveValue(originalDate);
    expect(
      await batch.locator('label[for]').evaluateAll((labels) =>
        labels.every((label) => {
          const el = label as HTMLLabelElement;
          return (
            el.control && el.closest('[role="dialog"]')?.contains(el.control)
          );
        })
      )
    ).toBe(true);
    await batch
      .getByRole('button', { name: 'Close New batch', exact: true })
      .click();
    const discard = page.getByRole('alertdialog', {
      name: 'Leave without saving?',
    });
    await expect(
      discard.getByRole('button', { name: 'Keep editing', exact: true })
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(discard).toBeHidden();
    await expect(batch.getByLabel('Harvest date', { exact: true })).toHaveValue(
      '2025-02-01'
    );
    await batch
      .getByRole('button', { name: 'Close New batch', exact: true })
      .click();
    await page.setViewportSize({ width, height: 240 });
    const bounds = await discard.boundingBox();
    expect(bounds!.height).toBeLessThanOrEqual(208);
    await discard
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click();
    await expect(batch).toBeHidden();
    await expect(outerDate).toHaveValue(originalDate);
  });
  test(`order titles, cards and filters retain useful space at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: token, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/grower/orders/${orderId}`);
    const heading = page.getByRole('heading', { level: 1 });
    expect(
      await heading.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)
    ).toBe(true);
    await page.goto('/grower/orders/history');
    const search = await page
      .getByRole('searchbox', { name: 'Search orders' })
      .boundingBox();
    expect(search!.width).toBeGreaterThan(240);
    await page
      .getByRole('textbox', { name: 'From', exact: true })
      .fill('2025-01-01');
    await expect(page).toHaveURL(/from=2025-01-01/);
    await page.goto('/grower/orders');
    const link = page.locator(
      `article a[href="/grower/orders/${orderId}"]:visible`
    );
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.width).toBeGreaterThan(220);
    await page.goto('/grower/marketplace');
    expect(
      (await page
        .getByRole('searchbox', { name: 'Search preview' })
        .boundingBox())!.width
    ).toBeGreaterThan(240);
  });
}

for (const width of [1440, 834, 768, 640, 390]) {
  test(`cart always offers a working review action at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: buyerToken, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/dispensary/catalog');
    await page
      .getByRole('button', { name: `Add ${productName} to cart`, exact: true })
      .click();
    await page.getByRole('link', { name: /^Cart(?:\s|$)/ }).click();
    const review = page.getByRole('button', {
      name: 'Review request',
      exact: true,
    });
    await expect(review).toBeVisible();
    await review.click();
    const dialog = page.getByRole('dialog', {
      name: 'Review request',
      exact: true,
    });
    await expect(
      dialog.getByRole('button', { name: 'Send order request', exact: true })
    ).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
}

for (const width of [1440, 834, 390]) {
  test(`saved filters show all selections and restore favorites after reload at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: buyerToken, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/dispensary/catalog');
    if (width < 1280)
      await page.getByRole('button', { name: 'Toggle filters' }).click();
    await page.getByRole('checkbox', { name: /^Favorites(?: only)?/ }).check();
    await page.getByRole('checkbox', { name: 'In stock', exact: true }).check();
    await page
      .getByRole('checkbox', { name: 'Has lab results', exact: true })
      .check();
    await page
      .getByRole('combobox', { name: 'Price unit', exact: true })
      .selectOption('lb');
    await page
      .getByRole('button', {
        name: width < 1280 ? 'Save filter' : 'Save these filters',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Save filter',
      exact: true,
    });
    for (const label of [
      /Favorites/,
      /^In stock$/,
      /^Has lab results$/,
      /^Per lb$/,
    ]) {
      await expect(dialog.getByText(label)).toBeVisible();
    }
    await mkdir('docs/audit-2026-10-29/screens', { recursive: true });
    await page.screenshot({
      path: `docs/audit-2026-10-29/screens/saved-selections-${width}.png`,
      animations: 'disabled',
    });
    const name = `TEST saved ${width}`;
    await dialog.getByLabel('Name', { exact: true }).fill(name);
    await dialog
      .getByRole('button', { name: 'Save filter', exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => {
        const response = await page.request.get(
          '/api/dispensary/saved-filters'
        );
        const { filters } = await response.json();
        return filters.find((value: { name: string }) => value.name === name)
          ?.filters;
      })
      .toMatchObject({
        inStock: true,
        hasLabs: true,
        priceUnit: 'lb',
        favoritesOnly: true,
      });
    await page.goto('/dispensary/catalog');
    if (width < 1280) {
      await page.getByRole('button', { name: 'Toggle filters' }).click();
      await page.getByText(/^Saved filters \(/).click();
    }
    await page.getByRole('button', { name, exact: true }).click();
    if (width < 1280)
      await page.getByRole('button', { name: 'Toggle filters' }).click();
    await expect(
      page.getByRole('checkbox', { name: /^Favorites(?: only)?/ })
    ).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'In stock', exact: true })
    ).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'Has lab results', exact: true })
    ).toBeChecked();
    await expect(
      page.getByRole('combobox', { name: 'Price unit', exact: true })
    ).toHaveValue('lb');
    if (width < 1280) await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy();
    await page.screenshot({
      path: `docs/audit-2026-10-29/screens/catalog-long-name-${width}.png`,
      animations: 'disabled',
    });
  });
  test(`inline strain creation remains reachable above the mobile actions at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: token, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/grower/products/add');
    await page
      .locator('#strainId:visible')
      .locator('..')
      .getByRole('button', { name: '+ New', exact: true })
      .click();
    await page.getByLabel('Name', { exact: true }).fill(`TEST strain ${width}`);
    await page.getByRole('button', { name: 'Add strain', exact: true }).click();
    await expect(
      page.locator('#strainId:visible').locator('option:checked')
    ).toHaveText(new RegExp(`TEST strain ${width}`));
  });
}

for (const width of [1440, 834, 390, 320]) {
  test(`decline and cancellation validation guides corrections at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'next-auth.session-token', value: token, url: baseURL },
    ]);
    await page.setViewportSize({ width, height: 844 });
    for (const status of ['PENDING', 'CONFIRMED'] as const) {
      await db.order.update({
        where: { id: orderId },
        data: {
          status,
          inventoryState: status === 'PENDING' ? 'NOT_DEDUCTED' : 'DEDUCTED',
        },
      });
      await page.goto(`/grower/orders/${orderId}`);
      const section = page
        .getByRole('heading', { name: 'Next action', exact: true })
        .locator('..');
      await section
        .getByRole('button', {
          name: status === 'PENDING' ? 'Decline' : 'Cancel order',
          exact: true,
        })
        .click();
      const confirm = section.getByRole('button', {
        name: status === 'PENDING' ? 'Confirm decline' : 'Confirm cancellation',
        exact: true,
      });
      const reason = section.getByRole('combobox');
      const note = section.getByRole('textbox');
      await confirm.click();
      await expect(reason).toBeFocused();
      await expect(section.getByRole('alert')).toContainText('Choose a reason');
      await reason.selectOption('Other');
      await expect(section.getByRole('alert')).toBeHidden();
      await confirm.click();
      await expect(note).toBeFocused();
      await expect(section.getByRole('alert')).toContainText(
        'Add a short note'
      );
      await note.fill('A local audit reason.');
      await expect(section.getByRole('alert')).toBeHidden();
      await expect(confirm).toBeInViewport();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBeTruthy();
      await mkdir('docs/audit-2026-10-29/screens', { recursive: true });
      await section.screenshot({
        path: `docs/audit-2026-10-29/screens/inline-fixed-${status}-${width}.png`,
        animations: 'disabled',
      });
      await reason.selectOption('');
      await confirm.click();
      await section
        .getByRole('button', {
          name: status === 'PENDING' ? 'Keep request' : 'Keep order',
          exact: true,
        })
        .click();
      await expect(section.getByRole('alert')).toBeHidden();
      await expect(reason).toBeHidden();
      expect(
        (await db.order.findUniqueOrThrow({ where: { id: orderId } })).status
      ).toBe(status);
    }
    await db.order.update({
      where: { id: orderId },
      data: { status: 'PENDING', inventoryState: 'NOT_DEDUCTED' },
    });
  });
}
