import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer({ categories = [] }) {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <span className="text-2xl font-bold text-white tracking-tight">Smalloys</span>
            <p className="text-gray-400 text-base">
              Premium product catalog providing the highest quality materials and equipment for your business needs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Products</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {categories.map((category) => (
                    <li key={category._id}>
                      <Link href={`/products/${category.slug}`} className="text-base text-gray-300 hover:text-white">
                        {category.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/products" className="text-base text-gray-300 hover:text-white font-medium text-blue-400">
                      View All Products
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link href="/about" className="text-base text-gray-300 hover:text-white">About</Link></li>
                  <li><Link href="/blog" className="text-base text-gray-300 hover:text-white">Blog</Link></li>
                  <li><Link href="/certificates" className="text-base text-gray-300 hover:text-white">Certificates</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link href="/contact" className="text-base text-gray-300 hover:text-white">Contact Sales</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Documentation</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">API Reference</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Contact Us</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li className="flex text-base text-gray-300 hover:text-white">
                    <Mail className="flex-shrink-0 h-5 w-5 mr-2 text-gray-400" />
                    sales@smalloys.com
                  </li>
                  <li className="flex text-base text-gray-300 hover:text-white">
                    <Phone className="flex-shrink-0 h-5 w-5 mr-2 text-gray-400" />
                    +1 (555) 123-4567
                  </li>
                  <li className="flex text-base text-gray-300 hover:text-white">
                    <MapPin className="flex-shrink-0 h-5 w-5 mr-2 text-gray-400" />
                    <span>123 Manufacturing Way, NY 10001</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
          <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} Smalloys, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
