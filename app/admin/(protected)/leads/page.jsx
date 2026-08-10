'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Inbox, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { docId, formatApiError } from '@/lib/admin-api';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
];

function statusVariant(status) {
  if (status === 'new') return 'primary';
  return 'default';
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const q = status ? `?status=${status}` : '';
      const res = await fetch(`/api/leads${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(formatApiError(data, 'Failed to load leads'));
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      <Toaster position="top-right" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
        <div className="min-w-0">
          <h2 className="text-2xl font-headline font-light text-text-primary tracking-tight">
            RFQ Leads
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Inbox for Contact form submissions — open a lead to update status and quote notes.
          </p>
        </div>
        <Select
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          className="w-full sm:w-48"
          size="sm"
        />
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
                  <TableHead className="pl-6">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Received</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="pr-6">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const id = docId(lead);
                  return (
                    <TableRow key={id} className="group">
                      <TableCell className="pl-6 font-medium text-text-primary">
                        <Link
                          href={`/admin/leads/${id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {lead.company || '—'}
                        </Link>
                        <dl className="font-normal sm:hidden mt-1 space-y-1">
                          <dt className="sr-only">Email</dt>
                          <dd className="text-text-muted text-xs truncate max-w-[14rem]">
                            {lead.email}
                          </dd>
                          <dt className="sr-only">Status</dt>
                          <dd className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusVariant(lead.status)} size="sm">
                              {lead.status}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              {formatDate(lead.createdAt)}
                            </span>
                          </dd>
                        </dl>
                      </TableCell>
                      <TableCell className="text-text-muted hidden md:table-cell">
                        <span className="truncate max-w-[14rem] inline-block align-bottom">
                          {lead.email}
                        </span>
                      </TableCell>
                      <TableCell className="text-text-muted hidden lg:table-cell">
                        {lead.product || lead.category || '—'}
                      </TableCell>
                      <TableCell className="text-text-muted hidden sm:table-cell whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/admin/leads/${id}`} aria-label={`Open ${lead.company}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {leads.length === 0 && (
            <div className="text-center py-16 px-4">
              <Inbox className="mx-auto h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">
                {status ? 'No leads with this status' : 'No leads yet'}
              </h3>
              <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
                {status
                  ? 'Try another filter, or clear it to see the full inbox.'
                  : 'New Contact RFQ submissions will show up here.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
