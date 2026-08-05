'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function BlogForm({ initialData = null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    coverImage: initialData?.coverImage || '',
    excerpt: initialData?.excerpt || '',
    tags: initialData?.tags?.join(', ') || '',
    status: initialData?.status || 'draft',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData?.content || '<p>Write your post content here...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] border border-border-subtle rounded-xl bg-surface-muted hover:bg-surface transition-colors p-6',
      },
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'title' && !initialData) {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      const toastId = toast.loading('Uploading image...');
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'blog' }),
        });
        const data = await res.json();
        if (res.ok) {
          setFormData((prev) => ({ ...prev, coverImage: data.url }));
          toast.success('Image uploaded', { id: toastId });
        } else {
          toast.error(data.error || 'Failed to upload', { id: toastId });
        }
      } catch (err) {
        toast.error('Upload error', { id: toastId });
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: editor.getHTML(),
      publishedAt: formData.status === 'published' && (!initialData || initialData.status === 'draft') ? new Date().toISOString() : initialData?.publishedAt,
    };

    const method = initialData ? 'PUT' : 'POST';
    const url = initialData ? `/api/blog/${initialData._id}` : '/api/blog';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Post ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/blog');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save post');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500 mb-12">
      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-border-subtle">
        <Toaster position="top-right" />
        <div className="space-y-8 divide-y divide-border-subtle">
        
        <div>
          <div>
            <h3 className="text-2xl font-headline font-light text-text-primary tracking-tight">Blog Post Details</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Title</label>
              <div className="mt-1">
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Status</label>
              <div className="mt-1">
                {isStatusOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)}></div>
                )}
                <div className={`relative ${isStatusOpen ? 'z-30' : 'z-10'}`}>
                  <input type="hidden" name="status" value={formData.status} />
                  <button 
                    type="button" 
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`w-full py-3.5 px-5 bg-surface/50 border ${isStatusOpen ? 'border-text-primary ring-1 ring-text-primary bg-surface' : 'border-border-subtle hover:border-border-base'} rounded-2xl transition-all duration-300 outline-none text-left flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}
                  >
                    <span className="text-text-primary font-medium capitalize">{formData.status}</span>
                    <svg className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-out ${isStatusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  <div className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border-base rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] ${isStatusOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                    <div className="space-y-1">
                      {['draft', 'published'].map((option) => {
                        const isSelected = formData.status === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, status: option });
                              setIsStatusOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between capitalize ${isSelected ? 'bg-text-primary text-text-inverse font-medium shadow-md' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}`}
                          >
                            {option}
                            {isSelected && (
                              <svg className="h-4 w-4 text-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Slug</label>
              <div className="mt-1">
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Excerpt</label>
              <div className="mt-1">
                <textarea name="excerpt" rows={2} value={formData.excerpt} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Tags (comma separated)</label>
              <div className="mt-1">
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Content</h3>
          {editor && (
            <div className="mb-4 flex space-x-2 border-b pb-2">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 border border-border-subtle rounded ${editor.isActive('bold') ? 'bg-surface-subtle' : 'bg-surface'}`}>Bold</button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 border border-border-subtle rounded ${editor.isActive('italic') ? 'bg-surface-subtle' : 'bg-surface'}`}>Italic</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 border border-border-subtle rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-surface-subtle' : 'bg-surface'}`}>H2</button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* Media */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">Cover Image</h3>
          </div>
          <div className="mt-6 flex items-center space-x-6">
            {formData.coverImage && (
              <img src={formData.coverImage} alt="Cover" className="h-32 w-48 object-cover rounded-md border" />
            )}
            <label className="inline-flex items-center px-4 py-2 border border-border-base shadow-sm text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-surface-muted cursor-pointer">
              <UploadCloud className="-ml-1 mr-2 h-5 w-5 text-text-muted" /> Upload Image
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">SEO Settings</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">SEO Title</label>
              <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              <p className="mt-1 text-xs text-text-muted">{formData.seoTitle.length}/60</p>
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">SEO Description</label>
              <textarea name="seoDescription" rows={3} value={formData.seoDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              <p className="mt-1 text-xs text-text-muted">{formData.seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-10 border-t border-surface-subtle">
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.push('/admin/blog')} className="inline-flex justify-center rounded-full border border-border-base shadow-sm px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex justify-center rounded-full border border-transparent shadow-xl px-6 py-2.5 bg-text-primary text-sm font-medium text-text-inverse hover:opacity-90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
      </form>
    </div>
  );
}
