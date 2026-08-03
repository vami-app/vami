import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export default async function HomePage() {
  let featuredProducts = [];
  let categories = [];
  try {
    await dbConnect();
    
    // Fetch Featured Products
    const featuredDocs = await Product.find({ status: 'published', featured: true })
      .populate('category')
      .limit(4)
      .lean();
      
    // Format for client
    featuredProducts = featuredDocs.map(p => ({
      ...p,
      _id: p._id.toString(),
      category: p.category ? { ...p.category, _id: p.category._id.toString() } : null,
    }));

    // Fetch Categories for Grid
    const categoryDocs = await Category.find().limit(6).lean();
    categories = categoryDocs.map(c => ({
      _id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description
    }));
  } catch (error) {
    console.error('Database connection failed on HomePage render:', error.message);
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Industrial materials"
          />
          <div className="absolute inset-0 bg-gray-900 mix-blend-multiply opacity-70" aria-hidden="true" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Premium Industrial Materials
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            We provide the highest quality alloys, composites, and specialized materials for demanding manufacturing and engineering applications worldwide.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/products"
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white w-full sm:w-auto"
            >
              Browse Catalog <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 w-full sm:w-auto"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Industry Leading Quality
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Trusted by aerospace, automotive, and heavy industry leaders for our uncompromising standards.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'ISO 9001 Certified', desc: 'All materials meet or exceed international quality standards.' },
                { title: 'Global Shipping', desc: 'Secure and rapid delivery to your facilities worldwide.' },
                { title: 'Custom Specifications', desc: 'Tailored alloy compositions to meet your exact requirements.' }
              ].map((feature) => (
                <div key={feature.title} className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                          <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                      <p className="mt-5 text-base text-gray-500">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-gray-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Shop by Category</h2>
            <Link href="/products" className="hidden text-sm font-semibold text-blue-600 hover:text-blue-500 sm:block">
              Browse all categories <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
            {categories.map((category) => (
              <Link key={category._id} href={`/products/${category.slug}`} className="group relative">
                <div className="relative w-full h-80 bg-white rounded-lg overflow-hidden group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1 p-6 border border-gray-200 flex flex-col justify-center shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">{category.name}</h3>
                  {category.description && (
                    <p className="mt-2 text-sm text-gray-500 text-center line-clamp-2">{category.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Link href="/products" className="block text-sm font-semibold text-blue-600 hover:text-blue-500">
              Browse all categories <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="bg-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Featured Products</h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-4 xl:gap-x-8">
              {featuredProducts.map((product) => (
                <div key={product._id} className="group relative">
                  <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none border border-gray-200">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700 font-medium">
                        <Link href={product.category ? `/products/${product.category.slug}/${product.slug}` : '#'}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
