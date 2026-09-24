import { test, expect } from '@playwright/test';
import { formatCalendarMonth } from '../lib/calendar-month';

const state = process.env.UI_GROWER_STATE;
const buyerState = process.env.UI_BUYER_STATE;
const evidence = process.env.UI_EVIDENCE_DIR || 'docs/reviews/ui-2026-09-17/remediation/root';
test.setTimeout(60000);

// A calendar bucket is not an instant in the viewer's timezone.
test('report month buckets stay stable across timezones and reject malformed input', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo', 'UTC']) {
      process.env.TZ = zone;
      expect(formatCalendarMonth('2026-09')).toBe('Sep 26');
      expect(formatCalendarMonth('2026-09', true)).toBe('September 2026');
      expect(formatCalendarMonth('2026-01', true)).toBe('January 2026');
    }
    for (const value of [null, undefined, '', '2026-00', '2026-13', '2026-9', 'invalid']) expect(formatCalendarMonth(value)).toBe('');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test.describe('shared controls on a populated portal', () => {
  test.use({ storageState: state });
  test.beforeEach(() => { if (!state) throw new Error('UI_GROWER_STATE must point to the isolated local fixture session.'); });

  test('mobile settings save appears for profile edits and clears after saving', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/grower/settings');
    const save = page.getByRole('button', { name: 'Save profile', exact: true });
    await expect(save).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
    const contact = page.locator('#profile-contactName');
    const original = await contact.inputValue();
    await contact.fill(`${original} UI check`);
    await page.locator('#profile-licenseExpiry').fill('2030-12-31');
    await expect(save.locator('visible=true')).toHaveCount(1);
    await page.route('**/api/grower/settings', async route => {
      if (route.request().method() === 'PUT') await route.fulfill({ json: { success: true } });
      else await route.continue();
    });
    await save.locator('visible=true').click();
    await expect(save).toHaveCount(0);
    await expect(page.getByText('Settings saved successfully!')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('search has touch-sized actions, correct singular result and keyboard-only desktop hints', async ({ page }) => {
    await page.route('**/api/search?*', route => route.fulfill({ json: { results: [{ id: 'one', type: 'product', title: 'Purple Haze', subtitle: 'Flower', href: '/grower/products/one/edit' }] } }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/grower/dashboard', { waitUntil: 'networkidle' });
    await page.locator('button[aria-label="Search"]:visible').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toContainText('0 results');
    await dialog.getByPlaceholder('Search PhenoShop').fill('Purple');
    await expect(dialog.getByText('1 result', { exact: true })).toBeVisible();
    await expect(dialog.getByText('↑↓ navigate · ↵ open · esc close', { exact: true })).not.toBeVisible();
    const secondary = dialog.locator('button[aria-label]:not([aria-label="Close search"])');
    for (const button of await secondary.all()) { const box = await button.boundingBox(); if (box) { expect(box.width).toBeGreaterThanOrEqual(40); expect(box.height).toBeGreaterThanOrEqual(40); } }
    await page.screenshot({ path: `${evidence}/search-one-mobile.png` });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('messaging replaces the composer with a labeled quote and restores the unsent text', async ({ page }) => {
    const conversation = { id: 'density-chat', growerId: 'grower-001', dispensaryId: 'dispensary-001', productId: 'product-001', product: { id: 'product-001', name: 'Purple Haze', unit: 'Gram' }, lastMessageAt: '2026-09-17T10:00:00Z', unreadCount: 0, lastMessagePreview: 'Pricing', counterpart: { id: 'buyer', name: 'Green Vermont Dispensary', role: 'DISPENSARY' } };
    await page.route('**/api/messages/conversations', route => route.fulfill({ json: { conversations: [conversation] } }));
    await page.route('**/api/messages/conversations/*/messages*', route => route.fulfill({ json: { messages: [], offerUpdates: [] } }));
    await page.route('**/api/messages/conversations/*/read', route => route.fulfill({ json: { ok: true, unreadCount: 0 } }));
    for (const width of [1440, 390, 360]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto('/grower/dashboard', { waitUntil: 'networkidle' });
      await page.getByTestId('chat-button').click();
      if (width === 1440) { await expect(page.getByText('Choose a conversation', { exact: true })).toHaveCount(1); await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveCount(0); }
      await page.getByTestId('conversation-item').click();
      const message = page.getByRole('textbox', { name: 'Message', exact: true });
      await message.fill('Keep this unsent message');
      await page.getByRole('combobox', { name: 'Message templates' }).selectOption('0');
      await expect(message).toHaveValue(/Keep this unsent message\n/);
      const draft = await message.inputValue();
      await page.locator('summary').filter({ hasText: /^Quote$/ }).click();
      await page.getByTestId('toggle-offer-composer').click();
      await expect(message).toHaveCount(0);
      await expect(page.getByLabel('Unit price ($/Gram)')).toBeVisible();
      await expect(page.getByLabel('Terms (optional)')).toBeVisible();
      await expect(page.getByTestId('send-offer')).toBeVisible();
      const sendBox = await page.getByTestId('send-offer').boundingBox();
      expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(width === 1440 ? 1000 : 844);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${evidence}/quote-${width}.png` });
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(message).toHaveValue(draft);
      await page.keyboard.press('Escape');
    }
  });

  test('notifications anchor beside the trigger and group repeated history', async ({ page }) => {
    const item = { title: 'Revised quote', body: 'Green Vermont · Purple Haze', href: '/grower/dashboard', readAt: null, createdAt: '2026-09-17T10:00:00Z' };
    await page.route('**/api/notifications', route => route.fulfill({ json: { notifications: [1, 2, 3].map(id => ({ ...item, id: String(id) })), unreadCount: 3 } }));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/grower/dashboard', { waitUntil: 'networkidle' });
    const trigger = page.locator('button[aria-label="Notifications"]:visible'); await trigger.click();
    const panel = page.getByRole('region', { name: 'Notifications panel' });
    await expect(panel.locator('summary')).toContainText('Revised quote · 3');
    const a = await trigger.boundingBox(), b = await panel.boundingBox();
    expect(b!.x).toBeGreaterThan(a!.x); expect(b!.x - a!.x - a!.width).toBeLessThan(30);
    await panel.locator('summary').click(); await expect(panel.getByRole('button').filter({ hasText: 'Green Vermont' })).toHaveCount(3);
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  });
});

test('recent shops use the business name and missing pages offer recovery', async ({ browser }) => {
  if (!buyerState) throw new Error('UI_BUYER_STATE is required.');
  const context = await browser.newContext({ storageState: buyerState }); const page = await context.newPage();
  await page.goto('/dispensary/grower/grower-001');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vermont Nurseries');
  await expect.poll(() => page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('recent')).map(([, value]) => value).join(''))).toContain('Vermont Nurseries');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/missing-review-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('href', '/dashboard');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await context.close();
});

test('mobile Messages restores focus after Escape and notifications hide floating controls', async ({ browser }) => {
  for (const [role, storageState] of [['grower', state], ['dispensary', buyerState]] as const) {
    if (!storageState) throw new Error('Both isolated UI fixture sessions are required.');
    const context = await browser.newContext({ storageState, viewport: { width: 360, height: 800 } });
    try {
      const page = await context.newPage();
      await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3144'}/${role}/dashboard`);
      const messages = page.getByRole('button', { name: 'Open messages', exact: true });
      await messages.click();
      await expect(page.getByRole('dialog', { name: 'Messages', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(messages).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('button[aria-label="Search"]:visible')).toBeFocused();
      const notifications = page.getByRole('button', { name: 'Notifications', exact: true }).locator('visible=true');
      await notifications.click();
      await expect(page.locator('[data-notifications-panel]')).toBeVisible();
      await expect(messages).not.toBeVisible();
      await page.keyboard.press('Escape');
      await expect(messages).toBeVisible();
      await expect(notifications).toBeFocused();
    } finally { await context.close(); }
  }
});
