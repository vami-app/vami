"use strict";

/**
 * Pure function helper for locating quote + context in text content.
 */
function locateHighlight(fullText, quote, contextBefore = "", contextAfter = "") {
  if (!fullText || !quote) return { found: false, index: -1 };

  // 1. Direct exact match
  const directIdx = fullText.indexOf(quote);
  if (directIdx !== -1) {
    return { found: true, index: directIdx, method: "exact" };
  }

  // 2. Disambiguated context match
  if (contextBefore && contextAfter) {
    const contextPattern = contextBefore + quote + contextAfter;
    const ctxIdx = fullText.indexOf(contextPattern);
    if (ctxIdx !== -1) {
      return { found: true, index: ctxIdx + contextBefore.length, method: "context" };
    }
  }

  return { found: false, index: -1, method: "none" };
}

describe("Highlight Fuzzy Relocation (locateHighlight)", () => {
  const articleText = "Inkwell is a quiet place to read, write, and share meaningful ideas with curious minds.";

  it("relocates exact quote when present in article text", () => {
    const res = locateHighlight(articleText, "share meaningful ideas");
    expect(res.found).toBe(true);
    expect(res.index).toBe(45);
    expect(res.method).toBe("exact");
  });

  it("returns found=false when quote is completely removed from edited content", () => {
    const res = locateHighlight(articleText, "obsolete string that was deleted");
    expect(res.found).toBe(false);
    expect(res.method).toBe("none");
  });
});
