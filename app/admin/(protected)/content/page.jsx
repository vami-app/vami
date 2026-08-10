'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, FileStack } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatApiError } from '@/lib/admin-api';

const KEYS = [
  { key: 'capabilities', label: 'Capabilities' },
  { key: 'quality', label: 'Quality' },
  { key: 'industries', label: 'Industries' },
  { key: 'why_rma', label: 'Why RMA' },
  { key: 'home_gallery', label: 'Home Gallery' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const emptyForm = {
  title: '',
  subtitle: '',
  body: '',
  status: 'draft',
  sections: [],
};

export default function PageContentAdmin() {
  const [key, setKey] = useState('capabilities');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingKey, setPendingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDirty(false);
    fetch(`/api/page-content?key=${key}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(formatApiError(data, 'Failed to load'));
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setForm({
          title: data.title || '',
          subtitle: data.subtitle || '',
          body: data.body || '',
          status: data.status || 'draft',
          sections: Array.isArray(data.sections) ? data.sections : [],
        });
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message);
          setForm(emptyForm);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  function patchForm(next) {
    setForm(next);
    setDirty(true);
  }

  function updateSection(index, field, value) {
    const sections = [...form.sections];
    sections[index] = { ...sections[index], [field]: value };
    patchForm({ ...form, sections });
  }

  function removeSection(index) {
    patchForm({
      ...form,
      sections: form.sections
        .filter((_, i) => i !== index)
        .map((s, order) => ({ ...s, order })),
    });
  }

  function addSection() {
    patchForm({
      ...form,
      sections: [
        ...form.sections,
        { title: '', description: '', imageUrl: '', order: form.sections.length },
      ],
    });
  }

  async function save(e) {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await fetch('/api/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          title: form.title,
          subtitle: form.subtitle,
          body: form.body,
          status: form.status,
          sections: form.sections.map((s, order) => ({ ...s, order })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, 'Save failed'));
      toast.success('Page content saved');
      setDirty(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const activeLabel = KEYS.find((k) => k.key === key)?.label || key;

  function requestKeyChange(nextKey) {
    if (nextKey === key) return;
    if (dirty) {
      setPendingKey(nextKey);
      return;
    }
    setKey(nextKey);
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={Boolean(pendingKey)}
        onClose={() => setPendingKey(null)}
        onConfirm={() => {
          if (pendingKey) setKey(pendingKey);
          setPendingKey(null);
          setDirty(false);
        }}
        title="Unsaved changes"
        description="You have unsaved edits on this page. Switch anyway and discard them?"
        confirmText="Discard & switch"
        isDanger
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <div className="min-w-0">
          <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">
            Page Content
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Edit CMS pages. Keep draft until RMA verifies copy — empty sections stay hidden when published.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={form.status === 'published' ? 'primary' : 'default'}>
            {form.status}
          </Badge>
          {dirty ? (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2 py-1">
              Unsaved
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both">
        {/* Page switcher — horizontal scroll on mobile, sidebar on desktop */}
        <nav
          className="lg:w-52 shrink-0 overflow-x-auto hide-scrollbar"
          aria-label="CMS pages"
        >
          <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0 pb-1 lg:pb-0">
            {KEYS.map((item) => {
              const active = item.key === key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => requestKeyChange(item.key)}
                  className={[
                    'text-left px-4 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <p className="text-text-muted">Loading…</p>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-4 border-b border-border-subtle flex items-center gap-3 shrink-0">
                <FileStack className="h-5 w-5 text-text-muted shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-medium text-text-primary truncate">{activeLabel}</h3>
                  <p className="text-xs text-text-muted">Key: {key}</p>
                </div>
              </div>

              <form
                onSubmit={save}
                className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-6 space-y-5 pb-28 md:pb-6"
              >
                <div>
                  <Label className="mb-2 ml-1">Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => patchForm({ ...form, title: e.target.value })}
                    placeholder="Page title"
                  />
                </div>
                <div>
                  <Label className="mb-2 ml-1">Subtitle</Label>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => patchForm({ ...form, subtitle: e.target.value })}
                    placeholder="Optional supporting line"
                  />
                </div>
                <div>
                  <Label className="mb-2 ml-1">Body</Label>
                  <Textarea
                    rows={6}
                    value={form.body}
                    onChange={(e) => patchForm({ ...form, body: e.target.value })}
                    placeholder="Main copy"
                  />
                </div>
                <div>
                  <Label className="mb-2 ml-1">Status</Label>
                  <Select
                    value={form.status}
                    onChange={(value) => patchForm({ ...form, status: value })}
                    options={STATUS_OPTIONS}
                    className="max-w-xs"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-medium text-text-primary">Sections</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addSection}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add section
                    </Button>
                  </div>

                  {form.sections.length === 0 ? (
                    <p className="text-sm text-text-muted border border-dashed border-border-subtle rounded-lg px-4 py-8 text-center">
                      No sections. Add blocks for cards, gallery items, or feature rows.
                    </p>
                  ) : (
                    form.sections.map((section, index) => (
                      <div
                        key={index}
                        className="border border-border-subtle rounded-lg p-4 space-y-3 bg-surface-muted/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">
                            Section {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghostDestructive"
                            size="icon"
                            onClick={() => removeSection(index)}
                            aria-label={`Remove section ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Section title"
                          value={section.title || ''}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                        />
                        <Textarea
                          rows={2}
                          placeholder="Description"
                          value={section.description || ''}
                          onChange={(e) => updateSection(index, 'description', e.target.value)}
                        />
                        <Input
                          placeholder="Image URL (optional)"
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(index, 'imageUrl', e.target.value)}
                        />
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop save */}
                <div className="hidden md:flex justify-end pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save page'}
                  </Button>
                </div>
              </form>

              {/* Mobile sticky save — clears bottom tab bar */}
              <div className="md:hidden sticky bottom-0 border-t border-border-subtle bg-surface/95 backdrop-blur-md p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Button type="button" className="w-full" disabled={saving} onClick={() => save()}>
                  {saving ? 'Saving…' : dirty ? 'Save changes' : 'Save page'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
