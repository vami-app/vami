import ProductClient from '@/features/admin/product-list';

export default function ProductsPage() {
  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <ProductClient />
    </div>
  );
}
