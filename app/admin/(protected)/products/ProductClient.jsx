'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CursorPagination from '@/components/ui/CursorPagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="flex flex-col flex-1 w-full min-h-0">
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
        <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">Products</h2>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both">
          <div className="flex-1 overflow-auto hide-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="pr-6"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productList.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="pl-6 font-medium text-text-primary">
                      {product.name}
                      <dl className="font-normal sm:hidden mt-1">
                        <dt className="sr-only">Category</dt>
                        <dd className="text-text-muted">{product.category?.name}</dd>
                        <dt className="sr-only">Status</dt>
                        <dd className="text-text-muted mt-1">
                          <Badge variant={product.status === 'published' ? 'primary' : 'default'} size="sm">
                            {product.status}
                          </Badge>
                        </dd>
                      </dl>
                    </TableCell>
                    <TableCell className="text-text-muted hidden sm:table-cell">{product.category?.name}</TableCell>
                    <TableCell className="text-text-muted hidden md:table-cell">
                      <Badge variant={product.status === 'published' ? 'primary' : 'default'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right space-x-3">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/products/${product._id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghostDestructive" size="icon" onClick={() => setDeleteTarget({ id: product._id, name: product.name })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}
