import { test, expect } from '@playwright/test';

const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000');
if (!['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Checkpoint UI checks require localhost');

test('landing FAQ works without JavaScript and interactive controls still work at mobile and desktop widths', async ({ browser, page }) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false, baseURL: origin.origin });
  try {
    const staticPage = await noJs.newPage();
    await staticPage.goto('/');
    await staticPage.getByText('Can we keep our prices private?', { exact: true }).click();
    await expect(staticPage.getByText('Yes. Every listing has per-product price visibility:', { exact: false })).toBeVisible();
  } finally { await noJs.close(); }
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByText('Can we keep our prices private?', { exact: true }).click();
    await expect(page.getByText('Yes. Every listing has per-product price visibility:', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Monthly', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Monthly', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Annual · save 20%', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});
