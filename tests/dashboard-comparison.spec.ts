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
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => 
    page.waitForURL('**/admin**', { timeout: 5000 })
  );
  await page.waitForSelector('text=/Dashboard|Sign out|Logout|Admin/i', { timeout: 10000 });
}

// Priority 1: Grower Dashboard
test('Comparison - Grower Dashboard', async ({ page }) => {
  await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);
  await page.goto('/grower/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/comparison/grower-dashboard.png', fullPage: true });
});

// Priority 2: Admin Dashboard (at /admin, not /admin/dashboard)
test('Comparison - Admin Dashboard', async ({ page }) => {
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  await page.goto('/admin'); // Admin dashboard is at /admin, not /admin/dashboard
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/comparison/admin-dashboard.png', fullPage: true });
});

// Priority 3: Dispensary Dashboard
test('Comparison - Dispensary Dashboard', async ({ page }) => {
  await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
  await page.goto('/dispensary/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/comparison/dispensary-dashboard.png', fullPage: true });
});
