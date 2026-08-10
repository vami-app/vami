import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';
import { serializeDoc } from '@/lib/serialize';

// ─── READS (Cached) ──────────────────────────────────────────────────────────

export async function getSiteSettings() {
  'use cache';
  cacheTag('settings');
  cacheLife('hours');
  try {
    await dbConnect();
    const settings = await SiteSettings.findById('site').lean();
    return serializeDoc(settings) || {};
  } catch {
    return {};
  }
}

// ─── ADMIN QUERIES (Uncached) ─────────────────────────────────────────────────

export const getSiteSettingsUncached = async () => {
  await dbConnect();
  const settings = await SiteSettings.findById('site').lean();
  return serializeDoc(settings) || {};
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const updateSiteSettings = async (data) => {
  await dbConnect();
  const settings = await SiteSettings.findByIdAndUpdate(
    'site',
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  revalidateTag('settings');
  return serializeDoc(settings);
};
