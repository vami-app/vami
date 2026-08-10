import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { formatZodIssues } from '@/lib/validations';
import { LeadCreateSchema } from '@/modules/leads/lead.schema';
import { checkRateLimit, createLead, listLeadsAdmin } from '@/services/lead.service';
import { logger } from '@/lib/logger';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const leads = await listLeadsAdmin({ status });
  return NextResponse.json(leads);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_LEADS });

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const parsed = LeadCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(`lead:${ip}`, 8) || !checkRateLimit(`lead-email:${parsed.data.email}`, 5)) {
    logger.warn('Lead rate limit hit', { domain: 'leads', ip });
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { website: _hp, ...leadData } = parsed.data;
  const lead = await createLead(leadData, { ip });

  return NextResponse.json({ ok: true, id: lead._id }, { status: 201 });
});
