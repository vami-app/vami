import { NextResponse } from 'next/server';
import { ProductSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getProductByIdUncached, updateProduct, deleteProduct } from '@/services/product.service';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const product = await getProductByIdUncached(id);
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

  const product = await updateProduct(id, parsed.data);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  
  return NextResponse.json(product);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const product = await deleteProduct(id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  
  return NextResponse.json({ message: 'Product deleted successfully (Background Cloudinary cleanup initiated)' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });
