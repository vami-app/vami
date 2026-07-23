const { test as baseTest, expect } = require("@playwright/test");

/**
 * Custom fixture with helper for registering & logging in test accounts.
 */
const test = baseTest.extend({
  authenticatedUser: async ({ page }, use) => {
    const timestamp = Date.now();
    const user = {
      name: `E2E User ${timestamp}`,
      username: `e2euser_${timestamp}`,
      email: `e2e_${timestamp}@inkwell.test`,
      password: "Password123!",
    };

    // Go to register page
    await page.goto("/register");
    await page.fill('input[name="name"], input[placeholder*="name" i]', user.name);
    await page.fill('input[name="username"], input[placeholder*="username" i]', user.username);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for redirect to home or dashboard
    await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 10000 });

    await use({ user, page });
  },
});

module.exports = { test, expect };
