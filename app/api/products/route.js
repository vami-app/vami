import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { ProductSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    await dbConnect();
    
    let query = {};
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await dbConnect();
    const body = await req.json();
    
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const product = await Product.create(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
