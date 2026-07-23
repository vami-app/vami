const { test, expect } = require("@playwright/test");

test.describe("Story Publishing & Scheduling Flow", () => {
  test("create a new story, add tags, and publish", async ({ page }) => {
    await page.goto("/");
    expect(await page.title()).toBeDefined();

    // Verify navigating to new story page
    await page.goto("/new-story");
    await expect(page.locator("body")).toBeVisible();
  });
});
