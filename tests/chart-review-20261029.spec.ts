import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient, type OrderStatus } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { CURRENT_POLICIES } from '../lib/policies/current';
import {
  dailyOrderValues,
  monthlyDeliveredValues,
  valueAxisMaximum,
} from '../lib/chart-values';
import {
  marketplaceDateKey,
  marketplaceDayStart,
  shiftDateKey,
} from '../lib/report-range';
import { formatMoney } from '../lib/format';

const base = process.env.PLAYWRIGHT_BASE_URL || '';
const target = new URL(process.env.DATABASE_URL || 'http://invalid');
if (
  !/^http:\/\/(127\.0\.0\.1|localhost):/.test(base) ||
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  !target.pathname.startsWith('/phenofarm_auth_')
) {
  throw new Error(
    'Chart regressions require an isolated local phenofarm_auth_ database and app.'
  );
}
const db = new PrismaClient();
const prefix = `chart-review-${randomUUID()}`;
const today = marketplaceDateKey();
const shots = 'docs/chart-review-2026-10-29/screens';
mkdirSync(shots, { recursive: true });
let growerId: string, buyerId: string, token: string, buyerToken: string;
const users: string[] = [],
  customers: string[] = [],
  products: string[] = [];
const historicalValues = [1250.25, 3525.5, 0, 2100, 650.99, 0, 4800.15, 900.3];
const historicalTotal = historicalValues.reduce((a, b) => a + b, 0);
const delivered30 = 800.1 + 1750.25 + 2250.35 + 1250.45 + 2750.55;
const delivered7 = 2250.35 + 1250.45 + 2750.55;
const buyerTotal = 123.45 + 120.3 + 50.25;

test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', video: 'off', actionTimeout: 15000 });
test.setTimeout(90000);
let browserErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (
      /hydration|hydrated|didn't match|server rendered|validateDOMNesting/i.test(
        message.text()
      )
    )
      browserErrors.push(message.text());
  });
});
test.afterEach(() => expect(browserErrors).toEqual([]));

