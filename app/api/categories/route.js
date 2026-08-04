import { NextResponse } from 'next/server';
import Category from '@/models/Category';
import { CategorySchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async () => {
  const categories = await Category.find({}).sort({ createdAt: -1 });
  return NextResponse.json(categories);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const category = await Category.create(parsed.data);
  return NextResponse.json(category, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
