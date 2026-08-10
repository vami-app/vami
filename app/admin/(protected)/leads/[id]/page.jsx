'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatApiError } from '@/lib/admin-api';

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
];

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: 'new',
    internalNotes: '',
    quotationNotes: '',
    quotationValidity: '',
    quotationFileUrl: '',
  });

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(formatApiError(data, 'Failed to load lead'));
        return data;
      })
      .then((data) => {
        setLead(data);
        setForm({
          status: data.status || 'new',
          internalNotes: data.internalNotes || '',
          quotationNotes: data.quotationNotes || '',
          quotationValidity: data.quotationValidity || '',
          quotationFileUrl: data.quotationFileUrl || '',
        });
      })
      .catch((e) => toast.error(e.message));
  }, [id]);

  async function save(notifyQuoteSent = false) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, notifyQuoteSent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Save failed'));
      setLead(data);
      toast.success(notifyQuoteSent ? 'Saved & quote notification attempted' : 'Lead updated');
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!lead) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[40vh]">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  const fields = [
    ['Name', lead.name],
    ['Country', lead.country],
    ['Product', lead.product],
    ['Category', lead.category],
    ['Grade', lead.materialGrade],
    ['Form', lead.formFactor],
    ['Qty', lead.quantity],
    ['Dimensions', lead.dimensions],
    ['Standard', lead.requiredStandard],
    ['Delivery', lead.deliveryLocation],
  ];

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 max-w-4xl">
      <Toaster position="top-right" />

      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </Link>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight truncate">
              {lead.company}
            </h2>
            <p className="text-sm text-text-muted mt-1 break-all">
              {lead.email}
              {lead.phone ? ` · ${lead.phone}` : ''}
            </p>
          </div>
          <Badge variant={lead.status === 'new' ? 'primary' : 'default'} className="shrink-0 w-fit">
            {lead.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-100 fill-mode-both pb-8">
        <div className="bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm p-4 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
            Request details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border-subtle px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{k}</p>
                <p className="mt-1 text-sm text-text-primary break-words">{v || '—'}</p>
              </div>
            ))}
          </div>
          {lead.additionalRequirements ? (
            <div className="mt-4 rounded-lg border border-border-subtle px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                Additional requirements
              </p>
              <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">
                {lead.additionalRequirements}
              </p>
            </div>
          ) : null}
          {(lead.attachments || []).length > 0 ? (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Attachments
              </p>
              <ul className="space-y-2">
                {lead.attachments.map((a) => (
                  <li key={a.url}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {a.filename || a.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="bg-surface rounded-[calc(var(--outer-radius)-8px)] border border-border-subtle shadow-sm p-4 sm:p-6 space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Workflow
          </h3>
          <div>
            <Label className="mb-2 ml-1">Status</Label>
            <Select
              value={form.status}
              onChange={(value) => setForm((f) => ({ ...f, status: value }))}
              options={LEAD_STATUS_OPTIONS}
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Internal notes</Label>
            <Textarea
              rows={3}
              value={form.internalNotes}
              onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Quotation notes</Label>
            <Textarea
              rows={3}
              value={form.quotationNotes}
              onChange={(e) => setForm((f) => ({ ...f, quotationNotes: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-2 ml-1">Quotation validity</Label>
            <Input
              value={form.quotationValidity}
              onChange={(e) => setForm((f) => ({ ...f, quotationValidity: e.target.value }))}
              placeholder="e.g. Valid 14 days"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => save(true)}
            >
              Save &amp; notify quote sent
            </Button>
            <Button type="button" disabled={saving} onClick={() => save(false)}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
