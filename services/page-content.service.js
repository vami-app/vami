import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import PageContent from '@/models/PageContent';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export async function getPublishedPageContent(key) {
  'use cache';
  cacheTag('page-content', `page-content-${key}`);
  cacheLife('hours');
  try {
    await dbConnect();
    const doc = await PageContent.findOne({ key, status: 'published' }).lean();
    return serializeDoc(doc);
  } catch {
    return null;
  }
}

export async function getPageContentByKey(key) {
  await dbConnect();
  const doc = await PageContent.findOne({ key }).lean();
  return serializeDoc(doc);
}

export async function listPageContentAdmin() {
  await dbConnect();
  const docs = await PageContent.find({}).sort({ key: 1 }).lean();
  return serializeDocs(docs);
}

export async function upsertPageContent(key, data) {
  await dbConnect();
  const doc = await PageContent.findOneAndUpdate(
    { key },
    { $set: { ...data, key } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
  revalidateTag('page-content');
  revalidateTag(`page-content-${key}`);
  return serializeDoc(doc);
}
