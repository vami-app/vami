/* eslint-disable @next/next/no-img-element */
import { getAllPublishedProducts } from '@/modules/products';
import Link from 'next/link';

export const metadata = {
  title: 'All Products | Smalloys',
  description: 'Browse our complete catalog of premium industrial materials, alloys, and composites.',
};

export default async function AllProductsPage() {
  let productsDocs = [];
  try {
    productsDocs = await getAllPublishedProducts();
  } catch (error) {
    console.error('Database connection failed on Products page render:', error.message);
  }

  return (
    <div className="layout-main">
      <section className="py-12 sm:py-16 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-20">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">Inventory</span>
            <h1 className="font-headline font-light text-text-primary mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              All Products
            </h1>
            <p className="mt-6 text-text-muted text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Browse our complete selection of premium industrial materials, custom copper-base alloys, and precision sand castings.
            </p>
          </div>

        {productsDocs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border-base rounded-[var(--outer-radius)] bg-surface">
            <h3 className="text-lg font-medium text-text-primary">No products found</h3>
            <p className="mt-2 text-text-muted font-light">Check back soon for new inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {productsDocs.map((product) => (
              <Link key={product._id.toString()} href={`/products/${product.category?.slug || 'uncategorized'}/${product.slug}`} className="relative group block">
                <div className="w-full aspect-[5/4] sm:aspect-square rounded-[var(--inner-radius)] overflow-hidden bg-surface-muted border border-border-subtle relative shadow-sm">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-center object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-text-muted font-light">No image</span>
                    </div>
                  )}
                  
                  {/* Top Badge */}
                  {product.category && (
                    <div className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate block bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-semibold text-text-primary uppercase tracking-wider shadow-sm border border-border-subtle z-10" title={product.category.name}>
                      {product.category.name}
                    </div>
                  )}

                  {/* Gradient Overlay for Sub-card Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Glassmorphism Sub-card */}
                  <div className="absolute bottom-3 left-3 right-3 bg-surface/95 backdrop-blur-md border border-border-subtle p-4 rounded-[calc(var(--inner-radius)-8px)] shadow-lg transform transition-all duration-500 group-hover:-translate-y-1 z-10">
                    <h3 className="text-sm sm:text-base font-medium text-text-primary tracking-tight line-clamp-1">{product.name}</h3>
                    <p className="mt-1 text-xs text-text-muted font-light leading-relaxed line-clamp-1 sm:line-clamp-2">{product.shortDescription}</p>
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
