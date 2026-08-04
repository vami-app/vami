import { NextResponse } from 'next/server';
import { CategorySchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async () => {
  const { getAllCategories } = await import('@/modules/categories');
  const categories = await getAllCategories();
  return NextResponse.json(categories);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();

  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const { createCategory } = await import('@/modules/categories');
  const category = await createCategory(parsed.data);
  return NextResponse.json(category, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
