const { test, expect } = require("@playwright/test");

test.describe("Writer Analytics Dashboard E2E", () => {
  test("analytics page navigation", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });
});
