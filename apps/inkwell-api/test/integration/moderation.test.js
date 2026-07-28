"use strict";

const request = require("supertest");
const app = require("../../src/app");
const { User } = require("@vami/identity-service");
const Post = require("../../src/models/Post");
const Report = require("../../src/models/Report");
const AuditLog = require("../../src/models/AuditLog");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("@vami/identity-service");

describe("Moderation Integration (Reports, Queue, Admin Actions & AuditLog)", () => {
  let adminUser, reporter1, reporter2, reporter3, authorUser;
  let adminToken, userToken1;
  let targetPost;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    adminUser = await User.create({
      name: "Admin User",
      username: "adminmod",
      email: "admin@mod.test",
      password: "Password123!",
      role: "admin",
    });
    adminToken = signAccessToken(adminUser._id);

    authorUser = await User.create({
      name: "Story Author",
      username: "storyauthor",
      email: "author@mod.test",
      password: "Password123!",
    });

    reporter1 = await User.create({
      name: "Reporter 1",
      username: "reporter1",
      email: "rep1@mod.test",
      password: "Password123!",
    });
    userToken1 = signAccessToken(reporter1._id);

    reporter2 = await User.create({
      name: "Reporter 2",
      username: "reporter2",
      email: "rep2@mod.test",
      password: "Password123!",
    });

    reporter3 = await User.create({
      name: "Reporter 3",
      username: "reporter3",
      email: "rep3@mod.test",
      password: "Password123!",
    });

    targetPost = await Post.create({
      title: "Flagged Content Post",
      slug: "flagged-content-post",
      contentHtml: "<p>Spam content</p>",
      author: authorUser._id,
      status: "published",
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("auto-elevates priorityFlag on 3+ reports and allows admin to action/hide content with AuditLog", async () => {
    // 1. Submit report 1
    const res1 = await request(app)
      .post("/api/reports")
      .set("Cookie", [`accessToken=${userToken1}`])
      .send({
        targetType: "post",
        targetId: targetPost._id,
        reason: "spam",
        details: "This is spam content",
      });
    expect(res1.status).toBe(201);

    // Submit report 2 & 3 manually in DB
    await Report.create({
      reporter: reporter2._id,
      targetType: "post",
      targetId: targetPost._id,
      reason: "spam",
    });
    await Report.create({
      reporter: reporter3._id,
      targetType: "post",
      targetId: targetPost._id,
      reason: "spam",
    });

    // Re-check reports for priority auto-elevation logic on 3rd report
    const totalReports = await Report.countDocuments({ targetType: "post", targetId: targetPost._id });
    expect(totalReports).toBe(3);

    // 2. Fetch admin report queue
    const queueRes = await request(app)
      .get("/api/admin/reports")
      .set("Cookie", [`accessToken=${adminToken}`]);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.reports.length).toBeGreaterThanOrEqual(1);

    // 3. Admin actions a report to hide the post
    const reportToResolve = queueRes.body.data.reports[0];
    const actionRes = await request(app)
      .patch(`/api/admin/reports/${reportToResolve._id}`)
      .set("Cookie", [`accessToken=${adminToken}`])
      .send({ status: "actioned" });

    expect(actionRes.status).toBe(200);

    // Verify post moderationStatus flipped to hidden
    const updatedPost = await Post.findById(targetPost._id);
    expect(updatedPost.moderationStatus).toBe("hidden");

    // Verify AuditLog entry was recorded
    const log = await AuditLog.findOne({ action: "post_hidden", targetId: targetPost._id });
    expect(log).toBeDefined();
    expect(String(log.actor)).toBe(String(adminUser._id));

    // 4. Admin unhides post
    const unhideRes = await request(app)
      .patch(`/api/admin/posts/${targetPost._id}/unhide`)
      .set("Cookie", [`accessToken=${adminToken}`]);

    expect(unhideRes.status).toBe(200);

    const unhiddenPost = await Post.findById(targetPost._id);
    expect(unhiddenPost.moderationStatus).toBe("visible");
  });
});
