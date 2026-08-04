import { NextResponse } from 'next/server';
import { ProductSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { createProduct } from '@/modules/products';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || null;
  const cursor = searchParams.get('cursor') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const { getProductsList } = await import('@/modules/products');
  const result = await getProductsList({ categoryId: category, cursor, limit });

  return NextResponse.json(result);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();

  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const product = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });
