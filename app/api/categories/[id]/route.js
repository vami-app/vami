import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { CategorySchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const category = await Category.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    
    return NextResponse.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    
    const category = await Category.findByIdAndDelete(id);
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
