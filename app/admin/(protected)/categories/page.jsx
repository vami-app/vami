import CategoryClient from './CategoryClient';

export default function CategoriesPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-text-primary">Categories</h1>
          <p className="mt-2 text-sm text-text-secondary">
            A list of all product categories in your catalog.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <CategoryClient />
      </div>
    </div>
  );
}
