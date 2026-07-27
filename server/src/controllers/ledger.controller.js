"use strict";

const PayoutLedgerEntry = require("../models/PayoutLedgerEntry");
const MembershipPayment = require("../models/MembershipPayment");
const ReadEvent = require("../models/ReadEvent");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Calculate writer payout ledger entries for a given billing window
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @returns {Promise<Array>} Array of PayoutLedgerEntry docs
 */
async function computeLedgerForPeriod(periodStart, periodEnd) {
  // Aggregate subscriber payments in window
  const payments = await MembershipPayment.find({
    periodEnd: { $gte: periodStart, $lte: periodEnd },
  });

  const poolCents = payments.reduce((sum, p) => sum + (p.amountCents || 0), 0);

  // Fetch all eligible read events within period
  const readEvents = await ReadEvent.find({
    createdAt: { $gte: periodStart, $lte: periodEnd },
    viewerWasMember: true,
    activeSeconds: { $gte: 10 }, // minimum floor 10 seconds
  }).populate("post", "author");

  // Group active seconds by writer (excluding self-reads)
  const writerSeconds = {};
  let platformActiveSeconds = 0;

  readEvents.forEach((event) => {
    if (!event.post || !event.post.author) return;
    const authorId = String(event.post.author._id || event.post.author);
    const viewerId = event.viewer ? String(event.viewer._id || event.viewer) : null;

    // Exclude self-reads (author reading their own post)
    if (viewerId && viewerId === authorId) return;

    const seconds = event.activeSeconds || 0;
    writerSeconds[authorId] = (writerSeconds[authorId] || 0) + seconds;
    platformActiveSeconds += seconds;
  });

  const ledgerEntries = [];
  const writerIds = Object.keys(writerSeconds);

  for (const writerId of writerIds) {
    const seconds = writerSeconds[writerId];
    const shareRatio = platformActiveSeconds > 0 ? seconds / platformActiveSeconds : 0;
    const payoutCents = Math.round(shareRatio * poolCents);

    const entry = await PayoutLedgerEntry.create({
      writer: writerId,
      periodStart,
      periodEnd,
      eligibleActiveSeconds: seconds,
      platformActiveSeconds,
      poolCents,
      payoutCents,
    });
    ledgerEntries.push(entry);
  }

  return ledgerEntries;
}

/**
 * Fetch calling writer's payout ledger history
 * GET /api/writer/payout-ledger
 */
const getPayoutLedger = asyncHandler(async (req, res) => {
  const entries = await PayoutLedgerEntry.find({ writer: req.user._id })
    .sort({ periodStart: -1 })
    .limit(20);

  return sendSuccess(res, 200, { entries }, "Payout ledger history retrieved");
});

module.exports = {
  computeLedgerForPeriod,
  getPayoutLedger,
};
