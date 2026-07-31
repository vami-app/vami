import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { ProductSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    
    return NextResponse.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    
    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    
    // Note: In Phase 4, we will add logic here to delete associated Cloudinary images
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
