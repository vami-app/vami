import mongoose from 'mongoose';

const LandingPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    h1: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    geo: { type: String, trim: true, default: '' },
    relatedProductSlugs: [{ type: String }],
    relatedIndustryKeys: [{ type: String }],
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.models.LandingPage ||
  mongoose.model('LandingPage', LandingPageSchema);
