import { NextResponse } from 'next/server';
import { CategorySchema, ObjectIdSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getCategoryByIdUncached, updateCategory, deleteCategory } from '@/modules/categories';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
  }

  const category = await getCategoryByIdUncached(idParsed.data);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  return NextResponse.json(category);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const category = await updateCategory(idParsed.data, parsed.data);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  return NextResponse.json(category);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
  }

  const category = await deleteCategory(idParsed.data);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  return NextResponse.json({ message: 'Category deleted successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
