import mongoose from 'mongoose';

const PageContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['capabilities', 'quality', 'industries', 'why_rma', 'home_gallery'],
    },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    sections: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        imageUrl: { type: String, trim: true },
        order: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.models.PageContent ||
  mongoose.model('PageContent', PageContentSchema);
