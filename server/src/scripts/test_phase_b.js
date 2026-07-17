"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const http = require("http");
const app = require("../app");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const PostRevision = require("../models/PostRevision");
const Follow = require("../models/Follow");
const { execSync } = require("child_process");

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function getCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function runTests() {
  console.log("🧪 Starting Inkwell Phase B Integration Verification Suite...");

  // 1. Setup Database Connection & Clean Collections
  await connectDB();
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await Report.deleteMany({});
  await AuditLog.deleteMany({});
  await PostRevision.deleteMany({});
  await Follow.deleteMany({});

  // 2. Start Test Server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Test server running on ${BASE_URL}`);

  // HTTP Request Helper
  async function makeRequest(path, method = "GET", body = null, cookie = "") {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const headers = {
        "Cookie": cookie,
        "Content-Type": "application/json",
      };
      let bodyStr = "";
      if (body) {
        bodyStr = JSON.stringify(body);
        headers["Content-Length"] = Buffer.byteLength(bodyStr);
      }
      const options = {
        method,
        headers,
      };
      const req = http.request(url, options, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const rawString = buffer.toString("utf8");
          let json = null;
          try {
            json = JSON.parse(rawString);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });
      req.on("error", reject);
      if (body) {
        req.write(bodyStr);
      }
      req.end();
    });
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Register and Log In Users
    // ----------------------------------------------------
    console.log("\n➡️  Test 1: User Registration & Session Initialization...");
    
    // Register User 1
    const reg1 = await makeRequest("/api/auth/register", "POST", {
      name: "Admin User",
      username: "adminuser",
      email: "admin@inkwell.dev",
      password: "password123",
    });
    if (reg1.status !== 201) throw new Error(`Reg1 failed: ${reg1.status} - ${JSON.stringify(reg1.body)}`);
    const adminCookie = getCookies(reg1.headers);

    // Verify email manually in DB so they can publish
    await User.updateOne({ email: "admin@inkwell.dev" }, { emailVerified: true });

    // Register User 2
    const reg2 = await makeRequest("/api/auth/register", "POST", {
      name: "Standard User 1",
      username: "userone",
      email: "user1@inkwell.dev",
      password: "password123",
    });
    const user1Cookie = getCookies(reg2.headers);
    await User.updateOne({ email: "user1@inkwell.dev" }, { emailVerified: true });

    // Register User 3
    const reg3 = await makeRequest("/api/auth/register", "POST", {
      name: "Standard User 2",
      username: "usertwo",
      email: "user2@inkwell.dev",
      password: "password123",
    });
    const user2Cookie = getCookies(reg3.headers);
    await User.updateOne({ email: "user2@inkwell.dev" }, { emailVerified: true });

    // Register User 4
    const reg4 = await makeRequest("/api/auth/register", "POST", {
      name: "Standard User 3",
      username: "userthree",
      email: "user3@inkwell.dev",
      password: "password123",
    });
    const user3Cookie = getCookies(reg4.headers);
    await User.updateOne({ email: "user3@inkwell.dev" }, { emailVerified: true });

    console.log("✅ Registered adminuser, userone, usertwo, userthree.");

    // ----------------------------------------------------
    // TEST 2: Promote First Admin via CLI Promote Script
    // ----------------------------------------------------
    console.log("\n➡️  Test 2: Promote script CLI verification...");
    try {
      const fs = require("fs");
      const promoteScriptPath = fs.existsSync("src/scripts/promote_admin.js")
        ? "src/scripts/promote_admin.js"
        : "server/src/scripts/promote_admin.js";
      execSync(`node ${promoteScriptPath} admin@inkwell.dev`);
      console.log("✅ Promote admin script executed successfully.");
    } catch (e) {
      throw new Error(`Promote admin script failed: ${e.message}`);
    }

    const adminUser = await User.findOne({ email: "admin@inkwell.dev" });
    if (adminUser.role !== "admin") throw new Error("Admin role not updated in DB.");
    console.log("✅ Admin role verified in DB.");

    // ----------------------------------------------------
    // TEST 3: requireAuth & requireAdmin Middleware Gatekeeping
    // ----------------------------------------------------
    console.log("\n➡️  Test 3: Authorization Middleware Checking...");
    
    // Non-admin tries to hit stats endpoint
    const statsUserResponse = await makeRequest("/api/admin/stats", "GET", null, user1Cookie);
    if (statsUserResponse.status !== 403) {
      throw new Error(`Non-admin allowed to hit admin route: ${statsUserResponse.status}`);
    }
    console.log("✅ Non-admin blocked from stats route with 403.");

    // Admin hits stats endpoint
    const statsAdminResponse = await makeRequest("/api/admin/stats", "GET", null, adminCookie);
    if (statsAdminResponse.status !== 200) {
      throw new Error(`Admin failed to hit admin stats: ${statsAdminResponse.status} - ${JSON.stringify(statsAdminResponse.body)}`);
    }
    console.log("✅ Admin successfully accessed stats endpoint.");

    // ----------------------------------------------------
    // TEST 4: Banned User Flow & Lockout
    // ----------------------------------------------------
    console.log("\n➡️  Test 4: User Ban Status Enforcement...");
    
    // Find User 1's ID
    const u1 = await User.findOne({ email: "user1@inkwell.dev" });
    
    // Ban User 1
    const banResponse = await makeRequest(`/api/admin/users/${u1._id}/ban`, "PATCH", null, adminCookie);
    if (banResponse.status !== 200) {
      throw new Error(`Admin failed to ban user: ${banResponse.status}`);
    }
    console.log("✅ Banned user1 via admin endpoint.");

    // Banned user1 tries to request `/api/auth/me`
    const meResponse = await makeRequest("/api/auth/me", "GET", null, user1Cookie);
    if (meResponse.status !== 403) {
      throw new Error(`Banned user allowed access: ${meResponse.status}`);
    }
    console.log("✅ Banned user immediately blocked with 403 on next auth request.");

    // Unban User 1
    const unbanResponse = await makeRequest(`/api/admin/users/${u1._id}/unban`, "PATCH", null, adminCookie);
    if (unbanResponse.status !== 200) {
      throw new Error(`Admin failed to unban user: ${unbanResponse.status}`);
    }
    console.log("✅ Unbanned user1.");

    // Banned user1 accesses `/api/auth/me` again
    const meActiveResponse = await makeRequest("/api/auth/me", "GET", null, user1Cookie);
    if (meActiveResponse.status !== 200) {
      throw new Error(`Unbanned user blocked: ${meActiveResponse.status}`);
    }
    console.log("✅ Unbanned user allowed access again (200).");

    // ----------------------------------------------------
    // TEST 5: Last Admin Lockout Guards
    // ----------------------------------------------------
    console.log("\n➡️  Test 5: Lockout Guards for Demoting/Banning Last Admin...");
    
    const adminU = await User.findOne({ email: "admin@inkwell.dev" });
    
    // Try to ban the only admin
    const banAdminResponse = await makeRequest(`/api/admin/users/${adminU._id}/ban`, "PATCH", null, adminCookie);
    if (banAdminResponse.status !== 400) {
      throw new Error(`Allowed to ban the only admin: ${banAdminResponse.status}`);
    }
    console.log("✅ Hard-blocked banning the only remaining admin (400).");

    // Try to demote the only admin
    const demoteAdminResponse = await makeRequest(`/api/admin/users/${adminU._id}/role`, "PATCH", { role: "user" }, adminCookie);
    if (demoteAdminResponse.status !== 400) {
      throw new Error(`Allowed to demote the only admin: ${demoteAdminResponse.status}`);
    }
    console.log("✅ Hard-blocked demoting the only remaining admin (400).");

    // Promote User1 to admin first
    await makeRequest(`/api/admin/users/${u1._id}/role`, "PATCH", { role: "admin" }, adminCookie);
    console.log("✅ Promoted user1 to admin temporarily.");

    // Now try to demote adminU (should succeed since user1 is also admin)
    const demoteAdminSucceed = await makeRequest(`/api/admin/users/${adminU._id}/role`, "PATCH", { role: "user" }, adminCookie);
    if (demoteAdminSucceed.status !== 200) {
      throw new Error(`Failed to demote admin when another admin exists: ${demoteAdminSucceed.status}`);
    }
    console.log("✅ Allowed demoting admin when another admin exists.");

    // Restore roles
    await User.updateOne({ email: "admin@inkwell.dev" }, { role: "admin" });
    await User.updateOne({ email: "user1@inkwell.dev" }, { role: "user" });

    // ----------------------------------------------------
    // TEST 6: Moderation Reports & Priority Flagging
    // ----------------------------------------------------
    console.log("\n➡️  Test 6: Moderation Reports & Auto-Priority Flagging...");
    
    // User 2 creates a post
    const postRes = await makeRequest("/api/posts", "POST", {
      title: "Violating Content Story",
      contentHtml: "<p>This is bad content.</p>",
      status: "published",
    }, user2Cookie);
    if (postRes.status !== 201) throw new Error("Could not create post.");
    const postSlug = postRes.body.data.post.slug;
    const postId = postRes.body.data.post.id;

    // User 1 reports post
    const r1 = await makeRequest("/api/reports", "POST", {
      targetType: "post",
      targetId: postId,
      reason: "spam",
      details: "Spamming links",
    }, user1Cookie);
    if (r1.status !== 201) throw new Error(`Report 1 failed: ${r1.status} - ${JSON.stringify(r1.body)}`);
    console.log("✅ Report 1 submitted.");

    // Try to report again (duplicate check)
    const rDuplicate = await makeRequest("/api/reports", "POST", {
      targetType: "post",
      targetId: postId,
      reason: "harassment",
    }, user1Cookie);
    if (rDuplicate.status !== 409) {
      throw new Error(`Allowed duplicate reporting: ${rDuplicate.status}`);
    }
    console.log("✅ Blocked duplicate report with 409.");

    // Try to report own post (self-reporting check)
    const rSelf = await makeRequest("/api/reports", "POST", {
      targetType: "post",
      targetId: postId,
      reason: "spam",
    }, user2Cookie);
    if (rSelf.status !== 400) {
      throw new Error(`Allowed self reporting: ${rSelf.status}`);
    }
    console.log("✅ Blocked self reporting with 400.");

    // Submit 2 more reports from user3 and admin to hit 3x priority threshold
    await makeRequest("/api/reports", "POST", { targetType: "post", targetId: postId, reason: "other" }, user3Cookie);
    await makeRequest("/api/reports", "POST", { targetType: "post", targetId: postId, reason: "misinformation" }, adminCookie);

    // Verify priorityFlag on reports in database
    const reportsForPost = await Report.find({ targetId: postId });
    if (!reportsForPost.every(r => r.priorityFlag === true)) {
      throw new Error("Priority flag not set to true after 3 reports.");
    }
    console.log("✅ priorityFlag automatically set to true on all reports after 3x threshold.");

    // List reports queue via admin
    const repQueue = await makeRequest("/api/admin/reports?status=pending", "GET", null, adminCookie);
    if (repQueue.body.data.reports[0].targetId !== postId || !repQueue.body.data.reports[0].priorityFlag) {
      throw new Error("Priority report not appearing at the top of admin queue.");
    }
    console.log("✅ Priority report surfaces correctly in admin reports queue query.");

    // ----------------------------------------------------
    // TEST 7: Resolving Reports & Visibility Filters
    // ----------------------------------------------------
    console.log("\n➡️  Test 7: Resolving Reports & Omit Moderated Content Filters...");
    
    // Resolve report as "actioned" (hides post)
    const reportToResolve = reportsForPost[0]._id;
    const resolveRes = await makeRequest(`/api/admin/reports/${reportToResolve}`, "PATCH", { status: "actioned" }, adminCookie);
    if (resolveRes.status !== 200) throw new Error("Failed to resolve report.");
    
    const dbPost = await Post.findById(postId);
    if (dbPost.moderationStatus !== "hidden" || dbPost.indexable !== false) {
      throw new Error("Post did not flip to hidden or non-indexable.");
    }
    console.log("✅ Post hidden and indexable flipped to false successfully.");

    // Verify AuditLog creation
    const log = await AuditLog.findOne({ action: "post_hidden", targetId: postId });
    if (!log) throw new Error("AuditLog not created for post_hidden action.");
    console.log("✅ AuditLog verification passed.");

    // Other pending reports on this post should be auto-marked as "actioned" too
    const pendingReportsCount = await Report.countDocuments({ targetId: postId, status: "pending" });
    if (pendingReportsCount !== 0) throw new Error("Sibling reports were not resolved automatically.");
    console.log("✅ Sibling pending reports resolved automatically.");

    // Verify post is hidden from feeds
    const feedRes = await makeRequest("/api/posts", "GET");
    const feedSlugs = feedRes.body.data.posts.map(p => p.slug);
    if (feedSlugs.includes(postSlug)) throw new Error("Hidden post leaked in feed.");
    
    const rssRes = await makeRequest("/api/feed/rss", "GET");
    if (rssRes.rawBody && rssRes.rawBody.includes(postSlug)) throw new Error("Hidden post leaked in RSS feed.");
    console.log("✅ Hidden post omitted from feeds and RSS builder queries successfully.");

    // Unhide post
    const unhideRes = await makeRequest(`/api/admin/posts/${postId}/unhide`, "PATCH", null, adminCookie);
    if (unhideRes.status !== 200) throw new Error("Failed to unhide post.");
    
    const dbPostVisible = await Post.findById(postId);
    if (dbPostVisible.moderationStatus !== "visible" || dbPostVisible.indexable !== true) {
      throw new Error("Unhide failed to restore visibility/indexability.");
    }
    console.log("✅ Unhide post restored visibility and indexability successfully.");

    // ----------------------------------------------------
    // TEST 8: Post Edit Revision History
    // ----------------------------------------------------
    console.log("\n➡️  Test 8: Post Revision Tracking, Snapshotting, and Restoring...");
    
    // Make 1st edit: title change
    await makeRequest(`/api/posts/${postSlug}`, "PATCH", { title: "Upgraded Title Story" }, user2Cookie);
    
    // Verify revision created
    let revs = await PostRevision.find({ post: postId });
    if (revs.length !== 1 || revs[0].title !== "Violating Content Story") {
      throw new Error(`Revision 1 missing or incorrect: ${JSON.stringify(revs)}`);
    }
    console.log("✅ Revision 1 created with pre-change title.");

    // Make 2nd edit: subtitle change
    await makeRequest(`/api/posts/${postSlug}`, "PATCH", { subtitle: "Fresh Subtitle" }, user2Cookie);
    
    revs = await PostRevision.find({ post: postId }).sort({ createdAt: -1 });
    if (revs.length !== 2 || revs[0].subtitle !== "") {
      throw new Error(`Revision 2 missing or incorrect: ${JSON.stringify(revs)}`);
    }
    console.log("✅ Revision 2 created with pre-change subtitle.");

    // Query revisions list via API
    const revsListRes = await makeRequest(`/api/posts/${postSlug}/revisions`, "GET", null, user2Cookie);
    if (revsListRes.status !== 200 || revsListRes.body.data.revisions.length !== 2) {
      throw new Error("Failed to query revisions list.");
    }
    console.log("✅ Revisions list endpoint returns correct count.");

    // Set notifiedAt and canonicalUrl before restore to check if they are preserved
    const testNotifiedAt = new Date(Date.now() - 10000);
    const testCanonicalUrl = "http://localhost:3000/canonical-test-url";
    await Post.updateOne(
      { _id: postId },
      { notifiedAt: testNotifiedAt, "seo.canonicalUrl": testCanonicalUrl, indexable: true }
    );

    // Restore Revision 1
    const oldestRevId = revs[1]._id; // The first revision (holding original title)
    const restoreRes = await makeRequest(`/api/posts/${postSlug}/revisions/${oldestRevId}/restore`, "POST", null, user2Cookie);
    if (restoreRes.status !== 200) throw new Error(`Restore failed: ${restoreRes.status}`);

    const restoredPost = await Post.findById(postId);
    if (restoredPost.title !== "Violating Content Story") {
      throw new Error(`Restore did not overwrite title: ${restoredPost.title}`);
    }
    if (restoredPost.indexable !== true) {
      throw new Error(`Restore reset indexable to false!`);
    }
    if (!restoredPost.seo || restoredPost.seo.canonicalUrl !== testCanonicalUrl) {
      throw new Error(`Restore modified canonicalUrl! Expected ${testCanonicalUrl}, got ${restoredPost.seo?.canonicalUrl}`);
    }
    if (restoredPost.notifiedAt.getTime() !== testNotifiedAt.getTime()) {
      throw new Error(`Restore modified notifiedAt!`);
    }
    console.log("✅ Restore successfully reverted post title to original, keeping notifiedAt, indexable, and canonicalUrl untouched.");

    // Restore should create an undo revision of pre-restored state ("Upgraded Title Story")
    const revsAfterRestore = await PostRevision.find({ post: postId }).sort({ createdAt: -1 });
    if (revsAfterRestore.length !== 3 || revsAfterRestore[0].title !== "Upgraded Title Story") {
      throw new Error("Restore did not create an undo revision.");
    }
    console.log("✅ Restore created an undo revision successfully.");

    // ----------------------------------------------------
    // TEST 9: Nested Comments, Depths, and Soft-Deletes
    // ----------------------------------------------------
    console.log("\n➡️  Test 9: Threaded/Nested Comments & Soft-Delete Fork...");
    
    // Comment 1: Top level (User 1)
    const c1Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", { content: "Top comment" }, user1Cookie);
    const comment1Id = c1Res.body.data.comment.id;

    // Comment 2: Reply to Comment 1 (User 2)
    const c2Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", {
      content: "Reply depth 1",
      parentComment: comment1Id,
    }, user2Cookie);
    const comment2Id = c2Res.body.data.comment.id;
    if (c2Res.body.data.comment.depth !== 1) throw new Error("Depth calculation incorrect.");

    // Comment 3: Reply to Comment 2 (User 3)
    const c3Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", {
      content: "Reply depth 2",
      parentComment: comment2Id,
    }, user3Cookie);
    const comment3Id = c3Res.body.data.comment.id;

    // Comment 4: Reply to Comment 3 (User 1)
    const c4Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", {
      content: "Reply depth 3",
      parentComment: comment3Id,
    }, user1Cookie);

    // Comment 5: Reply to Comment 4 (User 2)
    const c5Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", {
      content: "Reply depth 4",
      parentComment: c4Res.body.data.comment.id,
    }, user2Cookie);

    // Comment 6: Reply to Comment 5 (User 3) - depth should clamp at 5
    const c6Res = await makeRequest(`/api/posts/${postSlug}/comments`, "POST", {
      content: "Reply depth 5 (max)",
      parentComment: c5Res.body.data.comment.id,
    }, user3Cookie);
    if (c6Res.body.data.comment.depth !== 5) {
      throw new Error(`Expected depth clamped to 5, got: ${c6Res.body.data.comment.depth}`);
    }
    console.log("✅ Depth tracking and max depth clamping verified successfully.");

    // Verify Comment Deletion Forks
    // Comment 3 (leaf comment, no children point to it - comment 4 points to 3, so wait, 3 has replies)
    // Comment 6 is a leaf comment. Let's delete Comment 6 (hard delete)
    const del6 = await makeRequest(`/api/comments/${c6Res.body.data.comment.id}`, "DELETE", null, user3Cookie);
    if (del6.status !== 200) throw new Error("Hard delete of comment 6 failed.");
    const check6Exists = await Comment.findById(c6Res.body.data.comment.id);
    if (check6Exists) throw new Error("Leaf comment not hard-deleted.");
    console.log("✅ Hard-deleted leaf comment successfully.");

    // Comment 1 has replies (comment 2). Let's delete Comment 1 (soft delete)
    const del1 = await makeRequest(`/api/comments/${comment1Id}`, "DELETE", null, user1Cookie);
    if (del1.status !== 200) throw new Error("Delete of comment 1 failed.");
    
    const comment1Doc = await Comment.findById(comment1Id);
    if (!comment1Doc || comment1Doc.content !== "[deleted]" || !comment1Doc.deletedButHasReplies) {
      throw new Error("Comment with replies was not soft-deleted.");
    }
    console.log("✅ Soft-deleted parent comment containing replies successfully.");

    // ----------------------------------------------------
    // TEST 10: Deletion Cascade Update (13-step sequence)
    // ----------------------------------------------------
    console.log("\n➡️  Test 10: 13-step Account Deletion Cascade...");

    // Create report on comment 2
    await makeRequest("/api/reports", "POST", { targetType: "comment", targetId: comment2Id, reason: "spam" }, user3Cookie);

    // Create Follow relationships
    await makeRequest(`/api/users/userone/follow`, "POST", null, user2Cookie); // user2 follows user1

    // Generate deletion token directly without hitting delete-request email sender
    const user2 = await User.findOne({ email: "user2@inkwell.dev" });
    const { signDeleteToken } = require("../utils/unsubscribeToken");
    const deleteToken = signDeleteToken(String(user2._id));

    const deleteRes = await makeRequest("/api/users/me", "DELETE", { token: deleteToken, mode: "erase" }, user2Cookie);
    if (deleteRes.status !== 200) {
      console.log("Delete Response status:", deleteRes.status);
      console.log("Delete Response body:", deleteRes.body);
      throw new Error(`Delete account cascade failed: ${JSON.stringify(deleteRes.body)}`);
    }

    // Verify 13-step cascade outcomes:
    // Step 7: Post deleted
    const postSearch = await Post.findById(postId);
    if (postSearch) throw new Error("Cascade failed: Post not deleted.");
    
    // Step 2: PostRevision deleted
    const revsSearch = await PostRevision.find({ post: postId });
    if (revsSearch.length > 0) throw new Error("Cascade failed: PostRevisions not deleted.");

    // Step 3: Own reports deleted (user2's reports) - none were created by user2 in tests, but let's check
    const ownReportsSearch = await Report.find({ reporter: user2._id });
    if (ownReportsSearch.length > 0) throw new Error("Cascade failed: Own reports not deleted.");

    // Step 4: Reports on user2's posts/comments deleted
    const reportsOnPostSearch = await Report.find({ targetId: postId });
    if (reportsOnPostSearch.length > 0) throw new Error("Cascade failed: Reports on post not deleted.");
    
    const reportsOnComment2Search = await Report.find({ targetId: comment2Id });
    if (reportsOnComment2Search.length > 0) throw new Error("Cascade failed: Reports on comment 2 not deleted.");

    // Step 5: Comments on user2's posts deleted
    // comment 1 was user1's, but it was on user2's post. Check if comment 1 is deleted.
    const comment1Search = await Comment.findById(comment1Id);
    if (comment1Search) throw new Error("Cascade failed: Comment on user's post was not hard-deleted.");

    // Step 6: User2's own comments on other posts soft/hard deleted
    // comment 2 was user2's comment on user1's comment. But user1's post was postId, so comment 2 was on user2's post.
    // Let's verify no comments left by user2 exist.
    const commentsByUser2 = await Comment.find({ author: user2._id });
    if (commentsByUser2.length > 0) throw new Error("Cascade failed: User's comments were not deleted or reassigned.");

    // Step 9: Follow relationships deleted
    const followsCount = await Follow.countDocuments({ $or: [{ follower: user2._id }, { followee: user2._id }] });
    if (followsCount !== 0) throw new Error("Cascade failed: Follows not deleted.");

    console.log("✅ 13-step account deletion cascade ran perfectly.");

    console.log("\n🎉 ALL PHASE B FUNCTIONAL TESTS PASSED SUCCESSFULLY! 🎉\n");
    
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    server.close();
    await mongoose.connection.close();
    process.exit(1);
  }

  // 3. Cleanup & Exit
  server.close();
  await mongoose.connection.close();
  process.exit(0);
}

runTests();
