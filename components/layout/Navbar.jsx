'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar({ categories = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScroll = false;
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== lastScroll) {
        setIsScrolled(scrolled);
        lastScroll = scrolled;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className={`sticky top-[var(--gap)] mt-[var(--gap)] z-50 w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] pointer-events-none ${isHome ? 'h-0' : 'h-[calc(var(--nav-block-h)+var(--padding))] mb-[var(--gap)]'}`}>
      <nav 
        className={`pointer-events-auto relative w-[calc(100%-(var(--padding)*2))] mx-auto bg-white border border-black/10 rounded-[var(--inner-radius)] px-4 sm:px-[var(--space-6)] shadow-sm transition-all duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] mt-[var(--padding)] flex flex-col ${isScrolled && isHome ? '-translate-y-6' : 'translate-y-0'}`}
        aria-label="Top"
      >
        <div className="flex items-center justify-between w-full min-h-[var(--nav-block-h)]">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="sr-only">Smalloys</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight font-headline">Smalloys</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex space-x-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-[var(--text-body)] font-medium text-gray-700 hover:text-black transition-colors">
              Home
            </Link>
            <div className="relative group inline-block">
              <button className="text-[var(--text-body)] font-medium text-gray-700 hover:text-black inline-flex items-center transition-colors">
                Products <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-56 rounded-2xl shadow-lg bg-white border border-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/products/${category.slug}`}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors mx-2 rounded-lg"
                  >
                    {category.name}
                  </Link>
                ))}
                {categories.length === 0 && (
                  <span className="block px-4 py-2.5 text-sm text-gray-400">No categories</span>
                )}
              </div>
            </div>
            <Link href="/blog" className="text-[var(--text-body)] font-medium text-gray-700 hover:text-black transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-[var(--text-body)] font-medium text-gray-700 hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[var(--text-body)] font-medium text-gray-700 hover:text-black transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/contact"
              className="hidden lg:inline-flex items-center justify-center bg-black px-6 h-10 rounded-full text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Request Quote
            </Link>
            <button
              type="button"
              className="bg-gray-50 p-2.5 rounded-full text-gray-600 hover:text-black hover:bg-gray-100 lg:hidden flex-shrink-0 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu - Inline accordion inside nav */}
        <div className={`w-full lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}`}>
          <div className="pt-4 space-y-1 border-t border-black/5 overflow-y-auto max-h-[70vh]">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
              Home
            </Link>
            <div className="block px-4 py-3 text-base font-medium text-gray-700">
              Products
              <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-100 ml-2">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/products/${category.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
              Blog
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
              Contact
            </Link>
            <div className="mt-4 pt-4 border-t border-gray-100">
               <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center bg-black px-6 h-12 rounded-full text-base font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Request Quote
                </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
