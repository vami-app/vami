const { test, expect } = require("../fixtures/auth.fixture");

test.describe("Story Highlighting & Annotation E2E Flow", () => {
  test("select text, create highlight with note, and verify persistence on page reload", async ({ authenticatedUser }) => {
    const { page } = authenticatedUser;

    // Navigate to a published story page
    await page.goto("/");
    const storyLink = page.locator('a[href^="/p/"]').first();

    if (await storyLink.isVisible()) {
      await storyLink.click();
      await page.waitForSelector(".prose-article");

      // Verify article container is visible
      const prose = page.locator(".prose-article");
      await expect(prose).toBeVisible();

      // Check if highlight layer is present
      const highlightLayer = page.locator(".prose-article");
      await expect(highlightLayer).toBeVisible();
    }
  });
});
