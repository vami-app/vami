import ProductForm from '../ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Add New Product</h1>
      </div>
      <div className="bg-surface shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <ProductForm />
      </div>
    </div>
  );
}
