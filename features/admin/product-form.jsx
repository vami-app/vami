'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, UploadCloud } from 'lucide-react';

export default function ProductForm({ initialData = null }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

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
    <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500 mb-12">
      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-border-subtle">
        <div className="space-y-8 divide-y divide-border-subtle">
        
        {/* Basic Information */}
        <div>
          <div>
            <h3 className="text-2xl font-headline font-light text-text-primary tracking-tight">Basic Information</h3>
            <p className="mt-1 text-sm text-text-muted">Public product details and categorization.</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Product Name</label>
              <div className="mt-1">
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Slug</label>
              <div className="mt-1">
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Category</label>
              <div className="mt-1">
                {isCategoryOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>
                )}
                <div className={`relative ${isCategoryOpen ? 'z-30' : 'z-10'}`}>
                  <input type="hidden" name="category" value={formData.category} />
                  <button 
                    type="button" 
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`w-full py-3.5 px-5 bg-surface/50 border ${isCategoryOpen ? 'border-text-primary ring-1 ring-text-primary bg-surface' : 'border-border-subtle hover:border-border-base'} rounded-2xl transition-all duration-300 outline-none text-left flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}
                  >
                    <span className="text-text-primary font-medium">
                      {loadingCategories ? 'Loading...' : (categories.find(c => c._id === formData.category)?.name || 'Select Category')}
                    </span>
                    <svg className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-out ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  <div className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border-base rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] ${isCategoryOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                    <div className="space-y-1">
                      {categories.map((c) => {
                        const isSelected = formData.category === c._id;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: c._id });
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${isSelected ? 'bg-text-primary text-text-inverse font-medium shadow-md' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}`}
                          >
                            {c.name}
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

            <div className="sm:col-span-3">
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
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Short Description</label>
              <div className="mt-1">
                <textarea name="shortDescription" rows={2} value={formData.shortDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Long Description (HTML supported)</label>
              <div className="mt-1">
                <textarea name="longDescription" rows={6} value={formData.longDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
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
                <input type="text" placeholder="Key (e.g. Material)" required value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
                <input type="text" placeholder="Value (e.g. Aluminum)" required value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
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
                    <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Variant Name</label>
                    <input type="text" required value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Price / Note</label>
                    <input type="text" value={variant.priceNote} onChange={(e) => updateVariant(index, 'priceNote', e.target.value)} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-2xl focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
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
          <button type="button" onClick={() => router.push('/admin/products')} className="inline-flex justify-center rounded-full border border-border-base shadow-sm px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex justify-center rounded-full border border-transparent shadow-xl px-6 py-2.5 bg-text-primary text-sm font-medium text-text-inverse hover:opacity-90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus">
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
      </form>
    </div>
  );
}
