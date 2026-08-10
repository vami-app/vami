'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CursorPagination from '@/components/ui/CursorPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BlogClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [cursorHistory, setCursorHistory] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
  const [isPaginating, setIsPaginating] = useState(false);

  async function fetchPosts(cursor = null) {
    if (cursor) setIsPaginating(true);
    else setLoading(true);

    try {
      const url = cursor ? `/api/blog?cursor=${encodeURIComponent(cursor)}` : '/api/blog';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.edges) {
        setPosts(data.edges.map(e => e.node));
        setPageInfo(data.pageInfo || { hasNextPage: false, endCursor: null });
      } else {
        setPosts([]);
      }
    } catch (err) {
      toast.error('Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
      setIsPaginating(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(currentCursor);
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
      const res = await fetch(`/api/blog/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted');
        setDeleteTarget(null);
        fetchPosts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete post');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const postList = Array.isArray(posts) ? posts : [];

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        description={`Are you sure you want to delete "${deleteTarget?.title || 'this post'}"? This action cannot be undone.`}
        confirmText="Delete Post"
        isLoading={isDeleting}
      />
      <div className="mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">Blog Posts</h2>
        <Button asChild className="shadow-xl hover:scale-105">
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" /> New Post
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
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border-subtle">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest">Title</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden md:table-cell">Status</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden lg:table-cell">Published Date</th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {postList.map((post) => (
                  <tr key={post._id} className="hover:bg-surface-subtle transition-colors">
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-text-primary">
                      {post.title}
                      <dl className="font-normal md:hidden mt-1">
                        <dt className="sr-only">Status</dt>
                        <dd className="text-text-muted">
                          <Badge variant={post.status === 'published' ? 'primary' : 'default'} size="sm">
                            {post.status}
                          </Badge>
                        </dd>
                      </dl>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden md:table-cell">
                      <Badge variant={post.status === 'published' ? 'primary' : 'default'}>
                        {post.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden lg:table-cell">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                      <Link href={`/admin/blog/${post._id}/edit`} className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: post._id, title: post.title })} className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {postList.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-text-primary">No blog posts found</h3>
              <p className="mt-1 text-sm text-text-muted">Get started by writing a new post.</p>
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
