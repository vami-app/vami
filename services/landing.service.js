import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export async function getLandingBySlug(slug) {
  'use cache';
  cacheTag('landings', `landing-${slug}`);
  cacheLife('hours');
  try {
    await dbConnect();
    const doc = await LandingPage.findOne({ slug, status: 'published' }).lean();
    return serializeDoc(doc);
  } catch {
    return null;
  }
}

export async function listLandingsAdmin() {
  await dbConnect();
  return serializeDocs(await LandingPage.find({}).sort({ updatedAt: -1 }).lean());
}

export async function upsertLanding(data) {
  await dbConnect();
  const doc = await LandingPage.findOneAndUpdate(
    { slug: data.slug },
    { $set: data },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  revalidateTag('landings');
  revalidateTag(`landing-${data.slug}`);
  return serializeDoc(doc);
}
