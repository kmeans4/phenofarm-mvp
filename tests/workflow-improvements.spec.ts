import { buildOrderRequestNotes } from '../lib/order-workflow';
import {
  test,
  expect,
  request,
  type Page,
  type APIRequestContext,
  type BrowserContext,
} from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';
import { beginOrderMutation } from '../lib/order-mutations';
import { plainData } from '../lib/serialize';
import { quantityPrice } from '../lib/quantity';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const database = new URL(process.env.DATABASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) ||
  database.hostname !== 'localhost' ||
  !database.pathname.startsWith('/phenofarm_auth_')
)
  throw Error('Requires an isolated local database and app.');
const db = new PrismaClient();
const prefix = `workflow-${Date.now()}`;
const shots = process.env.WORKFLOW_SCREENSHOTS || '.codex/tmp/workflow-improvements-2026-11-06/screenshots';
mkdirSync(shots, { recursive: true });
test.use({
  trace: 'off',
  video: 'off',
  actionTimeout: 15000,
  navigationTimeout: 30000,
});
test.setTimeout(180000);
async function account(role: 'GROWER' | 'DISPENSARY', active = true) {
  return db.user.create({
    data: {
      email: `${prefix}-${randomUUID()}@example.test`,
      name: 'Workflow QA',
      role,
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      ...(role === 'GROWER'
        ? {
            grower: {
              create: {
                businessName: `QA ${randomUUID().slice(0, 8)} Grower`,
                licenseNumber: 'TEST-ONLY',
                licenseStatus: 'verified',
                isVerified: true,
                licenseExpiry: new Date('2030-12-31'),
                subscriptionPlan: active ? 'seller' : 'free',
                subscriptionStatus: active ? 'active' : 'inactive',
              },
            },
          }
        : {
            dispensary: {
              create: {
                businessName: 'QA Workflow Buyer',
                licenseNumber: 'TEST-ONLY',
                isVerified: true,
                licenseStatus: 'verified',
                licenseExpiry: new Date('2030-12-31'),
              },
            },
          }),
    },
    include: { grower: true, dispensary: true },
  });
}
type Account = Awaited<ReturnType<typeof account>>;
async function token(user: Account) {
  return encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
      growerId: user.grower?.id,
      dispensaryId: user.dispensary?.id,
    },
  });
}
async function auth(context: BrowserContext, user: Account) {
  await context.addCookies([
    { name: 'next-auth.session-token', value: await token(user), url: baseURL },
  ]);
}
async function api(user: Account) {
  return request.newContext({
    baseURL,
    extraHTTPHeaders: {
      cookie: `next-auth.session-token=${await token(user)}`,
    },
  });
}
async function product(
  user: Account,
  stock = 3.125,
  name = `QA Stock ${randomUUID().slice(0, 5)}`,
  unit = 'Lb'
) {
  return db.product.create({
    data: {
      growerId: user.grower!.id,
      name,
      productType: 'Flower',
      unit,
      price: 30.15,
      inventoryQty: stock,
      status: 'PUBLISHED',
      isAvailable: true,
      isPriceVisible: true,
      images: [],
    },
  });
}
async function order(id: string) {
  return plainData(
    await db.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })
  );
}
async function stock(id: string) {
  return Number(
    (await db.product.findUniqueOrThrow({ where: { id } })).inventoryQty
  );
}
async function submit(
  client: APIRequestContext,
  products: { id: string; growerId: string }[],
  quantity = 0.125
) {
  const r = await client.post('/api/checkout', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: {
      items: products.map((p) => ({
        id: p.id,
        growerId: p.growerId,
        quantity,
        price: 30.15,
      })),
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  return (await r.json()).orders;
}
async function fit(page: Page, name: string, width: number) {
  await expect(page.locator('main')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    ),
    name
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/${width}-${name}.png`,
    fullPage: true,
  });
}
async function checkResponse(
  p: Promise<import('@playwright/test').APIResponse>,
  status = 200
) {
  const r = await p;
  expect(r.status(), await r.text()).toBe(status);
  return r.json();
}
let g: Account,
  b: Account,
  competitor: Account,
  s: APIRequestContext,
  c: APIRequestContext,
  other: APIRequestContext;
test.beforeAll(async () => {
  g = await account('GROWER');
  b = await account('DISPENSARY');
  competitor = await account('DISPENSARY');
  s = await api(g);
  c = await api(b);
  other = await api(competitor);
});
test.afterAll(async () => {
  await Promise.all([s, c, other].map((x) => x?.dispose()));
  await db.$transaction(async (tx) => {
    await beginOrderMutation(tx);
    await tx.order.deleteMany({
      where: { grower: { user: { email: { startsWith: prefix } } } },
    });
    await tx.product.deleteMany({
      where: { grower: { user: { email: { startsWith: prefix } } } },
    });
    await tx.user.deleteMany({ where: { email: { startsWith: prefix } } });
  });
  await db.$disconnect();
});

test('fractional competing requests, atomic negotiated acceptance, retries and restoration', async () => {
  const p = await product(g, 0.3),
    a = await submit(c, [p], 0.2),
    z = await submit(other, [p], 0.2);
  expect(await stock(p.id)).toBe(0.3);
  const responses = await Promise.all(
    [a[0], z[0]].map(async (x) => {
      const o = await order(x.id);
      return s.put(`/api/orders/${x.id}`, {
        data: {
          accept: true,
          expectedUpdatedAt: o.updatedAt.toISOString(),
          items: [{ id: o.items[0].id, quantity: 0.2, unitPrice: 10.05 }],
        },
      });
    })
  );
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  expect(await stock(p.id)).toBe(0.1);
  const accepted = (await order(a[0].id)).status === 'CONFIRMED' ? a[0] : z[0];
  const o = await order(accepted.id);
  expect(o.totalAmount).toBe(2.01);
  expect(
    (
      await s.put(`/api/orders/${o.id}`, {
        data: {
          accept: true,
          items: [{ id: o.items[0].id, quantity: 0.2, unitPrice: 10.05 }],
        },
      })
    ).status()
  ).toBe(409);
  expect(await stock(p.id)).toBe(0.1);
  await Promise.all(
    Array.from({ length: 4 }, () =>
      s.patch(`/api/orders/${o.id}/status`, {
        data: { status: 'CANCELLED', reason: 'QA' },
      })
    )
  );
  expect(await stock(p.id)).toBe(0.3);
});

test('multi-line acceptance rolls back negotiated edits and stock; stale edits cannot accept', async () => {
  const p = await product(g, 1),
    q = await product(g, 1);
  const [requestOrder] = await submit(c, [p, q], 0.5);
  const before = await order(requestOrder.id);
  await db.product.update({ where: { id: q.id }, data: { inventoryQty: 0.1 } });
  const body = {
    accept: true,
    expectedUpdatedAt: before.updatedAt.toISOString(),
    items: before.items.map((i) => ({
      id: i.id,
      quantity: 0.25,
      unitPrice: 8.5,
    })),
  };
  const failed = await s.put(`/api/orders/${before.id}`, { data: body });
  expect(failed.status()).toBe(409);
  expect((await failed.json()).code).toBe('INSUFFICIENT_INVENTORY');
  expect(await order(before.id)).toEqual(before);
  expect(await stock(p.id)).toBe(1);
  expect(await stock(q.id)).toBe(0.1);
  await checkResponse(
    s.put(`/api/orders/${before.id}`, {
      data: {
        items: before.items.map((i) => ({
          id: i.id,
          quantity: 0.1,
          unitPrice: 8.5,
        })),
      },
    })
  );
  expect(
    (await s.put(`/api/orders/${before.id}`, { data: body })).status()
  ).toBe(409);
});

test('count units reject fractions, selling units cannot change under orders, line totals agree', async () => {
  const p = await product(g, 10, 'QA Packs', 'Pack');
  const r = await c.post('/api/checkout', {
    headers: { 'Idempotency-Key': randomUUID() },
    data: {
      items: [{ id: p.id, growerId: p.growerId, quantity: 0.5, price: 30.15 }],
    },
  });
  expect(r.status()).toBe(409);
  expect(
    (
      await s.post('/api/inventory', {
        data: { productId: p.id, quantityAvailable: 0.5, expectedQuantity: 10 },
      })
    ).status()
  ).toBe(400);
  const q = await product(g);
  await submit(c, [q]);
  expect(
    (await s.put(`/api/products/${q.id}`, { data: { unit: 'Gram' } })).status()
  ).toBe(409);
  const bulk = await checkResponse(
    s.patch('/api/products/bulk-update', {
      data: { productIds: [q.id], updates: { unit: 'Pack' } },
    })
  );
  expect(bulk.updatedCount).toBe(0);
  expect(quantityPrice(0.5, 10.05)).toBe(5.03);
  const [o] = await submit(c, [q], 0.5);
  expect((await order(o.id)).totalAmount).toBe(quantityPrice(0.5, 30.15));
});

test('subscription expiration hides new commerce but preserves accepted orders and messages; billing disabled', async () => {
  const localGrower = await account('GROWER');
  const localSeller = await api(localGrower);
  try {
    const p = await product(localGrower);
    const [o] = await submit(c, [p]);
    await checkResponse(
      localSeller.patch(`/api/orders/${o.id}/status`, {
        data: { status: 'CONFIRMED' },
      })
    );
    await db.grower.update({
      where: { id: localGrower.grower!.id },
      data: { subscriptionCurrentPeriodEnd: new Date(Date.now() - 1000) },
    });
    const validation = await checkResponse(
      c.post('/api/dispensary/cart/validate', { data: { productIds: [p.id] } })
    );
    expect(validation.products[0].isAvailable).toBe(false);
    const attempt = await c.post('/api/checkout', {
      headers: { 'Idempotency-Key': randomUUID() },
      data: {
        items: [
          { id: p.id, growerId: p.growerId, quantity: 0.1, price: 30.15 },
        ],
      },
    });
    expect(attempt.status()).toBe(409);
    await checkResponse(localSeller.get(`/api/orders/${o.id}`));
    const conv = await checkResponse(
      localSeller.post('/api/messages/conversations', {
        data: { dispensaryId: b.dispensary!.id },
      }),
      201
    );
    await checkResponse(
      localSeller.post(
        `/api/messages/conversations/${conv.conversationId}/messages`,
        { data: { messageType: 'TEXT', body: 'Existing order coordination' } }
      ),
      201
    );
    const quote = await localSeller.post(
      `/api/messages/conversations/${conv.conversationId}/messages`,
      {
        data: {
          productId: p.id,
          messageType: 'OFFER',
          body: 'New quote',
          offer: { unitPrice: 10, quantity: 0.1 },
        },
      }
    );
    expect(quote.status()).toBe(403);
    expect(
      (
        await localSeller.post('/api/grower/subscription/checkout', {
          data: { plan: 'seller' },
        })
      ).status()
    ).toBe(503);
    await checkResponse(
      localSeller.patch(`/api/orders/${o.id}/status`, {
        data: { status: 'CANCELLED', reason: 'QA' },
      })
    );
    expect(await stock(p.id)).toBe(3.125);
  } finally {
    await localSeller.dispose();
  }
});

test('fractional counterquotes keep their cap and price through checkout and retry', async () => {
  const p = await product(g, 2);
  const conv = await checkResponse(s.post('/api/messages/conversations', { data: { dispensaryId: b.dispensary!.id } }), 201);
  const offer = await checkResponse(s.post(`/api/messages/conversations/${conv.conversationId}/messages`, { data: { productId:p.id, messageType:'OFFER', body:'Fractional quote', offer:{unitPrice:20.25,quantity:.375} } }), 201);
  const counter = await checkResponse(c.post(`/api/messages/messages/${offer.id}/offer-action`, { data: { action:'COUNTER', counter:{unitPrice:18.55,quantity:.125} } }));
  const accepted = await checkResponse(s.post(`/api/messages/messages/${counter.counterOfferId}/offer-action`, {data:{action:'ACCEPT'}}));
  expect(Number((await db.acceptedQuote.findUniqueOrThrow({where:{id:accepted.acceptedQuote.id}})).quantity)).toBe(.125);
  const key=randomUUID(), payload={items:[{id:p.id,growerId:p.growerId,quantity:.125,price:18.55,acceptedQuoteId:accepted.acceptedQuote.id}]};
  const r=await checkResponse(c.post('/api/checkout',{headers:{'Idempotency-Key':key},data:payload}));
  const retry=await checkResponse(c.post('/api/checkout',{headers:{'Idempotency-Key':key},data:payload}));expect(retry).toEqual(r);
  const o=await order(r.orders[0].id);expect(o.items[0].quantity).toBe(.125);expect(o.totalAmount).toBe(2.32);expect(await stock(p.id)).toBe(2);
  await checkResponse(s.put(`/api/orders/${o.id}`,{data:{accept:true,items:[{id:o.items[0].id,quantity:.125,unitPrice:18.55}]}}));expect(await stock(p.id)).toBe(1.875);
});

test('fractional batch actions roll back shortages and cancel ready-for-pickup exactly once', async () => {
  const p=await product(g,.3), [a]=await submit(c,[p],.2), [z]=await submit(other,[p],.2);
  const batch=(ids:string[],status:string)=>s.patch('/api/orders/batch-status',{data:{orderIds:ids,status,reason:'QA'}});
  expect((await batch([a.id,z.id],'CONFIRMED')).status()).toBe(409);expect(await stock(p.id)).toBe(.3);expect((await order(a.id)).status).toBe('PENDING');
  await db.product.update({where:{id:p.id},data:{inventoryQty:.4}});
  for(const x of [a,z]) await checkResponse(s.put(`/api/orders/${x.id}`,{data:{notes:buildOrderRequestNotes({fulfillmentMethod:'Pickup',requestedWindow:'Friday',paymentTerms:'Handled directly',buyerNotes:''})}}));
  for(const status of ['CONFIRMED','PROCESSING','SHIPPED']) await checkResponse(batch([a.id,z.id],status));expect(await stock(p.id)).toBe(0);
  for(let i=0;i<2;i++) await checkResponse(batch([a.id,z.id],'CANCELLED'));expect(await stock(p.id)).toBe(.4);
});

test('free spreadsheet import keeps fractional units and rejects invalid count stock', async () => {
  const free=await account('GROWER',false), client=await api(free);
  try {
    const name=`Fractional import ${randomUUID()}`;
    const response=await checkResponse(client.post('/api/products/bulk',{multipart:{file:{name:'products.csv',mimeType:'text/csv',buffer:Buffer.from(`Name,Type,Price,Stock,Unit\n${name},Flower,30.15,1.125,Lb\n`)}}}));
    expect(response).toBeTruthy();const p=await db.product.findFirstOrThrow({where:{growerId:free.grower!.id,name}});expect(Number(p.inventoryQty)).toBe(1.125);
    const invalid=await client.post('/api/products/bulk',{multipart:{file:{name:'counts.csv',mimeType:'text/csv',buffer:Buffer.from('Name,Type,Price,Stock,Unit\nInvalid Pack,Preroll,10,1.5,Pack\n')}}});
    const body=await invalid.json();expect(body.errors?.length || body.errorRows).toBeGreaterThan(0);expect(await db.product.count({where:{growerId:free.grower!.id}})).toBe(1);
  }finally{await client.dispose();}
});

test('price-alert refresh respects seller access and date eligibility', async () => {
  await checkResponse(c.post('/api/dispensary/price-alerts/refresh'));
  const p=await product(g), alert=await db.dispensaryPriceAlert.create({data:{dispensaryId:b.dispensary!.id,productId:p.id,targetPrice:25,currentPrice:30.15,originalPrice:30.15}});
  await checkResponse(s.put(`/api/products/${p.id}`,{data:{price:20}}));expect((await db.dispensaryPriceAlert.findUniqueOrThrow({where:{id:alert.id}})).isTriggered).toBe(true);
  await checkResponse(c.post('/api/dispensary/price-alerts/refresh'));
});

for (const width of [1440, 834, 390])
  test(`all ten improvements end to end at ${width}px`, async ({ browser }) => {
    const seller = await account('GROWER'),
      second = await account('GROWER'),
      buyer = await account('DISPENSARY'),
      free = await account('GROWER', false);
    const sellerContext = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
      }),
      buyerContext = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
      }),
      freeContext = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
      });
    await auth(sellerContext, seller);
    await auth(buyerContext, buyer);
    await auth(freeContext, free);
    const gp = await sellerContext.newPage(),
      bp = await buyerContext.newPage(),
      fp = await freeContext.newPage();
    const errors: string[] = [];
    for (const p of [gp, bp, fp])
      { p.on('pageerror', (e) => errors.push(e.message)); p.on('response', r => { if(r.status() >= 500) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); }); }
    const key = `QA${width}-${randomUUID().slice(0, 5)}`;
    try {
      // Free catalog preparation and truthful seller visibility.
      await fp.goto('/grower/products');
      await fp
        .getByRole('button', { name: 'Add product', exact: true })
        .click();
      await fp.getByLabel('Name', { exact: true }).fill(`${key} hidden`);
      await fp.locator('#productType').selectOption('Flower');
      await fp.getByLabel('Price ($)', { exact: true }).fill('30.15');
      await fp.getByLabel('Stock', { exact: true }).fill('2.5');
      await fp.getByLabel('Unit', { exact: true }).selectOption('Lb');
      await fp
        .getByRole('button', { name: 'Publish product', exact: true })
        .click();
      await expect(
        fp.getByText('Ready — activate subscription', { exact: true }).first()
      ).toBeVisible();
      await fit(fp, 'free-products', width);
      await fp.goto('/grower/pricing');
      await expect(
        fp.getByText(
          'Your products are hidden — activate a subscription to sell'
        )
      ).toBeVisible();
      await fit(fp, 'subscription', width);
      // Quick draft/publish with fractional stock, then edit from the full form.
      await gp.goto('/grower/products');
      await gp
        .getByRole('button', { name: 'Add product', exact: true })
        .click();
      await gp.getByLabel('Name', { exact: true }).fill(`${key} draft`);
      await gp.getByLabel('Add another after saving', { exact: true }).check();
      await gp.getByRole('button', { name: 'Save draft', exact: true }).click();
      await expect(
        gp.getByText(`${key} draft`, { exact: true }).first()
      ).toBeVisible();
      await expect(gp.getByLabel('Name', { exact: true })).toHaveValue('');
      await gp.getByLabel('Add another after saving', { exact: true }).uncheck();
      await gp.getByLabel('Name', { exact: true }).fill(`${key} available`);
      await gp.locator('#productType').selectOption('Flower');
      await gp.getByLabel('Price ($)', { exact: true }).fill('30.15');
      await gp.getByLabel('Stock', { exact: true }).fill('3.125');
      await gp.getByLabel('Unit', { exact: true }).selectOption('Lb');
      await gp
        .getByRole('button', { name: 'Publish product', exact: true })
        .click();
      await expect(
        gp.getByText('Visible to buyers', { exact: true }).first()
      ).toBeVisible();
      await fit(gp, 'published-products', width);
      const p = await db.product.findFirstOrThrow({
          where: { growerId: seller.grower!.id, name: `${key} available` },
        }),
        q = await product(second, 4, `${key} second`),
        extra = await product(seller, 4, `${key} extra`),
        sold = await product(seller, 0, `${key} sold out`);
      await gp.getByRole('textbox', { name: `${p.name} stock in lb`, exact: true }).fill('3.25');
      await gp.getByRole('heading', { name: 'Products', exact: true }).click();
      await expect.poll(() => stock(p.id)).toBe(3.25);
      await gp.goto(`/grower/products/${p.id}/edit`);
      await gp.locator('#inventoryQty').fill('3.125');
      await gp.getByRole('button', { name: 'Save changes', exact: true }).filter({ visible: true }).first().click();
      await expect.poll(() => stock(p.id)).toBe(3.125);
      await bp.goto(`/dispensary/catalog?search=${key}`);
      await expect(bp.getByText(sold.name, { exact: true })).toHaveCount(0);
      await expect(bp.getByRole('button', { name: `Add ${p.name} to cart`, exact: true })).toBeVisible();
      const includeSold = bp.getByLabel('Include sold-out products', { exact: true }).filter({visible: true});
      if (!(await includeSold.count())) await bp.getByRole('button', { name: 'Toggle filters', exact: true }).click();
      await includeSold.check();
      if (width < 1024) await bp.getByRole('button', { name: /^Show \d+ products$/ }).click();
      await expect(bp.getByText(sold.name, { exact: true }).first()).toBeVisible();
      await expect(
        bp.getByRole('button', { name: `Add ${p.name} to cart`, exact: true })
      ).toBeVisible();
      await expect(bp.getByText(`${key} hidden`, { exact: true })).toHaveCount(
        0
      );
      await expect(bp.getByText(`${key} draft`, { exact: true })).toHaveCount(
        0
      );
      await bp.getByRole('button', { name: 'List view', exact: true }).click();
      const rows = bp.locator('[data-product-row]');
      await expect(rows).toHaveCount(4);
      const names = await rows.allTextContents();
      expect(names.findIndex((t) => t.includes(sold.name))).toBeGreaterThan(
        names.findIndex((t) => t.includes(p.name))
      );
      await fit(bp, 'catalog', width);
      for (const x of [p, q, extra]) {
        await bp
          .getByRole('textbox', { name: `Quantity for ${x.name}`, exact: true })
          .fill('0.5');
        await bp
          .getByRole('button', { name: `Add ${x.name} to cart`, exact: true })
          .click();
      }
      await bp.goto('/dispensary/cart');
      await bp
        .getByLabel('Pickup or delivery', { exact: true })
        .selectOption('Pickup');
      await bp
        .getByLabel('Preferred date or time (optional)', { exact: true })
        .fill('Friday morning');
      const group = bp.getByRole('group', {
        name: `Fulfillment for ${second.grower!.businessName}`,
      });
      await group
        .getByLabel('Use different pickup or delivery details')
        .check();
      await group
        .getByLabel('Method', { exact: true })
        .selectOption('Delivery requested');
      await group
        .getByLabel('Preferred date or time', { exact: true })
        .fill('Monday afternoon');
      await group
        .getByLabel('Delivery address', { exact: true })
        .fill('100 Test Street, Burlington VT');
      await expect.poll(() => bp.evaluate(() => Object.entries(localStorage).some(([key, value]) => key.endsWith(':cart-details-v2') && value.includes('100 Test Street')))).toBe(true);
      await bp.reload();
      await bp.getByRole('button', { name: 'Restore draft', exact: true }).click();
      await expect(
        group.getByLabel('Delivery address', { exact: true })
      ).toHaveValue('100 Test Street, Burlington VT');
      await fit(bp, 'multi-grower-cart', width);
      await bp
        .getByRole('button', { name: 'Review request', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await expect(bp.getByRole('dialog')).toBeVisible();
      await fit(bp, 'request-review', width);
      await bp
        .getByRole('button', { name: 'Send order requests', exact: true })
        .click();
      await expect(
        bp.getByText('Requests submitted', { exact: true })
      ).toBeVisible();
      const orders = await db.order.findMany({
        where: { dispensaryId: buyer.dispensary!.id },
        include: { items: true },
      });
      expect(orders).toHaveLength(2);
      const pending = orders.find((o) => o.growerId === seller.grower!.id)!;
      expect(pending.notes).toContain('Pickup');
      expect(
        orders.find((o) => o.growerId === second.grower!.id)!.notes
      ).toContain('100 Test Street');
      expect(await stock(p.id)).toBe(3.125);
      await bp.goto('/dispensary/orders');
      await expect(
        bp.getByRole('link', { name: 'In progress', exact: true })
      ).toHaveAttribute('aria-current', 'page');
      await expect(
        bp.getByRole('button', { name: /Reorder|Buy again/ })
      ).toHaveCount(0);
      await fit(bp, 'buyer-active-orders', width);
      // Contextual quote on a multi-item request, sent and accepted through the drawer.
      await gp.goto(`/grower/orders/${pending.id}`);
      await gp
        .getByRole('button', { name: 'Message', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await gp.getByTestId('toggle-offer-composer').click();
      await expect(
        gp.getByLabel('Quantity (optional)', { exact: true })
      ).toHaveValue('0.5');
      await expect(gp.getByLabel('Unit price', { exact: true })).toHaveValue(
        '30.15'
      );
      await gp.getByLabel('Request item', { exact: true }).selectOption('1');
      await expect(
        gp.getByLabel('Quantity (optional)', { exact: true })
      ).toHaveValue('0.5');
      await gp.getByLabel('Unit price', { exact: true }).fill('28.50');
      await expect(gp.getByRole('combobox',{name:'Quote product',exact:true})).toHaveValue(extra.id);
      await fit(gp, 'context-quote', width);
      await gp.getByRole('button', { name: 'Send quote', exact: true }).click();
      await expect(gp.getByText('0.5 lb @', { exact: false })).toBeVisible();
      await gp
        .getByRole('button', { name: 'Close messages', exact: true })
        .filter({ visible: true })
        .click();
      await bp.goto(`/dispensary/orders/${pending.id}`);
      await bp
        .getByRole('button', { name: /Message grower|Message/, exact: false })
        .filter({ visible: true })
        .first()
        .click();
      await bp
        .getByRole('button', { name: 'Accept & add to cart', exact: true })
        .click();
      await expect(bp).toHaveURL(/\/dispensary\/cart$/);
      await expect(bp.getByText('Quote: $28.50 / lb · up to 0.5', { exact: true })).toBeVisible();
      await fit(bp, 'buyer-quote', width);
      // Negotiate final quantities and accept in one atomic save.
      await gp.goto(`/grower/orders/${pending.id}/edit`);
      await expect(gp.getByLabel('Preferred date or time (optional)', { exact:true })).toHaveValue('Friday morning');
      await gp.locator('#order-quantity-0').fill('.375');
      await gp.getByLabel('Price / Lb', { exact: true }).first().fill('28.50');
      await fit(gp, 'review-accept', width);
      await gp
        .getByRole('button', { name: 'Accept order', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await expect
        .poll(async () => (await order(pending.id)).status)
        .toBe('CONFIRMED');
      const final = await order(pending.id);
      for (const line of final.items)
        expect(await stock(line.productId)).toBe(
          (line.productId === p.id ? 3.125 : 4) - line.quantity
        );
      await bp.goto(`/dispensary/orders/${pending.id}`);
      await expect(
        bp.getByText('Accepted', { exact: true }).first()
      ).toBeVisible();
      await fit(bp, 'buyer-confirmed', width);
      // Pickup labels and next actions on both sides.
      await gp.goto(`/grower/orders/${pending.id}`);
      await gp
        .getByRole('button', { name: 'Start preparing', exact: true })
        .click();
      await gp
        .getByRole('button', { name: 'Mark ready for pickup', exact: true })
        .click();
      await bp.reload();
      await expect(
        bp.getByText('Ready for pickup', { exact: true }).first()
      ).toBeVisible();
      await fit(bp, 'buyer-pickup', width);
      await fit(gp, 'grower-pickup', width);
      await gp
        .getByRole('button', { name: 'Mark collected', exact: true })
        .click();
      await expect
        .poll(async () => (await order(pending.id)).status)
        .toBe('DELIVERED');
      await bp.goto('/dispensary/orders?view=past');
      await expect(
        bp.getByRole('button', { name: /Reorder/ }).first()
      ).toBeVisible();
      await fit(bp, 'buyer-history', width);
      await bp.getByRole('button', { name: 'Reorder', exact: true }).filter({visible: true}).first().click();
      await expect(bp.getByText(/Added 2 of 2/).first()).toBeVisible();
      await bp.goto('/dispensary/cart');
      const reordered = await bp.getByRole('textbox', { name: `Quantity for ${p.name}`, exact: true }).inputValue();
      expect(Number(reordered)).toBeGreaterThanOrEqual(final.items.find(i => i.productId === p.id)!.quantity);
      await fit(bp, 'reorder-cart', width);
      // The other grower's request uses delivery terminology through completion.
      const delivery = orders.find(o => o.growerId === second.grower!.id)!;
      await auth(sellerContext, second);
      await gp.goto(`/grower/orders/${delivery.id}`);
      await gp.getByRole('button',{name:'Message',exact:true}).filter({visible:true}).first().click();
      await gp.getByTestId('toggle-offer-composer').click();
      await expect(gp.getByLabel('Quantity (optional)',{exact:true})).toHaveValue('0.5');
      await expect(gp.getByLabel('Unit price',{exact:true})).toHaveValue('30.15');
      await expect(gp.getByLabel('Request item',{exact:true})).toHaveCount(0);
      await fit(gp,'single-item-quote',width);
      await gp.getByRole('button',{name:'Close messages',exact:true}).filter({visible:true}).click();
      await gp.goto(`/grower/orders/${delivery.id}/edit`);
      await gp.getByRole('button', { name: 'Accept order', exact: true }).filter({visible: true}).first().click();
      await expect.poll(async () => (await order(delivery.id)).status).toBe('CONFIRMED');
      await gp.getByRole('button', { name: 'Start preparing', exact: true }).click();
      await gp.getByRole('button', { name: 'Mark on the way', exact: true }).click();
      await bp.goto(`/dispensary/orders/${delivery.id}`);
      await expect(bp.getByText('On the way', {exact:true}).first()).toBeVisible();
      await fit(bp, 'buyer-delivery', width);
      await fit(gp, 'grower-delivery', width);
      await gp.getByRole('button', { name: 'Mark delivered', exact: true }).click();
      await expect.poll(async () => (await order(delivery.id)).status).toBe('DELIVERED');
      await auth(sellerContext, seller);
      // Report inspection links to contributing records and actual orders.
      await gp.goto('/grower/reports');
      await expect(
        gp.getByRole('link', { name: p.name, exact: true }).first()
      ).toBeVisible();
      await expect(
        gp
          .getByRole('link', {
            name: buyer.dispensary!.businessName,
            exact: true,
          })
          .first()
      ).toBeVisible();
      const inspect = gp.getByRole('link', {
        name: 'View orders for this period',
        exact: true,
      });
      await expect(inspect).toBeVisible();
      await fit(gp, 'report-drilldown', width);
      await gp.getByRole('link', { name: p.name, exact: true }).first().click();
      await expect(gp).toHaveURL(new RegExp(`/grower/products/${p.id}/preview$`));
      await expect(gp.getByRole('heading', { name: p.name, exact: true }).first()).toBeVisible();
      await gp.goto('/grower/reports');
      await gp.getByRole('link', { name: buyer.dispensary!.businessName, exact: true }).first().click();
      await expect(gp).toHaveURL(new RegExp(`/grower/customers/${buyer.dispensary!.id}$`));
      await expect(gp.getByRole('heading', { name: buyer.dispensary!.businessName, exact: true }).first()).toBeVisible();
      await gp.goto('/grower/reports');
      await inspect.click();
      await expect(gp).toHaveURL(/dateBasis=delivered/);
      await expect(
        gp.getByText(pending.orderId, { exact: false }).first()
      ).toBeVisible();
      await fit(gp, 'report-orders', width);
      expect(errors).toEqual([]);
    } finally {
      await Promise.all([
        sellerContext.close(),
        buyerContext.close(),
        freeContext.close(),
      ]);
    }
  });
