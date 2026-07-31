import ProductForm from '../../ProductForm';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  await dbConnect();
  
  const product = await Product.findById(id).lean();
  if (!product) {
    notFound();
  }

  // Convert ObjectIds and Dates to strings for Client Component
  product._id = product._id.toString();
  if (product.category) product.category = product.category.toString();
  product.createdAt = product.createdAt.toISOString();
  product.updatedAt = product.updatedAt.toISOString();

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
