import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── INDEXES ────────────────────────────────────────────────────────
// Index for querying categories sorted by creation date efficiently (prevents in-memory sort)
CategorySchema.index({ createdAt: -1 });

// Prevent re-compilation of models in Next.js development mode
export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
