import { test, expect, Page } from '@playwright/test';

const GROWER_USER = {
  email: 'grower@vtnurseries.com',
  password: 'password123',
};

async function login(page: Page) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', GROWER_USER.email);
  await page.fill('input[type="password"]', GROWER_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|grower|\/$/, { timeout: 20000 });
}

test.describe('Grower settings form', () => {
  test('keeps typed business information edits instead of refetching saved values', async ({ page }) => {
    await login(page);

    let settingsGetCount = 0;
    await page.route('**/api/grower/settings', async (route) => {
      if (route.request().method() === 'GET') {
        settingsGetCount += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            businessName: 'VT Nurseries',
            licenseNumber: 'VT-GROW-001',
            licenseExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
            contactName: 'Vera Tanner',
            email: GROWER_USER.email,
            phone: '(802) 555-0100',
            address: '100 Farm Road',
            city: 'Burlington',
            state: 'VT',
            zip: '05401',
            website: 'https://vtnurseries.example',
            description: 'Wholesale nursery and cultivation business.',
            logo: '',
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/grower/settings');

    const businessName = page.getByPlaceholder('Your business name');
    await expect(businessName).toHaveValue('VT Nurseries');

    await businessName.fill('VT Nurseries X');
    await page.waitForTimeout(1200);

    await expect(businessName).toHaveValue('VT Nurseries X');
    expect(settingsGetCount).toBe(1);
  });
});
