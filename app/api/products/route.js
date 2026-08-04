import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import { ProductSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  let query = {};
  if (category) {
    query.category = category;
  }
  
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
    
  return NextResponse.json(products);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const product = await Product.create(parsed.data);
  return NextResponse.json(product, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });
