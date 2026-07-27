"use strict";

const { ApiError } = require("../../utils/apiResponse");

class MembershipService {
  constructor(membershipRepository, userRepository) {
    this.repo = membershipRepository;
    this.users = userRepository;
  }

  async getFreeReadContext({ viewer, post }) {
    const isMember = viewer && viewer.membershipStatus === "active";
    if (!post.locked || isMember) {
      return { remainingFreeReads: 3, totalMonthlyQuota: 3, isFreeReadApplied: false };
    }
    const viewerId = viewer ? viewer._id : null;
    const freeReadsUsed = await this.repo.countMonthlyFreeReads(viewerId);
    const totalMonthlyQuota = 3;
    const remainingFreeReads = Math.max(0, totalMonthlyQuota - freeReadsUsed);
    return {
      remainingFreeReads,
      totalMonthlyQuota,
      isFreeReadApplied: remainingFreeReads > 0,
    };
  }

  async getWriterPayoutLedger(writerId) {
    const entries = await this.repo.findLedgerEntriesByWriter(writerId);
    const totalEarnedPayoutCents = entries.reduce((sum, e) => sum + (e.payoutCents || 0), 0);
    return {
      totalEarnedPayoutCents,
      entries,
    };
  }
}

module.exports = MembershipService;
