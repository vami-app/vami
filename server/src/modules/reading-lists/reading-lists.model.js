"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const readingListItemSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const readingListSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    posts: { type: [readingListItemSchema], default: [] },
  },
  { timestamps: true }
);

// Compound index: slug is unique per owner
readingListSchema.index({ owner: 1, slug: 1 }, { unique: true });

readingListSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id,
    owner: this.owner,
    name: this.name,
    slug: this.slug,
    visibility: this.visibility,
    postsCount: this.posts ? this.posts.length : 0,
    posts: this.posts,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("ReadingList", readingListSchema);
