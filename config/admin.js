import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileText,
  Settings,
  Inbox,
  Award,
  BookOpen,
  Layers,
  GitCompare,
} from 'lucide-react';

/** Display order for More-sheet section headers */
export const MOBILE_MORE_GROUP_ORDER = ['catalog', 'content', 'assets', 'system'];

export const MOBILE_MORE_GROUP_LABELS = {
  catalog: 'Catalog',
  content: 'Content',
  assets: 'Assets',
  system: 'System',
};

export const adminConfig = {
  navigation: [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      permission: 'view_dashboard',
      mobilePrimary: true,
    },
    {
      name: 'Leads',
      href: '/admin/leads',
      icon: Inbox,
      permission: 'manage_leads',
      mobilePrimary: true,
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      permission: 'manage_products',
      mobilePrimary: true,
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
      permission: 'manage_categories',
      group: 'catalog',
    },
    {
      name: 'Certificates',
      href: '/admin/certificates',
      icon: Award,
      permission: 'manage_certificates',
      group: 'assets',
    },
    {
      name: 'Resources',
      href: '/admin/resources',
      icon: BookOpen,
      permission: 'manage_resources',
      group: 'assets',
    },
    {
      name: 'Page Content',
      href: '/admin/content',
      icon: Layers,
      permission: 'manage_content',
      group: 'content',
    },
    {
      name: 'Comparisons',
      href: '/admin/comparisons',
      icon: GitCompare,
      permission: 'manage_content',
      group: 'content',
    },
    {
      name: 'Blog',
      href: '/admin/blog',
      icon: FileText,
      permission: 'manage_blog',
      group: 'content',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      permission: 'manage_settings',
      group: 'system',
    },
  ],
};

/** True when pathname matches a nav href (exact for /admin; prefix for nested routes). */
export function isAdminNavActive(pathname, href) {
  if (!pathname || !href) return false;
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}
