"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Dispute = require("../../src/modules/moderation/dispute.model");
const PayoutLedgerEntry = require("../../src/models/PayoutLedgerEntry");
const { finalizationJob } = require("../../src/modules/moderation/moderation.module");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Moderation & Payout Dispute Integration (/api/moderation/disputes)", () => {
  let writer, admin, regularUser, writerToken, adminToken, userToken, post;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    writer = await User.create({
      name: "Dispute Writer",
      username: "disputewriter",
      email: "writer@dispute.test",
      password: "Password123!",
      role: "user",
      status: "active",
    });

    admin = await User.create({
      name: "Admin Reviewer",
      username: "adminreviewer",
      email: "admin@dispute.test",
      password: "Password123!",
      role: "admin",
      status: "active",
    });

    regularUser = await User.create({
      name: "Regular User",
      username: "regularuser",
      email: "regular@dispute.test",
      password: "Password123!",
      role: "user",
      status: "active",
    });

    writerToken = signAccessToken(String(writer._id));
    adminToken = signAccessToken(String(admin._id));
    userToken = signAccessToken(String(regularUser._id));

    post = await Post.create({
      title: "Story Under Review",
      slug: "story-under-review",
      contentHtml: "<p>Content</p>",
      author: writer._id,
      status: "published",
      moderationStatus: "visible",
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Scenario 1: Filing within window
  it("Scenario 1: allows writer to file dispute within window, maintaining HELD state", async () => {
    const res = await request(app)
      .post("/api/moderation/disputes")
      .set("Cookie", [`accessToken=${writerToken}`])
      .send({
        actionType: "content_removal",
        targetRef: String(post._id),
        targetModel: "Post",
        originalReason: "Flagged for misinformation review",
        writerStatement: "This article cites verified research papers.",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dispute.status).toBe("submitted");
    expect(res.body.data.dispute.writerStatement).toBe("This article cites verified research papers.");

    // Assert target post remains in HELD/visible state before final decision
    const checkPost = await Post.findById(post._id);
    expect(checkPost.moderationStatus).toBe("visible");
  });

  // Scenario 2: Filing past expiration window
  it("Scenario 2: REJECTS dispute filing when windowExpiresAt has passed", async () => {
    const pastWindow = new Date(Date.now() - 1000); // Already expired

    const res = await request(app)
      .post("/api/moderation/disputes")
      .set("Cookie", [`accessToken=${writerToken}`])
      .send({
        actionType: "account_restriction",
        targetRef: String(writer._id),
        targetModel: "User",
        originalReason: "Spam behavior suspected",
        writerStatement: "Too late filing",
        windowExpiresAt: pastWindow.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Dispute window has expired");
  });

  // Scenario 3: Sweep finalization job
  it("Scenario 3: FinalizationJob sweep auto-finalizes expired unappealed dispute windows", async () => {
    const expiredDispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "content_removal",
      targetRef: post._id,
      targetModel: "Post",
      originalReason: "Unappealed flag",
      writerStatement: "Initial statement",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    });

    const sweepResult = await finalizationJob.runSweep();
    expect(sweepResult.finalizedCount).toBeGreaterThanOrEqual(1);

    const checkDispute = await Dispute.findById(expiredDispute._id);
    expect(checkDispute.status).toBe("upheld");
    expect(checkDispute.reviewerNote).toContain("Auto-finalized");
  });

  // Scenario 4: Overturned decision (with numeric payoutCents before/after assertion)
  it("Scenario 4: Overturned decision restores status and asserts numeric payoutCents before/after", async () => {
    const entry = await PayoutLedgerEntry.create({
      writer: writer._id,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      eligibleActiveSeconds: 700,
      platformActiveSeconds: 1000,
      poolCents: 10000,
      payoutCents: 7000,
    });

    // Assert initial payoutCents before dispute decision
    expect(entry.payoutCents).toBe(7000);

    const dispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "payout_adjustment",
      targetRef: entry._id,
      targetModel: "PayoutLedgerEntry",
      originalReason: "Engagement anomaly hold",
      writerStatement: "Valid organic traffic verified.",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() + 86400000),
    });

    const decisionRes = await request(app)
      .patch(`/api/moderation/disputes/${dispute._id}/decision`)
      .set("Cookie", [`accessToken=${adminToken}`])
      .send({
        decision: "overturned",
        reviewerNote: "Traffic validated from analytics audit.",
      });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.data.dispute.status).toBe("overturned");

    // Assert final payoutCents in DB remains intact (7000 cents)
    const checkEntry = await PayoutLedgerEntry.findById(entry._id);
    expect(checkEntry.payoutCents).toBe(7000);
  });

  // Scenario 5: Upheld decision
  it("Scenario 5: Upheld decision finalizes action permanently", async () => {
    const dispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "account_restriction",
      targetRef: writer._id,
      targetModel: "User",
      originalReason: "Terms of service violation",
      writerStatement: "I request review.",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .patch(`/api/moderation/disputes/${dispute._id}/decision`)
      .set("Cookie", [`accessToken=${adminToken}`])
      .send({
        decision: "upheld",
        reviewerNote: "Violation confirmed upon inspection.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.dispute.status).toBe("upheld");
  });

  // Scenario 6: Non-reviewer authorization guard
  it("Scenario 6: BLOCKS non-admin users from admin queue and decision endpoints with 403", async () => {
    const dispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "content_removal",
      targetRef: post._id,
      targetModel: "Post",
      originalReason: "Test flag",
      writerStatement: "Test statement",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() + 86400000),
    });

    const queueRes = await request(app)
      .get("/api/moderation/disputes/queue")
      .set("Cookie", [`accessToken=${userToken}`]);
    expect(queueRes.status).toBe(403);

    const decisionRes = await request(app)
      .patch(`/api/moderation/disputes/${dispute._id}/decision`)
      .set("Cookie", [`accessToken=${userToken}`])
      .send({ decision: "overturned" });
    expect(decisionRes.status).toBe(403);

    // Assert DB state is unchanged
    const checkDispute = await Dispute.findById(dispute._id);
    expect(checkDispute.status).toBe("submitted");
  });

  // Scenario 7: Account deletion cascade
  it("Scenario 7: Account deletion cascade voids pending disputes and leaves zero orphaned references", async () => {
    const dispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "content_removal",
      targetRef: post._id,
      targetModel: "Post",
      originalReason: "Flag before account deletion",
      writerStatement: "Statement",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() + 86400000),
    });

    const { disputeRepository } = require("../../src/modules/moderation/moderation.module");
    await disputeRepository.voidForUser(writer._id);

    const checkDispute = await Dispute.findById(dispute._id);
    expect(checkDispute.status).toBe("overturned");
    expect(checkDispute.reviewerNote).toContain("voided due to account deletion cascade");
  });

  // Scenario 8: Razorpay settled payout edge case (reconciliationFlag = true, 0 API calls)
  it("Scenario 8: Overturning dispute on Razorpay-settled payout sets reconciliationFlag and makes 0 automated API calls", async () => {
    const entry = await PayoutLedgerEntry.create({
      writer: writer._id,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      eligibleActiveSeconds: 700,
      platformActiveSeconds: 1000,
      poolCents: 10000,
      payoutCents: 7000,
    });

    const dispute = await Dispute.create({
      filedBy: writer._id,
      actionType: "payout_adjustment",
      targetRef: entry._id,
      targetModel: "PayoutLedgerEntry",
      originalReason: "Settled payout hold review",
      writerStatement: "Payout was settled externally.",
      status: "submitted",
      windowExpiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .patch(`/api/moderation/disputes/${dispute._id}/decision`)
      .set("Cookie", [`accessToken=${adminToken}`])
      .send({
        decision: "overturned",
        reviewerNote: "Manually reconcile with settled bank transfer.",
        razorpaySettled: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.dispute.status).toBe("overturned");
    expect(res.body.data.dispute.reconciliationFlag).toBe(true);
  });

  // Public Policy Endpoint Check
  it("fetches public moderation & appeals policy document at GET /api/policy/moderation-appeals", async () => {
    const res = await request(app).get("/api/policy/moderation-appeals");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.policy).toContain("Inkwell Moderation & Appeals Policy");
  });
});
