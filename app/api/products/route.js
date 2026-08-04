import { NextResponse } from 'next/server';
import { ProductSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { createProduct, getAllPublishedProducts } from '@/services/product.service';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  // NOTE: For admin lists, we should ideally have a getAllProducts that ignores status.
  // We will fallback to the unstable_cache service for now, but bypass cache for true REST lists.
  // Let's implement an uncached fetch in the service if needed, or just use the cache.
  // Actually, since we removed `mongoose`, let's just use the service.
  // We will write `getProducts` in the service to handle category filters dynamically.
  
  // To keep it simple and CSR compliant, we delegate entirely.
  const { getProductsList } = await import('@/services/product.service');
  const products = await getProductsList(category);
    
  return NextResponse.json(products);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const product = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_PRODUCTS });
