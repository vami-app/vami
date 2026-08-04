import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    longDescription: {
      type: String,
    },
    specs: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    variants: [
      {
        name: { type: String, required: true },
        priceNote: { type: String },
        images: [{ type: String }],
      },
    ],
    images: [{ type: String }],
    featured: {
      type: Boolean,
      default: false,
    },
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
  },
  {
    timestamps: true,
  }
);
// ─── INDEXES ────────────────────────────────────────────────────────
// Compound index for querying published products by category efficiently
ProductSchema.index({ status: 1, category: 1 });

// Compound index for cursor-based pagination (FAANG-grade keyset)
ProductSchema.index({ createdAt: -1, _id: -1 });

// Text index for native MongoDB search
ProductSchema.index({ name: 'text', shortDescription: 'text' });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
