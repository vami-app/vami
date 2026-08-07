'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { siteConfig } from '@/config/site';

export default function Navbar({ categories = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [isDesktopProductsOpen, setIsDesktopProductsOpen] = useState(false);
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

  let activeNavItem = 'Home';
  if (pathname !== '/') {
    const match = siteConfig.mainNav.find(item => item.href !== '/' && !item.href.startsWith('/#') && pathname.startsWith(item.href));
    if (match) activeNavItem = match.title;
  }

  return (
    <header className={`sticky top-[var(--gap)] mt-[var(--gap)] z-50 w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] pointer-events-none ${isHome ? 'h-0' : 'h-[calc(var(--nav-block-h)+var(--padding))] mb-[var(--gap)]'}`}>
      <nav 
        className={`pointer-events-auto relative w-[calc(100%-(var(--padding)*2))] mx-auto bg-surface border border-border-base rounded-2xl px-4 sm:px-[var(--space-6)] shadow-sm transition-all duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] mt-[var(--padding)] flex flex-col ${isScrolled && isHome ? '-translate-y-6' : 'translate-y-0'}`}
        aria-label="Top"
      >
        <div className="flex items-center justify-between w-full min-h-[var(--nav-block-h)]">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <Image src="/images/logo.png" alt={siteConfig.name} width={200} height={80} className="h-12 sm:h-16 w-auto object-contain" style={{ width: 'auto' }} priority />
              <span className="sr-only">{siteConfig.name}</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex space-x-2 absolute left-1/2 -translate-x-1/2">
            <LayoutGroup>
            {siteConfig.mainNav.map((navItem) => {
              const isActive = activeNavItem === navItem.title;
              const textColorClass = isActive ? 'text-primary-foreground' : 'text-text-secondary hover:text-primary hover:bg-surface-subtle';

              if (navItem.hasDropdown) {
                return (
                  <div 
                    key={navItem.title} 
                    className="relative inline-block"
                    onMouseEnter={() => setIsDesktopProductsOpen(true)}
                    onMouseLeave={() => setIsDesktopProductsOpen(false)}
                  >
                    <Link href={navItem.href} className={`relative px-4 py-2 rounded-lg text-[var(--text-body)] font-medium inline-flex items-center transition-colors z-10 ${textColorClass}`}>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-capsule"
                          className="absolute inset-0 rounded-lg -z-10 bg-primary shadow-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          initial={false}
                        />
                      )}
                      <span className="relative z-10 flex items-center">
                        {navItem.title} <ChevronDown className="ml-1 h-4 w-4" />
                      </span>
                    </Link>
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 ${isDesktopProductsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                      <div className={`w-64 bg-surface/95 backdrop-blur-xl border border-border-base rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] flex flex-col origin-top ${isDesktopProductsOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                        <div className="space-y-1">
                          <Link
                            href={navItem.href}
                            className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-text-primary hover:bg-surface-subtle shadow-sm"
                          >
                            View All {navItem.title}
                          </Link>
                          <div className="h-px bg-border-subtle my-1 mx-2 flex-shrink-0"></div>
                          <div className="overflow-y-auto max-h-[60vh] space-y-1" style={{ scrollbarWidth: 'thin' }}>
                            {categories.map((category) => (
                              <Link
                                key={category._id}
                                href={`${navItem.href}/${category.slug}`}
                                className="block w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                              >
                                {category.name}
                              </Link>
                            ))}
                            {categories.length === 0 && (
                              <span className="block px-4 py-3 text-sm text-text-muted mx-2">No categories</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={navItem.title}
                  className="relative inline-block"
                >
                  <Link 
                    href={navItem.href} 
                    className={`relative block px-4 py-2 rounded-lg text-[var(--text-body)] font-medium transition-colors z-10 ${textColorClass}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-capsule"
                        className="absolute inset-0 rounded-lg -z-10 bg-primary shadow-md"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        initial={false}
                      />
                    )}
                    <span className="relative z-10">{navItem.title}</span>
                  </Link>
                </div>
              );
            })}
            </LayoutGroup>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />

            
            <button
              type="button"
              className="lg:hidden bg-surface-muted p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle flex-shrink-0 transition-colors"
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
                      className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary rounded-lg transition-colors"
                    >
                      {navItem.title}
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileProductsOpen ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="mt-1 mb-2 space-y-1 pl-4 border-l-2 border-surface-subtle ml-6 mr-4 overflow-y-auto max-h-[300px] pr-2" style={{ scrollbarWidth: 'thin' }}>
                        <Link
                          href={navItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors"
                        >
                          View All {navItem.title}
                        </Link>
                        {categories.map((category) => (
                          <Link
                            key={category._id}
                            href={`${navItem.href}/${category.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
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
                <Link key={navItem.title} href={navItem.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                  {navItem.title}
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-surface-subtle">
               <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center bg-primary px-6 h-12 rounded-lg text-base font-medium text-primary-foreground hover:opacity-90 transition-colors uppercase tracking-wider"
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
