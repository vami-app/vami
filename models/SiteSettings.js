import mongoose from 'mongoose';

// Singleton document — only one settings record ever exists (_id is fixed)
const SiteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'site' },
    siteName:        { type: String, default: 'Smalloys' },
    tagline:         { type: String, default: '' },
    contactEmail:    { type: String, default: '' },
    contactPhone:    { type: String, default: '' },
    address:         { type: String, default: '' },
    linkedIn:        { type: String, default: '' },
    website:         { type: String, default: '' },
    seoTitle:        { type: String, default: '' },
    seoDescription:  { type: String, default: '' },
    showProductImagesInList: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);
