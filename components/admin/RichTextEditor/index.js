/**
 * components/admin/RichTextEditor/index.js
 *
 * Public barrel export for the RichTextEditor organism.
 *
 * ─── Import rules ─────────────────────────────────────────────────────────────
 *
 * Client Components (e.g., BlogForm.jsx):
 *   import { RichTextEditor } from '@/components/admin/RichTextEditor';
 *   import { RichTextRenderer } from '@/components/admin/RichTextEditor';
 *   Both are safe — the barrel is imported inside a 'use client' boundary.
 *
 * Server Components (e.g., blog/[slug]/page.jsx):
 *   ✅ import { RichTextRenderer } from '@/components/admin/RichTextEditor/RichTextRenderer';
 *   ❌ DO NOT import from this barrel in Server Components.
 *
 *   Why: This barrel re-exports RichTextEditor.jsx which uses next/dynamic with
 *   ssr:false. Importing it in a Server Component causes a build error:
 *   "`ssr: false` is not allowed with `next/dynamic` in Server Components."
 *   Import RichTextRenderer.jsx directly instead.
 *
 * ─── Atomic Design boundary ───────────────────────────────────────────────────
 * Within client-side admin code, always import from this barrel.
 * Direct imports of internal sub-components are forbidden.
 */
export { RichTextEditor } from './RichTextEditor';
export { RichTextRenderer } from './RichTextRenderer';

