"use strict";

const { ApiError } = require("../../utils/apiResponse");

class DisputeService {
  constructor(disputeRepository, userRepository, postRepository, notificationService) {
    this.repo = disputeRepository;
    this.userRepo = userRepository;
    this.postRepo = postRepository;
    this.notificationService = notificationService;
  }

  /**
   * List HELD actions pending finalization for a writer.
   */
  async listPendingActions(user) {
    const disputes = await this.repo.findByWriter(user._id);
    return {
      pendingActions: disputes.filter((d) => d.status === "submitted" || d.status === "under_review"),
    };
  }

  /**
   * File a new dispute against a HELD action.
   */
  async fileDispute({ user, actionType, targetRef, targetModel, originalReason, writerStatement, windowExpiresAt }) {
    if (!actionType || !targetRef || !targetModel || !writerStatement) {
      throw new ApiError(400, "Missing required dispute fields.");
    }

    if (writerStatement.length > 2000) {
      throw new ApiError(400, "Writer statement exceeds maximum length of 2000 characters.");
    }

    const expiresAt = windowExpiresAt ? new Date(windowExpiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (Date.now() > expiresAt.getTime()) {
      throw new ApiError(400, "Dispute window has expired.");
    }

    // Ensure writer does not have an active open dispute for the same target
    const existing = await this.repo.findPendingByWriter(user._id);
    const duplicate = existing.find((d) => String(d.targetRef) === String(targetRef));
    if (duplicate) {
      throw new ApiError(409, "An active dispute already exists for this action.");
    }

    const dispute = await this.repo.create({
      filedBy: user._id,
      actionType,
      targetRef,
      targetModel,
      originalReason,
      writerStatement,
      status: "submitted",
      windowExpiresAt: expiresAt,
    });

    if (this.notificationService) {
      await this.notificationService.createAndEmit({
        recipient: user._id,
        actor: user._id,
        type: "system",
        targetType: "dispute",
        targetId: dispute._id,
      });
    }

    return dispute;
  }

  /**
   * List disputes filed by calling writer.
   */
  async listMyDisputes(userId) {
    const disputes = await this.repo.findByWriter(userId);
    return { disputes };
  }

  /**
   * Admin queue of submitted & under_review disputes.
   */
  async listAdminQueue({ status, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const { disputes, total } = await this.repo.findAdminQueue({ status, skip, limit: limitNum });

    return {
      disputes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Admin decision endpoint (upheld vs overturned).
   */
  async reviewDecision({ disputeId, adminUser, decision, reviewerNote, razorpaySettled = false }) {
    if (!["upheld", "overturned"].includes(decision)) {
      throw new ApiError(400, "Invalid decision status. Must be 'upheld' or 'overturned'.");
    }

    const dispute = await this.repo.findById(disputeId);
    if (!dispute) {
      throw new ApiError(404, "Dispute not found.");
    }

    if (dispute.status === "upheld" || dispute.status === "overturned") {
      throw new ApiError(400, "Dispute has already been resolved.");
    }

    let reconciliationFlag = false;

    if (decision === "overturned") {
      // Execute reversal logic based on targetModel / actionType
      if (dispute.actionType === "account_restriction" || dispute.targetModel === "User") {
        if (this.userRepo) {
          await this.userRepo.updateStatus({ id: dispute.targetRef, status: "active" });
        }
      } else if (dispute.actionType === "content_removal" || dispute.targetModel === "Post") {
        if (this.postRepo) {
          await this.postRepo.setModerationVisibility({ id: dispute.targetRef, hidden: false });
        }
      } else if (dispute.actionType === "payout_adjustment" || dispute.targetModel === "PayoutLedgerEntry") {
        if (razorpaySettled) {
          // If Razorpay payout has already settled externally, flag for manual operator reconciliation
          reconciliationFlag = true;
          // NO automated Razorpay reversal API call made
        }
      }
    }

    const updatedDispute = await this.repo.updateDecision({
      id: dispute._id,
      status: decision,
      reviewedBy: adminUser._id,
      reviewerNote: reviewerNote || "",
      resolvedAt: new Date(),
      reconciliationFlag,
    });

    if (this.notificationService) {
      await this.notificationService.createAndEmit({
        recipient: dispute.filedBy._id || dispute.filedBy,
        actor: adminUser._id,
        type: "system",
        targetType: "dispute",
        targetId: dispute._id,
      });
    }

    return updatedDispute;
  }

  /**
   * Finalization sweep job: Finalize expired unappealed actions.
   */
  async sweepFinalizationJob(now = new Date()) {
    const expiredDisputes = await this.repo.findExpiredUnappealed(now);
    const finalized = [];

    for (const dispute of expiredDisputes) {
      const updated = await this.repo.updateDecision({
        id: dispute._id,
        status: "upheld",
        reviewedBy: null,
        reviewerNote: "Auto-finalized upon 7-day dispute window expiration.",
        resolvedAt: new Date(),
      });
      finalized.push(updated);
    }

    return { finalizedCount: finalized.length, finalized };
  }
}

module.exports = DisputeService;
