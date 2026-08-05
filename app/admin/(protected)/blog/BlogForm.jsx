'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

export default function BlogForm({ initialData = null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Metadata fields â€” unrelated to editor content
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

  // Editor content â€” stored as { json, html } from Lexical's OnChangePlugin.
  // json = Lexical JSON state (source of truth for MongoDB)
  // html = Lexical HTML projection (for server rendering; sanitized server-side)
  const [editorContent, setEditorContent] = useState({
    json: initialData?.content?.lexicalState ?? null,
    html: initialData?.content?.html ?? '',
  });

  // Ref to track current editor content without causing re-renders on every keystroke
  const editorContentRef = useRef(editorContent);

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

  // Lexical onChange â€” called with { json, html } on every substantive change.
  // We update the ref immediately (no re-render) and the state for submit reads.
  const handleEditorChange = useCallback(({ json, html }) => {
    editorContentRef.current = { json, html };
    setEditorContent({ json, html });
  }, []);

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

    // Guard: editor content must be present before saving
    if (!editorContentRef.current.json) {
      toast.error('Editor content is empty â€” please write something before saving.');
      setIsSaving(false);
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      // Send the Lexical triple projection â€” server sanitizes html and computes plainText
      content: {
        lexicalState: editorContentRef.current.json,
        html: editorContentRef.current.html,
        // plainText is always derived server-side â€” never sent from client
      },
      publishedAt:
        formData.status === 'published' &&
        (!initialData || initialData.status === 'draft')
          ? new Date().toISOString()
          : initialData?.publishedAt,
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

  // Serialize saved JSON state to string for LexicalEditor hydration.
  // LexicalComposer expects a JSON string when initializing from saved state.
  const initialEditorState = initialData?.content?.lexicalState
    ? JSON.stringify(initialData.content.lexicalState)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <Toaster position="top-right" />
      <div className="space-y-8 divide-y divide-gray-200">

        {/* â”€â”€ Post Metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <div>
            <h3 className="text-2xl font-headline font-light text-text-primary tracking-tight">Blog Post Details</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium text-text-secondary">Title</label>
              <div className="mt-1">
                <input
                  type="text" name="title" required
                  value={formData.title} onChange={handleChange}
                  className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary">Status</label>
              <div className="mt-1">
                <select
                  name="status" value={formData.status} onChange={handleChange}
                  className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">Slug</label>
              <div className="mt-1">
                <input
                  type="text" name="slug" required
                  value={formData.slug} onChange={handleChange}
                  className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">Excerpt</label>
              <div className="mt-1">
                <textarea
                  name="excerpt" rows={2}
                  value={formData.excerpt} onChange={handleChange}
                  className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">Tags (comma separated)</label>
              <div className="mt-1">
                <input
                  type="text" name="tags"
                  value={formData.tags} onChange={handleChange}
                  className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Content (Lexical RTE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="pt-8">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Content</h3>
          <RichTextEditor
            initialState={initialEditorState}
            onChange={handleEditorChange}
            placeholder="Write your post content here..."
          />
        </div>

        {/* â”€â”€ Cover Image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ SEO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">SEO Settings</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">SEO Title</label>
              <input
                type="text" name="seoTitle"
                value={formData.seoTitle} onChange={handleChange}
                className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
              />
              <p className="mt-1 text-xs text-text-muted">{formData.seoTitle.length}/60</p>
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">SEO Description</label>
              <textarea
                name="seoDescription" rows={3}
                value={formData.seoDescription} onChange={handleChange}
                className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm"
              />
              <p className="mt-1 text-xs text-text-muted">{formData.seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pt-8 pb-10 border-t border-surface-subtle">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="inline-flex justify-center rounded-full border border-border-base shadow-sm px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center rounded-full border border-transparent shadow-sm px-6 py-2.5 bg-text-primary text-sm font-medium text-text-inverse hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
