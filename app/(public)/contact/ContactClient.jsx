'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { MapPin, Mail, Phone, ArrowRight, Loader2, Users, UploadCloud, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const metalCategories = ['Copper', 'Brass', 'Phosphor Bronze', 'Aluminium'];
const formFactors = ['Sheets', 'Plates', 'Circles', 'Ingots', 'Custom Castings'];

const checkboxClass =
  'h-5 w-5 rounded border border-border-base text-primary accent-primary bg-surface shrink-0';

function ContactForm({ settings }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || metalCategories[0]
  );
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState(formFactors[0]);
  const [isFactorOpen, setIsFactorOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const productPrefill = searchParams.get('product') || '';

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  const phones =
    settings?.contactPhones?.length > 0
      ? settings.contactPhones
      : settings?.contactPhone
        ? [settings.contactPhone]
        : ['+91 9081358107', '+91 8469669699', '+91 8141888799'];

  const email = settings?.contactEmail || 'radhemetalalloysllp@gmail.com';
  const persons =
    settings?.contactPersons?.length > 0
      ? settings.contactPersons.join(' | ')
      : 'Kevin Shah | Arth Joshi | Aditya Joshi';
  const address =
    settings?.address ||
    '43, Vardhmaan Nagar, Kalol\nGandhinagar, Gujarat\nIndia - 382721';

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 files');
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const base64 = await readFileAsDataUrl(file);
        const res = await fetch('/api/leads/attachments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        setAttachments((prev) => [
          ...prev,
          {
            url: data.url,
            filename: data.filename,
            mimeType: data.mimeType,
            bytes: data.bytes,
          },
        ]);
        trackEvent('drawing_upload', { filename: file.name });
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      company: String(fd.get('company') || ''),
      name: String(fd.get('contactName') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      country: String(fd.get('country') || ''),
      product: String(fd.get('product') || productPrefill || ''),
      category: selectedCategory,
      materialGrade: String(fd.get('alloy') || ''),
      formFactor: selectedFactor,
      quantity: String(fd.get('quantity') || ''),
      dimensions: String(fd.get('dimensions') || ''),
      requiredStandard: String(fd.get('requiredStandard') || ''),
      deliveryLocation: String(fd.get('deliveryLocation') || ''),
      additionalRequirements: String(fd.get('additionalRequirements') || ''),
      needsTC: Boolean(fd.get('needsTC')),
      needsNabl: Boolean(fd.get('needsNabl')),
      needsUT: Boolean(fd.get('needsUT')),
      attachments,
      website: String(fd.get('website') || ''),
      source: 'contact',
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit RFQ');
        return;
      }
      trackEvent('generate_lead', { category: selectedCategory });
      toast.success('Your RFQ has been received. Our team will contact you shortly.');
      form.reset();
      setAttachments([]);
      setSelectedCategory(metalCategories[0]);
      setSelectedFactor(formFactors[0]);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout-main">
      <Toaster position="top-right" />
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 w-full border-b border-border-subtle bg-surface overflow-hidden">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div
              className={`flex flex-col justify-center transition-all duration-1000 ease-out transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase mb-6 block">
                Get a Quote in 60 Seconds
              </span>
              <h1 className="font-headline font-light text-text-primary leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance mb-8">
                {settings?.siteName || 'Radhey Metal Alloys LLP'}
              </h1>
              <p className="text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-xl mb-12">
                For procurement, technical requirements, or custom castings — send your
                specification or drawing and our team will review your RFQ.
              </p>

              <div className="space-y-8 border-t border-border-subtle pt-10">
                <InfoRow icon={Users} title="Contact Persons" body={persons} />
                <InfoRow
                  icon={Phone}
                  title="Direct Phone Lines"
                  body={
                    <span>
                      {phones.map((p) => (
                        <span key={p}>
                          <a
                            href={`tel:${p.replace(/\s/g, '')}`}
                            className="hover:text-text-primary transition-colors"
                            onClick={() => trackEvent('phone_click')}
                          >
                            {p}
                          </a>
                          <br />
                        </span>
                      ))}
                    </span>
                  }
                />
                <InfoRow
                  icon={Mail}
                  title="Official Email"
                  body={
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-text-primary transition-colors underline underline-offset-4"
                      onClick={() => trackEvent('email_click')}
                    >
                      {email}
                    </a>
                  }
                />
                <InfoRow
                  icon={MapPin}
                  title="Registered Office"
                  body={<span className="whitespace-pre-line">{address}</span>}
                />
              </div>

              {(settings?.mapsEmbedUrl || settings?.mapsQuery) && (
                <div className="mt-10 aspect-video w-full rounded-[var(--inner-radius)] overflow-hidden border border-border-subtle">
                  <iframe
                    title="Factory location"
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={
                      settings.mapsEmbedUrl ||
                      `https://maps.google.com/maps?q=${encodeURIComponent(settings.mapsQuery)}&output=embed`
                    }
                  />
                </div>
              )}
            </div>

            <div
              className={`lg:pl-8 transition-all duration-1000 delay-300 ease-out transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-2xl font-headline text-text-primary mb-2">Request a Quote</h2>
                <p className="text-sm text-text-muted font-light mb-8">
                  One form for all enquiries — no duplicate RFQ pages.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField label="Company Name" htmlFor="company">
                      <Input id="company" name="company" required placeholder="Acme Industries" />
                    </FormField>
                    <FormField label="Contact Person" htmlFor="contactName">
                      <Input id="contactName" name="contactName" placeholder="Jane Doe" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField label="Email Address" htmlFor="email">
                      <Input id="email" name="email" type="email" required />
                    </FormField>
                    <FormField label="Phone / WhatsApp" htmlFor="phone">
                      <Input id="phone" name="phone" type="tel" required />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField label="Country" htmlFor="country">
                      <Input id="country" name="country" placeholder="India" />
                    </FormField>
                    <FormField label="Product required" htmlFor="product">
                      <Input
                        id="product"
                        name="product"
                        defaultValue={productPrefill}
                        placeholder="e.g. Brass sheets"
                      />
                    </FormField>
                  </div>

                  <FormField label="Metal Category">
                    <Select
                      value={selectedCategory}
                      options={metalCategories}
                      open={isCategoryOpen}
                      onOpenChange={setIsCategoryOpen}
                      onChange={setSelectedCategory}
                    />
                  </FormField>

                  <FormField label="Material / Grade" htmlFor="alloy">
                    <Input id="alloy" name="alloy" placeholder="e.g., ETP, C260, C52100" />
                  </FormField>

                  <FormField label="Form Factor">
                    <Select
                      value={selectedFactor}
                      options={formFactors}
                      open={isFactorOpen}
                      onOpenChange={setIsFactorOpen}
                      onChange={setSelectedFactor}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField label="Quantity" htmlFor="quantity">
                      <Input id="quantity" name="quantity" placeholder="kg or MT" />
                    </FormField>
                    <FormField label="Required standard" htmlFor="requiredStandard">
                      <Input id="requiredStandard" name="requiredStandard" placeholder="ASTM / EN / IS / customer" />
                    </FormField>
                  </div>

                  <FormField label="Dimensions" htmlFor="dimensions">
                    <Textarea id="dimensions" name="dimensions" rows={2} placeholder="Thickness, width, length…" />
                  </FormField>

                  <FormField label="Delivery location" htmlFor="deliveryLocation">
                    <Input id="deliveryLocation" name="deliveryLocation" />
                  </FormField>

                  <FormField label="Additional requirements" htmlFor="additionalRequirements">
                    <Textarea id="additionalRequirements" name="additionalRequirements" rows={2} />
                  </FormField>

                  <div>
                    <Label className="mb-2">
                      Upload drawing / specification (PDF, DWG, DXF, JPG, PNG)
                    </Label>
                    <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 border border-dashed border-border-subtle rounded-lg cursor-pointer hover:bg-surface-subtle transition-colors">
                      <UploadCloud className="h-6 w-6 text-text-muted" />
                      <span className="text-sm text-text-muted">
                        {uploading ? 'Uploading…' : 'Click to upload (max 5 files, 10MB each)'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,application/pdf,image/*"
                        multiple
                        disabled={uploading}
                        onChange={handleFileChange}
                      />
                    </label>
                    {attachments.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {attachments.map((a) => (
                          <li
                            key={a.url}
                            className="flex items-center justify-between text-sm text-text-secondary bg-surface-muted px-3 py-2 rounded-lg"
                          >
                            <span className="truncate">{a.filename}</span>
                            <button
                              type="button"
                              aria-label="Remove file"
                              onClick={() =>
                                setAttachments((prev) => prev.filter((x) => x.url !== a.url))
                              }
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-2 px-1">
                    <Label className="mb-5">
                      Testing documentation required?
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        ['needsTC', 'TC'],
                        ['needsNabl', 'NABL report'],
                        ['needsUT', 'Ultrasonic'],
                      ].map(([name, label]) => (
                        <label
                          key={name}
                          className="flex items-center space-x-3 p-4 border border-border-subtle rounded-lg hover:bg-surface-subtle cursor-pointer transition-colors"
                        >
                          <input type="checkbox" name={name} value="1" className={checkboxClass} />
                          <span className="text-sm font-medium text-text-primary">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full py-4 px-8 text-sm font-semibold shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit RFQ
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start group">
      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-surface-muted border border-border-subtle flex items-center justify-center text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="ml-6">
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        <div className="mt-2 text-text-muted font-light leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ContactPage({ settings = {} }) {
  return (
    <Suspense fallback={<div className="layout-main p-12 text-text-muted">Loading…</div>}>
      <ContactForm settings={settings} />
    </Suspense>
  );
}
