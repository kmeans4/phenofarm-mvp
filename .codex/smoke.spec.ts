import { expect, test } from "@playwright/test";

const baseURL = process.env.SMOKE_BASE_URL
  ?? process.env.NEXT_PUBLIC_APP_URL
  ?? process.env.NEXT_PUBLIC_SITE_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? "http://127.0.0.1:3000";
const homePath = "/";
const secondaryPath = "/auth/sign_in";
const allowedStatuses = new Set([200, 301, 302, 307, 308, 401, 403]);

test.describe("PhenoFarm smoke", () => {
  test("home page loads without severe console errors", async ({ page }) => {
    const severeErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") severeErrors.push(message.text());
    });
    const response = await page.goto(new URL(homePath, baseURL).toString(), { waitUntil: "domcontentloaded" });
    expect(response, "home page response").not.toBeNull();
    expect(allowedStatuses.has(response!.status()), "unexpected status " + response?.status()).toBe(true);
    await expect(page.locator("body")).toBeVisible();
    expect(severeErrors.slice(0, 5)).toEqual([]);
  });

  test("main app route responds or redirects intentionally", async ({ page }) => {
    const response = await page.goto(new URL(secondaryPath, baseURL).toString(), { waitUntil: "domcontentloaded" });
    expect(response, "secondary route response").not.toBeNull();
    expect(allowedStatuses.has(response!.status()), "unexpected status " + response?.status()).toBe(true);
    await expect(page.locator("body")).toBeVisible();
  });
});
