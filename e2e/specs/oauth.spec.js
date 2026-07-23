const { test, expect } = require("@playwright/test");

test.describe("OAuth Buttons and Navigation E2E", () => {
  test("login page renders Google and GitHub OAuth buttons", async ({ page }) => {
    await page.goto("/login");

    const googleBtn = page.locator('a[href*="/api/auth/google"]');
    const githubBtn = page.locator('a[href*="/api/auth/github"]');

    await expect(googleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();
  });
});
