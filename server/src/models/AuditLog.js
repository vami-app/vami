"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "post_hidden",
        "post_unhidden",
        "comment_hidden",
        "comment_unhidden",
        "user_banned",
        "user_unbanned",
        "role_changed",
        "report_dismissed",
        "report_actioned",
      ],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "report"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
