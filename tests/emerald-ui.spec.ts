import { test, expect, type Page } from '@playwright/test';
import { PrismaClient, type OrderStatus } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3144';

function isLocalTestTarget(value: string, database = false) {
  try {
    const target = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
      && (database
        ? /^postgres(?:ql)?:$/.test(target.protocol)
          && /^phenofarm_(?:auth|ui_fixes|test)_[a-zA-Z0-9_-]+$/.test(target.pathname.slice(1))
        : /^https?:$/.test(target.protocol));
  } catch { return false; }
}

if (!isLocalTestTarget(baseURL) || !isLocalTestTarget(process.env.DATABASE_URL || '', true)) {
  throw new Error('Emerald UI regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const authSecret = process.env.AUTH_SECRET;
if (!authSecret) throw new Error('Emerald UI regressions require the local app AUTH_SECRET.');

const db = new PrismaClient();
const prefix = `emerald-${randomUUID()}`;
const userIds: string[] = [];
const growerIds: string[] = [];
let growerId: string;
let token: string;
let modalProduct: { id: string; name: string };
const pendingRequests: Array<{ id: string; orderId: string }> = [];
const inProgressRequests: Array<{ id: string; orderId: string; label: string }> = [];
const lowStock: Array<{ id: string; name: string; quantity: number }> = [];
const excludedProducts: Array<{ id: string; name: string }> = [];

test.use({ baseURL, viewport: { width: 1440, height: 1000 } });
test.setTimeout(90000);

test.beforeAll(async () => {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const licenseExpiry = new Date(now.getFullYear() + 2, 11, 31);
  const createGrower = async (suffix: string) => {
    const user = await db.user.create({
      data: {
        email: `${prefix}-${suffix}@example.test`, name: `Emerald ${suffix}`, role: 'GROWER',
        emailVerifiedAt: now, sessionVersion: 0,
        grower: { create: {
          businessName: `Emerald ${suffix} Farm`, licenseNumber: `${prefix}-${suffix}`,
          licenseExpiry, isVerified: true, subscriptionPlan: 'pro', subscriptionStatus: 'active',
          phone: '8025550100', address: '1 Test Lane', city: 'Burlington', state: 'VT', zip: '05401',
          commercialMinimumOrder: 'None', commercialFulfillmentMethods: 'Pickup',
          commercialFulfillmentRegion: 'Vermont', commercialPaymentTerms: 'Net 30',
          commercialResponseWindow: 'One business day',
        } },
      },
      include: { grower: true },
    });
    userIds.push(user.id);
    growerIds.push(user.grower!.id);
    return user;
  };
  const user = await createGrower('owner');
  const foreignUser = await createGrower('foreign');
  growerId = user.grower!.id;
  const foreignGrowerId = foreignUser.grower!.id;
  token = await encode({
    secret: authSecret,
    token: { id: user.id, sub: user.id, role: 'GROWER', email: user.email, sessionVersion: 0 },
    maxAge: 3600,
  });

  const buyer = await db.dispensary.create({ data: {
    businessName: 'Emerald fixture buyer', createdByGrowerId: growerId, isOffPlatform: true,
  } });
  const foreignBuyer = await db.dispensary.create({ data: {
    businessName: 'Foreign fixture buyer', createdByGrowerId: foreignGrowerId, isOffPlatform: true,
  } });
  const createOrder = (suffix: string, status: OrderStatus, totalAmount: number, dates: {
    createdAt?: Date; updatedAt?: Date; deliveredAt?: Date;
  } = {}, foreign = false) => db.order.create({ data: {
    orderId: `${prefix}-${suffix}`, growerId: foreign ? foreignGrowerId : growerId,
    dispensaryId: foreign ? foreignBuyer.id : buyer.id, status,
    subtotal: totalAmount, totalAmount, ...dates,
  } });

  // The fifth pending request is older than 30 days and outside the four-row preview.
  for (let index = 0; index < 5; index++) {
    const order = await createOrder(`pending-${index}`, 'PENDING', 1000, {
      createdAt: daysAgo(index === 4 ? 60 : index + 1),
    });
    pendingRequests.push({ id: order.id, orderId: order.orderId });
  }
  const progressing: Array<{ status: OrderStatus; label: string }> = [
    { status: 'CONFIRMED', label: 'Accepted' },
    { status: 'PROCESSING', label: 'Preparing' },
    { status: 'SHIPPED', label: 'Ready / In transit' },
    { status: 'CONFIRMED', label: 'Accepted' },
  ];
  for (const [index, item] of progressing.entries()) {
    const order = await createOrder(`progress-${index}`, item.status, 2000, {
      createdAt: daysAgo(10), updatedAt: new Date(now.getTime() - (index + 1) * 60000),
    });
    inProgressRequests.push({ id: order.id, orderId: order.orderId, label: item.label });
  }
  await createOrder('delivered-recent-a', 'DELIVERED', 125.5, { deliveredAt: daysAgo(2) });
  await createOrder('delivered-recent-b', 'DELIVERED', 74.5, { deliveredAt: daysAgo(7) });
  // Updating an old delivery today must not make it part of the 30-day metric.
  await createOrder('delivered-old', 'DELIVERED', 9999, { deliveredAt: daysAgo(60), updatedAt: now });
  await createOrder('cancelled', 'CANCELLED', 700, { deliveredAt: daysAgo(2) });
  await createOrder('foreign-delivered', 'DELIVERED', 8888, { deliveredAt: daysAgo(2) }, true);
  await createOrder('foreign-pending', 'PENDING', 9000, {}, true);

  for (const quantity of [0, 5, 10]) {
    const product = await db.product.create({ data: {
      growerId, name: `Emerald low stock ${quantity}`, inventoryQty: quantity, price: 25,
      unit: 'Gram', productType: 'Flower', status: 'PUBLISHED', isAvailable: true,
    } });
    lowStock.push({ id: product.id, name: product.name, quantity });
  }
  for (const item of [
    { name: 'Emerald regular stock', inventoryQty: 11, ownerId: growerId, isDeleted: false },
    { name: 'Emerald deleted stock', inventoryQty: 1, ownerId: growerId, isDeleted: true },
    { name: 'Emerald foreign stock', inventoryQty: 0, ownerId: foreignGrowerId, isDeleted: false },
  ]) {
    const product = await db.product.create({ data: {
      growerId: item.ownerId, name: item.name, inventoryQty: item.inventoryQty, isDeleted: item.isDeleted,
      price: 25, unit: 'Gram', productType: 'Flower', status: 'PUBLISHED', isAvailable: true,
    } });
    excludedProducts.push({ id: product.id, name: product.name });
    if (item.inventoryQty === 11) modalProduct = { id: product.id, name: product.name };
  }
});

test.afterAll(async () => {
  try {
    await db.order.deleteMany({ where: { growerId: { in: growerIds } } });
    await db.dispensary.deleteMany({ where: { createdByGrowerId: { in: growerIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  } finally { await db.$disconnect(); }
});

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL }]);
});

async function openOverview(page: Page) {
  await page.goto('/grower/dashboard');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
}

test('overview aggregates every active status and only the grower’s recent delivered value', async ({ page }) => {
  await openOverview(page);
  const summary = page.getByRole('region', { name: 'Summary', exact: true });
  const active = summary.getByRole('link', { name: /^Active requests/ });
  await expect(active.getByText('9', { exact: true })).toBeVisible();
  await expect(active).toHaveAttribute('href', '/grower/orders');
  const delivered = summary.getByRole('link', { name: /^Delivered value/ });
  await expect(delivered.getByText('$200', { exact: true })).toBeVisible();
  await expect(delivered).toContainText('Last 30 days');
  await expect(delivered).toHaveAttribute('href', '/grower/reports');
});

test('overview request tabs separate pending and in-progress rows and preserve destination links', async ({ page }) => {
  await openOverview(page);
  const panel = page.getByRole('region', { name: 'Needs attention', exact: true });
  const newTab = panel.getByRole('button', { name: /^New\s*5$/ });
  const progressTab = panel.getByRole('button', { name: /^In progress\s*4$/ });
  await expect(newTab).toHaveAttribute('aria-pressed', 'true');
  await expect(progressTab).toHaveAttribute('aria-pressed', 'false');
  await expect(panel.locator('a[href^="/grower/orders/"]')).toHaveCount(4);
  for (const order of pendingRequests.slice(0, 4)) {
    const row = panel.getByRole('link').filter({ hasText: `#${order.orderId}` });
    await expect(row).toHaveAttribute('href', `/grower/orders/${order.id}`);
    await expect(row).toContainText('Submitted');
  }
  await expect(panel.getByText(`#${pendingRequests[4].orderId}`, { exact: true })).toHaveCount(0);
  await progressTab.click();
  await expect(progressTab).toHaveAttribute('aria-pressed', 'true');
  await expect(newTab).toHaveAttribute('aria-pressed', 'false');
  await expect(panel.locator('a[href^="/grower/orders/"]')).toHaveCount(4);
  for (const order of inProgressRequests) {
    const row = panel.getByRole('link').filter({ hasText: `#${order.orderId}` });
    await expect(row).toHaveAttribute('href', `/grower/orders/${order.id}`);
    await expect(row).toContainText(order.label);
  }
  await expect(panel.getByText('Submitted', { exact: true })).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'View all requests' })).toHaveAttribute('href', '/grower/orders');
  await newTab.click();
  await expect(panel.getByText('Submitted', { exact: true })).toHaveCount(4);
  await expect(page).toHaveURL(`${baseURL}/grower/dashboard`);
});

