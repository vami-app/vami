import mongoose from 'mongoose';

const ComparisonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    rows: [
      {
        parameter: { type: String, required: true },
        values: [{ type: String }],
      },
    ],
    columnLabels: [{ type: String }],
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.models.Comparison ||
  mongoose.model('Comparison', ComparisonSchema);
