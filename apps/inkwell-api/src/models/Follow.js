"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
    sourcePost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: false }
);

// Ensure follower-followee combination is unique
followSchema.index({ follower: 1, followee: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
