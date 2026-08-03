'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function BlogClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted');
        fetchPosts();
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
        <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">Blog Posts</h2>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-text-inverse shadow-sm hover:opacity-90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> New Post
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
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest">Title</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden md:table-cell">Status</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden lg:table-cell">Published Date</th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-surface">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-text-primary">
                      {post.title}
                      <dl className="font-normal md:hidden mt-1">
                        <dt className="sr-only">Status</dt>
                        <dd className="text-text-muted">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.status === 'published' ? 'bg-text-primary text-text-inverse' : 'bg-surface-subtle text-text-secondary'}`}>
                            {post.status}
                          </span>
                        </dd>
                      </dl>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden md:table-cell">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${post.status === 'published' ? 'bg-text-primary text-text-inverse' : 'bg-surface-subtle text-text-secondary'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden lg:table-cell">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                      <Link href={`/admin/blog/${post._id}/edit`} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(post._id)} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {posts.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-text-primary">No posts found</h3>
              <p className="mt-1 text-sm text-text-muted">Get started by creating a new blog post.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
