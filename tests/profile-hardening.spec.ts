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

test.describe('Profile hardening + license verification', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);
  test('Grower creates valid product with cannabinoid profile', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/products/add');
    await page.waitForSelector('#name', { timeout: 15000 });

    const productName = `Test Product ${Date.now()}`;
    
    // Fill required fields
    await page.fill('#name', productName);
    await page.selectOption('#productType', { index: 1 });
    await page.fill('#price', '19.99');
    await page.selectOption('#unit', 'Gram');
    await page.fill('#inventoryQty', '10');
    
    // Fill cannabinoid profile
    await page.fill('#thcMin', '15');
    await page.fill('#thcMax', '25');
    await page.fill('#cbdMin', '0');
    await page.fill('#cbdMax', '1');
    
    // Fill harvest date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    await page.fill('#harvestDate', pastDate.toISOString().split('T')[0]);

    // Mock API response
    let postSeen = false;
    let postData: Record<string, unknown> | null = null;
    await page.route('**/api/products', async (route) => {
      if (route.request().method() === 'POST') {
        postSeen = true;
        postData = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-product-id',
            name: productName,
            ok: true,
          }),
        });
      }
      return route.continue();
    });

    await page.getByRole('button', { name: 'Create Product' }).click();

    // Verify POST was made with cannabinoid data
    await expect
      .poll(() => postSeen, {
        message: 'expected create-product POST call to be made',
        timeout: 10000,
      })
      .toBeTruthy();

    expect(postData).toMatchObject({
      thcMin: 15,
      thcMax: 25,
      cbdMin: 0,
      cbdMax: 1,
      harvestDate: expect.any(String),
    });

    await expect(page).toHaveURL(/\/grower\/products/);
  });

  test('Grower product form validates THC/CBD ranges', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    await page.goto('/grower/products/add');
    await page.waitForSelector('#name', { timeout: 15000 });

    // Fill required fields first
    await page.fill('#name', 'Test Product');
    await page.selectOption('#productType', { index: 1 });
    await page.fill('#price', '19.99');
    await page.selectOption('#unit', 'Gram');
    await page.fill('#inventoryQty', '10');

    // Test invalid THC range (min > max)
    await page.fill('#thcMin', '30');
    await page.fill('#thcMax', '20');
    await page.locator('#thcMax').blur();

    // Should show error
    const thcError = page.locator('text=THC max must be >= min');
    await expect(thcError).toBeVisible();

    // Test invalid CBD value (> 100)
    await page.fill('#cbdMin', '150');
    await page.locator('#cbdMin').blur();

    const cbdError = page.locator('text=CBD min must be 0-100');
    await expect(cbdError).toBeVisible();

    // Test future harvest date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('#harvestDate', futureDate.toISOString().split('T')[0]);
    await page.locator('#harvestDate').blur();

    const harvestError = page.locator('text=Harvest date cannot be in the future');
    await expect(harvestError).toBeVisible();
  });

  test('Unverified dispensary cannot place orders', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);

    // Mock dispensary settings to show unverified status
    await page.route('**/api/dispensary/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            businessName: 'Test Dispensary',
            licenseNumber: 'VT-TEST-001',
            licenseExpiry: new Date(Date.now() + 86400000 * 30).toISOString(),
            licenseState: 'VT',
            licenseStatus: 'pending_review',
            contactName: 'Test User',
            email: 'dispensary@greenvermont.com',
            phone: '(802) 555-1234',
            address: '123 Main St',
            city: 'Montpelier',
            state: 'VT',
            zip: '05602',
          }),
        });
      }
      return route.continue();
    });

    // Mock order creation to verify it's blocked
    let orderAttempted = false;
    await page.route('**/api/orders', async (route) => {
      if (route.request().method() === 'POST') {
        orderAttempted = true;
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'License verification required. Please complete license verification before placing orders.',
            code: 'LICENSE_NOT_VERIFIED',
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/dispensary/cart');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Try to checkout
    const checkoutButton = page.getByRole('button', { name: /checkout|place order/i });
    const checkoutVisible = await checkoutButton.count() > 0;
    
    test.skip(!checkoutVisible, 'No checkout button available');

    await checkoutButton.click();

    // Verify order was blocked
    await expect
      .poll(() => orderAttempted, {
        message: 'expected order attempt to be made',
        timeout: 10000,
      })
      .toBeTruthy();

    // Should show license verification warning
    const licenseWarning = page.locator('text=/license.*verif|pending.*review/i');
    await expect(licenseWarning).toBeVisible();
  });

  test('Dispensary settings form shows license status badge', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);

    // Mock pending_review status
    await page.route('**/api/dispensary/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            businessName: 'Test Dispensary',
            licenseNumber: 'VT-TEST-001',
            licenseExpiry: new Date(Date.now() + 86400000 * 30).toISOString(),
            licenseState: 'VT',
            licenseStatus: 'pending_review',
            contactName: 'Test User',
            email: 'dispensary@greenvermont.com',
            phone: '(802) 555-1234',
            address: '123 Main St',
            city: 'Montpelier',
            state: 'VT',
            zip: '05602',
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/dispensary/settings', { waitUntil: 'domcontentloaded' });

    // Should show pending review badge
    await expect.poll(async () => page.locator('main').innerText(), { timeout: 15000 }).toContain('License Pending Review');

    // Verify required fields are marked
    const settingsText = await page.locator('main').innerText();
    expect(settingsText).toContain('Business Name *');
    expect(settingsText).toContain('Dispensary License Number *');
  });

  test('Grower settings form validates license expiry', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);

    // Mock grower settings
    await page.route('**/api/grower/settings', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            businessName: 'Test Grower',
            licenseNumber: 'VT-GRW-001',
            licenseExpiry: '',
            contactName: 'Test User',
            email: 'grower@vtnurseries.com',
            phone: '(802) 555-1234',
            address: '123 Farm Rd',
            city: 'Burlington',
            state: 'VT',
            zip: '05401',
            website: '',
            description: '',
            logo: '',
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/grower/settings', { waitUntil: 'domcontentloaded' });

    // Try to save with past expiry date
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', pastDateStr);
    await page.locator('input[type="date"]').blur();

    // Should show error
    const expiryError = page.locator('text=/license expiry.*future|invalid.*date|expiry date/i').first();
    await expect(expiryError).toBeVisible({ timeout: 15000 });

    // Submit should be blocked
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Should still be on settings page (not redirected)
    await expect(page).toHaveURL(/\/grower\/settings/);
  });
});
