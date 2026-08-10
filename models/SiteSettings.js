import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'site' },
    siteName: { type: String, default: 'Radhey Metal Alloys LLP' },
    tagline: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactPhones: { type: [String], default: [] },
    contactPersons: { type: [String], default: [] },
    whatsappNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    manufacturingAddress: { type: String, default: '' },
    mapsQuery: { type: String, default: '' },
    mapsEmbedUrl: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    website: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    ogImageUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    youtubeVideoId: { type: String, default: '' },
    showProductImagesInList: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);
