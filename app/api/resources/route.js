import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { formatZodIssues, ObjectIdSchema } from '@/lib/validations';
import { ResourceSchema } from '@/modules/leads/lead.schema';
import {
  createResource,
  deleteResource,
  listResourcesAdmin,
  updateResource,
} from '@/services/resource.service';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get('public') === '1';
  if (publicOnly) {
    const { getPublishedResources } = await import('@/services/resource.service');
    return NextResponse.json(await getPublishedResources());
  }
  const docs = await listResourcesAdmin();
  return NextResponse.json(docs);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_RESOURCES });

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const parsed = ResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  const doc = await createResource(parsed.data);
  return NextResponse.json(doc, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_RESOURCES });

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();
  const id = String(body.id ?? '');
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const rest = {
    title: body.title,
    type: body.type,
    description: body.description,
    fileUrl: body.fileUrl,
    status: body.status,
  };
  const parsed = ResourceSchema.partial().safeParse(
    Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  const doc = await updateResource(id, parsed.data);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(doc);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_RESOURCES });

export const DELETE = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await deleteResource(id);
  return NextResponse.json({ ok: true });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_RESOURCES });
