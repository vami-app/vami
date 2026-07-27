"use strict";

const Dispute = require("./dispute.model");
const IDisputeRepository = require("./disputes.repository.interface");

class MongoDisputeRepository extends IDisputeRepository {
  async create(data) {
    return Dispute.create(data);
  }

  async findById(id) {
    return Dispute.findById(id).populate("filedBy", "name username email").populate("reviewedBy", "name username");
  }

  async findByWriter(writerId) {
    return Dispute.find({ filedBy: writerId }).sort({ createdAt: -1 });
  }

  async findPendingByWriter(writerId) {
    return Dispute.find({
      filedBy: writerId,
      status: { $in: ["submitted", "under_review"] },
    });
  }

  async findAdminQueue({ status, skip = 0, limit = 20 }) {
    const query = status ? { status } : { status: { $in: ["submitted", "under_review"] } };
    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .sort({ filedAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("filedBy", "name username email"),
      Dispute.countDocuments(query),
    ]);
    return { disputes, total };
  }

  async updateDecision({ id, status, reviewedBy, reviewerNote, resolvedAt, reconciliationFlag }) {
    const update = {
      status,
      reviewedBy,
      reviewerNote,
      resolvedAt: resolvedAt || new Date(),
    };
    if (typeof reconciliationFlag === "boolean") {
      update.reconciliationFlag = reconciliationFlag;
    }

    return Dispute.findByIdAndUpdate(id, update, { new: true })
      .populate("filedBy", "name username email")
      .populate("reviewedBy", "name username");
  }

  async findExpiredUnappealed(now = new Date()) {
    return Dispute.find({
      status: "submitted",
      windowExpiresAt: { $lte: now },
    });
  }

  async voidForUser(userId) {
    return Dispute.updateMany(
      {
        $or: [{ filedBy: userId }, { targetRef: userId }],
        status: { $in: ["submitted", "under_review"] },
      },
      {
        status: "overturned",
        reviewerNote: "Dispute voided due to account deletion cascade.",
        resolvedAt: new Date(),
      }
    );
  }
}

module.exports = MongoDisputeRepository;
