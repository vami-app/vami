import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['catalogue', 'tds', 'company_profile', 'other'],
      default: 'other',
    },
    description: { type: String, trim: true, default: '' },
    fileUrl: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

ResourceSchema.index({ status: 1, type: 1 });

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
