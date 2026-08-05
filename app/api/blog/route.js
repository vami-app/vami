import { NextResponse } from 'next/server';
import { BlogPostSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { sanitizeHtml, validateLexicalState, extractPlainTextFromLexical } from '@/lib/editor/sanitize';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const { getBlogListUncached } = await import('@/modules/blog');
  const posts = await getBlogListUncached({ cursor, limit });
  return NextResponse.json(posts);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();

  // ── Zod structural validation ───────────────────────────────────────────
  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  // ── Lexical state deep validation ───────────────────────────────────────
  // Zod validates structure; this validates Lexical's required root node shape
  if (!validateLexicalState(parsed.data.content.lexicalState)) {
    return NextResponse.json(
      { error: 'Invalid editor state: malformed Lexical JSON structure' },
      { status: 422 }
    );
  }

  // ── Server-side HTML sanitization (defense-in-depth) ────────────────────
  // Client already sanitizes via DOMPurify, but we NEVER trust client-only
  // sanitization for content being written to the database.
  const sanitizedHtml = sanitizeHtml(parsed.data.content.html ?? '');

  // ── Compute plainText projection server-side ────────────────────────────
  // Clients must not send plainText; it is always derived on the server.
  const plainText = extractPlainTextFromLexical(parsed.data.content.lexicalState);

  // ── Build the final payload ─────────────────────────────────────────────
  const postData = {
    ...parsed.data,
    content: {
      lexicalState: parsed.data.content.lexicalState,
      html: sanitizedHtml,
      plainText,
    },
  };

  const { createBlogPost } = await import('@/modules/blog');
  const post = await createBlogPost(postData);
  return NextResponse.json(post, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });

