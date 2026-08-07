'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, UploadCloud, ChevronDown } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="relative pb-24 lg:pb-12 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header & Desktop Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-headline font-semibold text-text-primary uppercase tracking-wider">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Manage product details, pricing, and media.</p>
        </div>
        <div className="hidden lg:flex items-center space-x-3">
          <button 
            type="button" 
            onClick={() => router.push('/admin/products')} 
            className="inline-flex justify-center rounded-lg border border-border-base shadow-sm px-6 py-2.5 bg-surface text-xs uppercase tracking-wider font-semibold text-text-secondary hover:bg-surface-subtle hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-focus"
          >
            Discard
          </button>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="inline-flex justify-center rounded-lg border border-transparent shadow-xl px-6 py-2.5 bg-primary text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:opacity-90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Basic Info */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">General Information</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Product Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" placeholder="e.g. Stainless Steel Pipe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Slug URL</label>
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Short Description</label>
                <textarea name="shortDescription" rows={2} value={formData.shortDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" placeholder="A brief summary of the product..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Long Description (HTML Supported)</label>
                <textarea name="longDescription" rows={5} value={formData.longDescription} onChange={handleChange} className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]" placeholder="Detailed product specifications and features..." />
              </div>
            </div>
          </div>

          {/* Card 2: Media */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">Media Gallery</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {formData.images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-border-subtle aspect-square bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Product ${index}`} className="object-cover w-full h-full" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <label className="inline-flex justify-center items-center px-4 py-4 border-2 border-dashed border-border-subtle hover:border-border-base rounded-lg text-text-secondary bg-surface-muted hover:bg-surface cursor-pointer transition-all duration-300 w-full">
              <UploadCloud className="mr-2 h-5 w-5" /> 
              <span className="uppercase tracking-wider font-semibold text-xs">Upload Images</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Card 3: Specifications */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">Specifications</h3>
            
            <div className="space-y-4">
              {formData.specs.map((spec, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input type="text" placeholder="Key (e.g. Material)" required value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} className="block w-1/3 py-2.5 px-4 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary outline-none text-sm text-text-primary" />
                  <input type="text" placeholder="Value (e.g. Aluminum)" required value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} className="block w-full py-2.5 px-4 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary outline-none text-sm text-text-primary" />
                  <button type="button" onClick={() => removeSpec(index)} className="inline-flex items-center p-2.5 border border-border-subtle rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSpec} className="mt-4 inline-flex items-center px-4 py-2.5 border border-border-base shadow-sm uppercase tracking-wider font-semibold text-xs rounded-lg text-text-secondary bg-surface hover:bg-surface-muted transition-colors">
                <Plus className="-ml-1 mr-2 h-4 w-4 text-text-muted" /> Add Specification
              </button>
            </div>
          </div>

          {/* Card 4: Variants */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-6">Product Variants</h3>
            
            <div className="space-y-6">
              {formData.variants.map((variant, index) => (
                <div key={index} className="bg-surface-muted p-5 rounded-lg border border-border-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Variant #{index + 1}</h4>
                    <button type="button" onClick={() => removeVariant(index)} className="text-xs uppercase tracking-wider font-semibold text-red-600 hover:text-red-700">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Variant Name</label>
                      <input type="text" required value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="block w-full py-2.5 px-4 bg-surface border border-border-subtle rounded-lg focus:ring-1 focus:ring-text-primary outline-none text-sm text-text-primary" placeholder="e.g. 10mm Thickness" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Price / Note</label>
                      <input type="text" value={variant.priceNote} onChange={(e) => updateVariant(index, 'priceNote', e.target.value)} className="block w-full py-2.5 px-4 bg-surface border border-border-subtle rounded-lg focus:ring-1 focus:ring-text-primary outline-none text-sm text-text-primary" placeholder="e.g. Contact for Price" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVariant} className="inline-flex items-center px-4 py-2.5 border border-border-base shadow-sm uppercase tracking-wider font-semibold text-xs rounded-lg text-text-secondary bg-surface hover:bg-surface-muted transition-colors">
                <Plus className="-ml-1 mr-2 h-4 w-4 text-text-muted" /> Add Variant
              </button>
            </div>
          </div>

          {/* Card 5: SEO (Collapsible) */}
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
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Category</label>
                {isCategoryOpen && <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>}
                <div className={`relative ${isCategoryOpen ? 'z-30' : 'z-10'}`}>
                  <input type="hidden" name="category" value={formData.category} />
                  <button 
                    type="button" 
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`w-full py-3 px-4 bg-surface/50 border ${isCategoryOpen ? 'border-text-primary ring-1 ring-text-primary' : 'border-border-subtle hover:border-border-base'} rounded-lg transition-all text-sm outline-none text-left flex justify-between items-center`}
                  >
                    <span className="text-text-primary font-medium">
                      {loadingCategories ? 'Loading...' : (categories.find(c => c._id === formData.category)?.name || 'Select Category')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur border border-border-base rounded-lg shadow-xl overflow-hidden p-1.5 transition-all ${isCategoryOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'}`}>
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
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
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : 'text-text-secondary hover:bg-surface-subtle'}`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
          onClick={() => router.push('/admin/products')} 
          className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border border-border-base shadow-sm px-6 py-3 bg-surface text-xs uppercase tracking-wider font-semibold text-text-secondary active:scale-[0.98] transition-transform"
        >
          Discard
        </button>
        <button 
          type="submit" 
          disabled={isSaving} 
          className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border border-transparent shadow-xl px-6 py-3 bg-primary text-xs uppercase tracking-wider font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
        >
          {isSaving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

    </form>
  );
}
