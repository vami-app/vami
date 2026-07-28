"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const publicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    logoUrl: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

publicationSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    logoUrl: this.logoUrl,
    coverImage: this.coverImage,
    owner: this.owner,
    isArchived: this.isArchived,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Publication", publicationSchema);
