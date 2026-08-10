import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { formatZodIssues, ObjectIdSchema } from '@/lib/validations';
import { CertificateSchema } from '@/modules/leads/lead.schema';
import {
  createCertificate,
  deleteCertificate,
  listCertificatesAdmin,
  updateCertificate,
} from '@/services/certificate.service';

export const GET = withApiHandler(async () => {
  const docs = await listCertificatesAdmin();
  return NextResponse.json(docs);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CERTIFICATES });

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const parsed = CertificateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  const data = { ...parsed.data };
  if (data.issuedAt) data.issuedAt = new Date(data.issuedAt);
  else delete data.issuedAt;
  if (data.verifiedAt) data.verifiedAt = new Date(data.verifiedAt);
  else delete data.verifiedAt;
  if (data.status === 'published' && !data.verifiedAt) {
    data.verifiedAt = new Date();
  }
  const doc = await createCertificate(data);
  return NextResponse.json(doc, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CERTIFICATES });

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();
  const id = String(body.id ?? '');
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  // Only accept known certificate fields — ignore _id, dates from list docs, etc.
  const rest = {
    title: body.title,
    description: body.description,
    issuedBy: body.issuedBy,
    issuedAt: body.issuedAt,
    fileUrl: body.fileUrl,
    status: body.status,
    verifiedAt: body.verifiedAt,
  };
  const parsed = CertificateSchema.partial().safeParse(
    Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }
  const data = { ...parsed.data };
  if (data.issuedAt === '') delete data.issuedAt;
  else if (data.issuedAt) data.issuedAt = new Date(data.issuedAt);
  if (data.verifiedAt === '') delete data.verifiedAt;
  else if (data.verifiedAt) data.verifiedAt = new Date(data.verifiedAt);
  if (data.status === 'published' && !data.verifiedAt) {
    data.verifiedAt = new Date();
  }
  const doc = await updateCertificate(id, data);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(doc);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CERTIFICATES });

export const DELETE = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const idCheck = ObjectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await deleteCertificate(id);
  return NextResponse.json({ ok: true });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_CERTIFICATES });
