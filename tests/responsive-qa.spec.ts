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

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 900 },
] as const;

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|grower|dispensary|admin|\/$/, { timeout: 20000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(
      async () => {
        return await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - window.innerWidth;
        });
      },
      { timeout: 5000 }
    )
    .toBeLessThanOrEqual(2);
}

async function openAndCheck(page: Page, path: string, headingRegex: RegExp) {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => {});

  await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
  await expect(page.getByRole('heading', { name: headingRegex })).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

test.describe('Responsive QA sweep for launch-critical grower + dispensary paths', () => {
  test('Grower critical paths are responsive at 375 / 768 / 1280', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.context().clearCookies();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

      await openAndCheck(page, '/grower/dashboard', /grower dashboard/i);
      await openAndCheck(page, '/grower/products', /product management/i);
      await openAndCheck(page, '/grower/products/add', /add new product/i);

      await expect(page.locator('#name')).toBeVisible();
      await expect(page.getByRole('button', { name: /create product/i })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test('Dispensary critical paths are responsive at 375 / 768 / 1280', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.context().clearCookies();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);

      await openAndCheck(page, '/dispensary/dashboard', /dispensary dashboard/i);
      await openAndCheck(page, '/dispensary/catalog', /product catalog/i);

      const topAddToCartButton = page.getByRole('button', { name: /add to cart/i }).first();
      const addToCartCount = await page.getByRole('button', { name: /add to cart/i }).count();
      test.skip(addToCartCount === 0, 'No add-to-cart enabled products found in catalog seed data');

      await expect(topAddToCartButton).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
