import { test, expect, request as playwrightRequest } from '@playwright/test';
import { ConversationMessageType, PrismaClient, UserRole } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!['AUTH_SECRET', 'DATABASE_URL', 'NEXTAUTH_URL'].includes(key)) continue;

    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
function isLocalTestTarget(value: string, database = false) {
  try {
    const target = new URL(value);
    return ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
      && (database
        ? /^postgres(?:ql)?:$/.test(target.protocol) && /^phenofarm_(?:auth|ui_fixes|test)_[a-zA-Z0-9_-]+$/.test(target.pathname.slice(1))
        : /^https?:$/.test(target.protocol));
  } catch { return false; }
}
if (!isLocalTestTarget(baseURL) || !isLocalTestTarget(process.env.DATABASE_URL || '', true)) {
  throw new Error('Inventory/import regressions require a localhost app and named local phenofarm_auth/ui_fixes/test clone.');
}
const db = new PrismaClient();
const maxAge = 30 * 24 * 60 * 60;

test.describe.configure({ mode: 'serial' });

type TestAccount = Awaited<ReturnType<typeof createGrowerAndDispensary>>;

async function sessionCookie(account: TestAccount['growerUser']) {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is required for API test authentication');
  }

  return `next-auth.session-token=${await sessionToken(account)}`;
}

async function sessionToken(account: TestAccount['growerUser']) {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is required for browser test authentication');
  }

  return encode({
    secret: process.env.AUTH_SECRET,
    maxAge,
    token: {
      sub: account.id,
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      sessionVersion: account.sessionVersion,
      growerId: account.growerId || undefined,
      dispensaryId: account.dispensaryId || undefined,
    },
  });
}

