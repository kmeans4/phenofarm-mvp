import { expect, Page, test } from '@playwright/test';

const TEST_USERS = {
  admin: { email: 'admin@phenofarm.com', password: 'password123' },
  grower: { email: 'grower@vtnurseries.com', password: 'password123' },
  dispensary: { email: 'dispensary@greenvermont.com', password: 'password123' },
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|grower|dispensary|admin|\/$/, { timeout: 20000 });
}

test.describe('UX cleanup regressions', () => {
  test('admin settings is a read-only operations view instead of a no-op form', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.goto('/admin/settings');

    await expect(page.getByRole('heading', { name: 'Platform Settings' })).toBeVisible();
    await expect(page.getByText('Read-only operations view')).toBeVisible();
    await expect(page.getByRole('button', { name: /save settings/i })).toHaveCount(0);
    await expect(page.getByLabel(/subscription price/i)).toHaveCount(0);
  });

  test('grower pricing points to the real subscription management flow', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/pricing');

    await expect(page.getByRole('heading', { name: 'Cultivator Subscription Plans' })).toBeVisible();
    await expect(page.getByText('Buyer-seller wholesale payment is never collected in the app.')).toBeVisible();
    await expect(page.getByRole('link', { name: /manage subscription/i })).toBeVisible();
    await expect(page.getByText('Create Custom Tier')).toHaveCount(0);
  });

  test('dispensary catalog syncs existing browser saved state to account APIs', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);

    let favoritePutBody: unknown = null;
    let savedFilterPutBody: unknown = null;
    let priceAlertPutBody: unknown = null;

    await page.route('**/api/dispensary/catalog?**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], total: 0, hasMore: false }),
      })
    );

    await page.route('**/api/dispensary/favorites', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ productIds: ['server-product'] }),
        });
      }

      if (route.request().method() === 'PUT') {
        favoritePutBody = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(favoritePutBody),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [] }),
      });
    });

    await page.route('**/api/dispensary/saved-filters', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ filters: [] }),
        });
      }

      savedFilterPutBody = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedFilterPutBody),
      });
    });

    await page.route('**/api/dispensary/price-alerts', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ alerts: [] }),
        });
      }

      priceAlertPutBody = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(priceAlertPutBody),
      });
    });

    await page.goto('/dispensary/dashboard');
    await page.evaluate(() => {
      window.localStorage.setItem('phenofarm_favorites', JSON.stringify(['local-product']));
      window.localStorage.setItem('phenofarm_saved_filters', JSON.stringify([
        {
          id: 'local-filter',
          name: 'Local Flower',
          filters: {
            productTypes: ['Flower'],
            thcRanges: [],
            priceRanges: [],
            recentlyAdded: false,
            trending: false,
          },
          searchQuery: 'blue',
          sortBy: 'price-asc',
          createdAt: new Date().toISOString(),
        },
      ]));
      window.localStorage.setItem('phenofarm_price_alerts', JSON.stringify([
        {
          id: 'local-alert',
          productId: 'local-product',
          productName: 'Local Product',
          growerName: 'Local Grower',
          growerId: 'local-grower',
          targetPrice: 10,
          currentPrice: 12,
          thc: null,
          productType: 'Flower',
          unit: 'gram',
          createdAt: new Date().toISOString(),
          isTriggered: false,
        },
      ]));
    });

    await page.goto('/dispensary/catalog');
    await expect(page.getByRole('heading', { name: /product catalog/i })).toBeVisible();

    await expect.poll(() => favoritePutBody, { timeout: 10000 }).toMatchObject({
      productIds: expect.arrayContaining(['server-product', 'local-product']),
    });
    await expect.poll(() => savedFilterPutBody, { timeout: 10000 }).toMatchObject({
      filters: expect.arrayContaining([
        expect.objectContaining({ name: 'Local Flower', searchQuery: 'blue' }),
      ]),
    });
    await expect.poll(() => priceAlertPutBody, { timeout: 10000 }).toMatchObject({
      alerts: expect.arrayContaining([
        expect.objectContaining({ productId: 'local-product', targetPrice: 10 }),
      ]),
    });
  });
});
