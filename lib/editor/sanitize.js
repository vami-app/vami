/**
 * lib/editor/sanitize.js
 *
 * Server-side and isomorphic HTML sanitization for the rich text editor.
 * This module runs in both the Node.js server runtime (API routes, Server Actions)
 * and the browser (paste normalization, client-side display guards).
 *
 * Architecture:
 * - Uses isomorphic-dompurify which provides the jsdom window shim on the server.
 * - Defense-in-depth: client also sanitizes, but server is the enforcement point.
 * - DENY by default: only explicitly listed tags and attributes are permitted.
 *
 * Called from:
 * - app/api/blog/route.js (POST — before MongoDB write)
 * - app/api/blog/[id]/route.js (PUT — before MongoDB update)
 * - components/admin/RichTextEditor/utils/pasteNormalizer.js (client paste)
 * - components/admin/RichTextEditor/RichTextRenderer.jsx (read-only display)
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * Whitelist of HTML tags produced by the Lexical HTML serializer.
 * Every tag not in this list will be stripped from the output.
 * This is intentionally conservative — deny unknown, not allow unknown.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div',
];

/**
 * Whitelist of allowed HTML attributes.
 * style, on*, id, and class are explicitly forbidden below.
 */
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'width', 'height',
  'class', 'data-lexical-key', 'rel', 'target',
  'colspan', 'rowspan',
];

/**
 * Sanitizes an HTML string for safe storage and rendering.
 *
 * MUST be called server-side in every API route that accepts rich text content
 * before writing to MongoDB. Never store raw HTML from the client.
 *
 * Also called client-side in the paste normalizer and read-only renderer
 * as a secondary layer.
 *
 * @param {string} dirty - Unsanitized HTML string from the Lexical HTML serializer
 * @returns {string} - DOMPurify-cleaned HTML, safe for storage and dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only process standard HTML — no SVG/MathML XSS vectors
    USE_PROFILES: { html: true },
    // Strip all data-* attributes except our own data-lexical-key
    ALLOW_DATA_ATTR: false,
    // Force rel="noopener noreferrer" on all <a> tags (prevents tab-napping)
    ADD_ATTR: ['target'],
    // Block all event handlers and dangerous inline styles
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Validates that a Lexical JSON state object has the required root structure
 * before accepting it from a client request.
 *
 * This is a structural check, not a deep content validation.
 * It prevents corrupted or tampered editor state from being persisted to MongoDB.
 *
 * @param {unknown} lexicalState - Value from the request body's content.lexicalState
 * @returns {boolean}
 */
export function validateLexicalState(lexicalState) {
  if (!lexicalState || typeof lexicalState !== 'object') return false;
  if (!lexicalState.root || lexicalState.root.type !== 'root') return false;
  if (!Array.isArray(lexicalState.root.children)) return false;
  return true;
}

/**
 * Extracts plain text from a Lexical JSON state tree by traversing the node tree.
 *
 * Used to populate the plainText projection in MongoDB for Atlas Search
 * and SEO meta description generation.
 *
 * @param {object} lexicalState - EditorState.toJSON() output
 * @returns {string} - Concatenated plain text with normalized whitespace
 */
export function extractPlainTextFromLexical(lexicalState) {
  function traverse(node) {
    if (!node) return '';
    // TextNode: leaf node containing the actual string data
    if (node.type === 'text') return node.text ?? '';
    // ElementNode / RootNode: recurse into children
    if (Array.isArray(node.children)) {
      return node.children.map(traverse).join(' ');
    }
    return '';
  }

  try {
    return traverse(lexicalState.root).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}
