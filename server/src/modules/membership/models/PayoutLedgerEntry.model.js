"use strict";

const mongoose = require("mongoose");

const payoutLedgerEntrySchema = new mongoose.Schema(
  {
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    eligibleActiveSeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    platformActiveSeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    poolCents: {
      type: Number,
      required: true,
      default: 0,
    },
    payoutCents: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "computedAt", updatedAt: false },
  }
);

payoutLedgerEntrySchema.index({ writer: 1, periodStart: -1 });

module.exports = mongoose.model("PayoutLedgerEntry", payoutLedgerEntrySchema);
