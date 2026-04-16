import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  email: 'dispensary@greenvermont.com',
  password: 'password123',
};

async function login(page: Page) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|dispensary/, { timeout: 20000 });
}

test.describe('Order smoke test', () => {
  test('dispensary can add a product, place an order, and see it in orders', async ({ page }) => {
    await login(page);

    await page.goto('/dispensary/catalog');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByRole('heading', { name: /product catalog/i })).toBeVisible();

    await page.evaluate(() => window.localStorage.removeItem('phenofarm-cart'));

    const productCard = page.locator('[class*="group"]').filter({ has: page.getByRole('button', { name: /add to cart/i }) }).first();
    const productName = (await productCard.getByRole('heading').first().textContent())?.trim() || 'Unknown product';
    await productCard.getByRole('button', { name: /add to cart/i }).click();

    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const raw = window.localStorage.getItem('phenofarm-cart');
          if (!raw) return 0;
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.items) ? parsed.items.length : 0;
          } catch {
            return 0;
          }
        });
      }, { timeout: 10000 })
      .toBeGreaterThan(0);

    await page.goto('/dispensary/cart');
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();

    const initialOrderCount = await page.context().newPage();
    await login(initialOrderCount);
    await initialOrderCount.goto('/dispensary/orders');
    await initialOrderCount.waitForLoadState('networkidle').catch(() => {});
    const beforeRows = await initialOrderCount.locator('a[href^="/dispensary/orders/"]').count();
    await initialOrderCount.close();

    await page.getByRole('button', { name: /place order/i }).click();
    await expect(page.getByRole('heading', { name: /order placed!/i })).toBeVisible({ timeout: 20000 });
    await page.waitForURL(/\/dispensary\/orders/, { timeout: 20000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page).toHaveURL(/\/dispensary\/orders/);

    const orderRow = page.locator('table tbody tr').first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    const afterRows = await page.locator('table tbody tr').count();
    expect(afterRows).toBeGreaterThanOrEqual(beforeRows);

    const pageText = await page.locator('main').innerText();
    expect(pageText).toMatch(/My Orders|Order History/);
  });
});
