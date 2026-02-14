import { test, expect, Page } from '@playwright/test';

// Test credentials from the demo section
const TEST_USERS = {
  admin: {
    email: 'admin@phenofarm.com',
    password: 'password123',
    role: 'admin'
  },
  grower: {
    email: 'grower@vtnurseries.com',
    password: 'password123',
    role: 'grower'
  },
  dispensary: {
    email: 'dispensary@greenvermont.com',
    password: 'password123',
    role: 'dispensary'
  }
};

// Pages to screenshot for each role
const PAGES_BY_ROLE = {
  admin: [
    { path: '/admin', name: 'admin-dashboard' },
    { path: '/admin/users', name: 'admin-users' },
    { path: '/admin/growers', name: 'admin-growers' },
    { path: '/admin/dispensaries', name: 'admin-dispensaries' },
    { path: '/admin/settings', name: 'admin-settings' },
  ],
  grower: [
    { path: '/grower/dashboard', name: 'grower-dashboard' },
  ],
  dispensary: [
    { path: '/dispensary/dashboard', name: 'dispensary-dashboard' },
  ]
};

// Helper to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign_in');
  
  // Wait for form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login (to dashboard or home)
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
    // Might redirect to home instead
    return page.waitForURL('**/', { timeout: 5000 });
  });
  
  // Verify we're logged in by checking for a logout button or user menu
  await page.waitForSelector('text=/Dashboard|Sign out|Logout/i', { timeout: 10000 });
}

// Helper to take screenshot of a protected page
async function screenshotPage(page: Page, path: string, name: string) {
  await page.goto(path);
  
  // Wait for content to load
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  
  // Wait a bit for any dynamic content
  await page.waitForTimeout(1000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: `screenshots/${name}.png`,
    fullPage: true 
  });
}

// ============================================
// ADMIN TESTS
// ============================================
test.describe('Admin Auth Screenshots', () => {
  test.use({ storageState: undefined }); // Start fresh
  
  test('Admin login and dashboard screenshots', async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Take screenshots of admin pages
    for (const pageInfo of PAGES_BY_ROLE.admin) {
      await screenshotPage(page, pageInfo.path, pageInfo.name);
    }
  });
  
  test('Admin can view specific order detail', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Navigate to orders or a specific order if we have one
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Try to find and click an order link
    const orderLink = await page.$('a[href*="/orders/"]');
    if (orderLink) {
      await orderLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: 'screenshots/admin-order-detail.png', fullPage: true });
    } else {
      // Just screenshot the orders list
      await page.screenshot({ path: 'screenshots/admin-orders-list.png', fullPage: true });
    }
  });
  
  test('Admin can view product edit', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Navigate to products
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Try to find and click an edit link
    const editLink = await page.$('a[href*="/products/"][href*="edit"]');
    if (editLink) {
      await editLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: 'screenshots/admin-product-edit.png', fullPage: true });
    } else {
      // Just screenshot the products list
      await page.screenshot({ path: 'screenshots/admin-products-list.png', fullPage: true });
    }
  });
});

// ============================================
// GROWER TESTS
// ============================================
test.describe('Grower Auth Screenshots', () => {
  test.use({ storageState: undefined });
  
  test('Grower login and dashboard screenshot', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);
    
    for (const pageInfo of PAGES_BY_ROLE.grower) {
      await screenshotPage(page, pageInfo.path, pageInfo.name);
    }
  });
  
  test('Grower can view their products', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);
    
    await page.goto('/grower/products');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: 'screenshots/grower-products.png', fullPage: true });
  });
  
  test('Grower can view their orders', async ({ page }) => {
    await login(page, TEST_USERS.grower.email, TEST_USERS.grower.password);
    
    await page.goto('/grower/orders');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: 'screenshots/grower-orders.png', fullPage: true });
  });
});

// ============================================
// DISPENSARY TESTS
// ============================================
test.describe('Dispensary Auth Screenshots', () => {
  test.use({ storageState: undefined });
  
  test('Dispensary login and dashboard screenshot', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
    
    for (const pageInfo of PAGES_BY_ROLE.dispensary) {
      await screenshotPage(page, pageInfo.path, pageInfo.name);
    }
  });
  
  test('Dispensary can browse products', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
    
    await page.goto('/dispensary/products');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: 'screenshots/dispensary-products.png', fullPage: true });
  });
  
  test('Dispensary can view their orders', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
    
    await page.goto('/dispensary/orders');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: 'screenshots/dispensary-orders.png', fullPage: true });
  });
  
  test('Dispensary can view order detail', async ({ page }) => {
    await login(page, TEST_USERS.dispensary.email, TEST_USERS.dispensary.password);
    
    await page.goto('/dispensary/orders');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Try to find an order to view
    const orderLink = await page.$('a[href*="/orders/"]');
    if (orderLink) {
      await orderLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: 'screenshots/dispensary-order-detail.png', fullPage: true });
    } else {
      console.log('No order links found on dispensary orders page');
    }
  });
});

// ============================================
// SINGLE PAGE TEST (for testing specific pages)
// ============================================
test.describe('Single Page Tests', () => {
  test('Screenshot specific admin page', async ({ page }) => {
    // You can modify the path to test any specific page
    const targetPath = process.env.TEST_PAGE || '/admin';
    
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    await page.goto(targetPath);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Generate filename from path
    const fileName = targetPath.replace(/^\//, '').replace(/\//g, '-');
    await page.screenshot({ 
      path: `screenshots/${fileName}.png`,
      fullPage: true 
    });
  });
});
