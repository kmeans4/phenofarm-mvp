import { test, Page } from '@playwright/test';

const TEST_USERS = {
  admin: { email: 'admin@phenofarm.com', password: 'password123' },
  grower: { email: 'grower@vtnurseries.com', password: 'password123' },
  dispensary: { email: 'dispensary@greenvermont.com', password: 'password123' }
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin|\//, { timeout: 20000 });
  await page.waitForTimeout(2000);
}

test('Capture all three dashboards for comparison', async ({ page }) => {
  // Create comparison directory
  await page.evaluate(() => {});
  
  // 1. Admin Dashboard (at /admin, not /admin/dashboard)
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  await page.goto('/admin');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/comparison/admin-dashboard.png', fullPage: true });
  
  // 2. Grower Dashboard
  await page.context().clearCookies();
  await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);
  await page.goto('/grower/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/comparison/grower-dashboard.png', fullPage: true });
  
  // 3. Dispensary Dashboard
  await page.context().clearCookies();
  await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
  await page.goto('/dispensary/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/comparison/dispensary-dashboard.png', fullPage: true });
});
