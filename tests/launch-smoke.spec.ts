import { test, expect, Page } from '@playwright/test';

const TEST_USERS = {
  grower: {
    email: 'grower@vtnurseries.com',
    password: 'password123',
  },
  dispensary: {
    email: 'dispensary@greenvermont.com',
    password: 'password123',
  },
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/dashboard|grower|dispensary|admin|\/$/, { timeout: 20000 });
}

test.describe('Launch smoke suite (safe, non-destructive)', () => {
  test('Grower products page loads', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/products');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page).toHaveURL(/\/grower\/products/);
    await expect(page.getByRole('heading', { name: /product management/i })).toBeVisible();
  });

  test('Grower add product save flow works (mocked API, no data writes)', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/products');
    await page.evaluate(() => window.sessionStorage.removeItem('addProductDraft'));

    let postSeen = false;
    await page.route('**/api/products', async (route) => {
      if (route.request().method() === 'POST') {
        postSeen = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'smoke-product-id',
            ok: true,
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/grower/products/add');
    await page.waitForSelector('#name', { timeout: 15000 });

    await page.fill('#name', `Smoke Product ${Date.now()}`);
    await page.selectOption('#productType', { index: 1 });
    await page.fill('#price', '19.99');
    await page.selectOption('#unit', 'Gram');
    await page.fill('#inventoryQty', '10');

    await page.getByRole('button', { name: 'Create Product' }).click();

    await expect
      .poll(() => postSeen, {
        message: 'expected create-product POST call to be made',
        timeout: 10000,
      })
      .toBeTruthy();

    await expect(page).toHaveURL(/\/grower\/products/);
  });

  test('Grower edit product save flow works (mocked API, no data writes)', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/products');
    await page.waitForLoadState('networkidle').catch(() => {});

    const editLink = page.locator('a[href*="/grower/products/"][href$="/edit"]').first();
    const editLinkCount = await editLink.count();
    test.skip(editLinkCount === 0, 'No editable products available in seed data');

    let putSeen = false;
    await page.route('**/api/products/*', async (route) => {
      if (route.request().method() === 'PUT') {
        putSeen = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
      return route.continue();
    });

    await editLink.click();
    await page.waitForSelector('#name', { timeout: 15000 });

    const originalName = await page.locator('#name').inputValue();
    await page.fill('#name', `${originalName} · smoke`);

    await page.getByRole('button', { name: 'Update Product' }).click();

    await expect
      .poll(() => putSeen, {
        message: 'expected update-product PUT call to be made',
        timeout: 10000,
      })
      .toBeTruthy();

    await expect(page).toHaveURL(/\/grower\/products/);
  });

  test('Dispensary catalog loads and add-to-cart updates local cart', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);

    await page.goto('/dispensary/catalog');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.getByRole('heading', { name: /product catalog/i })).toBeVisible();

    const addToCartButtons = page.getByRole('button', { name: /add to cart/i });
    const addToCartCount = await addToCartButtons.count();
    test.skip(addToCartCount === 0, 'No add-to-cart enabled products found in catalog');

    await page.evaluate(() => window.localStorage.removeItem('phenofarm-cart'));
    await addToCartButtons.first().click();

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
      }, {
        message: 'expected cart item to be written to localStorage',
        timeout: 10000,
      })
      .toBeGreaterThan(0);
  });
});
