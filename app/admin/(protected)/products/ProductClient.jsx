'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CursorPagination from '@/components/ui/CursorPagination';

export default function ProductClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [cursorHistory, setCursorHistory] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
  const [isPaginating, setIsPaginating] = useState(false);

  async function fetchProducts(cursor = null) {
    if (cursor) setIsPaginating(true);
    else setLoading(true);

    try {
      const url = cursor ? `/api/products?cursor=${encodeURIComponent(cursor)}` : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.edges) {
        setProducts(data.edges.map(e => e.node));
        setPageInfo(data.pageInfo || { hasNextPage: false, endCursor: null });
      } else {
        setProducts([]);
      }
    } catch (err) {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
      setIsPaginating(false);
    }
  }

  useEffect(() => {
    fetchProducts(currentCursor);
  }, [currentCursor]);

  const handleNext = () => {
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      setCursorHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(pageInfo.endCursor);
    }
  };

  const handlePrev = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCurrentCursor(prevCursor);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        setDeleteTarget(null);
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete product');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const productList = Array.isArray(products) ? products : [];

  return (
    <>
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name || 'this product'}"? This action cannot be undone.`}
        confirmText="Delete Product"
        isLoading={isDeleting}
      />
      <div className="mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">Inventory Management</h2>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-text-inverse shadow-sm hover:opacity-90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/5">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest">Name</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden sm:table-cell">Category</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden md:table-cell">Status</th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-surface">
                {productList.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-text-primary">
                      {product.name}
                      <dl className="font-normal sm:hidden mt-1">
                        <dt className="sr-only">Category</dt>
                        <dd className="text-text-muted">{product.category?.name}</dd>
                        <dt className="sr-only">Status</dt>
                        <dd className="text-text-muted mt-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.status === 'published' ? 'bg-text-primary text-text-inverse' : 'bg-surface-subtle text-text-secondary'}`}>
                            {product.status}
                          </span>
                        </dd>
                      </dl>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden sm:table-cell">{product.category?.name}</td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden md:table-cell">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${product.status === 'published' ? 'bg-text-primary text-text-inverse' : 'bg-surface-subtle text-text-secondary'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                      <Link href={`/admin/products/${product._id}/edit`} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: product._id, name: product.name })} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {productList.length === 0 && (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No products found</h3>
              <p className="mt-1 text-sm text-text-muted">Get started by creating a new product.</p>
            </div>
          )}
          <CursorPagination
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={pageInfo.hasNextPage}
            hasPrev={cursorHistory.length > 0}
            isLoading={loading || isPaginating}
          />
        </div>
      )}
    </>
  );
}
