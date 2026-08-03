import ProductForm from '../../ProductForm';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  await dbConnect();
  
  const rawProduct = await Product.findById(id).lean();
  if (!rawProduct) {
    notFound();
  }
  const product = JSON.parse(JSON.stringify(rawProduct));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Edit Product: {product.name}</h1>
      </div>
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}
