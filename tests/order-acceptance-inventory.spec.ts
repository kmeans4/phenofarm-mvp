import {
  test,
  expect,
  request as apiRequest,
  type APIRequestContext,
} from '@playwright/test';
import {
  PrismaClient,
  type OrderStatus,
  type OrderInventoryState,
} from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CURRENT_POLICIES } from '../lib/policies/current';
import {
  beginOrderMutation,
  reconcileLegacyOrder,
} from '../lib/order-mutations';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const database = new URL(process.env.DATABASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) ||
  database.hostname !== 'localhost' ||
  !database.pathname.startsWith('/phenofarm_auth_')
)
  throw new Error(
    'Inventory lifecycle tests require an isolated local phenofarm_auth_ database and local app.'
  );
const db = new PrismaClient();
const prefix = `acceptance-${Date.now()}`;
test.describe.configure({ mode: 'default' });
test.use({ trace: 'off', video: 'off' });
test.setTimeout(60000);
let grower: Awaited<ReturnType<typeof account>>;
let buyer: Awaited<ReturnType<typeof account>>;
let other: Awaited<ReturnType<typeof account>>;
let seller: APIRequestContext,
  customer: APIRequestContext,
  competitor: APIRequestContext;

async function account(role: 'GROWER' | 'DISPENSARY') {
  return db.user.create({
    data: {
      email: `${prefix}-${randomUUID()}@example.test`,
      role,
      name: 'Inventory lifecycle QA',
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      ...(role === 'GROWER'
        ? {
            grower: {
              create: {
                businessName: 'Inventory QA Grower',
                licenseNumber: 'TEST-ONLY',
                licenseStatus: 'verified',
                isVerified: true,
                licenseExpiry: new Date('2030-12-31'),
              },
            },
          }
        : {
            dispensary: {
              create: {
                businessName: 'Inventory QA Buyer',
                licenseNumber: 'TEST-ONLY',
                licenseStatus: 'verified',
                isVerified: true,
                licenseExpiry: new Date('2030-12-31'),
              },
            },
          }),
    },
    include: { grower: true, dispensary: true },
  });
}
async function token(user: Awaited<ReturnType<typeof account>>) {
  return encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      sub: user.id,
      id: user.id,
      role: user.role,
      email: user.email,
      sessionVersion: user.sessionVersion,
      growerId: user.grower?.id,
      dispensaryId: user.dispensary?.id,
    },
  });
}
async function api(user: Awaited<ReturnType<typeof account>>) {
  const context = await apiRequest.newContext({
    baseURL,
    extraHTTPHeaders: {
      cookie: `next-auth.session-token=${await token(user)}`,
    },
  });
  expect((await (await context.get('/api/auth/session')).json()).user.id).toBe(
    user.id
  );
  return context;
}
test.beforeAll(async () => {
  grower = await account('GROWER');
  buyer = await account('DISPENSARY');
  other = await account('DISPENSARY');
  seller = await api(grower);
  customer = await api(buyer);
  competitor = await api(other);
});
test.afterAll(async () => {
  for (const context of [seller, customer, competitor])
    await context?.dispose();
  if (grower) {
    await db.order.deleteMany({ where: { growerId: grower.grower!.id } });
    await db.product.deleteMany({ where: { growerId: grower.grower!.id } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
});
async function product(stock = 10) {
  return db.product.create({
    data: {
      growerId: grower.grower!.id,
      name: `Inventory QA ${randomUUID().slice(0, 5)}`,
      productType: 'Flower',
      unit: 'Gram',
      price: 10,
      inventoryQty: stock,
      status: 'PUBLISHED',
      isAvailable: stock > 0,
      isPriceVisible: true,
      images: [],
    },
  });
}
type Product = Awaited<ReturnType<typeof product>>;
const item = (p: Product, quantity: number) => ({
  id: p.id,
  growerId: p.growerId,
  quantity,
  price: 10,
});
async function submit(items: ReturnType<typeof item>[], client = customer) {
  const response = await client.post('/api/checkout', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: { items },
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body.orders).toHaveLength(1);
  return order(body.orders[0].id);
}
const order = (id: string) =>
  db.order.findUniqueOrThrow({
    where: { id },
    include: { items: true, statusEvents: true },
  });
const stock = async (p: Product) =>
  (await db.product.findUniqueOrThrow({ where: { id: p.id } })).inventoryQty;
const change = (id: string, status: OrderStatus, client = seller) =>
  client.patch(`/api/orders/${id}/status`, {
    data: {
      status,
      ...(status === 'CANCELLED' ? { reason: 'QA cancellation' } : {}),
    },
  });
async function accept(id: string) {
  const r = await change(id, 'CONFIRMED');
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}
const edit = (
  id: string,
  items: {
    id?: string;
    productId?: string;
    quantity: number;
    unitPrice?: number;
  }[]
) => seller.put(`/api/orders/${id}`, { data: { items } });
const batch = (ids: string[], status: OrderStatus) =>
  seller.patch('/api/orders/batch-status', { data: { orderIds: ids, status } });

test('competing dispensaries can request the same stock; submission retries create one request without deductions', async () => {
  const p = await product(6);
  const key = randomUUID(),
    data = { items: [item(p, 6)] };
  const responses = await Promise.all(
    Array.from({ length: 6 }, () =>
      customer.post('/api/checkout', {
        data,
        headers: { 'Idempotency-Key': key },
      })
    )
  );
  for (const r of responses) expect(r.status(), await r.text()).toBe(200);
  const bodies = await Promise.all(responses.map((r) => r.json()));
  expect(new Set(bodies.map((b) => b.orders[0].id)).size).toBe(1);
  const second = await submit([item(p, 6)], competitor);
  expect(second).toMatchObject({
    status: 'PENDING',
    inventoryState: 'NOT_DEDUCTED',
  });
  expect(await stock(p)).toBe(6);
  expect(await db.orderItem.count({ where: { productId: p.id } })).toBe(2);
});

test('simultaneous acceptances cannot oversell competing requests', async () => {
  const p = await product();
  const first = await submit([item(p, 8)]),
    second = await submit([item(p, 8)], competitor);
  const responses = await Promise.all([
    change(first.id, 'CONFIRMED'),
    change(second.id, 'CONFIRMED'),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  const loser = responses[0].status() === 409 ? first : second;
  const failure = await responses.find((r) => r.status() === 409)!.json();
  expect(failure.code).toBe('INSUFFICIENT_INVENTORY');
  expect(failure.error).toContain('No changes were saved');
  expect(await order(loser.id)).toMatchObject({
    status: 'PENDING',
    inventoryState: 'NOT_DEDUCTED',
    updatedAt: loser.updatedAt,
  });
  expect(await stock(p)).toBe(2);
});

test('simultaneous and repeated acceptance/cancellation deduct and restore exactly once', async () => {
  const p = await product();
  const o = await submit([item(p, 7)]);
  const results = await Promise.all(
    Array.from({ length: 8 }, () => change(o.id, 'CONFIRMED'))
  );
  for (const result of results) expect([200, 409]).toContain(result.status());
  await accept(o.id);
  expect(await stock(p)).toBe(3);
  expect(
    (await order(o.id)).statusEvents.filter((e) => e.toStatus === 'CONFIRMED')
  ).toHaveLength(1);
  const cancels = await Promise.all(
    Array.from({ length: 8 }, () => change(o.id, 'CANCELLED'))
  );
  for (const result of cancels) expect([200, 409]).toContain(result.status());
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await order(o.id)).toMatchObject({
    status: 'CANCELLED',
    inventoryState: 'NOT_DEDUCTED',
  });
});

test('insufficient stock rolls back all items, status, version and events', async () => {
  const products = (await Promise.all([product(5), product(5)])).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const o = await submit(products.map((p) => item(p, 3)));
  await db.product.update({
    where: { id: products[1].id },
    data: { inventoryQty: 1 },
  });
  const response = await change(o.id, 'CONFIRMED');
  expect(response.status()).toBe(409);
  expect((await response.json()).issues[0]).toMatchObject({
    productId: products[1].id,
    available: 1,
    requested: 3,
  });
  expect(await Promise.all(products.map(stock))).toEqual([5, 1]);
  expect(await order(o.id)).toEqual(o);
});

test('negotiated quantities and prices only affect stock on acceptance; pending edits can exceed current stock', async () => {
  const p = await product(10),
    extra = await product(4);
  const o = await submit([item(p, 4)]);
  expect(
    (
      await edit(o.id, [
        { id: o.items[0].id, quantity: 12, unitPrice: 6 },
        { productId: extra.id, quantity: 2, unitPrice: 8 },
      ])
    ).status()
  ).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await stock(extra)).toBe(4);
  expect((await change(o.id, 'CONFIRMED')).status()).toBe(409);
  const edited = await order(o.id);
  expect(
    (
      await edit(
        o.id,
        edited.items.map((i) => ({
          id: i.id,
          quantity: i.productId === p.id ? 7 : 2,
        }))
      )
    ).status()
  ).toBe(200);
  expect(await stock(p)).toBe(10);
  await accept(o.id);
  expect(await stock(p)).toBe(3);
  expect(await stock(extra)).toBe(2);
  expect(Number((await order(o.id)).subtotal)).toBe(58);
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await stock(extra)).toBe(4);
});

test('pending line removal, decline and buyer withdrawal never restore unconsumed stock', async () => {
  const p = await product(),
    q = await product();
  const o = await submit([item(p, 3), item(q, 4)]);
  expect(
    (
      await edit(o.id, [
        { id: o.items.find((i) => i.productId === q.id)!.id, quantity: 2 },
      ])
    ).status()
  ).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await stock(q)).toBe(10);
  expect((await change(o.id, 'CANCELLED', customer)).status()).toBe(200);
  const declined = await submit([item(p, 3)]);
  expect((await seller.delete(`/api/orders/${declined.id}`)).status()).toBe(
    200
  );
  expect((await seller.delete(`/api/orders/${declined.id}`)).status()).toBe(
    200
  );
  expect(await stock(p)).toBe(10);
  expect(await stock(q)).toBe(10);
});

test('accepted edits deduct only deltas, aggregate split lines and restore exactly the final quantities', async () => {
  const p = await product(),
    q = await product(6);
  const o = await submit([item(p, 4)]);
  await accept(o.id);
  let response = await edit(o.id, [
    { id: o.items[0].id, quantity: 3 },
    { productId: p.id, quantity: 2 },
    { productId: q.id, quantity: 2 },
  ]);
  expect(response.status(), await response.text()).toBe(200);
  expect(await stock(p)).toBe(5);
  expect(await stock(q)).toBe(4);
  const current = await order(o.id);
  response = await edit(
    o.id,
    current.items.map((i) => ({
      id: i.id,
      quantity: i.productId === q.id ? 10 : i.quantity,
    }))
  );
  expect(response.status()).toBe(409);
  expect(await order(o.id)).toEqual(current);
  response = await edit(
    o.id,
    current.items
      .filter((i) => i.productId === q.id)
      .map((i) => ({ id: i.id, quantity: 3 }))
  );
  expect(response.status()).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await stock(q)).toBe(3);
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
  expect(await stock(q)).toBe(6);
});

