import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';

// ─── READS (Cached) ──────────────────────────────────────────────────────────

export async function getSiteSettings() {
  'use cache';
  cacheTag('settings');
  cacheLife('hours');
  await dbConnect();
  return (await SiteSettings.findById('site').lean()) || {};
}

// ─── ADMIN QUERIES (Uncached) ─────────────────────────────────────────────────

export const getSiteSettingsUncached = async () => {
  await dbConnect();
  return (await SiteSettings.findById('site').lean()) || {};
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
  return settings;
};
