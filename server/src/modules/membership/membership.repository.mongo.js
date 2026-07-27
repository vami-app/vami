"use strict";

const IMembershipRepository = require("./membership.repository.interface");
const MembershipPayment = require("./models/MembershipPayment.model");
const PayoutLedgerEntry = require("./models/PayoutLedgerEntry.model");
const WebhookEvent = require("./models/WebhookEvent.model");
const ReadEvent = require("./models/ReadEvent.model");

class MongoMembershipRepository extends IMembershipRepository {
  async createPayment(data) {
    return await MembershipPayment.create(data);
  }

  async findPaymentByRazorpayId(id) {
    return await MembershipPayment.findOne({ razorpayPaymentId: id });
  }

  async findPaymentsByUser(userId) {
    return await MembershipPayment.find({ user: userId }).sort({ createdAt: -1 });
  }

  async createLedgerEntry(data) {
    return await PayoutLedgerEntry.create(data);
  }

  async findLedgerEntriesByWriter(writerId) {
    return await PayoutLedgerEntry.find({ writer: writerId }).sort({ periodEnd: -1 });
  }

  async isWebhookProcessed(eventId) {
    const existing = await WebhookEvent.findOne({ eventId });
    return Boolean(existing);
  }

  async recordWebhookEvent(eventId, eventType) {
    return await WebhookEvent.create({ eventId, eventType });
  }

  async recordReadEvent({ post, viewer, viewerWasMember, activeSeconds }) {
    return await ReadEvent.create({ post, viewer, viewerWasMember, activeSeconds });
  }

  async countMonthlyFreeReads(viewerId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const filter = {
      viewerWasMember: false,
      createdAt: { $gte: startOfMonth },
    };
    if (viewerId) filter.viewer = viewerId;
    return await ReadEvent.countDocuments(filter);
  }
}

module.exports = MongoMembershipRepository;
