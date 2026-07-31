import { requireAuthPage } from '@/lib/auth';
import Link from 'next/link';
import { LayoutDashboard, Package, FolderTree, FileText, Settings, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }) {
  await requireAuthPage(); // Server-side auth guard

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white tracking-tight">Smalloys Admin</h1>
          </div>
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-gray-800 p-4">
            <Link href="/admin/logout" className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <LogOut className="inline-block h-5 w-5 rounded-full text-gray-400 group-hover:text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white">Sign Out</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-900 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-white px-4 tracking-tight">Smalloys Admin</h1>
          {/* Mobile menu button could go here, omitting for brevity; real app would use a stateful client component for mobile slideover */}
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
