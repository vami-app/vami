import ProductClient from './ProductClient';

export default function ProductsPage() {
  return (
    <div className="absolute inset-0 p-4 sm:p-5 md:p-8 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-7xl h-full flex flex-col pointer-events-auto">
        <ProductClient />
      </div>
    </div>
  );
}
