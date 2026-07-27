"use strict";

class IMembershipRepository {
  async createPayment(data) { throw new Error("Method not implemented"); }
  async findPaymentByRazorpayId(id) { throw new Error("Method not implemented"); }
  async findPaymentsByUser(userId) { throw new Error("Method not implemented"); }

  async createLedgerEntry(data) { throw new Error("Method not implemented"); }
  async findLedgerEntriesByWriter(writerId) { throw new Error("Method not implemented"); }

  async isWebhookProcessed(eventId) { throw new Error("Method not implemented"); }
  async recordWebhookEvent(eventId, eventType) { throw new Error("Method not implemented"); }

  async recordReadEvent(data) { throw new Error("Method not implemented"); }
  async countMonthlyFreeReads(viewerId) { throw new Error("Method not implemented"); }
}

module.exports = IMembershipRepository;
