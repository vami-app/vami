'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar({ categories = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-transparent lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <span className="sr-only">Smalloys</span>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Smalloys</span>
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              <Link href="/" className="text-base font-medium text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <div className="relative group inline-block">
                <button className="text-base font-medium text-gray-700 hover:text-blue-600 inline-flex items-center">
                  Products <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/products/${category.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        role="menuitem"
                      >
                        {category.name}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <span className="block px-4 py-2 text-sm text-gray-500">No categories</span>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/blog" className="text-base font-medium text-gray-700 hover:text-blue-600">
                Blog
              </Link>
              <Link href="/about" className="text-base font-medium text-gray-700 hover:text-blue-600">
                About
              </Link>
              <Link href="/contact" className="text-base font-medium text-gray-700 hover:text-blue-600">
                Contact
              </Link>
            </div>
          </div>
          <div className="ml-4 sm:ml-10 flex items-center space-x-4">
            <Link
              href="/contact"
              className="hidden sm:inline-block bg-blue-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Request Quote
            </Link>
            <button
              type="button"
              className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="pt-2 pb-4 space-y-1">
            <Link href="/" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900">
              Home
            </Link>
            <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700">
              Products
              <div className="mt-2 space-y-1 pl-4">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/products/${category.slug}`}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/blog" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
