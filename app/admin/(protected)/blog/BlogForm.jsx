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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] border border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors p-6',
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
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <Toaster position="top-right" />
      <div className="space-y-8 divide-y divide-gray-200">
        
        <div>
          <div>
            <h3 className="text-2xl font-headline font-light text-gray-900 tracking-tight">Blog Post Details</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <div className="mt-1">
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <select name="status" value={formData.status} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <div className="mt-1">
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Excerpt</label>
              <div className="mt-1">
                <textarea name="excerpt" rows={2} value={formData.excerpt} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
              <div className="mt-1">
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Content</h3>
          {editor && (
            <div className="mb-4 flex space-x-2 border-b pb-2">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 border rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}>Bold</button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 border rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-white'}`}>Italic</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 border rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-white'}`}>H2</button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* Media */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Cover Image</h3>
          </div>
          <div className="mt-6 flex items-center space-x-6">
            {formData.coverImage && (
              <img src={formData.coverImage} alt="Cover" className="h-32 w-48 object-cover rounded-md border" />
            )}
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <UploadCloud className="-ml-1 mr-2 h-5 w-5 text-gray-400" /> Upload Image
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">SEO Settings</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">SEO Title</label>
              <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              <p className="mt-1 text-xs text-gray-500">{formData.seoTitle.length}/60</p>
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">SEO Description</label>
              <textarea name="seoDescription" rows={3} value={formData.seoDescription} onChange={handleChange} className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-gray-900 shadow-sm" />
              <p className="mt-1 text-xs text-gray-500">{formData.seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-10 border-t border-gray-100">
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.push('/admin/blog')} className="inline-flex justify-center rounded-full border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex justify-center rounded-full border border-transparent shadow-sm px-6 py-2.5 bg-black text-sm font-medium text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
