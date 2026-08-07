'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { UploadCloud, ChevronDown } from 'lucide-react';
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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] border border-border-subtle rounded-lg bg-surface hover:bg-surface-subtle transition-colors p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]',
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
    <form onSubmit={handleSubmit} className="relative pb-24 lg:pb-12 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header & Desktop Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-headline font-semibold text-text-primary uppercase tracking-wider">
            {initialData ? 'Edit Post' : 'Add New Post'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Draft and publish company news or industry insights.</p>
        </div>
        <div className="hidden lg:flex items-center space-x-3">
          <button 
            type="button" 
            onClick={() => router.push('/admin/blog')} 
            className="inline-flex justify-center rounded-lg border border-border-base shadow-sm px-6 py-2.5 bg-surface text-xs uppercase tracking-wider font-semibold text-text-secondary hover:bg-surface-subtle hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus"
          >
            Discard
          </button>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="inline-flex justify-center rounded-lg border border-transparent shadow-xl px-6 py-2.5 bg-primary text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:opacity-90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Content Info */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">Content Details</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Title</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" placeholder="Post Title" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Slug URL</label>
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Excerpt</label>
                <textarea name="excerpt" rows={3} value={formData.excerpt} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" placeholder="A brief summary of the post..." />
              </div>
            </div>
            
            <div className="mt-8">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Article Body</label>
              {editor && (
                <div className="mb-4 flex space-x-2 border-b border-border-subtle pb-3">
                  <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1.5 border border-border-subtle rounded-lg text-sm font-medium transition-colors ${editor.isActive('bold') ? 'bg-surface-subtle text-text-primary' : 'bg-surface text-text-secondary hover:bg-surface-subtle'}`}>Bold</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1.5 border border-border-subtle rounded-lg text-sm font-medium transition-colors ${editor.isActive('italic') ? 'bg-surface-subtle text-text-primary' : 'bg-surface text-text-secondary hover:bg-surface-subtle'}`}>Italic</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1.5 border border-border-subtle rounded-lg text-sm font-medium transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-surface-subtle text-text-primary' : 'bg-surface text-text-secondary hover:bg-surface-subtle'}`}>H2</button>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Card 2: Media */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">Cover Image</h3>
            
            {formData.coverImage && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.coverImage} alt="Cover" className="w-full h-auto max-h-[400px] object-cover" />
              </div>
            )}
            
            <label className="inline-flex justify-center items-center px-4 py-4 border-2 border-dashed border-border-subtle hover:border-border-base rounded-lg text-text-secondary bg-surface-muted hover:bg-surface cursor-pointer transition-all duration-300 w-full">
              <UploadCloud className="mr-2 h-5 w-5" /> 
              <span className="uppercase tracking-wider font-semibold text-xs">{formData.coverImage ? 'Replace Image' : 'Upload Image'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Card 3: SEO (Collapsible) */}
          <details className="group bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden mb-8 lg:mb-0">
            <summary className="p-6 sm:p-8 cursor-pointer list-none flex justify-between items-center outline-none hover:bg-surface-subtle transition-colors">
              <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight">Search Engine Optimization</h3>
              <ChevronDown className="h-5 w-5 text-text-muted group-open:rotate-180 transition-transform duration-300" />
            </summary>
            <div className="p-6 sm:p-8 border-t border-border-subtle space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">SEO Title</label>
                <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary outline-none text-text-primary" />
                <p className="mt-2 text-xs text-text-muted font-medium">{formData.seoTitle.length}/60 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Meta Description</label>
                <textarea name="seoDescription" rows={3} value={formData.seoDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary outline-none text-text-primary" />
                <p className="mt-2 text-xs text-text-muted font-medium">{formData.seoDescription.length}/160 characters</p>
              </div>
            </div>
          </details>

        </div>

        {/* Sidebar (Right Column) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Organization Card */}
          <div className="bg-surface rounded-lg p-6 border border-border-subtle shadow-sm sticky top-8">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-6">Organization</h3>
            
            <div className="space-y-6">
              
              {/* Tags Input */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Tags (Comma Separated)</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="block w-full py-3 px-4 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary outline-none text-sm text-text-primary" placeholder="News, Guides, Insights" />
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Status</label>
                {isStatusOpen && <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)}></div>}
                <div className={`relative ${isStatusOpen ? 'z-30' : 'z-10'}`}>
                  <input type="hidden" name="status" value={formData.status} />
                  <button 
                    type="button" 
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`w-full py-3 px-4 bg-surface/50 border ${isStatusOpen ? 'border-text-primary ring-1 ring-text-primary' : 'border-border-subtle hover:border-border-base'} rounded-lg transition-all text-sm outline-none text-left flex justify-between items-center`}
                  >
                    <span className="text-text-primary font-medium capitalize">{formData.status}</span>
                    <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur border border-border-base rounded-lg shadow-xl overflow-hidden p-1.5 transition-all ${isStatusOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                    <div className="space-y-1">
                      {['draft', 'published'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, status: option });
                            setIsStatusOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all capitalize ${formData.status === option ? 'bg-primary text-primary-foreground font-semibold' : 'text-text-secondary hover:bg-surface-subtle'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-[68px] left-0 right-0 p-4 bg-surface/90 backdrop-blur-md border-t border-border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 flex justify-end space-x-3 sm:px-6">
        <button 
          type="button" 
          onClick={() => router.push('/admin/blog')} 
          className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border border-border-base shadow-sm px-6 py-3 bg-surface text-xs uppercase tracking-wider font-semibold text-text-secondary active:scale-[0.98] transition-transform"
        >
          Discard
        </button>
        <button 
          type="submit" 
          disabled={isSaving} 
          className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border border-transparent shadow-xl px-6 py-3 bg-primary text-xs uppercase tracking-wider font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
        >
          {isSaving ? 'Saving...' : 'Save Post'}
        </button>
      </div>

    </form>
  );
}
