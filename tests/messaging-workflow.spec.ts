import { test, expect, type Browser, type Page } from '@playwright/test';

test.describe('Messaging Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  async function login(page: Page, role: 'grower' | 'dispensary') {
    await page.context().clearCookies();
    await page.goto('/auth/sign_in', { waitUntil: 'networkidle' });

    const credentials = role === 'grower'
      ? { email: 'grower@vtnurseries.com', password: 'password123', destination: '**/grower/dashboard' }
      : { email: 'dispensary@greenvermont.com', password: 'password123', destination: '**/dispensary/dashboard' };

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(passwordInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill(credentials.email);
    await passwordInput.fill(credentials.password);
    await passwordInput.press('Enter');
    await page.waitForURL(credentials.destination, { timeout: 15000 });
  }

  async function openChat(page: Page) {
    await page.getByTestId('chat-button').click();
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  }

  async function closeChat(page: Page) {
    await page.getByTestId('close-chat').click();
    await expect(page.getByRole('heading', { name: 'Messages' })).not.toBeVisible();
  }

  async function selectLatestConversation(page: Page) {
    const firstConversation = page.getByTestId('conversation-item').first();
    await expect(firstConversation).toBeVisible();
    await firstConversation.click();
  }

  async function createConversationFromCatalog(page: Page, note: string) {
    await page.goto('/dispensary/catalog');
    await page.waitForURL('**/dispensary/catalog');
    await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible({ timeout: 15000 });

    const messageGrowerButton = page.getByRole('button', { name: 'Message Grower' }).first();
    await expect(messageGrowerButton).toBeVisible({ timeout: 15000 });
    await messageGrowerButton.click();

    await expect(page.getByRole('heading', { name: 'Message Grower' })).toBeVisible();

    const modalTextarea = page.locator('textarea').first();
    await modalTextarea.fill(note);
    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    await expect(page.getByTestId('conversation-item').first()).toContainText(note);
    await expect(page.getByTestId('message-bubble').filter({ hasText: note }).last()).toBeVisible({ timeout: 15000 });
  }

  async function openLatestConversationAs(browser: Browser, role: 'grower' | 'dispensary') {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, role);
    await openChat(page);
    await selectLatestConversation(page);
    return { context, page };
  }

  test('pricing request UI: send and display', async ({ page }) => {
    const token = `pricing-${Date.now()}`;
    const initialMessage = `Automated pricing check ${token}`;

    await login(page, 'dispensary');
    await createConversationFromCatalog(page, initialMessage);

    await page.getByTestId('request-pricing').click();

    await expect(
      page
        .getByTestId('pricing-request-message')
        .last()
        .getByText('Requesting pricing for this product. Please send an offer.')
    ).toBeVisible();
  });

  test('offer workflow: send → counter → accept', async ({ browser }) => {
    const token = Date.now();
    const initialMessage = `Automated offer setup ${token}`;
    const offerNote = `Automated offer ${token}`;
    const counterNote = `Automated counter ${token}`;

    const dispensaryContext = await browser.newContext();
    const dispensaryPage = await dispensaryContext.newPage();
    await login(dispensaryPage, 'dispensary');
    await createConversationFromCatalog(dispensaryPage, initialMessage);
    await closeChat(dispensaryPage);

    const { context: growerContext, page: growerPage } = await openLatestConversationAs(browser, 'grower');
    await growerPage.getByTestId('toggle-offer-composer').click();
    await growerPage.locator('input[placeholder="Offer unit price"]').fill('125');
    await growerPage.locator('input[placeholder="Qty (optional)"]').first().fill('10');
    await growerPage.locator('input[placeholder="Offer note (optional)"]').fill(offerNote);
    await growerPage.getByTestId('send-offer').click();
    await expect(growerPage.getByText(offerNote)).toBeVisible();

    await openChat(dispensaryPage);
    await selectLatestConversation(dispensaryPage);

    const incomingOffer = dispensaryPage.getByTestId('offer-message').filter({ hasText: offerNote }).first();
    await expect(incomingOffer).toBeVisible();
    await incomingOffer.getByRole('button', { name: 'Counter' }).click();
    await dispensaryPage.locator('input[placeholder="Unit price"]').fill('115');
    await dispensaryPage.locator('input[placeholder="Qty (optional)"]').last().fill('8');
    await dispensaryPage.locator('input[placeholder="Counter note (optional)"]').fill(counterNote);
    await dispensaryPage.getByTestId('send-counter').click();
    await expect(dispensaryPage.getByText(counterNote)).toBeVisible();

    await growerPage.reload();
    await openChat(growerPage);
    await selectLatestConversation(growerPage);

    const counterOffer = growerPage.getByTestId('offer-message').filter({ hasText: counterNote }).first();
    await expect(counterOffer).toBeVisible();
    await counterOffer.getByRole('button', { name: 'Accept' }).click();
    await expect(counterOffer.getByText('Accepted')).toBeVisible();

    await growerContext.close();
    await dispensaryContext.close();
  });

  test('read status tracking', async ({ browser }) => {
    const token = `read-${Date.now()}`;
    const readCheckMessage = `Automated unread check ${token}`;

    const dispensaryContext = await browser.newContext();
    const dispensaryPage = await dispensaryContext.newPage();
    await login(dispensaryPage, 'dispensary');
    await createConversationFromCatalog(dispensaryPage, readCheckMessage);
    await closeChat(dispensaryPage);

    const growerContext = await browser.newContext();
    const growerPage = await growerContext.newPage();
    await login(growerPage, 'grower');

    await expect(growerPage.getByTestId('unread-badge')).toBeVisible({ timeout: 15000 });

    await openChat(growerPage);
    await selectLatestConversation(growerPage);
    await expect(growerPage.getByTestId('message-bubble').filter({ hasText: readCheckMessage }).last()).toBeVisible({ timeout: 15000 });
    await expect(growerPage.getByTestId('conversation-unread-badge').first()).not.toBeVisible({ timeout: 10000 });
    await closeChat(growerPage);
    await expect(growerPage.getByTestId('unread-badge')).not.toBeVisible({ timeout: 10000 });

    await dispensaryContext.close();
    await growerContext.close();
  });
});
