const { test, expect } = require("@playwright/test");

test.describe("Dark Mode & Cookie Persistence E2E", () => {
  test("toggle dark mode, verify class on <html>, and confirm cookie persistence on cold reload", async ({ page, context }) => {
    await page.goto("/");

    const themeBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible();

    // Click theme toggle to switch to dark mode
    await themeBtn.click();

    // Verify dark class applied to html tag
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);

    // Verify theme cookie is set
    const cookies = await context.cookies();
    const themeCookie = cookies.find((c) => c.name === "theme");
    expect(themeCookie).toBeDefined();

    // Perform cold page reload
    await page.reload();

    // Confirm html tag immediately has dark class after reload (no flash)
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
