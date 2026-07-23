"use strict";

const { makeSlug, baseSlug } = require("../../src/utils/slugify");

describe("Slugify Utilities (makeSlug / baseSlug)", () => {
  it("converts titles into clean lowercased slugs", () => {
    expect(baseSlug("Hello World!")).toBe("hello-world");
    expect(baseSlug("  TypeScript & React 19   ")).toBe("typescript-react-19");
  });

  it("appends collision random suffix when generating unique slug", () => {
    const slug1 = makeSlug("Test Post");
    const slug2 = makeSlug("Test Post");
    expect(slug1).toMatch(/^test-post-[a-z0-9]+$/);
    expect(slug2).toMatch(/^test-post-[a-z0-9]+$/);
    expect(slug1).not.toBe(slug2);
  });
});
