'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, UploadCloud } from 'lucide-react';

export default function ProductForm({ initialData = null }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    category: initialData?.category?._id || initialData?.category || '',
    shortDescription: initialData?.shortDescription || '',
    longDescription: initialData?.longDescription || '',
    specs: initialData?.specs || [],
    variants: initialData?.variants || [],
    images: initialData?.images || [],
    status: initialData?.status || 'draft',
    featured: initialData?.featured || false,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
      if (data.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name' && !initialData) {
      setFormData({
        ...formData,
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  // Specs Handlers
  const addSpec = () => {
    setFormData({ ...formData, specs: [...formData.specs, { key: '', value: '' }] });
  };
  const updateSpec = (index, field, value) => {
    const newSpecs = [...formData.specs];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specs: newSpecs });
  };
  const removeSpec = (index) => {
    const newSpecs = [...formData.specs];
    newSpecs.splice(index, 1);
    setFormData({ ...formData, specs: newSpecs });
  };

  // Variants Handlers
  const addVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { name: '', priceNote: '', images: [] }] });
  };
  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };
  const removeVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  // Image Upload Handler
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
          body: JSON.stringify({ file: base64, folder: 'products' }),
        });
        const data = await res.json();
        if (res.ok) {
          setFormData((prev) => ({ ...prev, images: [...prev.images, data.url] }));
          toast.success('Image uploaded', { id: toastId });
        } else {
          toast.error(data.error || 'Failed to upload', { id: toastId });
        }
      } catch (err) {
        toast.error('Upload error', { id: toastId });
      }
    };
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (!formData.category) {
      toast.error('Please select a category');
      setIsSaving(false);
      return;
    }

    const method = initialData ? 'PUT' : 'POST';
    const url = initialData ? `/api/products/${initialData._id}` : '/api/products';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Product ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/products');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save product');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-border-subtle">
      <Toaster position="top-right" />
      <div className="space-y-8 divide-y divide-border-subtle">
        
        {/* Basic Information */}
        <div>
          <div>
            <h3 className="text-2xl font-headline font-light text-text-primary tracking-tight">Basic Information</h3>
            <p className="mt-1 text-sm text-text-muted">Public product details and categorization.</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary">Product Name</label>
              <div className="mt-1">
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary">Slug</label>
              <div className="mt-1">
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary">Category</label>
              <div className="mt-1">
                <select name="category" required value={formData.category} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm">
                  {loadingCategories ? <option>Loading...</option> : categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary">Status</label>
              <div className="mt-1">
                <select name="status" value={formData.status} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">Short Description</label>
              <div className="mt-1">
                <textarea name="shortDescription" rows={2} value={formData.shortDescription} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">Long Description (HTML supported)</label>
              <div className="mt-1">
                <textarea name="longDescription" rows={6} value={formData.longDescription} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Specs */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">Specifications (Key-Value)</h3>
            <p className="mt-1 text-sm text-text-muted">Add dynamic attributes (e.g. Material: Steel, Size: Large).</p>
          </div>
          <div className="mt-6 space-y-4">
            {formData.specs.map((spec, index) => (
              <div key={index} className="flex items-center space-x-4">
                <input type="text" placeholder="Key (e.g. Material)" required value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
                <input type="text" placeholder="Value (e.g. Aluminum)" required value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
                <button type="button" onClick={() => removeSpec(index)} className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-red-600 hover:bg-red-50 focus:outline-none">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addSpec} className="mt-2 inline-flex items-center px-4 py-2 border border-border-base shadow-sm text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-surface-muted">
              <Plus className="-ml-1 mr-2 h-5 w-5 text-text-muted" /> Add Specification
            </button>
          </div>
        </div>

        {/* Dynamic Variants */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">Variants</h3>
            <p className="mt-1 text-sm text-text-muted">Different forms of this product (e.g. sizes, colors, grades).</p>
          </div>
          <div className="mt-6 space-y-6">
            {formData.variants.map((variant, index) => (
              <div key={index} className="bg-surface-muted p-4 rounded-md border border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-text-primary">Variant #{index + 1}</h4>
                  <button type="button" onClick={() => removeVariant(index)} className="text-red-600 hover:text-red-900">Remove</button>
                </div>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">Variant Name</label>
                    <input type="text" required value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">Price / Note</label>
                    <input type="text" value={variant.priceNote} onChange={(e) => updateVariant(index, 'priceNote', e.target.value)} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="inline-flex items-center px-4 py-2 border border-border-base shadow-sm text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-surface-muted">
              <Plus className="-ml-1 mr-2 h-5 w-5 text-text-muted" /> Add Variant
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">Media Gallery</h3>
            <p className="mt-1 text-sm text-text-muted">Upload primary images for this product.</p>
          </div>
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-border-subtle aspect-w-1 aspect-h-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Product ${index}`} className="object-cover w-full h-32" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-600 text-text-inverse rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 border border-border-base shadow-sm text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-surface-muted cursor-pointer">
                <UploadCloud className="-ml-1 mr-2 h-5 w-5 text-text-muted" /> Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-text-primary">SEO Settings</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">SEO Title</label>
              <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              <p className="mt-1 text-xs text-text-muted">{formData.seoTitle.length}/60</p>
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary">SEO Description</label>
              <textarea name="seoDescription" rows={3} value={formData.seoDescription} onChange={handleChange} className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface outline-none text-text-primary shadow-sm" />
              <p className="mt-1 text-xs text-text-muted">{formData.seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-10 border-t border-surface-subtle">
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.push('/admin/products')} className="inline-flex justify-center rounded-full border border-border-base shadow-sm px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex justify-center rounded-full border border-transparent shadow-xl px-6 py-2.5 bg-text-primary text-sm font-medium text-text-inverse hover:opacity-90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
