/**
 * components/admin/RichTextEditor/RichTextRenderer.jsx
 *
 * Server Component — renders saved rich text content on public-facing pages.
 *
 * Architecture:
 * - Runs entirely on the server. Zero JavaScript shipped to the client.
 * - Accepts the pre-sanitized HTML string from MongoDB (content.html).
 * - Re-sanitizes as defense-in-depth before dangerouslySetInnerHTML.
 *   This guards against content written before sanitization was in place,
 *   or if DOMPurify config was updated to allow fewer tags.
 * - dangerouslySetInnerHTML is ONLY used after server-side DOMPurify processing.
 *
 * Usage (in blog post page — Server Component):
 *   import { RichTextRenderer } from '@/components/admin/RichTextEditor';
 *   <RichTextRenderer html={post.content.html} />
 *
 * @param {string} html - HTML string from content.html in MongoDB
 * @param {string} [className] - Additional CSS class for the wrapper
 */
import { sanitizeHtml } from '@/lib/editor/sanitize';
import './RichTextRenderer.css';

export function RichTextRenderer({ html, className = '' }) {
  if (!html) return null;

  // Server-side re-sanitization (defense-in-depth)
  const safeHtml = sanitizeHtml(html);

  return (
    <article
      className={`rte-output ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
