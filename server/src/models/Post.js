"use strict";

const mongoose = require("mongoose");
const { estimateReadTime } = require("../utils/readTime");

const { Schema } = mongoose;

const clapSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    count: { type: Number, default: 0, min: 0, max: 50 },
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subtitle: { type: String, trim: true, maxlength: 200, default: "" },
    slug: { type: String, required: true, unique: true, index: true },
    contentHtml: { type: String, required: true },
    coverImage: { type: String, default: "" },
    tags: { type: [String], default: [], index: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    claps: { type: [clapSchema], default: [] },
    totalClaps: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
    seo: {
      metaTitle: { type: String, trim: true, maxlength: 160 },
      metaDescription: { type: String, trim: true, maxlength: 200 },
      canonicalUrl: { type: String },
    },
    indexable: { type: Boolean, default: false },
    notifiedAt: { type: Date, default: null },
    moderationStatus: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
      index: true,
    },
    publication: {
      type: Schema.Types.ObjectId,
      ref: "Publication",
      default: null,
      index: true,
    },
    submissionStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected", "changes_requested"],
      default: "none",
      index: true,
    },
    reviewNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/**
 * Returns canonical visible query filter for published + visible posts.
 * @param {Object} [additional]
 * @returns {Object}
 */
postSchema.statics.visibleQuery = function visibleQuery(additional = {}) {
  return { status: "published", moderationStatus: "visible", ...additional };
};

// Full-text search across title, subtitle, and tags
postSchema.index({ title: "text", subtitle: "text", tags: "text" });
// Common feed sort
postSchema.index({ status: 1, publishedAt: -1 });

// Recompute read time whenever content changes, and sync SEO indexability / canonical URL
postSchema.pre("save", function computePostDetails(next) {
  if (this.isModified("contentHtml")) {
    this.readTimeMinutes = estimateReadTime(this.contentHtml);
  }
  if (this.status === "published" && this.moderationStatus !== "hidden") {
    this.indexable = true;
    if (!this.seo || !this.seo.canonicalUrl) {
      const env = require("../config/env");
      if (!this.seo) this.seo = {};
      this.seo.canonicalUrl = `${env.clientUrl}/p/${this.slug}`;
    }
  } else {
    this.indexable = false;
    this.notifiedAt = null;
  }
  next();
});

/**
 * Shape a post for API responses. Author is populated where available.
 * @param {import('mongoose').Types.ObjectId|null} [viewerId] - to compute viewer-specific flags
 * @returns {Object}
 */
postSchema.methods.toCardJSON = function toCardJSON(viewerId = null) {
  const viewerClap = viewerId
    ? this.claps.find((c) => String(c.user) === String(viewerId))
    : null;
  const author =
    this.author && this.author.username
      ? {
          id: this.author._id,
          name: this.author.name,
          username: this.author.username,
          avatarUrl: this.author.avatarUrl,
          bio: this.author.bio,
        }
      : this.author;
  return {
    id: this._id,
    title: this.title,
    subtitle: this.subtitle,
    slug: this.slug,
    coverImage: this.coverImage,
    tags: this.tags,
    author,
    status: this.status,
    totalClaps: this.totalClaps,
    views: this.views,
    readTimeMinutes: this.readTimeMinutes,
    publishedAt: this.publishedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    viewerClapCount: viewerClap ? viewerClap.count : 0,
    seo: this.seo || { metaTitle: "", metaDescription: "", canonicalUrl: "" },
    indexable: this.indexable,
    moderationStatus: this.moderationStatus || "visible",
    publication: this.publication,
    submissionStatus: this.submissionStatus || "none",
    reviewNote: this.reviewNote || "",
  };
};

module.exports = mongoose.model("Post", postSchema);