async function createGrowerAndDispensary(prefix: string) {
  const growerUser = await db.user.create({
    data: {
      emailVerifiedAt: new Date(),
      sessionVersion: 0,
      email: `${prefix}.grower@example.test`,
      name: `${prefix} Grower`,
      role: UserRole.GROWER,
    },
  });

  const grower = await db.grower.create({
    data: {
      userId: growerUser.id,
      businessName: `${prefix} Grower Co`,
      licenseNumber: `${prefix}-G`,
      isVerified: true,
    },
  });

  const updatedGrowerUser = await db.user.update({
    where: { id: growerUser.id },
    data: { growerId: grower.id },
  });

  const dispensaryUser = await db.user.create({
    data: {
      emailVerifiedAt: new Date(),
      sessionVersion: 0,
      email: `${prefix}.dispensary@example.test`,
      name: `${prefix} Buyer`,
      role: UserRole.DISPENSARY,
    },
  });

  const dispensary = await db.dispensary.create({
    data: {
      userId: dispensaryUser.id,
      businessName: `${prefix} Buyer Co`,
      licenseNumber: `${prefix}-D`,
      licenseStatus: 'verified',
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  const updatedDispensaryUser = await db.user.update({
    where: { id: dispensaryUser.id },
    data: { dispensaryId: dispensary.id },
  });

  return { growerUser: updatedGrowerUser, grower, dispensary, dispensaryUser: updatedDispensaryUser };
}

async function cleanupByPrefix(prefix: string) {
  const users = await db.user.findMany({
    where: { email: { contains: prefix } },
    select: { id: true, growerId: true, dispensaryId: true },
  });
  const growerIds = users.map((user) => user.growerId).filter((id): id is string => Boolean(id));
  const dispensaryIds = users.map((user) => user.dispensaryId).filter((id): id is string => Boolean(id));

  if (growerIds.length || dispensaryIds.length) {
    await db.order.deleteMany({
      where: {
        OR: [
          growerIds.length ? { growerId: { in: growerIds } } : undefined,
          dispensaryIds.length ? { dispensaryId: { in: dispensaryIds } } : undefined,
        ].filter((clause): clause is { growerId: { in: string[] } } | { dispensaryId: { in: string[] } } => Boolean(clause)),
      },
    });
  }

  if (growerIds.length) {
    await db.product.deleteMany({ where: { growerId: { in: growerIds } } });
    await db.grower.deleteMany({ where: { id: { in: growerIds } } });
  }

  if (dispensaryIds.length) {
    await db.dispensary.deleteMany({ where: { id: { in: dispensaryIds } } });
  }

  await db.user.deleteMany({ where: { email: { contains: prefix } } });
}

async function productInventory(productId: string) {
  const product = await db.product.findUniqueOrThrow({
    where: { id: productId },
    select: { inventoryQty: true },
  });
  return product.inventoryQty;
}

test.afterAll(async () => {
  await db.$disconnect();
});

test('grower marketplace preview mirrors buyer hidden-price cards', async ({ page, context }) => {
  const prefix = `pf-market-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const hiddenPriceProduct = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Hidden Price Flower`,
        productType: 'Flower',
        price: 99,
        inventoryQty: 8,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: false,
        images: [],
      },
    });
    const visiblePriceProduct = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Visible Price Flower`,
        productType: 'Flower',
        price: 12,
        inventoryQty: 8,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: [],
      },
    });

    await context.addCookies([{
      name: 'next-auth.session-token',
      value: await sessionToken(account.growerUser),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + maxAge,
    }]);

    await page.goto('/grower/marketplace');
    await expect(page.getByRole('heading', { name: 'Marketplace preview' })).toBeVisible();
    await expect(page.getByText('quote required', { exact: false })).toBeVisible();

    const hiddenCard = page.locator(`[data-testid="marketplace-listing-card"][data-product-id="${hiddenPriceProduct.id}"]`);
    await expect(hiddenCard).toBeVisible();
    await expect(hiddenCard.getByText('Request pricing')).toBeVisible();
    await expect(hiddenCard.getByText('$99.00', { exact: true })).toHaveCount(0);

    const visibleCard = page.locator(`[data-testid="marketplace-listing-card"][data-product-id="${visiblePriceProduct.id}"]`);
    await expect(visibleCard).toBeVisible();
    await expect(visibleCard.getByText('$12.00', { exact: true })).toBeVisible();
    await expect(visibleCard.getByText('Request pricing')).toHaveCount(0);
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('accepted quote is consumed once and checkout then falls back to list price', async () => {
  const prefix = `pf-quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await cleanupByPrefix(prefix);
  try {
    const account = await createGrowerAndDispensary(prefix);
    const product = await db.product.create({ data: { growerId: account.grower.id, name: `${prefix} Flower`, productType: 'Flower', price: 60, inventoryQty: 10, unit: 'Gram', isAvailable: true, isPriceVisible: true, images: [] } });
    const conversation = await db.conversation.create({ data: { growerId: account.grower.id, dispensaryId: account.dispensary.id, productId: product.id, createdByUserId: account.growerUser.id } });
    const offer = await db.conversationMessage.create({ data: { conversationId: conversation.id, senderUserId: account.growerUser.id, messageType: ConversationMessageType.OFFER, body: 'Automated accepted quote', productId: product.id, offerQuantity: 2, offerUnitPrice: 55, offerStatus: 'PENDING' } });
    const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { Cookie: await sessionCookie(account.dispensaryUser), Accept: 'application/json' } });
    const accepted = await api.post(`/api/messages/messages/${offer.id}/offer-action`, { data: { action: 'ACCEPT' } });
    expect(accepted.ok()).toBeTruthy();
    const firstCheckout = await api.post('/api/checkout', { data: { items: [{ id: product.id, growerId: account.grower.id, price: 999, quantity: 1 }, { id: product.id, growerId: account.grower.id, price: 1, quantity: 1 }], notes: 'Direct settlement test' } });
    expect(firstCheckout.ok()).toBeTruthy();
    const firstBody = await firstCheckout.json();
    const firstItem = await db.orderItem.findFirstOrThrow({ where: { orderId: firstBody.orders[0].id, productId: product.id }, include: { acceptedQuote: true } });
    expect(Number(firstItem.unitPrice)).toBe(55);
    expect(firstItem.acceptedQuote?.consumedByOrderId).toBe(firstBody.orders[0].id);
    const secondCheckout = await api.post('/api/checkout', { data: { items: [{ id: product.id, growerId: account.grower.id, price: 1, quantity: 1 }] } });
    expect(secondCheckout.ok()).toBeTruthy();
    const secondBody = await secondCheckout.json();
    const secondItem = await db.orderItem.findFirstOrThrow({ where: { orderId: secondBody.orders[0].id, productId: product.id } });
    expect(Number(secondItem.unitPrice)).toBe(60);
    await api.dispose();
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('rapid direct-order creation produces distinct collision-safe request ids', async () => {
  const prefix = `pf-order-id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await cleanupByPrefix(prefix);
  try {
    const account = await createGrowerAndDispensary(prefix);
    const product = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Flower`,
        productType: 'Flower',
        price: 20,
        inventoryQty: 4,
        unit: 'Gram',
        isAvailable: true,
        images: [],
      },
    });
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });
    const payload = {
      dispensaryId: account.dispensary.id,
      items: [{ productId: product.id, quantity: 1, unitPrice: 20 }],
    };
    const [firstResponse, secondResponse] = await Promise.all([
      api.post('/api/orders', { data: payload }),
      api.post('/api/orders', { data: payload }),
    ]);
    expect(firstResponse.status()).toBe(201);
    expect(secondResponse.status()).toBe(201);
    const [first, second] = await Promise.all([firstResponse.json(), secondResponse.json()]);
    expect(first.orderId).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
    expect(second.orderId).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
    expect(first.orderId).not.toBe(second.orderId);
    await expect.poll(() => productInventory(product.id)).toBe(2);
    await api.dispose();
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('upload endpoints reject files whose content does not match the allowed type', async () => {
  const prefix = `pf-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const product = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Upload Guard Product`,
        productType: 'Flower',
        price: 12,
        inventoryQty: 4,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: [],
      },
    });
    const fullImageProduct = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Full Image Product`,
        productType: 'Flower',
        price: 12,
        inventoryQty: 4,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: Array.from({ length: 5 }, (_, index) => `https://example.test/${prefix}-${index}.png`),
      },
    });
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const validImage = await api.post('/api/products/upload', {
        multipart: {
          productId: product.id,
          fileType: 'image',
          files: {
            name: 'valid.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n3sAAAAASUVORK5CYII=', 'base64'),
          },
        },
      });
      expect(validImage.status()).toBe(200);
      const validImageBody = await validImage.json();
      expect(validImageBody.uploadedFiles[0]).toMatchObject({ storage: 'local' });
      expect(validImageBody.uploadedFiles[0].dataUrl).toMatch(/^\/uploads\/.+\.png$/);

      const overLimitImage = await api.post('/api/products/upload', {
        multipart: {
          productId: fullImageProduct.id,
          fileType: 'image',
          files: {
            name: 'extra.png',
            mimeType: 'image/png',
            buffer: Buffer.from('%PDF-1.4 not stored because product is already full'),
          },
        },
      });
      expect(overLimitImage.status()).toBe(400);
      await expect(overLimitImage.json()).resolves.toMatchObject({
        error: expect.stringContaining('at most 2 images'),
      });

      const mismatchedImage = await api.post('/api/products/upload', {
        multipart: {
          productId: product.id,
          fileType: 'image',
          files: {
            name: 'fake.png',
            mimeType: 'image/png',
            buffer: Buffer.from('%PDF-1.4 not actually a product image'),
          },
        },
      });
      expect(mismatchedImage.status()).toBe(400);
      await expect(mismatchedImage.json()).resolves.toMatchObject({
        error: expect.stringContaining('content must be a JPG, PNG, or WebP image'),
      });

      const mismatchedDocument = await api.post('/api/products/upload-document', {
        multipart: {
          productId: product.id,
          file: {
            name: 'fake.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('not actually a pdf'),
          },
        },
      });
      expect(mismatchedDocument.status()).toBe(400);
      await expect(mismatchedDocument.json()).resolves.toMatchObject({
        error: expect.stringContaining('content must be a PDF'),
      });
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('order edits reconcile inventory for quantity changes, added lines, removals, conflicts, and cancellation', async () => {
  const prefix = `pf-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const productA = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Flower A`,
        productType: 'Flower',
        price: 10,
        inventoryQty: 10,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: [],
      },
    });
    const productB = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Flower B`,
        productType: 'Flower',
        price: 7,
        inventoryQty: 5,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: [],
      },
    });

    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const createResponse = await api.post('/api/orders', {
        data: {
          dispensaryId: account.dispensary.id,
          items: [{ productId: productA.id, quantity: 4, unitPrice: 10 }],
          shippingFee: 1,
          notes: 'initial reservation',
        },
      });
      expect(createResponse.status()).toBe(201);

      const createdOrder = await createResponse.json();
      const productAItem = createdOrder.items.find((item: { productId: string }) => item.productId === productA.id);
      expect(productAItem).toBeTruthy();
      await expect.poll(() => productInventory(productA.id)).toBe(6);

      const reduceResponse = await api.put(`/api/orders/${createdOrder.id}`, {
        data: {
          items: [{ id: productAItem.id, quantity: 2, unitPrice: 10 }],
          shippingFee: 1,
          tax: 0,
          notes: 'reduced quantity',
        },
      });
      expect(reduceResponse.status()).toBe(200);
      const reducedOrder = await reduceResponse.json();
      const reducedProductAItem = reducedOrder.items.find((item: { productId: string }) => item.productId === productA.id);
      await expect.poll(() => productInventory(productA.id)).toBe(8);

      const persistedEditResponse = await api.get(`/api/orders/${createdOrder.id}`);
      expect(persistedEditResponse.status()).toBe(200);
      const persistedEdit = await persistedEditResponse.json();
      expect(persistedEdit.notes).toBe('reduced quantity');
      expect(Number(persistedEdit.subtotal)).toBe(20);
      expect(persistedEdit.items).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: reducedProductAItem.id,
          quantity: 2,
        }),
      ]));

      const addLineResponse = await api.put(`/api/orders/${createdOrder.id}`, {
        data: {
          items: [
            { id: reducedProductAItem.id, quantity: 2, unitPrice: 10 },
            { productId: productB.id, quantity: 3, unitPrice: 7 },
          ],
          shippingFee: 1,
          tax: 0,
        },
      });
      expect(addLineResponse.status()).toBe(200);
      const addedLineOrder = await addLineResponse.json();
      const productBItem = addedLineOrder.items.find((item: { productId: string }) => item.productId === productB.id);
      expect(productBItem).toBeTruthy();
      await expect.poll(() => productInventory(productB.id)).toBe(2);

      const removeLineResponse = await api.put(`/api/orders/${createdOrder.id}`, {
        data: {
          items: [{ id: productBItem.id, quantity: 3, unitPrice: 7 }],
          shippingFee: 1,
          tax: 0,
        },
      });
      expect(removeLineResponse.status()).toBe(200);
      const removedLineOrder = await removeLineResponse.json();
      const remainingProductBItem = removedLineOrder.items.find((item: { productId: string }) => item.productId === productB.id);
      await expect.poll(() => productInventory(productA.id)).toBe(10);
      await expect.poll(() => productInventory(productB.id)).toBe(2);

      const conflictResponse = await api.put(`/api/orders/${createdOrder.id}`, {
        data: {
          items: [{ id: remainingProductBItem.id, quantity: 99, unitPrice: 7 }],
          shippingFee: 1,
          tax: 0,
        },
      });
      expect(conflictResponse.status()).toBe(409);
      await expect.poll(() => productInventory(productB.id)).toBe(2);
      const unchangedItem = await db.orderItem.findUniqueOrThrow({
        where: { id: remainingProductBItem.id },
        select: { quantity: true },
      });
      expect(unchangedItem.quantity).toBe(3);

      const deleteResponse = await api.delete(`/api/orders/${createdOrder.id}`);
      expect(deleteResponse.status()).toBe(200);
      await expect.poll(() => productInventory(productB.id)).toBe(5);
      await expect.poll(() => productInventory(productA.id)).toBe(10);
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('product import reports row errors, stays all-or-nothing, and retires the legacy upload route', async () => {
  const prefix = `pf-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    await db.grower.update({ where: { id: account.grower.id }, data: { subscriptionPlan: 'pro', subscriptionStatus: 'active' } });
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const invalidCsv = [
        'name,category,price,inventoryQty,unit,isPriceVisible',
        `"${prefix} Valid Hidden Flower","Flower","12.50","7","Gram","false"`,
        `"${prefix} Missing Unit","Flower","15.00","3","","true"`,
      ].join('\n');

      const invalidResponse = await api.post('/api/products/bulk', {
        multipart: {
          file: {
            name: 'products.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(invalidCsv),
          },
        },
      });
      expect(invalidResponse.status()).toBe(422);
      const invalidBody = await invalidResponse.json();
      expect(invalidBody.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ row: 3, field: 'unit' }),
      ]));
      await expect.poll(() => db.product.count({
        where: { growerId: account.grower.id, name: { contains: prefix } },
      })).toBe(0);

      const retiredResponse = await api.post('/grower/products/api/upload', {
        multipart: {
          file: {
            name: 'products.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(invalidCsv),
          },
        },
      });
      expect(retiredResponse.status()).toBe(410);
      await expect(retiredResponse.json()).resolves.toMatchObject({
        error: expect.stringContaining('retired'),
        supportedPath: '/api/products/bulk',
      });

      const validCsv = [
        'name,category,price,inventoryQty,unit,description,isAvailable,isPriceVisible,sku,thc,cbd',
        `"${prefix} Hidden Flower","Flower","12.50","7","Gram","A quoted, comma-safe description","yes","no","${prefix}-SKU","22","1"`,
      ].join('\n');

      const validResponse = await api.post('/api/products/bulk', {
        multipart: {
          file: {
            name: 'products.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(validCsv),
          },
        },
      });
      expect(validResponse.status()).toBe(200);
      await expect(validResponse.json()).resolves.toMatchObject({
        success: true,
        totalRows: 1,
        successCount: 1,
        errorCount: 0,
      });

      const imported = await db.product.findFirstOrThrow({
        where: { growerId: account.grower.id, name: `${prefix} Hidden Flower` },
      });
      expect(imported.productType).toBe('Flower');
      expect(imported.isPriceVisible).toBe(false);
      expect(imported.inventoryQty).toBe(7);
      expect(imported.description).toBe('A quoted, comma-safe description');
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('grower can accept, prepare, mark ready, deliver, and batch-update valid requests only', async () => {
  const prefix = `pf-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const product = await db.product.create({
      data: {
        growerId: account.grower.id,
        name: `${prefix} Workflow Flower`,
        productType: 'Flower',
        price: 20,
        inventoryQty: 20,
        unit: 'Gram',
        isAvailable: true,
        isPriceVisible: true,
        images: [],
      },
    });

    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const createResponse = await api.post('/api/orders', {
        data: {
          dispensaryId: account.dispensary.id,
          items: [{ productId: product.id, quantity: 2, unitPrice: 20 }],
          notes: 'workflow status coverage',
        },
      });
      expect(createResponse.status()).toBe(201);
      const order = await createResponse.json();

      for (const status of ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']) {
        const response = await api.patch(`/api/orders/${order.id}/status`, {
          data: { status },
        });
        expect(response.status()).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
          success: true,
          order: { id: order.id, status },
        });
      }

      const deliveredOrder = await db.order.findUniqueOrThrow({
        where: { id: order.id },
        select: { status: true, shippedAt: true, deliveredAt: true },
      });
      expect(deliveredOrder.status).toBe('DELIVERED');
      expect(deliveredOrder.shippedAt).toBeTruthy();
      expect(deliveredOrder.deliveredAt).toBeTruthy();

      const invalidBatchResponse = await api.patch('/api/orders/batch-status', {
        data: {
          orderIds: [order.id],
          status: 'PROCESSING',
        },
      });
      expect(invalidBatchResponse.status()).toBe(409);
      await expect(invalidBatchResponse.json()).resolves.toMatchObject({
        updatedCount: 0,
        skippedCount: 1,
      });

      const secondResponse = await api.post('/api/orders', {
        data: {
          dispensaryId: account.dispensary.id,
          items: [{ productId: product.id, quantity: 1, unitPrice: 20 }],
          notes: 'batch status coverage',
        },
      });
      expect(secondResponse.status()).toBe(201);
      const secondOrder = await secondResponse.json();

      const validBatchResponse = await api.patch('/api/orders/batch-status', {
        data: {
          orderIds: [secondOrder.id],
          status: 'CONFIRMED',
        },
      });
      expect(validBatchResponse.status()).toBe(200);
      await expect(validBatchResponse.json()).resolves.toMatchObject({
        success: true,
        updatedCount: 1,
        updatedOrderIds: [secondOrder.id],
      });

      await expect.poll(async () => {
        const updated = await db.order.findUniqueOrThrow({
          where: { id: secondOrder.id },
          select: { status: true },
        });
        return updated.status;
      }).toBe('CONFIRMED');
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('grower attention summary includes new requests, unread buyer messages, cancellations, and status changes', async () => {
  const prefix = `pf-attn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const now = new Date();
    const beforeUnread = new Date(now.getTime() - 60_000);

    await Promise.all([
      db.order.create({
        data: {
          growerId: account.grower.id,
          dispensaryId: account.dispensary.id,
          orderId: `${prefix}-PENDING`,
          status: 'PENDING',
          totalAmount: 120,
          subtotal: 120,
          tax: 0,
        },
      }),
      db.order.create({
        data: {
          growerId: account.grower.id,
          dispensaryId: account.dispensary.id,
          orderId: `${prefix}-CANCELLED`,
          status: 'CANCELLED',
          totalAmount: 80,
          subtotal: 80,
          tax: 0,
        },
      }),
      db.order.create({
        data: {
          growerId: account.grower.id,
          dispensaryId: account.dispensary.id,
          orderId: `${prefix}-PROCESSING`,
          status: 'PROCESSING',
          totalAmount: 60,
          subtotal: 60,
          tax: 0,
        },
      }),
    ]);

    const conversation = await db.conversation.create({
      data: {
        growerId: account.grower.id,
        dispensaryId: account.dispensary.id,
        createdByUserId: account.dispensaryUser.id,
        growerLastReadAt: beforeUnread,
        dispensaryLastReadAt: now,
        lastMessageAt: now,
      },
    });
    const message = await db.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderUserId: account.dispensaryUser.id,
        messageType: ConversationMessageType.TEXT,
        body: `${prefix} buyer needs updated availability`,
      },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const response = await api.get('/api/grower/attention');
      expect(response.status()).toBe(200);
      const summary = await response.json();

      expect(summary.counts.pendingRequests).toBeGreaterThanOrEqual(1);
      expect(summary.counts.unreadBuyerMessages).toBeGreaterThanOrEqual(1);
      expect(summary.counts.recentCancellations).toBeGreaterThanOrEqual(1);
      expect(summary.counts.recentStatusChanges).toBeGreaterThanOrEqual(1);
      expect(summary.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'request', title: 'New buyer request' }),
        expect.objectContaining({ type: 'message', conversationId: conversation.id }),
        expect.objectContaining({ type: 'cancellation' }),
        expect.objectContaining({ type: 'status' }),
      ]));
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('subscription settings and commercial terms stay scoped to software billing and direct settlement', async () => {
  const prefix = `pf-settings-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await cleanupByPrefix(prefix);

  try {
    const account = await createGrowerAndDispensary(prefix);
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: await sessionCookie(account.growerUser) },
    });

    try {
      const freeSubscription = await api.get('/api/grower/subscription');
      expect(freeSubscription.status()).toBe(200);
      const freeBody = await freeSubscription.json();
      expect(freeBody).toMatchObject({
        plan: 'free',
        status: 'inactive',
        portalAvailable: false,
      });
      expect(freeBody).not.toHaveProperty('stripeAccountId');

      await db.grower.update({
        where: { id: account.grower.id },
        data: {
          stripeCustomerId: `${prefix}-customer`,
          stripeSubscriptionId: `${prefix}-subscription`,
          subscriptionPlan: 'pro',
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const paidSubscription = await api.get('/api/grower/subscription');
      expect(paidSubscription.status()).toBe(200);
      await expect(paidSubscription.json()).resolves.toMatchObject({
        plan: 'pro',
        status: 'active',
        portalAvailable: true,
      });

      const terms = {
        minimumOrder: '$500 minimum',
        fulfillmentMethods: 'Pickup or coordinated route',
        fulfillmentRegion: 'Vermont buyers',
        paymentTerms: 'Net 15 direct ACH',
        responseWindow: 'within 1 business day',
        contactNote: 'Message before fulfillment',
      };

      const saveTerms = await api.put('/api/grower/commercial-terms', {
        data: { terms },
      });
      expect(saveTerms.status()).toBe(200);
      await expect(saveTerms.json()).resolves.toMatchObject({
        success: true,
        terms,
      });

      const readTerms = await api.get('/api/grower/commercial-terms');
      expect(readTerms.status()).toBe(200);
      await expect(readTerms.json()).resolves.toMatchObject({ terms });

      const invalidTerms = await api.put('/api/grower/commercial-terms', {
        data: { terms: { ...terms, paymentTerms: 'x'.repeat(241) } },
      });
      expect(invalidTerms.status()).toBe(400);
    } finally {
      await api.dispose();
    }
  } finally {
    await cleanupByPrefix(prefix);
  }
});

test('wholesale payment residue is absent from schema and source surfaces', async () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  expect(schema).not.toMatch(/stripeAccountId|connectOnboardedAt|model Payment|enum PaymentMethod|enum PaymentStatus/);

  const paymentModel = fs.readFileSync(path.join(process.cwd(), '.codex/payment-model.md'), 'utf8');
  expect(paymentModel).toMatch(/settlement is handled directly outside PhenoFarm|wholesale settlement stays direct/i);

  const wholesaleSurfaces = [
    'app/api/checkout/route.ts',
    'app/api/orders/route.ts',
    'app/api/orders/[id]/route.ts',
    'app/api/orders/[id]/status/route.ts',
    'app/api/orders/batch-status/route.ts',
    'app/grower/orders/page.tsx',
    'app/grower/orders/[id]/page.tsx',
    'app/grower/reports/page.tsx',
    'app/dispensary/cart/page.tsx',
    'app/dispensary/orders/[id]/page.tsx',
  ];

  const combined = wholesaleSurfaces
    .map((file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8'))
    .join('\n');

  expect(combined).toMatch(/direct|does not process wholesale payment|does not collect wholesale payment/i);
  expect(combined).not.toMatch(/stripe\.checkout|payment_intent|PaymentIntent|payout|stripeAccountId|connectOnboardedAt|application_fee/i);
});
