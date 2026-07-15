"use strict";

const crypto = require("crypto");

/**
 * Convert a string into a URL-safe base slug (no random suffix).
 * @param {string} text
 * @returns {string}
 */
function baseSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

/**
 * Build a unique slug: base slug + short random suffix.
 * @param {string} title
 * @returns {string}
 */
function makeSlug(title) {
  const suffix = crypto.randomBytes(4).toString("hex"); // 8 hex chars
  return `${baseSlug(title)}-${suffix}`;
}

module.exports = { makeSlug, baseSlug };
