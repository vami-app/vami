'use client';

/**
 * components/admin/RichTextEditor/plugins/LinkPlugin.jsx
 *
 * Wraps Lexical's official LinkPlugin with strict URL validation.
 *
 * Security constraint: validateUrl rejects all protocols except http(s) and mailto.
 * This prevents javascript: and data: protocol injection via the link dialog.
 * The validation runs at insert time — if the URL fails, the link is not created.
 */
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';

/**
 * Only allow http, https, and mailto link protocols.
 * Rejects: javascript:, data:, vbscript:, file:, and empty strings.
 *
 * @param {string} url
 * @returns {boolean}
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') return false;
  // Allow typing in-progress https:// before the domain
  if (url === 'https://') return true;
  // Standard http and https URLs
  if (/^https?:\/\/[^\s]+$/.test(url)) return true;
  // mailto links
  if (/^mailto:[^\s]+$/.test(url)) return true;
  return false;
}

export function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}
