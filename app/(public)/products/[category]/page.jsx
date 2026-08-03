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
    <div className="layout-main">
      <section className="py-12 sm:py-16 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          
          <div className="mb-12 sm:mb-20">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol role="list" className="flex items-center space-x-3 sm:space-x-4">
                <li>
                  <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                    <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors">Home</Link>
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-gray-300">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  </div>
                </li>
                <li>
                  <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                    <Link href="/products" className="text-gray-400 hover:text-gray-900 transition-colors">Products</Link>
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-gray-300">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  </div>
                </li>
                <li className="text-xs font-semibold tracking-[0.2em] uppercase">
                  <span className="text-gray-900" aria-current="page">{category.name}</span>
                </li>
              </ol>
            </nav>

            <h1 className="font-headline font-light text-gray-900 mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-6 text-gray-500 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-y-16">
            {products.map((product) => (
              <Link key={product._id.toString()} href={`/products/${category.slug}/${product.slug}`} className="flex flex-col relative group">
                <div className="w-full border-t-2 border-black/10 group-hover:border-black transition-colors duration-300 mb-6"></div>
                
                <div className="w-full aspect-square sm:aspect-[4/3] rounded-[var(--inner-radius)] overflow-hidden bg-gray-50 border border-black/5 relative shadow-sm">
                  {product.images && product.images.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-center object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-light text-sm">
                      No image available
                    </div>
                  )}
                </div>
                
                <h3 className="mt-6 text-lg sm:text-xl font-medium text-gray-900 tracking-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-2 text-xs font-semibold text-gray-500 tracking-[0.1em] uppercase">
                  {product.variants && product.variants.length > 0 ? 'View Options' : 'Request Quote'}
                </p>
              </Link>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="mt-12 text-center text-gray-500 font-light">
              No products found in this category.
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
