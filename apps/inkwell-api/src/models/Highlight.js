"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const highlightSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    quote: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    contextBefore: {
      type: String,
      default: "",
      maxlength: 200,
    },
    contextAfter: {
      type: String,
      default: "",
      maxlength: 200,
    },
    note: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

highlightSchema.index({ owner: 1, post: 1 });

highlightSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id,
    owner: this.owner,
    post: this.post,
    quote: this.quote,
    contextBefore: this.contextBefore,
    contextAfter: this.contextAfter,
    note: this.note,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Highlight", highlightSchema);
