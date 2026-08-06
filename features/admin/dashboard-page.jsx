import { Package, FileText, FolderTree } from 'lucide-react';
import { StatCard } from '@/components/molecules/stat-card';
import { Text } from '@/components/atoms/text';

export function DashboardPageFeature({ stats }) {
  const statItems = [
    { name: 'Total Products', stat: stats.productCount, icon: Package, href: '/admin/products' },
    { name: 'Total Categories', stat: stats.categoryCount, icon: FolderTree, href: '/admin/categories' },
    { name: 'Total Blog Posts', stat: stats.blogCount, icon: FileText, href: '/admin/blog' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <Text as="h1" variant="headline" className="text-3xl sm:text-4xl font-light mb-8 tracking-tight">
        Dashboard Overview
      </Text>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <StatCard key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}
