"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    filedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ["account_restriction", "payout_adjustment", "content_removal"],
      required: true,
    },
    targetRef: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      enum: ["User", "Post", "PayoutLedgerEntry"],
      required: true,
    },
    originalReason: {
      type: String,
      required: true,
    },
    writerStatement: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "upheld", "overturned"],
      default: "submitted",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewerNote: {
      type: String,
      default: "",
    },
    filedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    windowExpiresAt: {
      type: Date,
      required: true,
    },
    reconciliationFlag: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1, windowExpiresAt: 1 });

module.exports = mongoose.model("Dispute", disputeSchema);
