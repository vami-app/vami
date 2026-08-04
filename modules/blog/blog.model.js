/**
 * Blog Module — Model (canonical Mongoose schema)
 * Moved from models/BlogPost.js — single source of truth for the blog domain.
 */
import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    coverImage: { type: String },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ slug: 1 }, { unique: true }); // Covered by unique: true above, explicit for clarity

export default mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
