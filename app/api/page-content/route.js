import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { formatZodIssues } from '@/lib/validations';
import { PageContentSchema } from '@/modules/leads/lead.schema';
import {
  getPageContentByKey,
  listPageContentAdmin,
  upsertPageContent,
} from '@/services/page-content.service';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (key) {
    const doc = await getPageContentByKey(key);
    return NextResponse.json(doc || {});
  }
  const docs = await listPageContentAdmin();
  return NextResponse.json(docs);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();
  const parsed = PageContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  const { key, ...rest } = parsed.data;
  const doc = await upsertPageContent(key, rest);
  return NextResponse.json(doc);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });
