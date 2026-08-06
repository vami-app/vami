'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { siteConfig } from '@/config/site';

// Atoms
import { Link } from '@/components/atoms/link';
import { Button } from '@/components/atoms/button';
import { ThemeToggle } from '@/components/atoms/theme-toggle';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';

export function Navbar({ categories = [] }) {
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
        className={`pointer-events-auto relative w-[calc(100%-(var(--padding)*2))] mx-auto bg-surface border border-border-base rounded-[var(--inner-radius)] px-4 sm:px-[var(--space-6)] shadow-sm transition-all duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] mt-[var(--padding)] flex flex-col ${isScrolled && isHome ? '-translate-y-6' : 'translate-y-0'}`}
        aria-label="Top"
      >
        <div className="flex items-center justify-between w-full min-h-[var(--nav-block-h)]">
          <div className="flex items-center">
            <Link href="/" variant="default" className="flex-shrink-0 flex items-center gap-3 hover:no-underline" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/images/logo.png" alt={siteConfig.name} className="h-12 sm:h-16 w-auto object-contain" />
              <span className="sr-only">{siteConfig.name}</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex space-x-2 absolute left-1/2 -translate-x-1/2">
            <LayoutGroup>
            {siteConfig.mainNav.map((navItem) => {
              const isActive = activeNavItem === navItem.title;
              const textColorClass = isActive ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle';

              if (navItem.hasDropdown) {
                return (
                  <div 
                    key={navItem.title} 
                    className="relative inline-block"
                    onMouseEnter={() => setIsDesktopProductsOpen(true)}
                    onMouseLeave={() => setIsDesktopProductsOpen(false)}
                  >
                    <Link variant="default" href={navItem.href} className={`relative px-4 py-2 rounded-full text-[var(--text-body)] font-medium inline-flex items-center transition-colors z-10 hover:no-underline ${textColorClass}`}>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-capsule"
                          className="absolute inset-0 rounded-full -z-10 bg-text-primary shadow-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          initial={false}
                        />
                      )}
                      <span className="relative z-10 flex items-center">
                        {navItem.title} <Icon icon={ChevronDown} size="sm" className="ml-1" />
                      </span>
                    </Link>
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 ${isDesktopProductsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                      <div className={`w-64 bg-surface/95 backdrop-blur-xl border border-border-base rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] flex flex-col origin-top ${isDesktopProductsOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                        <div className="space-y-1">
                          <Link
                            variant="default"
                            href={navItem.href}
                            className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-text-primary hover:bg-surface-subtle shadow-sm hover:no-underline"
                          >
                            View All {navItem.title}
                          </Link>
                          <div className="h-px bg-border-subtle my-1 mx-2 flex-shrink-0"></div>
                          <div className="overflow-y-auto max-h-[60vh] space-y-1" style={{ scrollbarWidth: 'thin' }}>
                            {categories.map((category) => (
                              <Link
                                variant="default"
                                key={category._id}
                                href={`${navItem.href}/${category.slug}`}
                                className="block w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 text-text-secondary hover:bg-surface-subtle hover:text-text-primary hover:no-underline"
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
                    variant="default"
                    href={navItem.href} 
                    className={`relative block px-4 py-2 rounded-full text-[var(--text-body)] font-medium transition-colors z-10 hover:no-underline ${textColorClass}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-capsule"
                        className="absolute inset-0 rounded-full -z-10 bg-text-primary shadow-md"
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
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 bg-surface-muted text-text-secondary hover:text-text-primary hover:bg-surface-subtle flex-shrink-0 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <Icon icon={X} size="md" aria-hidden="true" />
              ) : (
                <Icon icon={Menu} size="md" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu - Inline accordion inside nav */}
        <div className={`w-full lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}`}>
          <div className="pt-4 space-y-1 border-t border-border-subtle overflow-y-auto max-h-[70vh]">
            
            {siteConfig.mainNav.map((navItem) => {
              if (navItem.hasDropdown) {
                return (
                  <div key={navItem.title} className="block">
                    <Button 
                      variant="ghost"
                      onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary rounded-2xl transition-colors h-auto"
                    >
                      {navItem.title}
                      <Icon icon={ChevronDown} size="sm" className={`transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileProductsOpen ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="mt-1 mb-2 space-y-1 pl-4 border-l-2 border-surface-subtle ml-6 mr-4 overflow-y-auto max-h-[300px] pr-2" style={{ scrollbarWidth: 'thin' }}>
                        <Link
                          variant="default"
                          href={navItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors hover:no-underline"
                        >
                          View All {navItem.title}
                        </Link>
                        {categories.map((category) => (
                          <Link
                            variant="default"
                            key={category._id}
                            href={`${navItem.href}/${category.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors hover:no-underline"
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
                <Link variant="default" key={navItem.title} href={navItem.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors hover:no-underline">
                  {navItem.title}
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-surface-subtle">
               <Button asChild className="w-full h-12 rounded-full text-base font-medium">
                <Link
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:no-underline"
                  >
                    Request Quote
                  </Link>
               </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
