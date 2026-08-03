/* eslint-disable @next/next/no-img-element */
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
            <nav aria-label="Breadcrumb" className="mb-6 relative w-full">
              <ol role="list" className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 w-full">
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

          {products.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-300 rounded-[var(--outer-radius)] bg-white mt-8">
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500 font-light">There are currently no items in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {products.map((product) => (
                <Link key={product._id} href={`/products/${category.slug}/${product.slug}`} className="relative group block">
                  <div className="w-full aspect-[5/4] sm:aspect-square rounded-[var(--inner-radius)] overflow-hidden bg-gray-50 border border-black/5 relative shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-center object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-400 font-light">No image</span>
                      </div>
                    )}
                    
                    {/* Top Badge */}
                    {product.category && (
                      <div className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate block bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-semibold text-gray-900 uppercase tracking-wider shadow-sm border border-black/5 z-10" title={category.name}>
                        {category.name}
                      </div>
                    )}

                    {/* Gradient Overlay for Sub-card Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Glassmorphism Sub-card */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-white/20 p-4 rounded-[calc(var(--inner-radius)-8px)] shadow-lg transform transition-all duration-500 group-hover:-translate-y-1 z-10">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 tracking-tight line-clamp-1">{product.name}</h3>
                      <p className="mt-1 text-xs text-gray-500 font-light leading-relaxed line-clamp-1 sm:line-clamp-2">{product.shortDescription}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
