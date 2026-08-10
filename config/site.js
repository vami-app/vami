export const siteConfig = {
  name: 'Radhey Metal Alloys LLP',
  /**
   * Primary nav — keep ≤7 top-level items (NN/g / enterprise B2B standard).
   * Contact is intentionally omitted: Request Quote CTA → /contact.
   * Secondary destinations nest under Company / Resources dropdowns.
   */
  mainNav: [
    { title: 'Home', href: '/' },
    {
      title: 'Products',
      href: '/products',
      hasDropdown: true,
      dropdown: 'categories',
    },
    { title: 'Industries', href: '/industries' },
    { title: 'Capabilities', href: '/capabilities' },
    {
      title: 'Company',
      href: '/about',
      hasDropdown: true,
      children: [
        { title: 'About Us', href: '/about' },
        { title: 'Quality', href: '/quality' },
        { title: 'Certificates', href: '/certificates' },
      ],
    },
    {
      title: 'Resources',
      href: '/resources',
      hasDropdown: true,
      children: [
        { title: 'Downloads & Specs', href: '/resources' },
        { title: 'Blog', href: '/blog' },
      ],
    },
  ],
  footerNav: {
    company: [
      { title: 'About', href: '/about' },
      { title: 'Capabilities', href: '/capabilities' },
      { title: 'Quality', href: '/quality' },
      { title: 'Industries', href: '/industries' },
      { title: 'Contact', href: '/contact' },
    ],
    products: [
      { title: 'All Products', href: '/products' },
      { title: 'Custom Castings', href: '/contact?product=Custom%20Castings' },
    ],
    resources: [
      { title: 'Resources', href: '/resources' },
      { title: 'Certificates', href: '/certificates' },
      { title: 'Request Quote', href: '/contact' },
      { title: 'Blog', href: '/blog' },
    ],
    legal: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms', href: '/terms' },
      { title: 'Disclaimer', href: '/disclaimer' },
    ],
  },
};
