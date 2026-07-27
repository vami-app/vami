"use strict";

const mongoose = require("mongoose");

const readEventSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    viewerWasMember: {
      type: Boolean,
      default: false,
    },
    activeSeconds: {
      type: Number,
      required: true,
      min: 1,
      max: 1800, // Capped at 30 minutes per session
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

readEventSchema.index({ createdAt: -1 });
readEventSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("ReadEvent", readEventSchema);
