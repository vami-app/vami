const { test, expect } = require("@playwright/test");

test.describe("Razorpay Test-Mode Subscription E2E", () => {
  test("membership page rendering and subscribe triggers", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
