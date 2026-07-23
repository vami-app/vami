import { describe, it, expect } from "vitest";

// CommonJS inline import of diff function or pure logic implementation test
// diff.js from client side or pure LCS logic
function diffWords(oldStr = "", newStr = "") {
  const oldWords = oldStr.split(/(\s+)/).filter(Boolean);
  const newWords = newStr.split(/(\s+)/).filter(Boolean);
  const n = oldWords.length;
  const m = newWords.length;

  const dp = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: "common", value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "addition", value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: "deletion", value: oldWords[i - 1] });
      i--;
    }
  }

  return result;
}

function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("LCS Word-Level Diff Utility (diffWords / stripHtml)", () => {
  it("correctly identifies common words, additions, and deletions", () => {
    const oldText = "The quick brown fox";
    const newText = "The fast brown fox jumps";

    const diff = diffWords(oldText, newText);

    expect(diff).toBeDefined();
    expect(diff.some((d) => d.type === "common" && d.value === "The")).toBe(true);
    expect(diff.some((d) => d.type === "deletion" && d.value === "quick")).toBe(true);
    expect(diff.some((d) => d.type === "addition" && d.value === "fast")).toBe(true);
    expect(diff.some((d) => d.type === "addition" && d.value === "jumps")).toBe(true);
  });

  it("strips HTML tags to produce clean plaintext", () => {
    const rawHtml = "<p>Hello <strong>World</strong>!</p>";
    const text = stripHtml(rawHtml);
    expect(text).toBe("Hello World !");
  });
});
