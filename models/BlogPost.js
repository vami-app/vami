import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema(
  {
    title: {
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
    coverImage: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
// ─── INDEXES ────────────────────────────────────────────────────────
// Compound index for querying published blogs sorted by date efficiently
BlogPostSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
