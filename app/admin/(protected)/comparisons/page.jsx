'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, GitCompare, PlusCircle, X } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AdminFormModal from '@/components/admin/AdminFormModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { docId, formatApiError } from '@/lib/admin-api';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const empty = {
  title: '',
  slug: '',
  description: '',
  columnLabels: 'Product A, Product B',
  rows: [],
  status: 'draft',
};

export default function ComparisonsAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/comparisons');
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Failed to load comparisons'));
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = statusFilter
    ? items.filter((item) => item.status === statusFilter)
    : items;

  const columnCount = form.columnLabels
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setSlugTouched(true);
    setForm({
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      columnLabels: (item.columnLabels || []).join(', ') || 'Product A, Product B',
      rows: (item.rows || []).map((row) => ({
        parameter: row.parameter || '',
        values: [...(row.values || [])],
      })),
      status: item.status || 'draft',
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(empty);
  }

  function setTitle(value) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function addRow() {
    const values = Array.from({ length: Math.max(columnCount, 1) }, () => '');
    setForm((f) => ({
      ...f,
      rows: [...f.rows, { parameter: '', values }],
    }));
  }

  function updateRow(index, patch) {
    setForm((f) => {
      const rows = [...f.rows];
      rows[index] = { ...rows[index], ...patch };
      return { ...f, rows };
    });
  }

  function updateRowValue(rowIndex, valueIndex, value) {
    setForm((f) => {
      const rows = [...f.rows];
      const values = [...(rows[rowIndex].values || [])];
      while (values.length <= valueIndex) values.push('');
      values[valueIndex] = value;
      rows[rowIndex] = { ...rows[rowIndex], values };
      return { ...f, rows };
    });
  }

  function removeRow(index) {
    setForm((f) => ({
      ...f,
      rows: f.rows.filter((_, i) => i !== index),
    }));
  }

  function buildPayload() {
    const labels = form.columnLabels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description,
      columnLabels: labels,
      rows: form.rows.map((row) => ({
        parameter: row.parameter.trim(),
        values: labels.map((_, i) => (row.values?.[i] || '').trim()),
      })).filter((row) => row.parameter),
      status: form.status,
    };
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const id = docId(editing);
    const payload = buildPayload();
    if (id) payload.id = id;

    try {
      const res = await fetch('/api/comparisons', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Save failed'));
      toast.success(id ? 'Comparison updated' : 'Comparison created');
      setModalOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comparisons?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, 'Delete failed'));
      toast.success('Comparison deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const labelsPreview = form.columnLabels
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Comparison"
        description={`Delete "${deleteTarget?.name || 'this comparison'}"? This cannot be undone.`}
        confirmText="Delete Comparison"
        isLoading={isDeleting}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <div className="min-w-0">
          <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">
            Comparisons
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Side-by-side grade/spec tables for product pages. Stay draft until data is verified.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center shrink-0">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={FILTER_OPTIONS}
            className="w-full sm:w-44"
            size="sm"
          />
          <Button onClick={openCreate} className="shadow-xl hover:scale-105 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Comparison
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Loading…</p>
        </div>
      ) : (
        <div className="flex-1 bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both">
          <div className="flex-1 overflow-auto hide-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Title</TableHead>
                  <TableHead className="hidden md:table-cell">Slug</TableHead>
                  <TableHead className="hidden sm:table-cell">Columns</TableHead>
                  <TableHead className="hidden lg:table-cell">Rows</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="pr-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => {
                  const id = docId(item);
                  const cols = item.columnLabels?.length || 0;
                  const rows = item.rows?.length || 0;
                  return (
                    <TableRow key={id}>
                      <TableCell className="pl-6 font-medium text-text-primary">
                        <span className="line-clamp-2">{item.title}</span>
                        <dl className="font-normal sm:hidden mt-1 space-y-1">
                          <dt className="sr-only">Slug</dt>
                          <dd className="text-text-muted text-xs">{item.slug}</dd>
                          <dt className="sr-only">Status</dt>
                          <dd>
                            <Badge
                              variant={item.status === 'published' ? 'primary' : 'default'}
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                          </dd>
                        </dl>
                      </TableCell>
                      <TableCell className="text-text-muted hidden md:table-cell">{item.slug}</TableCell>
                      <TableCell className="text-text-muted hidden sm:table-cell">{cols}</TableCell>
                      <TableCell className="text-text-muted hidden lg:table-cell">{rows}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={item.status === 'published' ? 'primary' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right space-x-1 sm:space-x-3">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghostDestructive"
                          size="icon"
                          onClick={() => setDeleteTarget({ id, name: item.title })}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {visible.length === 0 && (
            <div className="text-center py-16 px-4">
              <GitCompare className="mx-auto h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">
                {items.length === 0 ? 'No comparisons yet' : 'No matches for this filter'}
              </h3>
              <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
                Create a draft comparison set, add parameter rows, then publish when verified.
              </p>
              {items.length === 0 ? (
                <Button onClick={openCreate} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" /> Add Comparison
                </Button>
              ) : null}
            </div>
          )}
        </div>
      )}

      <AdminFormModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Comparison' : 'New Comparison'}
        wide
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="mb-2 ml-1">Title</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 1050 vs 1100 Aluminium"
              />
            </div>
            <div>
              <Label className="mb-2 ml-1">Slug</Label>
              <Input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
              />
            </div>
            <div>
              <Label className="mb-2 ml-1">Status</Label>
              <Select
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 ml-1">Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Column labels</Label>
            <Input
              value={form.columnLabels}
              onChange={(e) => setForm({ ...form, columnLabels: e.target.value })}
              placeholder="Comma-separated, e.g. 1050 H14, 1100 H14"
            />
            <p className="mt-1.5 text-xs text-text-muted ml-1">
              Separated by commas — each label becomes a comparison column.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="ml-1">Parameter rows</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add row
              </Button>
            </div>
            {form.rows.length === 0 ? (
              <p className="text-sm text-text-muted border border-dashed border-border-subtle rounded-lg px-4 py-6 text-center">
                No rows yet. Add parameters like Thickness, Temper, or Conductivity.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto hide-scrollbar pr-1">
                {form.rows.map((row, index) => (
                  <div
                    key={index}
                    className="border border-border-subtle rounded-lg p-3 space-y-2 bg-surface-muted/40"
                  >
                    <div className="flex gap-2 items-start">
                      <Input
                        className="flex-1"
                        placeholder="Parameter"
                        value={row.parameter}
                        onChange={(e) => updateRow(index, { parameter: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghostDestructive"
                        size="icon"
                        onClick={() => removeRow(index)}
                        aria-label="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(labelsPreview.length ? labelsPreview : ['Column 1']).map((label, vi) => (
                        <Input
                          key={`${index}-${vi}`}
                          placeholder={label}
                          value={row.values?.[vi] || ''}
                          onChange={(e) => updateRowValue(index, vi, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update Comparison' : 'Create Comparison'}
            </Button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}
