import { NextResponse } from 'next/server';
import { ProductSchema, ObjectIdSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getProductByIdUncached, updateProduct, deleteProduct } from '@/modules/products';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
  }

  const product = await getProductByIdUncached(idParsed.data);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(product);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const product = await updateProduct(idParsed.data, parsed.data);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json(product);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;

  const idParsed = ObjectIdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
  }

  const product = await deleteProduct(idParsed.data);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ message: 'Product deleted successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });
