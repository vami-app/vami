import ProductClient from './ProductClient';

export default function ProductsPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-text-primary">Products</h1>
          <p className="mt-2 text-sm text-text-secondary">
            A list of all products including their status, category, and variants.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ProductClient />
      </div>
    </div>
  );
}