async function order(
  value: number,
  status: OrderStatus,
  createdAt: Date,
  deliveredAt?: Date,
  index = 0
) {
  return db.order.create({
    data: {
      orderId: `QA-${randomUUID().slice(0, 8)}`,
      growerId,
      dispensaryId: index ? customers[index % customers.length] : buyerId,
      status,
      inventoryState:
        status === 'PENDING' || status === 'CANCELLED'
          ? 'NOT_DEDUCTED'
          : 'DEDUCTED',
      createdAt,
      deliveredAt,
      updatedAt: deliveredAt || createdAt,
      subtotal: value,
      totalAmount: value,
      items: {
        create: {
          growerId,
          productId: products[index % products.length],
          quantity: 1,
          unitPrice: value,
          totalPrice: value,
        },
      },
    },
  });
}
async function auth(context: BrowserContext, value = token) {
  await context.addCookies([
    { name: 'next-auth.session-token', value, url: base },
  ]);
}
async function capture(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    ),
    'page has no horizontal overflow'
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
    caret: 'initial',
  });
  const title =
    name.startsWith('reports') || name.startsWith('large-')
      ? 'Delivered value by month'
      : name.startsWith('buyer')
        ? '7-day order value'
        : 'Delivered value';
  const chart = page.getByRole('region', { name: title, exact: true });
  if (await chart.count()) {
    await chart.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await chart.screenshot({
      path: `${shots}/${name}-chart.png`,
      animations: 'disabled',
      caret: 'initial',
    });
  }
}
test.beforeAll(async () => {
  const grower = await db.user.create({
    data: {
      email: `${prefix}@example.test`,
      role: 'GROWER',
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      grower: {
        create: {
          businessName: 'TEST — Chart review grower',
          licenseNumber: prefix,
          isVerified: true,
          licenseExpiry: new Date('2030-12-31'),
        },
      },
    },
    include: { grower: true },
  });
  users.push(grower.id);
  growerId = grower.grower!.id;
  await db.user.update({ where: { id: grower.id }, data: { growerId } });
  const buyer = await db.user.create({
    data: {
      email: `${prefix}-buyer@example.test`,
      role: 'DISPENSARY',
      emailVerifiedAt: new Date(),
      policyAcceptances: {
        create: { ...CURRENT_POLICIES, source: 'TEST_FIXTURE' },
      },
      dispensary: {
        create: {
          businessName: 'TEST — Chart review market',
          licenseNumber: `${prefix}-buyer`,
          licenseStatus: 'verified',
          isVerified: true,
          licenseExpiry: new Date('2030-12-31'),
        },
      },
    },
    include: { dispensary: true },
  });
  users.push(buyer.id);
  buyerId = buyer.dispensary!.id;
  await db.user.update({
    where: { id: buyer.id },
    data: { dispensaryId: buyerId },
  });
  for (let i = 0; i < 7; i++) {
    const customer = await db.dispensary.create({
      data: {
        businessName:
          i === 1
            ? 'TEST — Green Mountain Community Market and Wellness Collective'
            : `TEST — Customer ${i + 1}`,
        createdByGrowerId: growerId,
        isOffPlatform: true,
      },
    });
    customers.push(customer.id);
    const product = await db.product.create({
      data: {
        growerId,
        name: [
          'Northern Lights',
          'Blue Dream Premium Small Batch Greenhouse Flower',
          'OG Kush',
          'Lemon Haze',
          'Purple Punch',
          'Sour Diesel',
          'Wedding Cake',
        ][i],
        price: 100,
        unit: i % 2 ? 'Unit' : 'Lb',
        inventoryQty: 100,
        status: 'PUBLISHED',
        isAvailable: true,
        productType: 'Flower',
      },
    });
    products.push(product.id);
  }
  token = await encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      sub: grower.id,
      id: grower.id,
      email: grower.email,
      role: 'GROWER',
      growerId,
      sessionVersion: 0,
    },
  });
  buyerToken = await encode({
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      sub: buyer.id,
      id: buyer.id,
      email: buyer.email,
      role: 'DISPENSARY',
      dispensaryId: buyerId,
      sessionVersion: 0,
    },
  });
  for (let i = 0; i < historicalValues.length; i++)
    if (historicalValues[i]) {
      await order(
        historicalValues[i],
        'DELIVERED',
        new Date('2024-01-01'),
        new Date(`2025-${String(i + 1).padStart(2, '0')}-15T17:00:00Z`),
        i
      );
    }
  // A pending and a canceled request in the report range must not enter delivered charts.
  await order(9999, 'PENDING', new Date('2025-02-15T17:00:00Z'));
  await order(8888, 'CANCELLED', new Date('2025-04-15T17:00:00Z'));
  for (const [i, day] of [-27, -15, -6, -3, 0].entries()) {
    await order(
      [800.1, 1750.25, 2250.35, 1250.45, 2750.55][i],
      'DELIVERED',
      new Date('2024-01-01'),
      new Date(`${shiftDateKey(today, day)}T17:00:00Z`),
      i + 1
    );
  }
  await order(123.45, 'PENDING', marketplaceDayStart(shiftDateKey(today, -1))!);
  await order(120.3, 'CONFIRMED', marketplaceDayStart(today)!);
  // UTC today, but still the preceding Eastern calendar day.
  await order(
    50.25,
    'PENDING',
    new Date(marketplaceDayStart(today)!.getTime() - 1)
  );
  await order(999.99, 'CANCELLED', marketplaceDayStart(today)!);
  // Exact outer boundaries must be excluded.
  await order(
    777,
    'PENDING',
    new Date(marketplaceDayStart(shiftDateKey(today, -6))!.getTime() - 1)
  );
  await order(888, 'PENDING', marketplaceDayStart(shiftDateKey(today, 1))!);
});
test.afterAll(async () => {
  if (growerId) {
    await db.order.deleteMany({ where: { growerId } });
    await db.product.deleteMany({ where: { growerId } });
    await db.dispensary.deleteMany({ where: { createdByGrowerId: growerId } });
  }
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

test('calendar aggregation preserves cents, zero months, year rollover and Eastern DST boundaries', () => {
  expect(
    dailyOrderValues(
      [
        { createdAt: new Date('2026-03-08T04:59:59Z'), totalAmount: '1.15' },
        { createdAt: new Date('2026-03-08T05:00:00Z'), totalAmount: '2.25' },
        { createdAt: new Date('2026-03-09T03:59:59Z'), totalAmount: '3.35' },
        { createdAt: new Date('2026-03-09T04:00:00Z'), totalAmount: '4.45' },
      ],
      '2026-03-09',
      3
    )
  ).toEqual([
    { date: '2026-03-07', value: 1.15 },
    { date: '2026-03-08', value: 5.6 },
    { date: '2026-03-09', value: 4.45 },
  ]);
  expect(
    dailyOrderValues(
      [
        { createdAt: new Date('2026-11-01T05:30:00Z'), totalAmount: 1 },
        { createdAt: new Date('2026-11-01T06:30:00Z'), totalAmount: 2 },
        { createdAt: new Date('2026-11-02T04:59:59Z'), totalAmount: 3 },
        { createdAt: new Date('2026-11-02T05:00:00Z'), totalAmount: 4 },
      ],
      '2026-11-02',
      2
    )
  ).toEqual([
    { date: '2026-11-01', value: 6 },
    { date: '2026-11-02', value: 4 },
  ]);
  expect(
    monthlyDeliveredValues(
      [
        { month: '2026-02', revenue: 20.25 },
        { month: '2025-12', revenue: 10.1 },
      ],
      '2025-11-20',
      '2026-03-15'
    ).points
  ).toEqual([
    { date: '2025-11', value: 0 },
    { date: '2025-12', value: 10.1 },
    { date: '2026-01', value: 0 },
    { date: '2026-02', value: 20.25 },
    { date: '2026-03', value: 0 },
  ]);
  expect(monthlyDeliveredValues([], '', today).points).toEqual([]);
  expect(monthlyDeliveredValues([], '2026-10-29', '2025-01-01').points).toEqual(
    []
  );
  expect(
    monthlyDeliveredValues(
      [{ month: '2026-01', revenue: 100 }],
      '1000-01-01',
      today
    ).activeMonthsOnly
  ).toBe(true);
  for (const value of [0, 0.01, 0.04, 0.1, 1250.25, 1234567.89])
    expect(valueAxisMaximum([value])).toBeGreaterThanOrEqual(value);
});

for (const width of [1440, 834, 390]) {
  test(`grower and buyer charts preserve values and support interaction at ${width}px`, async ({
    page,
    context,
  }) => {
    await auth(context);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/grower/dashboard');
    const daily = page.getByRole('region', {
      name: 'Delivered value',
      exact: true,
    });
    await expect(daily.locator('[data-chart-total]')).toHaveText(
      formatMoney(delivered30)
    );
    await daily.getByRole('button', { name: '7 days', exact: true }).click();
    await expect(daily.locator('[data-chart-total]')).toHaveText(
      formatMoney(delivered7)
    );
    const slider = daily.getByRole('slider');
    await slider.focus();
    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuenow', '1');
    await expect(daily.locator('[data-chart-selection]')).toContainText(
      '$2,250.35'
    );
    await page.keyboard.press('ArrowRight');
    await expect(daily.locator('[data-chart-selection]')).toContainText(
      '$0.00'
    );
    await page.keyboard.press('End');
    await expect(daily.locator('[data-chart-selection]')).toContainText(
      '$2,750.55'
    );
    await expect(
      daily.getByRole('button', { name: 'Next day' })
    ).toBeDisabled();
    await daily.getByRole('button', { name: 'Previous day' }).click();
    await expect(slider).toHaveAttribute('aria-valuenow', '6');
    await daily.getByText('Daily values', { exact: true }).click();
    await expect(daily.getByRole('row')).toHaveCount(8);
    await expect(daily.getByRole('row').last()).toContainText('$2,750.55');
    await daily.getByText('Daily values', { exact: true }).click();
    await daily.getByRole('button', { name: '30 days', exact: true }).click();
    await expect(slider).toHaveAttribute('aria-valuenow', '30');
    await capture(page, `grower-${width}`);

    await page.goto('/grower/reports?from=2025-01-01&to=2025-08-31');
    const monthly = page.getByRole('region', {
      name: 'Delivered value by month',
      exact: true,
    });
    await expect(monthly.locator('[data-chart-total]')).toHaveText(
      formatMoney(historicalTotal)
    );
    const monthlySlider = monthly.getByRole('slider');
    await monthlySlider.focus();
    await page.keyboard.press('Home');
    await expect(monthly.locator('[data-chart-selection]')).toContainText(
      '$1,250.25'
    );
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(monthly.locator('[data-chart-selection]')).toContainText(
      'March 2025'
    );
    await expect(monthly.locator('[data-chart-selection]')).toContainText(
      '$0.00'
    );
    await monthly.getByText('Monthly values', { exact: true }).click();
    await expect(monthly.getByRole('row')).toHaveCount(9);
    await expect(
      monthly.getByRole('row').filter({ hasText: 'March 2025' })
    ).toContainText('$0.00');
    const rows = await monthly.locator('tbody td').allTextContents();
    expect(
      rows.map((v) => Number(v.replace(/[$,]/g, ''))).reduce((a, b) => a + b, 0)
    ).toBeCloseTo(historicalTotal, 2);
    await monthly.getByText('Monthly values', { exact: true }).click();
    const productRanking = page.getByRole('region', {
      name: 'Top products',
      exact: true,
    });
    await expect(productRanking).toContainText('lb');
    await expect(productRanking.getByRole('listitem')).toHaveCount(5);
    await expect(
      productRanking.getByRole('button', { name: /Show all/ })
    ).toHaveCount(0);
    await monthlySlider.focus();
    await page.keyboard.press('ArrowLeft');
    await capture(page, `reports-${width}`);

    await auth(context, buyerToken);
    await page.goto('/dispensary/dashboard');
    const buyer = page.getByRole('region', {
      name: '7-day order value',
      exact: true,
    });
    await expect(buyer.locator('[data-chart-total]')).toHaveText(
      formatMoney(buyerTotal)
    );
    await buyer.getByText('Daily values', { exact: true }).click();
    await expect(buyer.getByRole('row').nth(6)).toContainText('$173.70');
    await expect(buyer.getByRole('row').last()).toContainText('$120.30');
    await buyer.getByText('Daily values', { exact: true }).click();
    await buyer.getByRole('slider').hover({ position: { x: 2, y: 20 } });
    await expect(buyer.getByRole('slider')).toHaveAttribute(
      'aria-valuenow',
      '1'
    );
    const box = await buyer.getByRole('slider').boundingBox();
    await page.mouse.click(box!.x + box!.width - 2, box!.y + 20);
    await expect(buyer.locator('[data-chart-selection]')).toContainText(
      '$120.30'
    );
    await capture(page, `buyer-${width}`);
  });
}

test('report ranges, ranking expansion and full CSV/PDF exports agree with chart values', async ({
  page,
  context,
}) => {
  await auth(context);
  await page.goto('/grower/reports?from=2025-01-01&to=2025-08-31');
  const csvReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const csv = await csvReady;
  const csvPath = `${shots}/report.csv`;
  await csv.saveAs(csvPath);
  const text = readFileSync(csvPath, 'utf8');
  expect(text).toContain(`"Delivered value","${historicalTotal.toFixed(2)}"`);
  expect(text).toContain('"Lb"');
  const pdfReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  const pdf = await pdfReady;
  const pdfPath = `${shots}/report.pdf`;
  await pdf.saveAs(pdfPath);
  expect(readFileSync(pdfPath, 'utf8')).toContain(historicalTotal.toFixed(2));
  await page.getByRole('link', { name: 'All time', exact: true }).click();
  const ranking = page.getByRole('region', {
    name: 'Top products',
    exact: true,
  });
  await ranking.getByRole('button', { name: /Show all/ }).click();
  await expect(ranking.getByRole('listitem')).toHaveCount(7);
  await ranking.getByRole('button', { name: 'Show top 5' }).click();
  await expect(ranking.getByRole('listitem')).toHaveCount(5);
  const customers = page.getByRole('region', {
    name: 'Top customers',
    exact: true,
  });
  await expect(customers.getByRole('listitem')).toHaveCount(5);
  await customers.getByRole('button', { name: 'Show all 8' }).click();
  await expect(customers.getByRole('listitem')).toHaveCount(8);
  await expect(ranking.getByRole('listitem')).toHaveCount(5);
  await customers.getByRole('button', { name: 'Show top 5' }).click();
  await expect(customers.getByRole('listitem')).toHaveCount(5);
});

test('touch can inspect points without preventing vertical scrolling', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await auth(context, buyerToken);
  const page = await context.newPage();
  await page.goto(`${base}/dispensary/dashboard`);
  const slider = page.getByRole('slider', {
    name: /Select day in 7-day order value/,
  });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await page.touchscreen.tap(box!.x + 2, box!.y + 30);
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  expect(await slider.evaluate((el) => getComputedStyle(el).touchAction)).toBe(
    'pan-y'
  );
  await page.touchscreen.tap(box!.x + box!.width - 2, box!.y + 30);
  await expect(slider).toHaveAttribute('aria-valuenow', '7');
  await context.close();
});

test('large values, single month, empty history and all-zero periods remain usable', async ({
  page,
  context,
}) => {
  await auth(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await order(
    1234567.89,
    'DELIVERED',
    new Date('2024-01-01'),
    new Date('2025-10-10T17:00:00Z')
  );
  await page.goto('/grower/reports?from=2025-10-01&to=2025-10-31');
  const chart = page.getByRole('region', {
    name: 'Delivered value by month',
    exact: true,
  });
  await expect(chart.locator('[data-chart-total]')).toHaveText('$1,234,567.89');
  await expect(
    chart.getByRole('button', { name: 'Previous month' })
  ).toBeDisabled();
  await expect(
    chart.getByRole('button', { name: 'Next month' })
  ).toBeDisabled();
  await capture(page, 'large-single-month-mobile');
  await db.order.deleteMany({ where: { growerId } });
  await page.goto('/grower/reports?range=all');
  await expect(
    chart.getByText('No delivered orders in this range.', { exact: true })
  ).toBeVisible();
  await expect(chart.getByRole('slider')).toHaveCount(0);
  await page.goto('/grower/dashboard');
  const daily = page.getByRole('region', {
    name: 'Delivered value',
    exact: true,
  });
  await expect(
    daily.getByText('No delivered orders in this period.', { exact: true })
  ).toBeVisible();
  await daily.getByText('Daily values', { exact: true }).click();
  await expect(daily.getByRole('row')).toHaveCount(31);
  await capture(page, 'empty-grower-mobile');
  await auth(context, buyerToken);
  await page.goto('/dispensary/dashboard');
  const buyer = page.getByRole('region', {
    name: '7-day order value',
    exact: true,
  });
  await expect(
    buyer.getByText('No requests or orders in the last 7 days.', {
      exact: true,
    })
  ).toBeVisible();
  await expect(buyer.getByRole('slider')).toHaveCount(0);
  await capture(page, 'empty-buyer-mobile');
});
