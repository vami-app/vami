import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Link from 'next/link';

export const metadata = {
  title: 'All Products | Smalloys',
  description: 'Browse our complete catalog of premium industrial materials, alloys, and composites.',
};

export default async function AllProductsPage() {
  await dbConnect();

  // Fetch all published products and populate the category
  const productsDocs = await Product.find({ status: 'published' })
    .populate('category')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="border-b border-gray-200 pb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">All Products</h1>
          <p className="mt-4 text-base text-gray-500">
            Browse our complete selection of high-quality materials and aerospace-grade alloys.
          </p>
        </div>

        {productsDocs.length === 0 ? (
          <div className="pt-12 text-center text-gray-500">
            No products found. Please check back later.
          </div>
        ) : (
          <div className="pt-12 grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {productsDocs.map((product) => {
              const categorySlug = product.category?.slug || 'uncategorized';
              
              return (
                <Link key={product._id.toString()} href={`/products/${categorySlug}/${product.slug}`} className="group">
                  <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8 border border-gray-200 relative">
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
                    {product.category && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm border border-gray-200">
                        {product.category.name}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm text-gray-700 font-medium line-clamp-2">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">{product.shortDescription}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
