'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, Award, UploadCloud, ExternalLink } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AdminFormModal from '@/components/admin/AdminFormModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { docId, formatApiError, uploadAdminFile } from '@/lib/admin-api';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

const empty = {
  title: '',
  description: '',
  issuedBy: '',
  fileUrl: '',
  status: 'draft',
};

export default function CertificatesAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates');
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Failed to load certificates'));
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

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      issuedBy: item.issuedBy || '',
      fileUrl: item.fileUrl || '',
      status: item.status || 'draft',
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || uploading) return;
    setModalOpen(false);
    setEditing(null);
    setForm(empty);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading…');
    try {
      const url = await uploadAdminFile(file);
      setForm((f) => ({ ...f, fileUrl: url }));
      toast.success('Uploaded', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const id = docId(editing);
    const payload = id
      ? {
          id,
          title: form.title.trim(),
          description: form.description,
          issuedBy: form.issuedBy,
          fileUrl: form.fileUrl,
          status: form.status,
        }
      : {
          title: form.title.trim(),
          description: form.description,
          issuedBy: form.issuedBy,
          fileUrl: form.fileUrl,
          status: form.status,
        };

    try {
      const res = await fetch('/api/certificates', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Save failed'));
      toast.success(id ? 'Certificate updated' : 'Certificate created');
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
      const res = await fetch(`/api/certificates?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, 'Delete failed'));
      toast.success('Certificate deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Certificate"
        description={`Delete "${deleteTarget?.name || 'this certificate'}"? Draft or published — this cannot be undone.`}
        confirmText="Delete Certificate"
        isLoading={isDeleting}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <div className="min-w-0">
          <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">
            Certificates
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Keep unverified documents as draft — only published items appear publicly.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3 sm:items-center shrink-0">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={FILTER_OPTIONS}
            className="w-full sm:w-44"
            size="sm"
          />
          <Button onClick={openCreate} className="shadow-xl hover:scale-105 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Certificate
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
                  <TableHead className="hidden md:table-cell">Issued by</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">File</TableHead>
                  <TableHead className="pr-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => {
                  const id = docId(item);
                  return (
                    <TableRow key={id}>
                      <TableCell className="pl-6 font-medium text-text-primary">
                        <span className="line-clamp-2">{item.title}</span>
                        <dl className="font-normal md:hidden mt-1 space-y-1">
                          {item.issuedBy ? (
                            <>
                              <dt className="sr-only">Issued by</dt>
                              <dd className="text-text-muted text-xs">{item.issuedBy}</dd>
                            </>
                          ) : null}
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
                      <TableCell className="text-text-muted hidden md:table-cell">
                        {item.issuedBy || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={item.status === 'published' ? 'primary' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
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
              <Award className="mx-auto h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">
                {items.length === 0 ? 'No certificates yet' : 'No matches for this filter'}
              </h3>
              <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
                {items.length === 0
                  ? 'Add a certificate as draft until RMA verifies the document.'
                  : 'Try another status filter.'}
              </p>
              {items.length === 0 ? (
                <Button onClick={openCreate} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" /> Add Certificate
                </Button>
              ) : null}
            </div>
          )}
        </div>
      )}

      <AdminFormModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Certificate' : 'New Certificate'}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Label className="mb-2 ml-1">Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Material Test Certificate"
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional context for the team"
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Issued by</Label>
            <Input
              value={form.issuedBy}
              onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
              placeholder="Issuing body or lab"
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Document</Label>
            <label className="inline-flex justify-center items-center px-4 py-4 border-2 border-dashed border-border-subtle hover:border-border-base rounded-lg text-text-secondary bg-surface-muted hover:bg-surface cursor-pointer transition-all duration-300 w-full">
              <UploadCloud className="mr-2 h-5 w-5 shrink-0" />
              <span className="uppercase tracking-wider font-semibold text-xs">
                {uploading ? 'Uploading…' : 'Upload PDF or image'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf,image/*"
                disabled={uploading || saving}
                onChange={handleUpload}
              />
            </label>
            {form.fileUrl ? (
              <a
                href={form.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
              >
                View current file <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <div>
            <Label className="mb-2 ml-1">Status</Label>
            <Select
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value })}
              options={STATUS_OPTIONS}
            />
            <p className="mt-1.5 text-xs text-text-muted ml-1">
              Publish only after the document is verified.
            </p>
          </div>
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Saving…' : editing ? 'Update Certificate' : 'Create Certificate'}
            </Button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}
