"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
    deletedButHasReplies: {
      type: Boolean,
      default: false,
    },
    moderationStatus: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
