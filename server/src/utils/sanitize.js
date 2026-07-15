"use strict";

const sanitizeHtml = require("sanitize-html");

/**
 * Sanitize editor-produced HTML before persisting. Strips <script>,
 * event handler attributes, and javascript: URLs to prevent stored XSS.
 * Allows the subset of tags the Tiptap editor can produce.
 * @param {string} dirty
 * @returns {string}
 */
function sanitizeContent(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h1", "h2", "h3", "h4",
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s", "strike",
      "blockquote",
      "ul", "ol", "li",
      "a",
      "code", "pre",
      "img",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      span: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    // Only allow safe URL schemes (blocks javascript:, data: for links)
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
    // Force safe rel on links that open in a new tab
    transformTags: {
      a: (tagName, attribs) => {
        const rel = attribs.target === "_blank" ? "noopener noreferrer" : attribs.rel;
        return { tagName, attribs: { ...attribs, ...(rel ? { rel } : {}) } };
      },
    },
    // Drop disallowed tags entirely (including their content for script/style)
    disallowedTagsMode: "discard",
  });
}

module.exports = { sanitizeContent };
