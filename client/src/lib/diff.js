/**
 * Minimal word-level diff utility using Longest Common Subsequence (LCS).
 * Splits text by whitespace, preserving formatting, and matches terms.
 * 
 * @param {string} oldStr 
 * @param {string} newStr 
 * @returns {Array<{type: 'common'|'addition'|'deletion', value: string}>}
 */
export function diffWords(oldStr = "", newStr = "") {
  // Split by spaces but preserve whitespace in array
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

/**
 * Strips HTML tags from content to allow clean plaintext comparison.
 * @param {string} html 
 * @returns {string}
 */
export function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
