import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Certificate from '@/models/Certificate';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export async function getPublishedCertificates() {
  'use cache';
  cacheTag('certificates');
  cacheLife('hours');
  try {
    await dbConnect();
    const docs = await Certificate.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
    return serializeDocs(docs);
  } catch {
    return [];
  }
}

export async function listCertificatesAdmin() {
  await dbConnect();
  const docs = await Certificate.find({}).sort({ createdAt: -1 }).lean();
  return serializeDocs(docs);
}

export async function getCertificateById(id) {
  await dbConnect();
  const doc = await Certificate.findById(id).lean();
  return serializeDoc(doc);
}

export async function createCertificate(data) {
  await dbConnect();
  const doc = await Certificate.create(data);
  revalidateTag('certificates');
  return serializeDoc(doc.toObject());
}

export async function updateCertificate(id, data) {
  await dbConnect();
  const doc = await Certificate.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  revalidateTag('certificates');
  return serializeDoc(doc);
}

export async function deleteCertificate(id) {
  await dbConnect();
  await Certificate.findByIdAndDelete(id);
  revalidateTag('certificates');
  return { ok: true };
}
