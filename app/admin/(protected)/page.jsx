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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <h1 className="text-3xl sm:text-4xl font-headline font-light text-text-primary mb-8 tracking-tight">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className="relative bg-surface p-6 sm:p-8 border border-border-subtle rounded-[calc(var(--outer-radius)-8px)] overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted tracking-wide uppercase">{item.name}</p>
                <p className="mt-4 text-4xl sm:text-5xl font-headline font-light text-text-primary tracking-tight">{item.stat}</p>
              </div>
              <div className="bg-surface-muted rounded-2xl p-4 border border-border-subtle group-hover:bg-black group-hover:border-black transition-colors duration-300 flex items-center justify-center">
                <item.icon className="h-6 w-6 text-text-muted group-hover:text-white transition-colors duration-300" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
