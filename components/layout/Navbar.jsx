'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 220;

function resolveActiveTitle(pathname) {
  if (pathname === '/') return 'Home';

  for (const item of siteConfig.mainNav) {
    if (item.children?.length) {
      const childHit = item.children.some(
        (c) => c.href !== '/' && pathname.startsWith(c.href)
      );
      if (childHit) return item.title;
    }
    if (item.href !== '/' && pathname.startsWith(item.href)) {
      return item.title;
    }
  }
  return '';
}

function NavLinkClasses(isActive) {
  return isActive
    ? 'text-primary-foreground'
    : 'text-text-secondary hover:text-primary hover:bg-surface-subtle';
}

function DropdownPanel({ open, children, className }) {
  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <div
        className={cn(
          'min-w-[14rem] w-max max-w-[20rem] bg-surface/95 backdrop-blur-xl border border-border-base rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] flex flex-col origin-top',
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DropdownItem({ href, children, onClick, emphasized }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200',
        emphasized
          ? 'font-medium text-text-primary hover:bg-surface-subtle shadow-sm'
          : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
      )}
    >
      {children}
    </Link>
  );
}

export default function Navbar({ categories = [] }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const activeNavItem = resolveActiveTitle(pathname);
  const onContact = pathname.startsWith('/contact');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const navRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const scheduleOpen = useCallback(
    (title) => {
      clearTimers();
      openTimer.current = setTimeout(() => setOpenMenu(title), HOVER_OPEN_MS);
    },
    [clearTimers]
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpenMenu(null), HOVER_CLOSE_MS);
  }, [clearTimers]);

  const closeAll = useCallback(() => {
    clearTimers();
    setOpenMenu(null);
  }, [clearTimers]);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setMobileSection(null);
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeAll();
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAll]);

  useEffect(() => {
    const onPointer = (e) => {
      if (!navRef.current?.contains(e.target)) closeAll();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [closeAll]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const renderDesktopItem = (navItem) => {
    const isActive = activeNavItem === navItem.title;
    const textColorClass = NavLinkClasses(isActive);
    const isOpen = openMenu === navItem.title;

    if (!navItem.hasDropdown) {
      return (
        <div key={navItem.title} className="relative inline-block">
          <Link
            href={navItem.href}
            className={cn(
              'relative block px-3 py-1.5 rounded-lg text-sm font-medium transition-colors z-10',
              textColorClass
            )}
          >
            {isActive && (
              <motion.div
                layoutId="navbar-capsule"
                className="absolute inset-0 rounded-lg -z-10 bg-primary shadow-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                initial={false}
              />
            )}
            <span className="relative z-10">{navItem.title}</span>
          </Link>
        </div>
      );
    }

    const panelId = `nav-panel-${navItem.title.toLowerCase()}`;

    return (
      <div
        key={navItem.title}
        className="relative inline-block"
        onMouseEnter={() => scheduleOpen(navItem.title)}
        onMouseLeave={scheduleClose}
      >
        <div className="inline-flex items-center">
          <Link
            href={navItem.href}
            className={cn(
              'relative px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center transition-colors z-10',
              textColorClass
            )}
            aria-expanded={isOpen}
            aria-controls={panelId}
            onFocus={() => setOpenMenu(navItem.title)}
          >
            {isActive && (
              <motion.div
                layoutId="navbar-capsule"
                className="absolute inset-0 rounded-lg -z-10 bg-primary shadow-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                initial={false}
              />
            )}
            <span className="relative z-10 flex items-center">
              {navItem.title}
              <ChevronDown
                className={cn(
                  'ml-1 h-4 w-4 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </span>
          </Link>
        </div>

        <div id={panelId} role="region" aria-label={`${navItem.title} submenu`}>
          {navItem.dropdown === 'categories' ? (
            <DropdownPanel open={isOpen} className="w-64 max-w-none">
              <div className="space-y-1">
                <DropdownItem href={navItem.href} emphasized>
                  View All {navItem.title}
                </DropdownItem>
                <div className="h-px bg-border-subtle my-1 mx-2" />
                <div
                  className="overflow-y-auto max-h-[60vh] space-y-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {categories.map((category) => (
                    <DropdownItem
                      key={category._id}
                      href={`${navItem.href}/${category.slug}`}
                    >
                      {category.name}
                    </DropdownItem>
                  ))}
                  {categories.length === 0 && (
                    <span className="block px-4 py-3 text-sm text-text-muted">
                      No categories
                    </span>
                  )}
                </div>
              </div>
            </DropdownPanel>
          ) : (
            <DropdownPanel open={isOpen}>
              <div className="space-y-1">
                {(navItem.children || []).map((child) => (
                  <DropdownItem key={child.href + child.title} href={child.href}>
                    {child.title}
                  </DropdownItem>
                ))}
              </div>
            </DropdownPanel>
          )}
        </div>
      </div>
    );
  };

  const renderMobileItem = (navItem) => {
    if (!navItem.hasDropdown) {
      return (
        <Link
          key={navItem.title}
          href={navItem.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className="block px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
        >
          {navItem.title}
        </Link>
      );
    }

    const expanded = mobileSection === navItem.title;
    const childLinks =
      navItem.dropdown === 'categories'
        ? [
            { title: `View All ${navItem.title}`, href: navItem.href, strong: true },
            ...categories.map((c) => ({
              title: c.name,
              href: `${navItem.href}/${c.slug}`,
            })),
          ]
        : navItem.children || [];

    return (
      <div key={navItem.title} className="block">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() =>
            setMobileSection((prev) => (prev === navItem.title ? null : navItem.title))
          }
          className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary rounded-lg transition-colors"
        >
          {navItem.title}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div
            className="mt-1 mb-2 space-y-1 pl-4 border-l-2 border-surface-subtle ml-6 mr-4 overflow-y-auto max-h-[300px] pr-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            {childLinks.map((child) => (
              <Link
                key={child.href + child.title}
                href={child.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-2.5 rounded-lg text-sm transition-colors',
                  child.strong
                    ? 'font-semibold text-text-primary hover:bg-surface-muted'
                    : 'font-medium text-text-muted hover:text-text-primary hover:bg-surface-muted'
                )}
              >
                {child.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <header
      className={cn(
        'sticky top-[var(--gap)] mt-[var(--gap)] z-50 w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] pointer-events-none',
        isHome
          ? 'h-0'
          : 'h-[calc(var(--nav-block-h)+var(--padding))] mb-[var(--gap)]'
      )}
    >
      <nav
        ref={navRef}
        className={cn(
          'pointer-events-auto relative w-[calc(100%-(var(--padding)*2))] mx-auto bg-surface border border-border-base rounded-2xl px-4 sm:px-[var(--space-6)] shadow-sm transition-all duration-[350ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] mt-[var(--padding)] flex flex-col',
          isScrolled && isHome ? '-translate-y-6' : 'translate-y-0'
        )}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between w-full min-h-[var(--nav-block-h)]">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-2 sm:gap-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt={siteConfig.name}
                className="h-9 sm:h-12 w-auto object-contain"
              />
              <span className="text-sm font-semibold tracking-wider text-text-primary sm:hidden">
                RMA
              </span>
              <span className="sr-only">{siteConfig.name}</span>
            </Link>
          </div>

          <div className="hidden xl:flex space-x-1 absolute left-1/2 -translate-x-1/2">
            <LayoutGroup>{siteConfig.mainNav.map(renderDesktopItem)}</LayoutGroup>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />

            <Button
              asChild
              className={cn(
                'hidden sm:inline-flex px-4 h-10 shadow-none',
                onContact && 'ring-2 ring-primary/30'
              )}
            >
              <Link href="/contact">Request Quote</Link>
            </Button>

            <button
              type="button"
              className="xl:hidden bg-surface-muted p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle flex-shrink-0 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav-panel"
          className={cn(
            'w-full xl:hidden overflow-hidden transition-all duration-300 ease-in-out',
            isMobileMenuOpen ? 'max-h-[80vh] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'
          )}
        >
          <div className="pt-4 space-y-1 border-t border-border-subtle overflow-y-auto max-h-[70vh]">
            {siteConfig.mainNav.map(renderMobileItem)}

            <div className="mt-4 pt-4 border-t border-surface-subtle">
              <Button
                asChild
                className="w-full px-6 h-12 text-base font-medium shadow-none tracking-wider"
              >
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
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
