import { NextResponse } from 'next/server';
import { BlogPostSchema, ObjectIdSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getBlogPostByIdUncached, updateBlogPost, deleteBlogPost } from '@/modules/blog';
import { sanitizeHtml, validateLexicalState, extractPlainTextFromLexical } from '@/lib/editor/sanitize';


export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid blog post ID format' }, { status: 400 });
  }

  const post = await getBlogPostByIdUncached(idParsed.data);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  return NextResponse.json(post);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid blog post ID format' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  // ── Lexical state deep validation ───────────────────────────────────────
  if (!validateLexicalState(parsed.data.content.lexicalState)) {
    return NextResponse.json(
      { error: 'Invalid editor state: malformed Lexical JSON structure' },
      { status: 422 }
    );
  }

  // ── Server-side HTML sanitization (defense-in-depth) ────────────────────
  const sanitizedHtml = sanitizeHtml(parsed.data.content.html ?? '');
  const plainText = extractPlainTextFromLexical(parsed.data.content.lexicalState);

  const postData = {
    ...parsed.data,
    content: {
      lexicalState: parsed.data.content.lexicalState,
      html: sanitizedHtml,
      plainText,
    },
  };

  const post = await updateBlogPost(idParsed.data, postData);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });

  return NextResponse.json(post);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });


export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid blog post ID format' }, { status: 400 });
  }

  const post = await deleteBlogPost(idParsed.data);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });

  return NextResponse.json({ message: 'Blog post deleted successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });
