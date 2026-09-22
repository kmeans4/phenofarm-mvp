import { test, expect, type Locator } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const buyerState = process.env.UI_BUYER_STATE;
const fixtureProductId = process.env.UI_BUYER_PRODUCT_ID || 'product-001';
const fixtureGrowerId = process.env.UI_BUYER_GROWER_ID || 'grower-001';

// These checks use an explicitly supplied session for the disposable UI-review clone.
// They never submit an order, message, favorite change, or profile update.
test.skip(!buyerState || !baseURL, 'Supply UI_BUYER_STATE and the isolated local PLAYWRIGHT_BASE_URL.');
if (baseURL && !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
  throw new Error('Buyer UI regression checks require a local review server.');
}
test.use({ storageState: buyerState });

async function expectReachable(target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  const result = await target.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const failures: string[] = [];
    if (rect.width <= 0 || rect.height <= 0) failures.push('empty bounds');
    if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) failures.push('outside viewport');
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const bounds = parent.getBoundingClientRect();
      if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) failures.push('clipped horizontally');
      if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push('clipped vertically');
    }
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!hit || !element.contains(hit)) failures.push('covered by another layer');
    return failures;
  });
  expect(result).toEqual([]);
}

test('desktop filter sidebar preserves quantity and add controls inside product cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dispensary/catalog');
  await page.getByRole('button', { name: 'Toggle filters', exact: true }).click();
  const card = page.locator(`#catalog-product-${fixtureProductId}`);
  await expectReachable(card.getByRole('button', { name: /Increase quantity/ }));
  await expectReachable(card.getByRole('button', { name: 'Add to draft', exact: true }));
  const input = card.getByRole('spinbutton');
  await card.getByRole('button', { name: /Increase quantity/ }).click();
  await expect(input).toHaveValue('2');
});

test('mobile catalog list keeps price, identity and Add in separate visible areas', async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/dispensary/catalog');
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    const card = page.locator(`#catalog-product-${fixtureProductId}`);
    await expectReachable(card.locator('[data-product-price]'));
    await expectReachable(card.getByRole('button', { name: /Add .* to request draft/ }));
    const geometry = await card.evaluate(element => {
      const title = element.querySelector('h3')!.getBoundingClientRect();
      const price = element.querySelector('[data-product-price]')!.getBoundingClientRect();
      return { titleWidth: title.width, separateRows: price.top >= title.bottom };
    });
    expect(geometry.titleWidth).toBeGreaterThan(140);
    expect(geometry.separateRows).toBe(true);
  }
});

test('comparison dialog stays above navigation and remains keyboard dismissible at three widths', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('phenofarm_compare_products'));
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto('/dispensary/catalog');
    await page.locator('button[aria-label^="Compare "]').first().click();
    await page.locator('button[aria-label^="Compare "]').first().click();
    await page.getByRole('button', { name: 'Compare Now', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /^Compare \(2\)/ });
    await expectReachable(dialog.getByRole('heading', { name: /^Compare/ }));
    await expectReachable(dialog.getByRole('button', { name: 'Close product comparison' }));
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }
});

test('mobile saved list keeps quote action below readable product identity', async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/dispensary/saved?tab=favorites');
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    const card = page.locator('[data-product-row]').first();
    await expectReachable(card.getByRole('button', { name: 'Request pricing', exact: true }));
    const separate = await card.evaluate(element => {
      const title = element.querySelector('h3')!.getBoundingClientRect();
      const button = Array.from(element.querySelectorAll('button')).find(node => node.textContent?.includes('Request pricing'))!.getBoundingClientRect();
      return title.width > 140 && button.top >= title.bottom;
    });
    expect(separate).toBe(true);
  }
});

test('request review keeps both footer actions visible above navigation', async ({ page }) => {
  await page.addInitScript(({ productId, growerId }) => {
    localStorage.setItem('phenofarm-cart', JSON.stringify({
      items: [{ id: productId, name: 'Purple Haze Flowers', grower: 'Vermont Nurseries', growerId, price: 25, quantity: 2, maxQty: 240, unit: 'Gram', isPriceVisible: true }],
      subtotal: 50, tax: 0, total: 50,
    }));
  }, { productId: fixtureProductId, growerId: fixtureGrowerId });
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto('/dispensary/cart');
    const review = page.getByRole('button', { name: /^Review request$/i }).first();
    await expect(review).toBeEnabled();
    await review.click();
    const dialog = page.getByRole('dialog', { name: 'Review request', exact: true });
    await expectReachable(dialog.getByRole('heading', { name: 'Review request', exact: true }));
    await expectReachable(dialog.getByRole('button', { name: 'Submit request', exact: true }));
    await expectReachable(dialog.getByRole('button', { name: 'Back', exact: true }));
    await dialog.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
});

test('mobile draft filters can be saved and existing presets remain reachable on a short phone', async ({ page }) => {
  const saved = [{
    id: 'mobile-review-preset', name: 'Saved flower selection',
    filters: { productTypes: ['Flower'], thcRanges: [], priceRanges: [], recentlyAdded: false, trending: false },
    searchQuery: '', sortBy: 'default', createdAt: '2026-09-17T00:00:00.000Z',
  }];
  let submitted: typeof saved | undefined;
  // Intercept the complete collection endpoint: saving exercises the UI and payload
  // while never writing to the review database.
  await page.route('**/api/dispensary/saved-filters', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { filters: saved } });
      return;
    }
    expect(route.request().method()).toBe('PUT');
    submitted = route.request().postDataJSON().filters;
    await route.fulfill({ json: { filters: submitted } });
  });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/dispensary/catalog');
  const toggle = page.getByRole('button', { name: 'Toggle filters', exact: true });
  await toggle.click();
  const sheet = page.getByRole('dialog', { name: 'Catalog filters', exact: true });
  const saveDraft = sheet.getByRole('button', { name: 'Save filter', exact: true });
  await expect(saveDraft).toBeDisabled();
  await sheet.getByRole('button', { name: /^Flower\s/ }).click();
  await expect(saveDraft).toBeEnabled();
  await expectReachable(saveDraft);
  await expectReachable(sheet.getByRole('button', { name: 'Apply filters', exact: true }));
  await saveDraft.click();
  const nameDialog = page.getByRole('dialog', { name: 'Save Filter', exact: true });
  await expect(nameDialog.getByText('Flower', { exact: true })).toBeVisible();
  await nameDialog.getByPlaceholder('e.g., High THC Flower Under $20').fill('Mobile draft selection');
  await nameDialog.getByRole('button', { name: 'Save Filter', exact: true }).click();
  await expect.poll(() => submitted?.find(item => item.name === 'Mobile draft selection')?.filters.productTypes).toEqual(['Flower']);
  await toggle.click();
  await sheet.locator('summary').click();
  await expectReachable(sheet.getByRole('button', { name: 'Saved flower selection', exact: true }));
  await expectReachable(sheet.getByRole('button', { name: 'Delete saved filter Saved flower selection', exact: true }));
  await sheet.getByRole('button', { name: 'Saved flower selection', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/productTypes=Flower/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Save Current Filter', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(sheet).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.locator('body').evaluate(element => getComputedStyle(element).overflow)).not.toBe('hidden');
});
