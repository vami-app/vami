"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../../utils/apiResponse");

class DisputeController {
  constructor(disputeService) {
    this.service = disputeService;
  }

  listPendingActions = asyncHandler(async (req, res) => {
    const data = await this.service.listPendingActions(req.user);
    return sendSuccess(res, 200, data, "Pending HELD actions retrieved.");
  });

  fileDispute = asyncHandler(async (req, res) => {
    const { actionType, targetRef, targetModel, originalReason, writerStatement, windowExpiresAt } = req.body;

    const dispute = await this.service.fileDispute({
      user: req.user,
      actionType,
      targetRef,
      targetModel,
      originalReason,
      writerStatement,
      windowExpiresAt,
    });

    return sendSuccess(res, 201, { dispute }, "Dispute filed successfully.");
  });

  listMyDisputes = asyncHandler(async (req, res) => {
    const data = await this.service.listMyDisputes(req.user._id);
    return sendSuccess(res, 200, data, "My disputes retrieved.");
  });

  listAdminQueue = asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const data = await this.service.listAdminQueue({ status, page, limit });
    return sendSuccess(res, 200, data, "Admin dispute queue retrieved.");
  });

  reviewDecision = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, reviewerNote, razorpaySettled } = req.body;

    const dispute = await this.service.reviewDecision({
      disputeId: id,
      adminUser: req.user,
      decision,
      reviewerNote,
      razorpaySettled: Boolean(razorpaySettled),
    });

    return sendSuccess(res, 200, { dispute }, `Dispute decision recorded as ${decision}.`);
  });

  getPolicy = asyncHandler(async (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const policyPath = path.resolve(__dirname, "../../docs/policies/moderation-appeals.md");

    let policyText = "";
    if (fs.existsSync(policyPath)) {
      policyText = fs.readFileSync(policyPath, "utf8");
    } else {
      policyText = "# Moderation & Appeals Policy\n\nWriters have a 7-day due process window to appeal moderation and payout actions.";
    }

    return sendSuccess(res, 200, { policy: policyText }, "Moderation & Appeals Policy retrieved.");
  });
}

module.exports = DisputeController;
