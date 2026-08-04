import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import { ProductSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(product);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const product = await Product.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  
  return NextResponse.json(product);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const product = await Product.findByIdAndDelete(id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  
  // Note: In Phase 4, we will add logic here to delete associated Cloudinary images
  
  return NextResponse.json({ message: 'Product deleted successfully' });
}, { requireAuth: true });
