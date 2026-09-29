import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { CURRENT_POLICIES } from '../lib/policies/current';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = new URL(process.env.PLAYWRIGHT_BASE_URL || '');
const database = new URL(process.env.DATABASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  database.hostname !== 'localhost' ||
  !database.pathname.startsWith('/phenofarm_auth_')
)
  throw new Error('Buyer UX tests require isolated local app/database.');
const db = new PrismaClient();
const prefix = `ux-buyer-${Date.now()}`;
const password = `Test-${randomUUID()}`;
const shots = '/tmp/phenoshop-ux-20260929/buyer-screens';
mkdirSync(shots, { recursive: true });
let grower: { id: string; userId: string; email: string },
  buyer: { id: string; userId: string; email: string },
  pending: typeof buyer;
let product: { id: string; name: string; growerId: string },
  quoteOnly: typeof product;
const users: string[] = [];
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.use({ video: 'off', trace: 'retain-on-failure' });
async function login(page: Page, user: { email: string }) {
  await page.goto('/auth/sign_in');
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/(grower|dispensary)\//);
}
function item(quantity = 2) {
  return {
    id: product.id,
    name: product.name,
    grower: 'UX Grower',
    growerId: grower.id,
    price: 1800,
    quantity,
    maxQty: 100,
    unit: 'lb',
  };
}
test.beforeAll(async () => {
  for (const role of ['grower', 'buyer', 'pending']) {
    const user = await db.user.create({
      data: {
        email: `${prefix}-${role}@example.test`,
        name: 'UX Tester',
        role: role === 'grower' ? 'GROWER' : 'DISPENSARY',
        passwordHash: await bcrypt.hash(password, 10),
        emailVerifiedAt: new Date(),
        policyAcceptances: {
          create: { ...CURRENT_POLICIES, source: 'signup' },
        },
        ...(role === 'grower'
          ? {
              grower: {
                create: {
                  businessName: 'UX Grower',
                  isVerified: true,
                  licenseNumber: prefix,
                  licenseExpiry: new Date('2030-12-31'),
                  commercialPaymentTerms: 'Net 15',
                  commercialMinimumOrder: '$500',
                  commercialFulfillmentMethods: 'Pickup, Delivery',
                },
              },
            }
          : {
              dispensary: {
                create: {
                  businessName: `UX ${role}`,
                  isVerified: role === 'buyer',
                  licenseStatus:
                    role === 'buyer' ? 'verified' : 'pending_review',
                  licenseNumber: prefix,
                  licenseSubmittedAt: new Date(),
                  licenseExpiry: new Date('2030-12-31'),
                  address: '10 Test Road',
                  city: 'Burlington',
                  state: 'VT',
                  zip: '05401',
                  orderDefaults: {
                    fulfillmentMethod: 'Delivery requested',
                    paymentTerms: 'Net 30',
                  },
                },
              },
            }),
      },
      include: { grower: true, dispensary: true },
    });
    users.push(user.id);
    const record = {
      id: user.grower?.id || user.dispensary!.id,
      userId: user.id,
      email: user.email,
    };
    if (role === 'grower') grower = record;
    else if (role === 'buyer') buyer = record;
    else pending = record;
  }
  const strain = await db.strain.create({
    data: {
      name: 'Blue Dream',
      growerId: grower.id,
      strainType: 'SATIVA_DOM_HYBRID',
    },
  });
  product = await db.product.create({
    data: {
      name: `Blue Dream ${prefix}`,
      growerId: grower.id,
      strainId: strain.id,
      price: 1800,
      unit: 'lb',
      productType: 'Flower',
      status: 'PUBLISHED',
      isAvailable: true,
      inventoryQty: 100,
      description: 'Fresh wholesale flower with a detailed description.',
    },
  });
  quoteOnly = await db.product.create({
    data: {
      name: `Quote ${prefix}`,
      growerId: grower.id,
      price: 900,
      isPriceVisible: false,
      unit: 'lb',
      productType: 'Flower',
      status: 'PUBLISHED',
      isAvailable: true,
      inventoryQty: 10,
    },
  });
});
test.afterAll(async () => {
  await db.order.deleteMany({
    where: { dispensaryId: { in: [buyer.id, pending.id] } },
  });
  await db.product.deleteMany({ where: { growerId: grower.id } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

test('catalog typos, product details, quantity editing, filters and account cart work on desktop/mobile', async ({
  page,
  browser,
}) => {
  await login(page, buyer);
  const response = await page.request.get(
    '/api/dispensary/catalog?search=blu%20drem'
  );
  expect(response.status(), await response.text()).toBe(200);
  expect(
    (await response.json()).products.some(
      (value: { id: string }) => value.id === product.id
    )
  ).toBe(true);
  await page.goto(`/dispensary/catalog?product=${product.id}`);
  const modal = page.getByRole('dialog', { name: product.name });
  await expect(modal).toBeVisible();
  await expect(
    modal.getByText('Fresh wholesale flower with a detailed description.')
  ).toBeVisible();
  await expect(modal.getByText('No lab results.')).toBeVisible();
  const quantity = modal.getByRole('textbox', {
    name: `Quantity for ${product.name}`,
  });
  await quantity.fill('');
  await expect(quantity).toHaveValue('');
  await quantity.fill('1.5');
  await modal
    .getByRole('button', { name: `Add ${product.name} to cart`, exact: true })
    .click();
  await expect(quantity).toHaveValue('1.5');
  await expect(modal.getByRole('alert')).toHaveText(
    'Enter a whole number of 1 or more.'
  );
  expect(
    (await page.request.get('/api/dispensary/cart').then((r) => r.json())).cart
      .items
  ).toHaveLength(0);
  await quantity.fill('3');
  await modal
    .getByRole('button', { name: `Add ${product.name} to cart`, exact: true })
    .click();
  await expect(quantity).toHaveValue('3');
  await expect(
    page.getByText(`Added 3 × ${product.name}`, { exact: true })
  ).toBeVisible();
  await modal.getByRole('button', { name: `Close ${product.name}` }).click();
  await expect
    .poll(
      async () =>
        (await page.request.get('/api/dispensary/cart').then((r) => r.json()))
          .cart.items[0]?.quantity
    )
    .toBe(3);
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/dispensary/catalog?search=${prefix}`);
    await expect(
      page.locator(`#catalog-product-${product.id}:visible`)
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/catalog-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Toggle filters' }).click();
  const filters = page.getByRole('dialog', { name: 'Catalog filters' });
  await filters
    .getByRole('combobox', { name: 'Price unit' })
    .selectOption('lb');
  await filters
    .getByRole('button', { name: '$1,000–$2,000 / lb', exact: true })
    .click();
  await expect(
    filters.getByRole('button', { name: 'Show 1 products', exact: true })
  ).toBeVisible();
  await filters.getByLabel('Has lab results').check();
  await expect(
    filters.getByRole('button', { name: 'Show 0 products', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'No matching products', exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(/hasLabs=true/);
  await page.getByRole('button', { name: 'Toggle filters' }).click();
  await expect(filters.getByLabel('Has lab results')).toBeChecked();
  await filters.getByLabel('Has lab results').uncheck();
  await filters
    .getByRole('button', { name: 'Show 1 products', exact: true })
    .click();
  await expect(
    page.locator(`#catalog-product-${product.id}:visible`)
  ).toBeVisible();
  await page.screenshot({
    path: `${shots}/filters-mobile.png`,
    fullPage: true,
  });
  await page.goto(`/dispensary/catalog?product=${product.id}`);
  const mobileDetail = page.getByRole('dialog', { name: product.name });
  await expect(mobileDetail).toBeVisible();
  expect(
    await mobileDetail.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/product-detail-mobile.png`,
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  const context = await browser.newContext();
  const phone = await context.newPage();
  await login(phone, buyer);
  await phone.goto('/dispensary/cart');
  await expect(phone.locator(`#qty-${product.id}`)).toHaveValue('3');
  await context.close();
});

test('license state is visible before ordering and definitive rejection clears retry lock', async ({
  page,
}) => {
  await login(page, pending);
  await page.goto('/dispensary/dashboard');
  await expect(
    page.getByText('Submitted — under review (usually 1–2 business days).')
  ).toBeVisible();
  await page.request.patch('/api/dispensary/cart', {
    data: { changed: [item()], removed: [] },
  });
  await page.goto('/dispensary/cart');
  await expect(
    page.getByText(/You can send orders once your license is approved/)
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Review order', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Send order', exact: true })
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key: `phenofarm:pending-request:${pending.userId}`,
      value: {
        key: randomUUID(),
        cart: { items: [item()], subtotal: 3600, tax: 0, total: 3600 },
        notes: '',
        details: {
          fulfillmentMethod: 'Pickup',
          requestedWindow: '',
          paymentTerms: '',
          orderNotes: '',
          deliveryAddress: '',
        },
      },
    }
  );
  await page.reload();
  await page.getByRole('button', { name: 'Check order', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Confirm your order' })
  ).toHaveCount(0);
  await expect(page.locator(`#cart-${product.id}`)).toBeVisible();
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      `phenofarm:pending-request:${pending.userId}`
    )
  ).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${shots}/pending-cart-mobile.png`,
    fullPage: true,
  });
});

test('cart flags price-only lines, removes with undo, sends address and grower terms with safe retry', async ({
  page,
}) => {
  await login(page, buyer);
  await page.request.patch('/api/dispensary/cart', {
    data: {
      changed: [
        item(2),
        {
          ...item(1),
          id: quoteOnly.id,
          name: quoteOnly.name,
          requiresQuote: true,
        },
      ],
      removed: [],
    },
  });
  await page.goto('/dispensary/cart');
  const quote = page.locator(`#cart-${quoteOnly.id}`);
  await expect(
    quote.getByText('Price on request', { exact: true }).first()
  ).toBeVisible();
  await quote
    .getByRole('button', { name: `Remove ${quoteOnly.name} from cart` })
    .click();
  await expect(quote).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(quote).toBeVisible();
  await quote
    .getByRole('button', { name: `Remove ${quoteOnly.name} from cart` })
    .click();
  await expect(page.locator('#delivery-address')).toContainText('10 Test Road');
  await expect(page.getByLabel('Payment timing')).toHaveValue('Net 15');
  await page.route(
    '**/api/checkout',
    async (route) => {
      await route.fetch();
      await route.abort('failed');
    },
    { times: 1 }
  );
  await page
    .getByRole('button', { name: 'Review order', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Send order', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Check order', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Check order', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Order sent', exact: true })
  ).toBeVisible();
  const orders = await db.order.findMany({ where: { dispensaryId: buyer.id } });
  expect(orders).toHaveLength(1);
  expect(orders[0].notes).toContain('Delivery address: 10 Test Road');
  expect(orders[0].notes).toContain('Payment terms: Net 15');
  await page.waitForTimeout(5500);
  await expect(page).toHaveURL(/\/dispensary\/cart/);
  await page.screenshot({ path: `${shots}/order-sent.png`, fullPage: true });
  await page.goto(`/dispensary/orders/${orders[0].id}`);
  await expect(
    page.getByRole('region', { name: 'Order progress' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reorder', exact: true })
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Buy again', exact: true })
    .first()
    .click();
  await expect(page.getByText('Added 1 of 1', { exact: true })).toBeVisible();
});

test('price change notifies without buyer visit, editing and dismissing alerts work', async ({
  page,
  browser,
}) => {
  await login(page, buyer);
  const response = await page.request.patch('/api/dispensary/price-alerts', {
    data: {
      added: [{ productId: product.id, targetPrice: 1700 }],
      removed: [],
    },
  });
  expect(response.status()).toBe(200);
  const context = await browser.newContext();
  const seller = await context.newPage();
  await login(seller, grower);
  const update = await seller.request.put(`/api/products/${product.id}`, {
    data: {
      name: product.name,
      price: 1600,
      inventoryQty: 98,
      unit: 'lb',
      productType: 'Flower',
      status: 'PUBLISHED',
      isAvailable: true,
      isPriceVisible: true,
    },
  });
  expect(update.status(), await update.text()).toBe(200);
  await expect
    .poll(
      async () =>
        await db.notification.count({
          where: { userId: buyer.userId, type: 'PRICE_ALERT_TRIGGERED' },
        })
    )
    .toBe(1);
  await context.close();
  await page.goto('/dispensary/saved?tab=alerts');
  await expect(page.getByText('Price dropped', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit target', exact: true }).click();
  await page.getByRole('textbox', { name: 'Target price' }).fill('$1,500');
  await page.getByRole('button', { name: 'Save alert', exact: true }).click();
  await expect
    .poll(async () =>
      Number(
        (
          await db.dispensaryPriceAlert.findFirst({
            where: { dispensaryId: buyer.id, productId: product.id },
          })
        )?.targetPrice
      )
    )
    .toBe(1500);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/alerts-${width}.png`,
      fullPage: true,
    });
  }
});

test('settings defaults persist across devices and shop/order/saved pages fit mobile', async ({
  page,
}) => {
  page.on('dialog', (dialog) => dialog.accept());
  await login(page, buyer);
  await page.goto('/dispensary/settings');
  await page.getByLabel('License state', { exact: true }).count();
  const defaults = page.locator('#order-defaults');
  await defaults.getByLabel('Preferred date or time').fill('Tuesday morning');
  await defaults.getByRole('button', { name: 'Save defaults' }).click();
  await expect
    .poll(
      async () =>
        (await db.dispensary.findUniqueOrThrow({ where: { id: buyer.id } }))
          .orderDefaults
    )
    .toMatchObject({ requestedWindow: 'Tuesday morning' });
  const name = page.locator('#dispensary-setting-businessName');
  await name.fill('Unsaved business draft');
  await page.waitForTimeout(750);
  await page.reload();
  await expect(name).toHaveValue('UX buyer');
  await page
    .getByRole('button', { name: 'Restore draft', exact: true })
    .click();
  await expect(name).toHaveValue('Unsaved business draft');
  await page.reload();
  await page
    .getByRole('button', { name: 'Discard draft', exact: true })
    .click();
  await expect(name).toHaveValue('UX buyer');
  for (const [label, path] of [
    ['shop', `/dispensary/grower/${grower.id}`],
    ['orders', '/dispensary/orders'],
    ['recent', '/dispensary/saved?tab=recent'],
    ['settings', '/dispensary/settings'],
  ]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1:visible')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${shots}/${label}-390.png`,
      fullPage: true,
    });
  }
});

test('license network errors release the spinner and allow a real retry', async ({
  page,
}) => {
  await db.dispensary.update({
    where: { id: pending.id },
    data: { licenseNumber: null, licenseSubmittedAt: null },
  });
  await login(page, pending);
  await page.goto('/dispensary/dashboard');
  await page
    .getByLabel('License number', { exact: true })
    .fill(`${prefix}-retry`);
  await page.route('**/api/dispensary/settings', async (route) => {
    if (route.request().method() === 'PATCH') await route.abort('failed');
    else await route.continue();
  });
  const send = page.getByRole('button', {
    name: 'Send for review',
    exact: true,
  });
  await send.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Couldn’t send' })
  ).toBeVisible();
  await expect(send).toBeEnabled();
  await page.unroute('**/api/dispensary/settings');
  await send.click();
  await expect(
    page.getByText(/Submitted.*under review|Submitted for review/).first()
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await db.dispensary.findUniqueOrThrow({ where: { id: pending.id } }))
          .licenseNumber
    )
    .toBe(`${prefix}-retry`);
});

test('offline cart edits recover across reload and account carts stay separate', async ({
  page,
  browser,
}) => {
  await login(page, buyer);
  await page.goto('/dispensary/cart');
  await page.route('**/api/dispensary/cart', async (route) => {
    if (route.request().method() === 'PATCH') await route.abort('failed');
    else await route.continue();
  });
  const quantity = page.locator(`#qty-${product.id}`);
  await quantity.fill('7');
  await quantity.blur();
  await expect(
    page.getByRole('button', { name: 'Retry sync', exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(quantity).toHaveValue('7');
  await page.unroute('**/api/dispensary/cart');
  await page.getByRole('button', { name: 'Retry sync', exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await page.request.get('/api/dispensary/cart').then((r) => r.json())
        ).cart.items.find((value: { id: string }) => value.id === product.id)
          ?.quantity
    )
    .toBe(7);
  await expect(
    page.getByRole('button', { name: 'Retry sync', exact: true })
  ).toHaveCount(0);
  await page
    .getByLabel('Notes (optional)', { exact: true })
    .fill('Quietly saved delivery note');
  await page.waitForTimeout(700);
  await page.reload();
  await page
    .getByRole('button', { name: 'Restore draft', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Notes (optional)', exact: true })
  ).toHaveValue('Quietly saved delivery note', { timeout: 10000 });
  const context = await browser.newContext();
  const other = await context.newPage();
  await login(other, pending);
  const own = await other.request
    .get('/api/dispensary/cart')
    .then((r) => r.json());
  expect(
    own.cart.items.find((value: { id: string }) => value.id === product.id)
      ?.quantity
  ).toBe(2);
  const one = { ...item(), id: 'parallel-one' };
  const two = { ...item(), id: 'parallel-two' };
  await Promise.all([
    page.request.patch('/api/dispensary/cart', {
      data: { changed: [one], removed: [] },
    }),
    page.request.patch('/api/dispensary/cart', {
      data: { changed: [two], removed: [] },
    }),
  ]);
  expect(
    (
      await page.request.get('/api/dispensary/cart').then((r) => r.json())
    ).cart.items.map((value: { id: string }) => value.id)
  ).toEqual(
    expect.arrayContaining(['parallel-one', 'parallel-two', product.id])
  );
  await context.close();
});

test('responsive alerts keep one portal, one mobile header, and anchored bottom navigation', async ({
  page,
}) => {
  await login(page, buyer);
  await page.request.patch('/api/dispensary/price-alerts', {
    data: {
      added: [{ productId: product.id, targetPrice: 1200 }],
      removed: [],
    },
  });
  await page.goto('/dispensary/saved?tab=alerts');
  await expect(
    page.getByRole('button', { name: 'Edit target', exact: true })
  ).toBeVisible();
  const frames = [];
  for (let turn = 0; turn < 3; turn++) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: `${shots}/responsive-alerts-desktop-${turn}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 900 });
    const frame = await page.evaluate(() => {
      const visible = (element: Element) =>
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== 'hidden';
      const portals = Array.from(
        document.querySelectorAll('.pf-portal')
      ).filter(visible);
      const fixed = portals.flatMap((portal) =>
        Array.from(portal.querySelectorAll('*'))
          .filter(
            (element) =>
              visible(element) && getComputedStyle(element).position === 'fixed'
          )
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              tag: element.tagName,
              label: element.getAttribute('aria-label'),
              class: element.className,
              text: element.textContent?.slice(0, 70),
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
              cssTop: style.top,
              cssBottom: style.bottom,
              transform: style.transform,
            };
          })
      );
      const brandLinks = Array.from(
        document.querySelectorAll(
          'a[aria-label="PhenoShop Dispensary overview"]'
        )
      )
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom };
        });
      return {
        portals: portals.length,
        fixed,
        brandLinks,
        viewport: { width: innerWidth, height: innerHeight },
        scrollHeight: document.documentElement.scrollHeight,
      };
    });
    frames.push(frame);
    writeFileSync(
      `${shots}/responsive-alerts-layout.json`,
      JSON.stringify(frames, null, 2)
    );
    expect(frame.portals).toBe(1);
    expect(frame.brandLinks).toHaveLength(1);
    expect(frame.brandLinks[0].top).toBeGreaterThanOrEqual(0);
    expect(frame.brandLinks[0].bottom).toBeLessThan(80);
    const navigation = frame.fixed.find(
      (element) => element.label === 'Main navigation'
    );
    expect(navigation).toBeDefined();
    expect(navigation!.bottom).toBe(900);
    expect(navigation!.height).toBeGreaterThanOrEqual(64);
    await page.screenshot({
      path: `${shots}/responsive-alerts-immediate-${turn}.png`,
      fullPage: true,
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
    await expect(
      page.getByRole('navigation', { name: 'Main navigation', exact: true })
    ).toBeVisible();
    await page.screenshot({
      path: `${shots}/responsive-alerts-settled-${turn}.png`,
      fullPage: true,
    });
  }
  writeFileSync(
    `${shots}/responsive-alerts-layout.json`,
    JSON.stringify(frames, null, 2)
  );
});

test('buyer pages and product sheet render without hydration or browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];
  page.on('pageerror', (error) =>
    errors.push(`${page.url()}: ${error.message}`)
  );
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      consoleMessages.push(`${page.url()}: ${message.text()}`);
  });
  await login(page, buyer);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/dispensary/dashboard',
    '/dispensary/catalog',
    '/dispensary/cart',
    '/dispensary/orders',
    '/dispensary/saved',
    '/dispensary/saved?tab=alerts',
    '/dispensary/saved?tab=recent',
    '/dispensary/settings',
    `/dispensary/grower/${grower.id}`,
  ]) {
    await page.goto(path);
    await expect(page.locator('h1:visible')).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
  }
  await page.goto(`/dispensary/catalog?product=${product.id}`);
  await expect(page.getByRole('dialog', { name: product.name })).toBeVisible();
  await page.screenshot({ path: `${shots}/product-detail-console-check.png` });
  writeFileSync(
    `${shots}/buyer-browser-errors.json`,
    JSON.stringify({ errors, consoleMessages }, null, 2)
  );
  expect(errors).toEqual([]);
  expect(
    consoleMessages.filter((message) =>
      /hydration|hydrated|didn't match|server rendered|cannot appear as a descendant|validateDOMNesting/i.test(
        message
      )
    )
  ).toEqual([]);
});
