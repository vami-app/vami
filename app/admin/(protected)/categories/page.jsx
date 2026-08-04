import CategoryClient from './CategoryClient';

export default function CategoriesPage() {
  return (
    <div className="absolute inset-0 p-4 sm:p-5 md:p-8 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-7xl h-full flex flex-col pointer-events-auto">
        <CategoryClient />
      </div>
    </div>
  );
}
