const { test, expect } = require("@playwright/test");

test.describe("User Authentication & Onboarding Journeys", () => {
  test("user registration, login, and logout", async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@inkwell.test`;
    const password = "Password123!";

    // 1. Register
    await page.goto("/register");
    await page.fill('input[name="name"], input[placeholder*="name" i]', "Test User");
    await page.fill('input[name="username"], input[placeholder*="username" i]', `user_${timestamp}`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    await page.click('button[type="submit"]');

    // Should redirect after registration
    await page.waitForURL((url) => !url.pathname.includes("/register"));

    // 2. Logout
    await page.click('button[aria-label="Account menu"]');
    await page.click('button:has-text("Sign out")');

    // 3. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes("/login"));
    expect(page.url()).not.toContain("/login");
  });
});
