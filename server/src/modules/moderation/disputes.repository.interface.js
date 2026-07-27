"use strict";

/**
 * Interface contract for Dispute Repository
 */
class IDisputeRepository {
  async create(data) {
    throw new Error("Not implemented");
  }

  async findById(id) {
    throw new Error("Not implemented");
  }

  async findByWriter(writerId) {
    throw new Error("Not implemented");
  }

  async findPendingByWriter(writerId) {
    throw new Error("Not implemented");
  }

  async findAdminQueue({ status, skip, limit }) {
    throw new Error("Not implemented");
  }

  async updateDecision({ id, status, reviewedBy, reviewerNote, resolvedAt, reconciliationFlag }) {
    throw new Error("Not implemented");
  }

  async findExpiredUnappealed(now) {
    throw new Error("Not implemented");
  }

  async voidForUser(userId) {
    throw new Error("Not implemented");
  }
}

module.exports = IDisputeRepository;
