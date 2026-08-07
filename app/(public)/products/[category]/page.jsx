/* eslint-disable @next/next/no-img-element */
import { getCategoryBySlug } from '@/modules/categories';
import { getProductsByCategory } from '@/modules/products';
import { getSiteSettings } from '@/services/settings.service';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description || `Browse our selection of ${category.name}`,
  };
}

export default async function CategoryPage({ params }) {
  const { category: categorySlug } = await params;
  
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const products = await getProductsByCategory(category._id);
  const settings = await getSiteSettings();
  const showImages = settings.showProductImagesInList !== false;

  return (
    <div className="layout-main">
      <section className="py-12 sm:py-16 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          
          <div className="mb-12 sm:mb-20">
            <nav aria-label="Breadcrumb" className="mb-6 relative w-full">
              <ol role="list" className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 w-full">
                <li>
                  <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                    <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">Home</Link>
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-text-muted">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  </div>
                </li>
                <li>
                  <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                    <Link href="/products" className="text-text-muted hover:text-text-primary transition-colors">Products</Link>
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-text-muted">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  </div>
                </li>
                <li className="text-xs font-semibold tracking-[0.2em] uppercase">
                  <span className="text-text-primary" aria-current="page">{category.name}</span>
                </li>
              </ol>
            </nav>

            <h1 className="font-headline font-light text-text-primary mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-6 text-text-muted text-base sm:text-lg font-light max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border-base rounded-[var(--outer-radius)] bg-surface mt-8">
              <h3 className="text-lg font-medium text-text-primary">No products found</h3>
              <p className="mt-2 text-text-muted font-light">There are currently no items in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {products.map((product) => (
                <Link key={product._id} href={`/products/${category.slug}/${product.slug}`} className="relative group block h-full">
                  <div className="w-full h-full bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-center">
                    
                    {/* Left Side: Content */}
                    <div className="flex-1 w-full flex flex-col justify-center text-left order-2 sm:order-1">
                      {/* Pill Badge */}
                      {product.category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg border border-primary text-[10px] font-semibold text-primary uppercase tracking-widest bg-transparent">
                            {category.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Product Name */}
                      <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2 line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      {/* Product Description */}
                      <p className="text-sm text-text-muted font-light leading-relaxed line-clamp-3">
                        {product.shortDescription || "Contact us for detailed specifications and sizing options."}
                      </p>
                    </div>

                    {/* Right Side: Image with margin/padding wrapper effect */}
                    {showImages && product.images && product.images.length > 0 && (
                      <div className="w-full sm:w-1/3 xl:w-2/5 aspect-video sm:aspect-square md:aspect-[4/3] rounded-lg overflow-hidden relative order-1 sm:order-2 shrink-0 border border-border-subtle">
                        <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    )}

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
