import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { ObjectIdSchema, formatZodIssues } from '@/lib/validations';
import { LeadUpdateSchema } from '@/modules/leads/lead.schema';
import { getLeadById, updateLead } from '@/services/lead.service';
import { sendEmail } from '@/services/email.service';

export const GET = withApiHandler(async (_req, { params }) => {
  const { id } = await params;
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_LEADS });

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = LeadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const lead = await updateLead(id, parsed.data);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.notifyQuoteSent && lead.email) {
    await sendEmail({
      to: lead.email,
      subject: 'Your quotation from Radhey Metal Alloys LLP',
      replyTo: undefined,
      html: `<p>Dear ${lead.name || lead.company},</p><p>We have prepared a quotation regarding your enquiry. Our team will follow up shortly.</p><pre>${lead.quotationNotes || ''}</pre>`,
    });
  }

  return NextResponse.json(lead);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_LEADS });
