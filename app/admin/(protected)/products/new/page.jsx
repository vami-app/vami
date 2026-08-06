import ProductForm from '@/features/admin/product-form';
import { AdminPageFrame } from '@/components/templates/admin-page-frame';

export default function NewProductPage() {
  return (
    <AdminPageFrame title="Add New Product">
      <ProductForm />
    </AdminPageFrame>
  );
}
