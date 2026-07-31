import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Info } from 'lucide-react';

export async function generateMetadata({ params }) {
  const { category: categorySlug, slug: productSlug } = await params;
  await dbConnect();
  
  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) return { title: 'Product Not Found' };

  const product = await Product.findOne({ slug: productSlug, category: category._id, status: 'published' }).lean();
  if (!product) return { title: 'Product Not Found' };
  
  return {
    title: product.seoTitle || `${product.name} | Smalloys`,
    description: product.seoDescription || product.shortDescription || `Buy ${product.name} at Smalloys.`,
    openGraph: {
      images: product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { category: categorySlug, slug: productSlug } = await params;
  await dbConnect();

  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) notFound();

  const product = await Product.findOne({ slug: productSlug, category: category._id, status: 'published' }).lean();
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images || [],
    description: product.shortDescription || product.seoDescription,
    sku: product._id.toString(),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      price: '0.00', // Request quote paradigm
    }
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol role="list" className="flex items-center space-x-2">
            <li>
              <div className="flex items-center text-sm">
                <Link href="/" className="font-medium text-gray-500 hover:text-gray-900">Home</Link>
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-2 flex-shrink-0 h-5 w-5 text-gray-300">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              </div>
            </li>
            <li>
              <div className="flex items-center text-sm">
                <Link href={`/products/${category.slug}`} className="font-medium text-gray-500 hover:text-gray-900">{category.name}</Link>
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-2 flex-shrink-0 h-5 w-5 text-gray-300">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              </div>
            </li>
            <li className="text-sm">
              <span className="font-medium text-gray-900" aria-current="page">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {product.images && product.images.length > 0 ? (
              <div className="w-full aspect-w-1 aspect-h-1 mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-center object-cover sm:rounded-lg border border-gray-200 shadow-sm" />
              </div>
            ) : (
              <div className="w-full aspect-w-1 aspect-h-1 mt-6 bg-gray-100 flex items-center justify-center sm:rounded-lg border border-gray-200">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            {/* If we had a carousel client component we would map over product.images here */}
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 space-y-6">
                <p>{product.shortDescription}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center mt-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                <p className="ml-2 text-sm text-gray-500">In stock and ready to ship globally</p>
              </div>
            </div>

            <div className="mt-10 flex">
              <Link href="/contact" className="max-w-xs flex-1 bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500 sm:w-full">
                Request a Quote
              </Link>
            </div>
          </div>
        </div>

        {/* Specs and Variants */}
        <div className="mt-16 lg:mt-24 lg:grid lg:grid-cols-3 lg:gap-x-8">
          <div className="lg:col-span-2">
            
            {product.longDescription && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Detailed Overview</h2>
                <div 
                  className="prose prose-sm sm:prose lg:prose-lg text-gray-500 max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.longDescription }} 
                />
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Available Options</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                  <ul role="list" className="divide-y divide-gray-200">
                    {product.variants.map((variant, idx) => (
                      <li key={idx} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">{variant.name}</p>
                          {variant.priceNote && <p className="mt-1 text-sm text-gray-500">{variant.priceNote}</p>}
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Available</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
          </div>
          
          {/* Sidebar / Specs */}
          <div className="mt-8 lg:mt-0 lg:col-span-1">
            {product.specs && product.specs.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 text-gray-400 mr-2" />
                  Specifications
                </h3>
                <dl className="divide-y divide-gray-200 text-sm">
                  {product.specs.map((spec, idx) => (
                    <div key={idx} className="py-3 flex justify-between">
                      <dt className="text-gray-500 font-medium">{spec.key}</dt>
                      <dd className="text-gray-900 font-semibold">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
