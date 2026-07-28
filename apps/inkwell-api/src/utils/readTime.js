"use strict";

/** Average adult reading speed (words per minute). */
const WPM = 200;

/**
 * Estimate reading time in minutes from an HTML string.
 * Strips tags, counts words, rounds up to at least 1 minute.
 * @param {string} html
 * @returns {number}
 */
function estimateReadTime(html) {
  if (!html) return 1;
  const text = String(html).replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WPM));
}

module.exports = { estimateReadTime };
