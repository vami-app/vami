'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function CategoryClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', seoTitle: '', seoDescription: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data?.categories || []));
    } catch (err) {
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryList = Array.isArray(categories) ? categories : [];

  const handleOpenModal = (category = null) => {
    setCurrentCategory(category);
    if (category) {
      setFormData({ 
        name: category.name, 
        slug: category.slug, 
        description: category.description || '',
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || ''
      });
    } else {
      setFormData({ name: '', slug: '', description: '', seoTitle: '', seoDescription: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const method = currentCategory ? 'PUT' : 'POST';
    const url = currentCategory ? `/api/categories/${currentCategory._id}` : '/api/categories';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Category ${currentCategory ? 'updated' : 'created'}`);
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save category');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted');
        fetchCategories();
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
        <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">Categories</h2>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-text-inverse shadow-sm hover:opacity-90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </button>
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
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-widest hidden md:table-cell">Slug</th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-surface">
                {categoryList.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-text-primary">
                      {category.name}
                      <dl className="font-normal md:hidden mt-1">
                        <dt className="sr-only">Slug</dt>
                        <dd className="text-text-muted">{category.slug}</dd>
                      </dl>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-sm text-text-muted hidden md:table-cell">{category.slug}</td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleOpenModal(category)} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(category._id)} className="inline-flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {categoryList.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-text-primary">No categories found</h3>
              <p className="mt-1 text-sm text-text-muted">Get started by creating a new category.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setIsModalOpen(false)} aria-hidden="true" />

          {/* Modal Content Box */}
          <div className="relative bg-surface rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border-subtle z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-headline font-light text-text-primary tracking-tight" id="modal-title">
              {currentCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <div className="mt-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                  <input
                    type="text"
                    required
                    className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        name: val,
                        slug: !currentCategory ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : formData.slug
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Slug</label>
                  <input
                    type="text"
                    required
                    className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                  <textarea
                    className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SEO Title</label>
                  <input
                    type="text"
                    className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-text-muted">{formData.seoTitle.length}/60</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SEO Description</label>
                  <textarea
                    className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-text-muted">{formData.seoDescription.length}/160</p>
                </div>
                <div className="mt-8 pt-6 border-t border-surface-subtle flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex justify-center rounded-full border border-transparent shadow-sm px-6 py-2.5 bg-text-primary text-sm font-medium text-text-inverse hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    {isSaving ? 'Saving...' : 'Save Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-full border border-border-base shadow-sm px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
