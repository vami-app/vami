import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';

export const getSiteSettings = unstable_cache(
  async () => {
    await dbConnect();
    return await SiteSettings.findById('site').lean() || {};
  },
  ['site-settings'],
  { tags: ['settings'], revalidate: 86400 }
);

// ─── MUTATIONS (Uncached) ─────────────────────────

export const getSiteSettingsUncached = async () => {
  await dbConnect();
  return await SiteSettings.findById('site').lean() || {};
};

export const updateSiteSettings = async (data) => {
  await dbConnect();
  return await SiteSettings.findByIdAndUpdate(
    'site',
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  ).lean();
};
