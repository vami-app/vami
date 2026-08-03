import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Link from 'next/link';

export const metadata = {
  title: 'All Products | Smalloys',
  description: 'Browse our complete catalog of premium industrial materials, alloys, and composites.',
};

export default async function AllProductsPage() {
  let productsDocs = [];
  try {
    await dbConnect();
    // Fetch all published products and populate the category
    productsDocs = await Product.find({ status: 'published' })
      .populate('category')
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error('Database connection failed on Products page render:', error.message);
  }

  return (
    <div className="layout-main bg-[#f9f9f9] min-h-screen">
      <section className="py-12 sm:py-16 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-20">
            <span className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">Inventory</span>
            <h1 className="font-headline font-light text-gray-900 mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              All Products
            </h1>
            <p className="mt-6 text-gray-500 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Browse our complete selection of premium industrial materials, custom copper-base alloys, and precision sand castings.
            </p>
          </div>

        {productsDocs.length === 0 ? (
          <div className="pt-12 text-center text-gray-500 font-light">
            No products found. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-y-16">
            {productsDocs.map((product) => {
              const categorySlug = product.category?.slug || 'uncategorized';
              
              return (
                <Link key={product._id.toString()} href={`/products/${categorySlug}/${product.slug}`} className="flex flex-col relative group">
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
                    {product.category && (
                      <div className="absolute top-4 left-4 max-w-[calc(100%-2rem)] truncate bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold text-gray-900 uppercase tracking-wider shadow-sm border border-black/5" title={product.category.name}>
                        {product.category.name}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="mt-6 text-lg sm:text-xl font-medium text-gray-900 tracking-tight line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-500 font-light leading-relaxed line-clamp-2">
                    {product.shortDescription}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
