import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export async function getPublishedResources() {
  'use cache';
  cacheTag('resources');
  cacheLife('hours');
  try {
    await dbConnect();
    const docs = await Resource.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
    return serializeDocs(docs);
  } catch {
    return [];
  }
}

export async function listResourcesAdmin() {
  await dbConnect();
  const docs = await Resource.find({}).sort({ createdAt: -1 }).lean();
  return serializeDocs(docs);
}

export async function getResourceById(id) {
  await dbConnect();
  const doc = await Resource.findById(id).lean();
  return serializeDoc(doc);
}

export async function createResource(data) {
  await dbConnect();
  const doc = await Resource.create(data);
  revalidateTag('resources');
  return serializeDoc(doc.toObject());
}

export async function updateResource(id, data) {
  await dbConnect();
  const doc = await Resource.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  revalidateTag('resources');
  return serializeDoc(doc);
}

export async function deleteResource(id) {
  await dbConnect();
  await Resource.findByIdAndDelete(id);
  revalidateTag('resources');
  return { ok: true };
}
