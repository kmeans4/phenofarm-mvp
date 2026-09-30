import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';
const base = process.env.PLAYWRIGHT_BASE_URL || '';
const target = new URL(process.env.DATABASE_URL || '');
if (
  new URL(base).hostname !== '127.0.0.1' ||
  target.hostname !== 'localhost' ||
  !target.pathname.startsWith('/phenofarm_auth_')
)
  throw new Error('Use an isolated local phenofarm_auth_ database and app.');
const db = new PrismaClient();
const prefix = `ux-grower-${Date.now()}`;
const password = `QA-${randomUUID()}`;
let growerId: string;
let email: string;
let customerId: string;
let productId: string;
let secondProductId: string;
let sessionCookies: Awaited<ReturnType<BrowserContext['cookies']>> | undefined;
const screenshotDir = '/tmp/phenoshop-ux-20260929/grower-screenshots';
mkdirSync(screenshotDir, { recursive: true });
test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', video: 'off', actionTimeout: 15000 });
test.setTimeout(120000);
test.beforeAll(async () => {
  email = `${prefix}@example.test`;
  const user = await db.user.create({
    data: {
      email,
      name: 'UX Grower Tester',
      role: 'GROWER',
      emailVerifiedAt: new Date(),
      passwordHash: await bcrypt.hash(password, 10),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      grower: {
        create: {
          businessName: 'UX Review Grower',
          licenseNumber: 'TEST-UX-LICENSE',
          licenseExpiry: new Date('2030-12-31'),
          isVerified: true,
          phone: '8025550199',
          address: '10 Test Street',
          commercialPaymentTerms: 'Net 15',
          commercialFulfillmentMethods: 'Pickup',
          commercialTermsUpdatedAt: new Date(),
        },
      },
    },
    include: { grower: true },
  });
  growerId = user.grower!.id;
  const customer = await db.dispensary.create({
    data: {
      createdByGrowerId: growerId,
      businessName: 'UX Phone Customer',
      isOffPlatform: true,
      phone: '8025550188',
    },
  });
  customerId = customer.id;
  const item = await db.product.create({
    data: {
      growerId,
      name: 'UX Flower',
      price: 1200,
      inventoryQty: 100,
      unit: 'Lb',
      productType: 'Flower',
      images: [],
      status: 'PUBLISHED',
      isAvailable: true,
    },
  });
  productId = item.id;
  const second = await db.product.create({
    data: {
      growerId,
      name: 'UX Cartridge',
      price: 20,
      inventoryQty: 100,
      unit: 'Unit',
      productType: 'Cartridge',
      images: [],
      status: 'PUBLISHED',
      isAvailable: true,
    },
  });
  secondProductId = second.id;
});
test.afterAll(async () => {
  await db.order.deleteMany({ where: { growerId } });
  await db.acceptedQuote.deleteMany({ where: { growerId } });
  await db.conversation.deleteMany({ where: { growerId } });
  await db.product.deleteMany({ where: { growerId } });
  await db.dispensary.deleteMany({ where: { createdByGrowerId: growerId } });
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
});
async function login(page: Page) {
  if (sessionCookies) {
    await page.context().addCookies(sessionCookies);
    await page.goto('/grower/dashboard');
    return;
  }
  await page.goto(`/auth/sign_in?email=${encodeURIComponent(email)}`);
  await expect(page.locator('input[type=email]')).toHaveValue(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/grower\//);
  sessionCookies = await page.context().cookies();
}
async function capture(page: Page, name: string) {
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    ),
    `${name} overflow`
  ).toBe(true);
  await page.screenshot({
    path: `${screenshotDir}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}
async function create(page: Page, overrides: Record<string, unknown> = {}) {
  const r = await page.request.post('/api/orders', {
    data: {
      dispensaryId: customerId,
      items: [{ productId, quantity: 1 }],
      ...overrides,
    },
  });
  expect(r.status(), await r.text()).toBe(201);
  return r.json();
}
test('manual orders are accepted; status undo is single-use and preserves stock, reasons and actor', async ({
  page,
}) => {
  await login(page);
  const initial = (
    await db.product.findUniqueOrThrow({ where: { id: productId } })
  ).inventoryQty;
  const order = await create(page);
  expect(order.status).toBe('CONFIRMED');
  const change = await page.request.patch(`/api/orders/${order.id}/status`, {
    data: { status: 'PROCESSING', expectedStatus: 'CONFIRMED' },
  });
  expect(change.status(), await change.text()).toBe(200);
  const token = (await change.json()).undoEventId;
  expect(
    (
      await page.request.patch(`/api/orders/${order.id}/status`, {
        data: { undoEventId: token },
      })
    ).status()
  ).toBe(200);
  expect(
    (
      await page.request.patch(`/api/orders/${order.id}/status`, {
        data: { undoEventId: token },
      })
    ).status()
  ).toBe(409);
  expect(
    (
      await page.request.patch(`/api/orders/${order.id}/status`, {
        data: { status: 'CANCELLED' },
      })
    ).status()
  ).toBe(400);
  const cancel = await page.request.patch(`/api/orders/${order.id}/status`, {
    data: {
      status: 'CANCELLED',
      expectedStatus: 'CONFIRMED',
      reason: 'Buyer asked: delayed opening',
    },
  });
  expect(cancel.status(), await cancel.text()).toBe(200);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: productId } }))
      .inventoryQty
  ).toBe(initial);
  const event = await db.orderStatusEvent.findFirstOrThrow({
    where: { orderId: order.id, toStatus: 'CANCELLED' },
  });
  expect(event.note).toContain('Buyer asked');
  expect(
    (
      await page.request.patch(`/api/orders/${order.id}/status`, {
        data: { undoEventId: (await cancel.json()).undoEventId },
      })
    ).status()
  ).toBe(200);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: productId } }))
      .inventoryQty
  ).toBe(initial - 1);
  await page.goto(`/grower/orders/${order.id}`);
  await expect(
    page.getByRole('heading', { name: 'History', exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('UX Grower Tester', { exact: false }).first()
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Message', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Call', exact: true })
  ).toHaveAttribute('href', 'tel:8025550188');
});
test('explicit shortage correction is audited and concurrent ordinary orders never oversell', async ({
  page,
}) => {
  await login(page);
  const low = await db.product.create({
    data: {
      growerId,
      name: 'UX Low stock',
      price: 10,
      inventoryQty: 1,
      unit: 'Unit',
      productType: 'Cartridge',
      images: [],
      status: 'PUBLISHED',
      isAvailable: true,
    },
  });
  const payload = {
    dispensaryId: customerId,
    items: [
      {
        productId: low.id,
        quantity: 3,
        priceOverride: { unitPrice: 8, reason: '' },
      },
    ],
  };
  expect(
    (await page.request.post('/api/orders', { data: payload })).status()
  ).toBe(409);
  const corrected = await page.request.post('/api/orders', {
    data: { ...payload, adjustStock: true },
  });
  expect(corrected.status(), await corrected.text()).toBe(201);
  const order = await corrected.json();
  expect(Number(order.totalAmount)).toBe(24);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: low.id } })).inventoryQty
  ).toBe(0);
  expect(
    (
      await db.orderStatusEvent.findFirstOrThrow({
        where: { orderId: order.id },
      })
    ).note
  ).toContain('added 2');
  await db.product.update({
    where: { id: low.id },
    data: { inventoryQty: 1, isAvailable: true },
  });
  const concurrent = await Promise.all(
    [0, 1].map(() =>
      page.request.post('/api/orders', {
        data: {
          dispensaryId: customerId,
          items: [{ productId: low.id, quantity: 1 }],
        },
      })
    )
  );
  expect(concurrent.map((r) => r.status()).sort()).toEqual([201, 409]);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: low.id } })).inventoryQty
  ).toBe(0);
});
for (const width of [1440, 390])
  test(`manual order inline customer, editable quantities, saved detail and repeat at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    await page.goto('/grower/orders/add');
    await page
      .getByRole('button', { name: 'Record order', exact: true })
      .click();
    await expect(
      page.getByText('Choose a customer.', { exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: '+ New customer', exact: true })
      .click();
    await page
      .getByLabel('Business name', { exact: true })
      .fill(`UX Inline ${width}`);
    await page.getByLabel('Phone', { exact: true }).fill('8025550177');
    await page
      .getByRole('button', { name: 'Add customer', exact: true })
      .click();
    await expect(
      page.getByRole('combobox', { name: 'Customer', exact: true })
    ).toHaveValue(`UX Inline ${width}`);
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page
      .getByRole('searchbox', { name: 'Find product' })
      .fill('UX Flower');
    await page
      .getByRole('button', { name: /UX Flower.*available|UX Flower.*\$/ })
      .click();
    await page.locator('#order-quantity-0').fill('2');
    await expect(
      page.getByText('Choose a customer.', { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByText('Add at least one product.', { exact: true })
    ).toHaveCount(0);
    await page.locator('#order-price-0').fill('');
    await expect(page.locator('#order-price-0')).toHaveValue('');
    await page.locator('#order-price-0').fill('$1,050.00');
    await page
      .getByRole('combobox', { name: 'Fulfillment', exact: true })
      .selectOption('Delivery');
    await page
      .getByLabel('Delivery address', { exact: true })
      .fill('12 Buyer Lane, VT');
    await page
      .getByRole('combobox', { name: 'Payment terms', exact: true })
      .selectOption('Net 30');
    await capture(page, `manual-${width}`);
    await page
      .getByRole('button', { name: 'Record order', exact: true })
      .click();
    await page.waitForURL(/\/grower\/orders\/c[a-z0-9]+$/);
    const id = page.url().split('/').pop()!;
    expect(
      Number((await db.order.findUniqueOrThrow({ where: { id } })).totalAmount)
    ).toBe(2100);
    await expect(
      page.getByText('12 Buyer Lane, VT', { exact: true })
    ).toBeVisible();
    await capture(page, `detail-${width}`);
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.locator('#order-quantity-0').fill('3');
    await page.locator('#order-price-0').fill('1000');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page
      .getByRole('searchbox', { name: 'Find product' })
      .fill('UX Cartridge');
    await page.getByRole('button', { name: /UX Cartridge.*\$/ }).click();
    await page.getByRole('button', { name: 'Save order', exact: true }).click();
    await page.waitForURL(`/grower/orders/${id}`);
    expect(
      await db.orderItem.findMany({ where: { orderId: id } })
    ).toHaveLength(2);
    await page.goto(`/grower/orders/add?from=${id}`);
    const repeatedFlower = page.locator('article').filter({
      has: page.getByRole('heading', { name: 'UX Flower', exact: true }),
    });
    await expect(
      repeatedFlower.locator('input[inputmode=numeric]')
    ).toHaveValue('3');
    await expect(
      repeatedFlower.locator('input[inputmode=decimal]')
    ).toHaveValue('1000');
    await capture(page, `repeat-${width}`);
  });
test('customer ZIP and phone-only contact round-trip, cross-grower denial, report exports all delivered lines', async ({
  page,
}) => {
  await login(page);
  const added = await page.request.post('/api/customers', {
    data: {
      businessName: 'UX ZIP Contact',
      phone: '8025550111',
      zipCode: '08055',
      state: 'NJ',
    },
  });
  expect(added.status(), await added.text()).toBe(201);
  expect((await added.json()).zip).toBe('08055');
  const foreign = await db.dispensary.create({
    data: {
      businessName: `${prefix}-foreign`,
      isOffPlatform: true,
      phone: '8025550112',
    },
  });
  try {
    expect(
      (await page.request.get(`/api/customers/${foreign.id}`)).status()
    ).toBe(404);
    expect(
      (
        await page.request.put(`/api/customers/${foreign.id}`, {
          data: { businessName: 'No' },
        })
      ).status()
    ).toBe(403);
  } finally {
    await db.dispensary.delete({ where: { id: foreign.id } });
  }
  for (let i = 0; i < 12; i++) {
    await db.order.create({
      data: {
        growerId,
        dispensaryId: customerId,
        orderId: `${prefix}-report-${i}`,
        status: 'DELIVERED',
        createdAt: new Date('2025-01-01'),
        deliveredAt: new Date(),
        totalAmount: 20,
        subtotal: 20,
        notes: 'Settlement recorded: paid by check',
        items: {
          create: {
            growerId,
            productId: secondProductId,
            quantity: 1,
            unitPrice: 20,
            totalPrice: 20,
          },
        },
      },
    });
  }
  const exported = await page.request.get(
    '/api/orders/export?report=true&range=30d'
  );
  expect(exported.status(), await exported.text()).toBe(200);
  const csv = await exported.text();
  for (let i = 0; i < 12; i++) expect(csv).toContain(`${prefix}-report-${i}`);
  expect(csv).toContain('Settlement recorded: paid by check');
  expect(csv).not.toContain('Settled directly between');
  await page.goto('/grower/reports?range=30d');
  const pdfReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  const pdf = await pdfReady;
  const path = `${screenshotDir}/full-grower-report.pdf`;
  await pdf.saveAs(path);
  const pdfText = readFileSync(path, 'utf8');
  for (let i = 0; i < 12; i++)
    expect(pdfText).toContain(`${prefix}-report-${i}`);
  await page.getByRole('link', { name: 'Last 90 days', exact: true }).click();
  await expect(page).toHaveURL(/range=90d/);
});
test('order counts cover all pages; bulk updates undo and cancellations preserve reasons', async ({
  page,
}) => {
  await login(page);
  await db.order.createMany({
    data: Array.from({ length: 52 }, (_, index) => ({
      growerId,
      dispensaryId: customerId,
      orderId: `${prefix}-bulk-${index}`,
      status: 'PENDING' as const,
      totalAmount: 0,
      subtotal: 0,
    })),
  });
  await page.goto('/grower/orders?view=needs-review');
  await expect(
    page
      .getByRole('navigation', { name: 'Order status' })
      .getByRole('link', { name: /^New\s+52$/ })
  ).toBeVisible();
  await expect(page.locator('article')).toHaveCount(50);
  await page.goto('/grower/orders?status=PENDING&page=2');
  await expect(page.locator('article')).toHaveCount(2);
  await page.getByLabel('Select this page', { exact: true }).check();
  await page
    .getByRole('button', { name: 'Update selected', exact: true })
    .click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(() =>
      db.order.count({
        where: {
          growerId,
          orderId: { startsWith: `${prefix}-bulk-` },
          status: 'PENDING',
        },
      })
    )
    .toBe(52);
  await page.goto('/grower/orders?status=PENDING&page=2');
  await page.getByLabel('Select this page', { exact: true }).check();
  await page.locator('#bulk-status').selectOption('CANCELLED');
  await page.locator('#bulk-reason').selectOption('Buyer asked');
  await page
    .getByRole('button', { name: 'Confirm cancellation', exact: true })
    .click();
  await expect
    .poll(() =>
      db.orderStatusEvent.count({
        where: {
          order: { growerId, orderId: { startsWith: `${prefix}-bulk-` } },
          toStatus: 'CANCELLED',
          note: 'Buyer asked',
        },
      })
    )
    .toBe(2);
  await page.goto('/grower/orders?view=needs-review');
  await page.getByRole('searchbox').fill('no-matching-buyer');
  await expect(page).toHaveURL(/q=no-matching-buyer/);
  await expect(
    page.getByRole('heading', { name: 'No matching orders', exact: true })
  ).toBeVisible();
});
for (const width of [1440, 390])
  test(`grower pages, license warning and atomic profile/terms save at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    for (const [name, url] of [
      ['dashboard', '/grower/dashboard'],
      ['orders', '/grower/orders?view=needs-review'],
      ['history', '/grower/orders/history'],
      ['customers', '/grower/customers'],
      ['customer', `/grower/customers/${customerId}`],
      ['statement', `/grower/customers/${customerId}/statement`],
      ['reports', '/grower/reports?range=30d'],
      ['pricing', '/grower/pricing'],
    ] as const) {
      await page.goto(url);
      await capture(page, `${name}-${width}`);
    }
    await db.grower.update({
      where: { id: growerId },
      data: { licenseExpiry: new Date('2020-01-01') },
    });
    await page.goto('/grower/settings#profile');
    await page
      .getByLabel('Business name', { exact: true })
      .fill(`UX Saved Grower ${width}`);
    await page
      .getByRole('combobox', { name: 'Payment terms', exact: true })
      .selectOption('Net 30');
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(
      page.getByText('Changes saved', { exact: true })
    ).toBeVisible();
    const saved = await db.grower.findUniqueOrThrow({
      where: { id: growerId },
    });
    expect(saved.businessName).toBe(`UX Saved Grower ${width}`);
    expect(saved.commercialPaymentTerms).toBe('Net 30');
    await page
      .getByLabel('License number', { exact: true })
      .fill(`NEW-TEST-${width}`);
    await expect(
      page.getByText(
        'Saving pauses your listings until the new license is verified.'
      )
    ).toBeVisible();
    await page
      .getByLabel('Expiration date', { exact: true })
      .fill('2030-12-31');
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(
      page.getByText('Submitted — under review', { exact: true })
    ).toBeVisible();
    await capture(page, `settings-${width}`);
  });

test('quoted manual orders consume the scoped agreed price once; intervening edits prevent status undo', async ({
  page,
}) => {
  await login(page);
  const buyer = await db.user.create({
    data: {
      email: `${prefix}-quote@example.test`,
      name: 'UX Quote Buyer',
      role: 'DISPENSARY',
      emailVerifiedAt: new Date(),
      passwordHash: await bcrypt.hash(password, 10),
      dispensary: {
        create: {
          businessName: 'UX Quote Buyer',
          licenseNumber: 'TEST-QUOTE',
          licenseExpiry: new Date('2030-12-31'),
          licenseStatus: 'verified',
          isVerified: true,
        },
      },
    },
    include: { dispensary: true },
  });
  const conversation = await db.conversation.create({
    data: {
      growerId,
      dispensaryId: buyer.dispensary!.id,
      productId: secondProductId,
    },
  });
  const message = await db.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      senderUserId: buyer.id,
      messageType: 'OFFER',
      body: 'Test agreed price',
      productId: secondProductId,
      offerQuantity: 2,
      offerUnitPrice: 15,
      offerStatus: 'ACCEPTED',
    },
  });
  const quote = await db.acceptedQuote.create({
    data: {
      conversationId: conversation.id,
      messageId: message.id,
      growerId,
      dispensaryId: buyer.dispensary!.id,
      productId: secondProductId,
      quantity: 2,
      unitPrice: 15,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  const payload = {
    dispensaryId: buyer.dispensary!.id,
    quoteId: quote.id,
    items: Array.from({ length: 2 }, () => ({
      productId: secondProductId,
      quantity: 1,
      priceOverride: { unitPrice: 1, reason: 'Wrong browser price' },
    })),
  };
  const r = await page.request.post('/api/orders', { data: payload });
  expect(r.status(), await r.text()).toBe(201);
  const order = await r.json();
  expect(Number(order.totalAmount)).toBe(30);
  expect(order.items[0].acceptedQuoteId).toBe(quote.id);
  expect(
    (await page.request.post('/api/orders', { data: payload })).status()
  ).toBe(400);
  const repriced = await page.request.put(`/api/orders/${order.id}`, {
    data: {
      items: [
        {
          id: order.items[0].id,
          productId: secondProductId,
          quantity: 2,
          unitPrice: 1,
        },
      ],
    },
  });
  expect(repriced.status()).toBe(409);
  const tooLarge = await page.request.put(`/api/orders/${order.id}`, {
    data: {
      items: order.items.map((item: { id: string; productId: string }) => ({
        id: item.id,
        productId: item.productId,
        quantity: 2,
        unitPrice: 15,
      })),
    },
  });
  expect(tooLarge.status(), await tooLarge.text()).toBe(409);
  expect(
    await db.orderItem.aggregate({
      where: { orderId: order.id },
      _sum: { quantity: true },
    })
  ).toMatchObject({ _sum: { quantity: 2 } });
  const move = await page.request.patch(`/api/orders/${order.id}/status`, {
    data: { status: 'PROCESSING', expectedStatus: 'CONFIRMED' },
  });
  expect(move.status()).toBe(200);
  expect(
    (
      await page.request.put(`/api/orders/${order.id}`, {
        data: { notes: 'A newer saved agreement' },
      })
    ).status()
  ).toBe(200);
  expect(
    (
      await page.request.patch(`/api/orders/${order.id}/status`, {
        data: { undoEventId: (await move.json()).undoEventId },
      })
    ).status()
  ).toBe(409);
});

test('plan lookup failure retries without claiming Free; checkout confirmation waits for active status', async ({
  page,
}) => {
  await login(page);
  let fail = true;
  await page.route('**/api/grower/subscription', (route) =>
    route.fulfill({
      status: fail ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        fail
          ? { error: 'Unavailable' }
          : {
              plan: 'pro',
              status: 'trialing',
              currentPeriodEnd: '2030-10-01T00:00:00.000Z',
              cancelAtPeriodEnd: false,
              checkoutConfigured: false,
              proCheckoutConfigured: false,
              businessCheckoutConfigured: false,
              portalAvailable: false,
            }
      ),
    })
  );
  await page.goto('/grower/pricing');
  await expect(
    page.getByText('Could not load your plan.', { exact: false })
  ).toBeVisible();
  await expect(page.getByText('Current plan:', { exact: false })).toHaveCount(
    0
  );
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Current plan:', { exact: false })).toBeVisible();
  await page.goto('/grower/settings?subscription=success#subscription');
  await expect(
    page.getByText('Your plan is active.', { exact: true })
  ).toBeVisible();
  await expect(page.getByText(/Trial — ends/)).toBeVisible();
});

test('opposing order edits lock stock consistently and preserve both accepted deductions', async ({
  page,
}) => {
  await login(page);
  const stockBefore = new Map(
    (
      await db.product.findMany({
        where: { id: { in: [productId, secondProductId] } },
        select: { id: true, inventoryQty: true },
      })
    ).map((product) => [product.id, product.inventoryQty])
  );
  const items = [productId, secondProductId].map((id) => ({
    productId: id,
    quantity: 1,
  }));
  const first = await create(page, { items });
  const second = await create(page, { items: [...items].reverse() });
  for (let quantity = 2; quantity <= 6; quantity++) {
    const responses = await Promise.all(
      [first, second].map((order, index) =>
        page.request.put(`/api/orders/${order.id}`, {
          data: {
            items: [...order.items]
              .sort((a: { productId: string }, b: { productId: string }) =>
                index
                  ? b.productId.localeCompare(a.productId)
                  : a.productId.localeCompare(b.productId)
              )
              .map((item: { id: string; productId: string }) => ({
                id: item.id,
                productId: item.productId,
                quantity,
              })),
          },
        })
      )
    );
    for (const response of responses)
      expect(response.status(), await response.text()).toBe(200);
  }
  for (const product of await db.product.findMany({
    where: { id: { in: [productId, secondProductId] } },
  }))
    expect(product.inventoryQty).toBe(stockBefore.get(product.id)! - 12);
  expect(
    (
      await db.orderItem.findMany({
        where: { orderId: { in: [first.id, second.id] } },
      })
    ).every((item) => item.quantity === 6)
  ).toBe(true);
});
