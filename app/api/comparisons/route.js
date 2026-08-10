import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';
import { formatZodIssues, ObjectIdSchema } from '@/lib/validations';
import dbConnect from '@/lib/db';
import Comparison from '@/models/Comparison';
import { serializeDoc, serializeDocs } from '@/lib/serialize';
import { revalidateTag } from 'next/cache';

const ComparisonSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  columnLabels: z.array(z.string()).optional().default([]),
  rows: z
    .array(
      z.object({
        parameter: z.string(),
        values: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const GET = withApiHandler(async () => {
  await dbConnect();
  const docs = await Comparison.find({}).sort({ updatedAt: -1 }).lean();
  return NextResponse.json(serializeDocs(docs));
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const parsed = ComparisonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  await dbConnect();
  const doc = await Comparison.create(parsed.data);
  revalidateTag('comparisons');
  return NextResponse.json(serializeDoc(doc.toObject()), { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();
  const idCheck = ObjectIdSchema.safeParse(body.id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const { id, ...rest } = body;
  const parsed = ComparisonSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  await dbConnect();
  const doc = await Comparison.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  revalidateTag('comparisons');
  return NextResponse.json(serializeDoc(doc));
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });

export const DELETE = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await dbConnect();
  await Comparison.findByIdAndDelete(id);
  revalidateTag('comparisons');
  return NextResponse.json({ ok: true });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CONTENT });
