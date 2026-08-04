import ProductForm from '../../ProductForm';
import { getProductById } from '@/services/product.service';
import mongoose from 'mongoose';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const rawProduct = await getProductById(id);
  if (!rawProduct) {
    notFound();
  }
  const product = JSON.parse(JSON.stringify(rawProduct));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Edit Product: {product.name}</h1>
      </div>
      <div className="bg-surface shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}
