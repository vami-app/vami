'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { siteConfig } from '@/config/site';

export default function Navbar({ categories = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
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
        className={`pointer-events-auto relative w-[calc(100%-(var(--padding)*2))] mx-auto bg-surface border border-border-base rounded-[var(--inner-radius)] px-4 sm:px-[var(--space-6)] shadow-sm transition-all duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] mt-[var(--padding)] flex flex-col ${isScrolled && isHome ? '-translate-y-6' : 'translate-y-0'}`}
        aria-label="Top"
      >
        <div className="flex items-center justify-between w-full min-h-[var(--nav-block-h)]">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="sr-only">{siteConfig.name}</span>
              <span className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight font-headline">{siteConfig.name}</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex space-x-8 absolute left-1/2 -translate-x-1/2">
            {siteConfig.mainNav.map((navItem) => {
              if (navItem.hasDropdown) {
                return (
                  <div key={navItem.title} className="relative group inline-block">
                    <button className="text-[var(--text-body)] font-medium text-text-secondary hover:text-text-primary inline-flex items-center transition-colors">
                      {navItem.title} <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-64 rounded-2xl shadow-lg bg-surface border border-border-subtle opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 flex flex-col">
                      <Link
                        href={navItem.href}
                        className="block px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors mx-2 rounded-lg mb-1 flex-shrink-0"
                      >
                        View All {navItem.title}
                      </Link>
                      <div className="h-px bg-surface-subtle mx-4 mb-1 flex-shrink-0"></div>
                      <div className="overflow-y-auto max-h-64" style={{ scrollbarWidth: 'thin' }}>
                        {categories.map((category) => (
                          <Link
                            key={category._id}
                            href={`${navItem.href}/${category.slug}`}
                            className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors mx-2 rounded-lg"
                          >
                            {category.name}
                          </Link>
                        ))}
                        {categories.length === 0 && (
                          <span className="block px-4 py-2.5 text-sm text-text-muted mx-2">No categories</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link key={navItem.title} href={navItem.href} className="text-[var(--text-body)] font-medium text-text-secondary hover:text-text-primary transition-colors">
                  {navItem.title}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <Link
              href="/contact"
              className="hidden lg:inline-flex items-center justify-center bg-text-primary px-6 h-10 rounded-full text-sm font-medium text-text-inverse hover:opacity-90 transition-colors"
            >
              Request Quote
            </Link>
            
            <button
              type="button"
              className="lg:hidden bg-surface-muted p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-subtle flex-shrink-0 transition-colors"
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
          <div className="pt-4 space-y-1 border-t border-border-subtle overflow-y-auto max-h-[70vh]">
            
            {siteConfig.mainNav.map((navItem) => {
              if (navItem.hasDropdown) {
                return (
                  <div key={navItem.title} className="block">
                    <button 
                      type="button" 
                      onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary rounded-2xl transition-colors"
                    >
                      {navItem.title}
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileProductsOpen ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="mt-1 mb-2 space-y-1 pl-4 border-l-2 border-surface-subtle ml-6 mr-4 overflow-y-auto max-h-[300px] pr-2" style={{ scrollbarWidth: 'thin' }}>
                        <Link
                          href={navItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors"
                        >
                          View All {navItem.title}
                        </Link>
                        {categories.map((category) => (
                          <Link
                            key={category._id}
                            href={`${navItem.href}/${category.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link key={navItem.title} href={navItem.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                  {navItem.title}
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-surface-subtle">
               <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center bg-text-primary px-6 h-12 rounded-full text-base font-medium text-text-inverse hover:opacity-90 transition-colors"
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
