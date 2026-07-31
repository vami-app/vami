import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';
import Category from '@/models/Category';
import { Package, FileText, FolderTree } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  await dbConnect();
  
  const productCount = await Product.countDocuments();
  const blogCount = await BlogPost.countDocuments();
  const categoryCount = await Category.countDocuments();

  const stats = [
    { name: 'Total Products', stat: productCount, icon: Package, href: '/admin/products' },
    { name: 'Total Categories', stat: categoryCount, icon: FolderTree, href: '/admin/categories' },
    { name: 'Total Blog Posts', stat: blogCount, icon: FileText, href: '/admin/blog' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
              <dt>
                <div className="absolute bg-blue-600 rounded-md p-3 group-hover:bg-blue-700 transition-colors">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              </dd>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
