"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const publicationMemberSchema = new Schema(
  {
    publication: {
      type: Schema.Types.ObjectId,
      ref: "Publication",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "editor", "writer"],
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One membership record per user per publication
publicationMemberSchema.index({ publication: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("PublicationMember", publicationMemberSchema);
