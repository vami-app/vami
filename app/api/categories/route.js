import { NextResponse } from 'next/server';
import { CategorySchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async () => {
  // Leverage the uncached version or cache if needed.
  // Actually, we already have getAllCategories that is cached.
  // But for API routes, we often want fresh data or we let ISR handle it.
  const { getAllCategories } = await import('@/services/category.service');
  const categories = await getAllCategories();
  return NextResponse.json(categories);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const { createCategory } = await import('@/services/category.service');
  const category = await createCategory(parsed.data);
  return NextResponse.json(category, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