test('overview low stock includes zero through ten units and excludes deleted and foreign products', async ({ page }) => {
  await openOverview(page);
  const metric = page.getByRole('region', { name: 'Summary', exact: true }).getByRole('link', { name: /^Low stock/ });
  await expect(metric.getByText('3', { exact: true })).toBeVisible();
  const inventory = page.getByRole('region', { name: 'Inventory', exact: true });
  await expect(inventory.locator('a[href^="/grower/products/"]')).toHaveCount(3);
  for (const product of lowStock) {
    const row = inventory.getByRole('link').filter({ hasText: product.name });
    await expect(row).toHaveAttribute('href', `/grower/products/${product.id}/edit`);
    await expect(row).toContainText(`${product.quantity} left`);
  }
  for (const product of excludedProducts) {
    await expect(inventory.getByText(product.name, { exact: true })).toHaveCount(0);
  }
});

for (const view of ['card', 'list'] as const) {
  test(`desktop product ${view} actions remain visible and Escape restores focus without navigation`, async ({ page }) => {
    await page.goto('/grower/products');
    await page.getByRole('button', { name: /^Display/ }).click();
    await page.getByRole('button', { name: view === 'card' ? 'Cards' : 'List', exact: true }).click();
    const product = page.locator(`[id="product-${view === 'card' ? 'card' : 'row'}-${modalProduct.id}"]`);
    const trigger = product.getByRole('button', { name: `More actions for ${modalProduct.name}`, exact: true });
    await expect(trigger).toBeVisible();
    await trigger.focus();
    const beforeUrl = page.url();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'More actions', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(modalProduct.name, { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Duplicate', exact: true })).toBeInViewport({ ratio: 1 });
    const deleteAction = dialog.getByRole('button', { name: 'Delete', exact: true });
    await expect(deleteAction).toBeInViewport({ ratio: 1 });
    await deleteAction.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close More actions', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(beforeUrl);
    const persisted = await db.product.findUniqueOrThrow({ where: { id: modalProduct.id } });
    expect({ name: persisted.name, quantity: persisted.inventoryQty, deleted: persisted.isDeleted })
      .toEqual({ name: modalProduct.name, quantity: 11, deleted: false });
  });
}