test('batch acceptance is atomic across competing requests and repeated batches do not deduct twice', async () => {
  const p = await product();
  const a = await submit([item(p, 7)]),
    b = await submit([item(p, 7)], competitor);
  const failed = await batch([b.id, a.id], 'CONFIRMED');
  expect(failed.status()).toBe(409);
  expect(await stock(p)).toBe(10);
  expect(await order(a.id)).toEqual(a);
  expect(await order(b.id)).toEqual(b);
  expect(
    (await edit(b.id, [{ id: b.items[0].id, quantity: 3 }])).status()
  ).toBe(200);
  expect((await batch([b.id, a.id], 'CONFIRMED')).status()).toBe(200);
  expect(await stock(p)).toBe(0);
  expect((await batch([a.id, b.id], 'CONFIRMED')).status()).toBe(200);
  expect(await stock(p)).toBe(0);
  expect((await batch([a.id, b.id], 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
});

test('mixed pending and accepted batch cancellation restores only accepted deductions', async () => {
  const p = await product();
  const a = await submit([item(p, 3)]),
    b = await submit([item(p, 4)]);
  await accept(a.id);
  expect(await stock(p)).toBe(7);
  expect((await batch([a.id, b.id], 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
  expect((await batch([a.id, b.id], 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
});

test('undo acceptance releases stock; undo pending cancellation does not deduct; undo accepted cancellation rechecks stock', async () => {
  const p = await product(5),
    o = await submit([item(p, 5)]);
  const accepted = await accept(o.id);
  let response = await seller.patch(`/api/orders/${o.id}/status`, {
    data: { undoEventId: accepted.undoEventId },
  });
  expect(response.status(), await response.text()).toBe(200);
  expect(await stock(p)).toBe(5);
  expect(await order(o.id)).toMatchObject({
    status: 'PENDING',
    inventoryState: 'NOT_DEDUCTED',
  });
  expect(
    (
      await seller.patch(`/api/orders/${o.id}/status`, {
        data: { undoEventId: accepted.undoEventId },
      })
    ).status()
  ).toBe(409);
  const cancelled = await (await change(o.id, 'CANCELLED')).json();
  response = await seller.patch(`/api/orders/${o.id}/status`, {
    data: { undoEventId: cancelled.undoEventId },
  });
  expect(response.status()).toBe(200);
  expect(await stock(p)).toBe(5);
  await accept(o.id);
  const secondCancel = await (await change(o.id, 'CANCELLED')).json();
  const competing = await submit([item(p, 5)], competitor);
  await accept(competing.id);
  const snapshot = await order(o.id);
  response = await seller.patch(`/api/orders/${o.id}/status`, {
    data: { undoEventId: secondCancel.undoEventId },
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).code).toBe('INSUFFICIENT_INVENTORY');
  expect(await stock(p)).toBe(0);
  expect(await order(o.id)).toEqual(snapshot);
});

test('acceptance racing a negotiated edit uses one coherent final quantity and price', async () => {
  const p = await product(),
    o = await submit([item(p, 4)]);
  const results = await Promise.all([
    change(o.id, 'CONFIRMED'),
    edit(o.id, [{ id: o.items[0].id, quantity: 6, unitPrice: 7 }]),
  ]);
  for (const r of results) expect([200, 409]).toContain(r.status());
  const current = await order(o.id);
  if (current.status === 'PENDING') await accept(o.id);
  const final = await order(o.id);
  expect(await stock(p)).toBe(10 - final.items[0].quantity);
  expect(Number(final.subtotal)).toBe(
    final.items[0].quantity * Number(final.items[0].unitPrice)
  );
  const race = await Promise.all([
    change(o.id, 'CANCELLED'),
    edit(o.id, [{ id: final.items[0].id, quantity: 8 }]),
  ]);
  for (const r of race) expect([200, 409]).toContain(r.status());
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
});

async function legacy(
  p: Product,
  status: OrderStatus = 'PENDING',
  inventoryState?: OrderInventoryState
) {
  return db.order.create({
    data: {
      growerId: grower.grower!.id,
      dispensaryId: buyer.dispensary!.id,
      orderId: `LEGACY-${randomUUID()}`,
      status,
      ...(inventoryState ? { inventoryState } : {}),
      subtotal: 60,
      totalAmount: 60,
      items: {
        create: {
          growerId: grower.grower!.id,
          productId: p.id,
          quantity: 6,
          unitPrice: 10,
          totalPrice: 60,
        },
      },
    },
    include: { items: true },
  });
}
test('legacy pending deductions require review, are released once, and cannot double-deduct or over-restore', async () => {
  const p = await product(4),
    o = await legacy(p);
  expect(o.inventoryState).toBe('LEGACY_UNREVIEWED');
  for (const response of [
    await change(o.id, 'CONFIRMED'),
    await change(o.id, 'CANCELLED'),
    await seller.delete(`/api/orders/${o.id}`),
    await edit(o.id, [{ id: o.items[0].id, quantity: 3 }]),
    await batch([o.id], 'CONFIRMED'),
  ]) {
    expect(response.status()).toBe(409);
    expect((await response.json()).code).toBe(
      'LEGACY_INVENTORY_REVIEW_REQUIRED'
    );
  }
  expect(await stock(p)).toBe(4);
  const review = {
    id: o.id,
    expectedUpdatedAt: o.updatedAt.toISOString(),
    stockWasDeducted: true,
  };
  await expect(
    db.$transaction((tx) =>
      reconcileLegacyOrder(tx, {
        ...review,
        expectedUpdatedAt: new Date(0).toISOString(),
      })
    )
  ).rejects.toThrow();
  await db.$transaction((tx) => reconcileLegacyOrder(tx, review));
  expect(await stock(p)).toBe(10);
  await expect(
    db.$transaction((tx) => reconcileLegacyOrder(tx, review))
  ).rejects.toThrow();
  expect(await stock(p)).toBe(10);
  await accept(o.id);
  expect(await stock(p)).toBe(4);
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
});

test('legacy undeducted pending and already-deducted accepted orders have distinct safe reconciliation', async () => {
  const p = await product(10),
    o = await legacy(p);
  await db.$transaction((tx) =>
    reconcileLegacyOrder(tx, {
      id: o.id,
      expectedUpdatedAt: o.updatedAt.toISOString(),
      stockWasDeducted: false,
    })
  );
  expect(await stock(p)).toBe(10);
  expect((await change(o.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(p)).toBe(10);
  const q = await product(4),
    confirmed = await legacy(q, 'CONFIRMED');
  await expect(
    db.$transaction((tx) =>
      reconcileLegacyOrder(tx, {
        id: confirmed.id,
        expectedUpdatedAt: confirmed.updatedAt.toISOString(),
        stockWasDeducted: false,
      })
    )
  ).rejects.toThrow('separate stock reconciliation');
  await db.$transaction((tx) =>
    reconcileLegacyOrder(tx, {
      id: confirmed.id,
      expectedUpdatedAt: confirmed.updatedAt.toISOString(),
      stockWasDeducted: true,
    })
  );
  expect(await stock(q)).toBe(4);
  await accept(confirmed.id);
  expect(await stock(q)).toBe(4);
  expect((await change(confirmed.id, 'CANCELLED')).status()).toBe(200);
  expect(await stock(q)).toBe(10);
});

test('legacy rehearsal CLI is dry-run by default, auditable, single-use and refuses remote databases', async () => {
  const p = await product(4),
    o = await legacy(p);
  const folder = mkdtempSync(`${tmpdir()}/inventory-review-`);
  const manifest = `${folder}/review.json`;
  writeFileSync(
    manifest,
    JSON.stringify([
      {
        id: o.id,
        expectedUpdatedAt: o.updatedAt.toISOString(),
        stockWasDeducted: true,
      },
    ])
  );
  const run = promisify(execFile);
  const args = [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/reconcile-order-inventory.ts',
    manifest,
  ];
  try {
    expect((await run(process.execPath, args)).stdout).toContain(
      'Dry run only'
    );
    expect(await stock(p)).toBe(4);
    expect((await order(o.id)).inventoryState).toBe('LEGACY_UNREVIEWED');
    await expect(
      run(process.execPath, [...args, '--apply'], {
        env: {
          ...process.env,
          DATABASE_URL: 'postgresql://unused@remote.invalid/unused',
        },
      })
    ).rejects.toThrow('refuses non-local');
    expect(
      (await run(process.execPath, [...args, '--apply'])).stdout
    ).toContain('reconciled');
    expect(await stock(p)).toBe(10);
    expect((await order(o.id)).statusEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorRole: 'ADMIN',
          note: 'Legacy inventory review: outstanding deduction verified. Released pending quantities.',
        }),
      ])
    );
    await expect(run(process.execPath, [...args, '--apply'])).rejects.toThrow(
      'already applied'
    );
    expect(await stock(p)).toBe(10);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('direct grower-created orders are accepted and accounted immediately', async () => {
  const p = await product(5);
  const r = await seller.post('/api/orders', {
    data: {
      dispensaryId: buyer.dispensary!.id,
      items: [{ productId: p.id, quantity: 3 }],
    },
  });
  expect(r.status(), await r.text()).toBe(201);
  const o = await r.json();
  expect(o).toMatchObject({ status: 'CONFIRMED', inventoryState: 'DEDUCTED' });
  expect(await stock(p)).toBe(2);
  await accept(o.id);
  expect(await stock(p)).toBe(2);
  expect((await seller.delete(`/api/orders/${o.id}`)).status()).toBe(200);
  expect(await stock(p)).toBe(5);
});

for (const width of [1440, 390])
  test(`grower and buyer see request inventory wording and useful acceptance errors at ${width}px`, async ({
    page,
    context,
  }) => {
    const p = await product(5),
      o = await submit([item(p, 4)]);
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: await token(grower),
        url: baseURL,
      },
    ]);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/grower/orders/${o.id}/edit`);
    await expect(
      page
        .getByText('Saving this request does not reserve stock', {
          exact: false,
        })
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 15000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    mkdirSync('/tmp/phenoshop-inventory-screenshots', { recursive: true });
    await page.screenshot({
      path: `/tmp/phenoshop-inventory-screenshots/editor-${width}.png`,
      fullPage: true,
    });
    await page.locator('#order-quantity-0').filter({ visible: true }).fill('3');
    await page
      .getByLabel('Price / Gram', { exact: true })
      .filter({ visible: true })
      .fill('8.50');
    const saving = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/orders/${o.id}`) &&
        r.request().method() === 'PUT'
    );
    await page
      .getByRole('button', { name: 'Save request', exact: true })
      .filter({ visible: true })
      .click();
    expect((await saving).status()).toBe(200);
    expect(await stock(p)).toBe(5);
    expect((await order(o.id)).items[0].quantity).toBe(3);
    expect(Number((await order(o.id)).subtotal)).toBe(25.5);
    await db.product.update({ where: { id: p.id }, data: { inventoryQty: 1 } });
    await page.goto(`/grower/orders/${o.id}`);
    await page
      .getByRole('button', { name: /^Accept/ })
      .first()
      .click();
    await expect(
      page
        .getByText(/Not enough stock/)
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    expect((await order(o.id)).status).toBe('PENDING');
    expect(await stock(p)).toBe(1);
    await page.screenshot({
      path: `/tmp/phenoshop-inventory-screenshots/insufficient-${width}.png`,
      fullPage: true,
    });
    await db.product.update({ where: { id: p.id }, data: { inventoryQty: 5 } });
    await page
      .getByRole('button', { name: /^Accept/ })
      .filter({ visible: true })
      .first()
      .click();
    await expect.poll(async () => (await order(o.id)).status).toBe('CONFIRMED');
    expect(await stock(p)).toBe(2);
    const pending = await submit([item(p, 1)]);
    await context.clearCookies();
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: await token(buyer),
        url: baseURL,
      },
    ]);
    await page.goto(`/dispensary/orders/${pending.id}`);
    await expect(
      page
        .getByText('Pending request', { exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 15000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/phenoshop-inventory-screenshots/buyer-${width}.png`,
      fullPage: true,
    });
    const historical = await legacy(await product(4));
    await page.goto(`/dispensary/orders/${historical.id}`);
    await expect(
      page
        .getByText('This older order needs an inventory review.', {
          exact: false,
        })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    await context.clearCookies();
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: await token(grower),
        url: baseURL,
      },
    ]);
    await page.goto(`/grower/orders/${historical.id}/edit`);
    await expect(
      page
        .getByText('This older order needs an inventory review.', {
          exact: false,
        })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
  });

// Isolated local database only; install the production fence and remove it after this check.
test('cutover guard rejects old writers atomically while current creation, edit, batch, cancellation and review work', async () => {
  const p = await product(10),
    old = await legacy(p);
  const sql = readFileSync(
    'prisma/migrations/20260930121000_order_inventory_writer_guard/migration.sql',
    'utf8'
  );
  const functionSQL = sql.match(/CREATE FUNCTION[\s\S]*?\$\$;/)![0];
  try {
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(functionSQL);
      await tx.$executeRawUnsafe(
        'CREATE TRIGGER orders_inventory_writer_guard BEFORE INSERT OR UPDATE OR DELETE ON orders FOR EACH STATEMENT EXECUTE FUNCTION phenoshop_require_inventory_writer()'
      );
      await tx.$executeRawUnsafe(
        'CREATE TRIGGER order_items_inventory_writer_guard BEFORE INSERT OR UPDATE OR DELETE ON order_items FOR EACH STATEMENT EXECUTE FUNCTION phenoshop_require_inventory_writer()'
      );
    });
    await expect(
      db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: p.id },
          data: { inventoryQty: { increment: 6 } },
        });
        await tx.order.update({
          where: { id: old.id },
          data: { status: 'CANCELLED' },
        });
      })
    ).rejects.toThrow();
    expect(await stock(p)).toBe(10);
    await expect(
      db.orderItem.update({
        where: { id: old.items[0].id },
        data: { quantity: 2 },
      })
    ).rejects.toThrow();
    const first = await submit([item(p, 3)]);
    expect(
      (await edit(first.id, [{ id: first.items[0].id, quantity: 4 }])).status()
    ).toBe(200);
    expect((await batch([first.id], 'CONFIRMED')).status()).toBe(200);
    expect(await stock(p)).toBe(6);
    expect((await change(first.id, 'CANCELLED')).status()).toBe(200);
    expect(await stock(p)).toBe(10);
    const direct = await seller.post('/api/orders', {
      data: {
        dispensaryId: buyer.dispensary!.id,
        items: [{ productId: p.id, quantity: 2 }],
      },
    });
    expect(direct.status(), await direct.text()).toBe(201);
    expect(await stock(p)).toBe(8);
    expect(
      (await seller.delete(`/api/orders/${(await direct.json()).id}`)).status()
    ).toBe(200);
    await db.$transaction((tx) =>
      reconcileLegacyOrder(tx, {
        id: old.id,
        expectedUpdatedAt: old.updatedAt.toISOString(),
        stockWasDeducted: false,
      })
    );
    expect(await stock(p)).toBe(10);
    await db.$transaction(async (tx) => {
      await beginOrderMutation(tx);
      await tx.order.update({
        where: { id: old.id },
        data: { createdBy: 'GROWER' },
      });
    });
    expect(
      (await customer.patch(`/api/orders/${old.id}/acknowledge`)).status()
    ).toBe(200);
    // The marker must not leak beyond a transaction through pooled sessions.
    await expect(
      db.order.update({ where: { id: old.id }, data: { status: 'CONFIRMED' } })
    ).rejects.toThrow();
  } finally {
    await db.$executeRawUnsafe(
      'DROP TRIGGER IF EXISTS orders_inventory_writer_guard ON orders'
    );
    await db.$executeRawUnsafe(
      'DROP TRIGGER IF EXISTS order_items_inventory_writer_guard ON order_items'
    );
    await db.$executeRawUnsafe(
      'DROP FUNCTION IF EXISTS phenoshop_require_inventory_writer()'
    );
  }
});
