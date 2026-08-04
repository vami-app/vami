import { NextResponse } from 'next/server';
import { CategorySchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getCategoryByIdUncached, updateCategory, deleteCategory } from '@/services/category.service';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const category = await getCategoryByIdUncached(id);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  return NextResponse.json(category);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const category = await updateCategory(id, parsed.data);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  
  return NextResponse.json(category);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const category = await deleteCategory(id);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  
  return NextResponse.json({ message: 'Category deleted successfully (Background Cloudinary cleanup initiated)' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
