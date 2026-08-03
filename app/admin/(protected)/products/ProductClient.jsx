'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProductClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <h2 className="text-2xl font-headline font-light text-gray-900 tracking-tight">Inventory Management</h2>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-[calc(var(--outer-radius)-8px)] border border-black/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/5">
              <thead className="bg-[#f9f9f9]">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-widest">Name</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Category</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">Status</th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-white">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-gray-900">
                      {product.name}
                      <dl className="font-normal sm:hidden mt-1">
                        <dt className="sr-only">Category</dt>
                        <dd className="text-gray-500">{product.category?.name}</dd>
                        <dt className="sr-only">Status</dt>
                        <dd className="text-gray-500 mt-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.status === 'published' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {product.status}
                          </span>
                        </dd>
                      </dl>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500 hidden sm:table-cell">{product.category?.name}</td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500 hidden md:table-cell">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${product.status === 'published' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                      <Link href={`/admin/products/${product._id}/edit`} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(product._id)} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
