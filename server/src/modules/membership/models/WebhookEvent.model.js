"use strict";

const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "processedAt", updatedAt: false },
  }
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
