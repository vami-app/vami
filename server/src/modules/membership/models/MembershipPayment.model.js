"use strict";

const mongoose = require("mongoose");

const membershipPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

membershipPaymentSchema.index({ periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model("MembershipPayment", membershipPaymentSchema);
