'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, UploadCloud, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
    grades: (initialData?.grades || []).join(', '),
    thicknessRange: initialData?.thicknessRange || '',
    widthRange: initialData?.widthRange || '',
    lengthRange: initialData?.lengthRange || '',
    temper: initialData?.temper || '',
    surfaceFinish: initialData?.surfaceFinish || '',
    standards: (initialData?.standards || []).join(', '),
    applications: (initialData?.applications || []).join(', '),
    availableForms: (initialData?.availableForms || []).join(', '),
    qualityDocs: (initialData?.qualityDocs || []).join(', '),
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

    const splitList = (value) =>
      String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      ...formData,
      grades: splitList(formData.grades),
      standards: splitList(formData.standards),
      applications: splitList(formData.applications),
      availableForms: splitList(formData.availableForms),
      qualityDocs: splitList(formData.qualityDocs),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/admin/products')} 
            className="border-border-base shadow-sm bg-surface text-text-secondary hover:bg-surface-subtle hover:text-text-secondary hover:border-border-base hover:scale-[1.02] focus-visible:ring-border-focus"
          >
            Discard
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving} 
            className="shadow-xl hover:scale-105 focus-visible:ring-offset-2"
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </Button>
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
                <Input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Stainless Steel Pipe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Slug URL</label>
                <Input type="text" name="slug" required value={formData.slug} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Short Description</label>
                <Textarea name="shortDescription" rows={2} value={formData.shortDescription} onChange={handleChange} placeholder="A brief summary of the product..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Long Description (HTML Supported)</label>
                <Textarea name="longDescription" rows={5} value={formData.longDescription} onChange={handleChange} placeholder="Detailed product specifications and features..." />
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
                  <Input type="text" placeholder="Key (e.g. Material)" required value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} className="w-1/3 py-2.5 px-4 text-sm" />
                  <Input type="text" placeholder="Value (e.g. Aluminum)" required value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} className="py-2.5 px-4 text-sm" />
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
                      <Input type="text" required value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="py-2.5 px-4 text-sm shadow-none bg-surface" placeholder="e.g. 10mm Thickness" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">Price / Note</label>
                      <Input type="text" value={variant.priceNote} onChange={(e) => updateVariant(index, 'priceNote', e.target.value)} className="py-2.5 px-4 text-sm shadow-none bg-surface" placeholder="e.g. Contact for Price" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVariant} className="inline-flex items-center px-4 py-2.5 border border-border-base shadow-sm uppercase tracking-wider font-semibold text-xs rounded-lg text-text-secondary bg-surface hover:bg-surface-muted transition-colors">
                <Plus className="-ml-1 mr-2 h-4 w-4 text-text-muted" /> Add Variant
              </button>
            </div>
          </div>

          {/* Card 4b: Technical catalogue (verified fields only) */}
          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border-subtle shadow-sm">
            <h3 className="text-lg font-headline font-semibold text-text-primary tracking-tight mb-2">
              Technical Catalogue
            </h3>
            <p className="text-sm text-text-muted mb-6">
              Leave blank until RMA verifies values — empty fields stay hidden on the public site.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['grades', 'Grades (comma-separated)'],
                ['thicknessRange', 'Thickness range'],
                ['widthRange', 'Width range'],
                ['lengthRange', 'Length range'],
                ['temper', 'Temper / hardness'],
                ['surfaceFinish', 'Surface finish'],
                ['standards', 'Standards (comma-separated)'],
                ['availableForms', 'Available forms (comma-separated)'],
                ['applications', 'Applications (comma-separated)'],
                ['qualityDocs', 'Quality documentation (comma-separated)'],
              ].map(([name, label]) => (
                <div key={name} className={name === 'applications' || name === 'qualityDocs' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-text-secondary mb-2 ml-1">
                    {label}
                  </label>
                  <Input
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="py-2.5 px-4 text-sm shadow-none"
                  />
                </div>
              ))}
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
                <Input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
                <p className="mt-2 text-xs text-text-muted font-medium">{formData.seoTitle.length}/60 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">Meta Description</label>
                <Textarea name="seoDescription" rows={3} value={formData.seoDescription} onChange={handleChange} />
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
                <Label className="text-xs uppercase tracking-wider font-semibold mb-2 ml-1">Category</Label>
                <input type="hidden" name="category" value={formData.category} />
                <Select
                  value={formData.category}
                  options={categories.map((c) => ({ value: c._id, label: c.name }))}
                  open={isCategoryOpen}
                  onOpenChange={setIsCategoryOpen}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder={loadingCategories ? 'Loading...' : 'Select Category'}
                  disabled={loadingCategories}
                  size="sm"
                />
              </div>

              {/* Status Dropdown */}
              <div>
                <Label className="text-xs uppercase tracking-wider font-semibold mb-2 ml-1">Status</Label>
                <input type="hidden" name="status" value={formData.status} />
                <Select
                  value={formData.status}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                  open={isStatusOpen}
                  onOpenChange={setIsStatusOpen}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  size="sm"
                />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-[68px] left-0 right-0 p-4 bg-surface/90 backdrop-blur-md border-t border-border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 flex justify-end space-x-3 sm:px-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push('/admin/products')} 
          className="flex-1 sm:flex-none border-border-base shadow-sm bg-surface text-text-secondary hover:bg-surface hover:text-text-secondary hover:border-border-base py-3 active:scale-[0.98]"
        >
          Discard
        </Button>
        <Button 
          type="submit" 
          disabled={isSaving} 
          className="flex-1 sm:flex-none shadow-xl py-3 active:scale-[0.98]"
        >
          {isSaving ? 'Saving...' : 'Save Product'}
        </Button>
      </div>

    </form>
  );
}
