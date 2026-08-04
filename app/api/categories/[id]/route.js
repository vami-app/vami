import { NextResponse } from 'next/server';
import Category from '@/models/Category';
import { CategorySchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const category = await Category.findById(id);
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

  const category = await Category.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  
  return NextResponse.json(category);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const category = await Category.findByIdAndDelete(id);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  
  return NextResponse.json({ message: 'Category deleted successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CATEGORIES });
