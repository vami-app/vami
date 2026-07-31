import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  await dbConnect();
  const category = await Category.findOne({ slug: categorySlug }).lean();
  
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: category.seoTitle || `${category.name} | Smalloys`,
    description: category.seoDescription || category.description || `Browse our selection of ${category.name}`,
  };
}

export default async function CategoryPage({ params }) {
  const { category: categorySlug } = await params;
  await dbConnect();

  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) {
    notFound();
  }

  const products = await Product.find({ category: category._id, status: 'published' }).lean();

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="border-b border-gray-200 pb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="mt-4 text-base text-gray-500">
              {category.description}
            </p>
          )}
        </div>

        <div className="pt-12 grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <Link key={product._id.toString()} href={`/products/${category.slug}/${product.slug}`} className="group">
              <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8 border border-gray-200">
                {product.images && product.images.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-center object-cover group-hover:opacity-75"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-sm text-gray-700 font-medium">{product.name}</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {product.variants && product.variants.length > 0 ? 'View Options' : 'Request Quote'}
              </p>
            </Link>
          ))}
        </div>
        {products.length === 0 && (
          <div className="mt-12 text-center text-gray-500">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
