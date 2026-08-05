'use client';

/**
 * components/admin/RichTextEditor/utils/pasteNormalizer.js
 *
 * Intercepts all paste events and routes HTML through a strict sanitization
 * and schema-normalization pipeline before insertion into the editor state.
 *
 * Pipeline:
 * 1. preventDefault — block native browser paste (which would bypass our schema)
 * 2. Extract text/html from ClipboardData
 * 3. DOMPurify.sanitize() — strip scripts, event handlers, dangerous protocols
 * 4. DOMParser → in-memory DocumentFragment (never touches the live document)
 * 5. $generateNodesFromDOM → translates DOM nodes to Lexical node objects
 * 6. Insert validated Lexical nodes at the current selection
 *
 * This is the only entry point for external HTML into the editor state.
 * If this function returns false, Lexical handles the paste as plain text (safe).
 */
import DOMPurify from 'dompurify';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getSelection, $isRangeSelection } from 'lexical';

/**
 * Normalizes a paste event into the Lexical editor state.
 *
 * @param {ClipboardEvent} clipboardEvent - The native paste event
 * @param {import('lexical').LexicalEditor} editor - The Lexical editor instance
 * @returns {boolean} true if we handled the paste; false to fall through to default
 */
export function normalizePaste(clipboardEvent, editor) {
  const htmlData = clipboardEvent.clipboardData?.getData('text/html');

  // If no HTML payload, let Lexical handle plain text paste natively (safe path)
  if (!htmlData) return false;

  // Block native DOM insertion — we will handle it
  clipboardEvent.preventDefault();

  // ── Step 1: Aggressive client-side sanitization ────────────────────────────
  // Allow only the tags the Lexical HTML serializer can produce.
  // Strip inline styles, event handlers, and dangerous protocols.
  const sanitized = DOMPurify.sanitize(htmlData, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'object', 'embed', 'meta', 'link'],
    FORBID_ATTR: ['style', 'class', 'id', 'onerror', 'onload', 'onclick', 'onmouseover'],
    // Strip javascript: and data: protocols from href/src
    ALLOW_DATA_ATTR: false,
  });

  // ── Step 2: Parse into in-memory DOM (does NOT touch the live document) ───
  const parser = new DOMParser();
  const dom = parser.parseFromString(sanitized, 'text/html');

  // ── Step 3: Convert to Lexical nodes and insert at selection ──────────────
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const nodes = $generateNodesFromDOM(editor, dom);
    if (nodes.length > 0) {
      selection.insertNodes(nodes);
    }
  });

  return true;
}
