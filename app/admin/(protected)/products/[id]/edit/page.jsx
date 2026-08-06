import ProductForm from '@/features/admin/product-form';
import { AdminPageFrame } from '@/components/templates/admin-page-frame';
import { getProductById } from '@/modules/products';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }) {
  const { id } = await params;

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  const rawProduct = await getProductById(id);
  if (!rawProduct) {
    notFound();
  }
  const product = JSON.parse(JSON.stringify(rawProduct));

  return (
    <AdminPageFrame title={`Edit Product: ${product.name}`}>
      <ProductForm initialData={product} />
    </AdminPageFrame>
  );
}
