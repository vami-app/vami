import {
  LayoutDashboard, Package, FolderTree, FileText, Settings,
} from 'lucide-react';

export const adminConfig = {
  navigation: [
    { name: 'Dashboard',  href: '/admin',             icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'Products',   href: '/admin/products',    icon: Package,         permission: 'manage_products' },
    { name: 'Categories', href: '/admin/categories',  icon: FolderTree,      permission: 'manage_categories' },
    { name: 'Blog',       href: '/admin/blog',        icon: FileText,        permission: 'manage_blog' },
    { name: 'Settings',   href: '/admin/settings',    icon: Settings,        permission: 'manage_settings' },
  ]
};
