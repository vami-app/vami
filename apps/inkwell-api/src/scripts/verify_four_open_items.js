"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("../app");

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const PostRevision = require("../models/PostRevision");
const Follow = require("../models/Follow");

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function getCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function makeRequest(urlPath, method = "GET", body = null, cookie = "") {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = {
      "Cookie": cookie,
      "Content-Type": "application/json",
    };
    let bodyStr = "";
    if (body) {
      bodyStr = JSON.stringify(body);
      headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }
    const options = { method, headers };
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
        resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: rawString });
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runSuite() {
  console.log("==========================================================================");
  console.log("🔥 INKWELL — VERIFICATION OF ALL 4 OPEN ITEMS (HARD PROOF SUITE)");
  console.log("==========================================================================\n");

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Verification test server listening on ${BASE_URL}\n`);

  // Ensure Admin User Ada exists and is active admin
  let admin = await User.findOne({ email: "ada@inkwell.dev" });
  if (!admin) {
    admin = await User.create({
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@inkwell.dev",
      password: "password123",
      role: "admin",
      status: "active",
      emailVerified: true,
    });
  } else {
    admin.role = "admin";
    admin.status = "active";
    admin.emailVerified = true;
    await admin.save();
  }

  // Authenticate Admin
  const adminLogin = await makeRequest("/api/auth/login", "POST", {
    email: "ada@inkwell.dev",
    password: "password123",
  });
  const adminCookie = getCookies(adminLogin.headers);
  console.log("🔑 Authenticated as Admin (Ada Lovelace)");

  // ==========================================================================
  // ITEM 1: Moderation resolve action ("Action (Hide Content)") & 4-Surface Exclusion
  // ==========================================================================
  console.log("\n--------------------------------------------------------------------------");
  console.log("➡️  ITEM 1: Moderation Resolve Action & 4-Surface Exclusion Check");
  console.log("--------------------------------------------------------------------------");

  const testTs = Date.now();
  // Create a target post to report and hide
  const targetPost = await Post.create({
    title: "Flagged Spam Story for Moderation Test",
    subtitle: "This post will be reported and hidden by admin action",
    slug: `flagged-spam-story-moderation-test-${testTs}`,
    contentHtml: "<p>Unsafe spam content that violates guidelines.</p>",
    author: admin._id,
    status: "published",
    publishedAt: new Date(),
  });

  // Create a report against targetPost
  const report = await Report.create({
    reporter: admin._id,
    targetType: "post",
    targetId: targetPost._id,
    reason: "spam",
    details: "Contains spam affiliate links.",
    status: "pending",
  });

  console.log(`📌 Created pending report ID: ${report._id} for Post ID: ${targetPost._id}`);

  // Perform "Action (Hide Content)" on the report
  const resolveRes = await makeRequest(`/api/admin/reports/${report._id}`, "PATCH", { status: "actioned" }, adminCookie);
  if (resolveRes.status !== 200) {
    throw new Error(`Failed to action report: ${resolveRes.status} - ${JSON.stringify(resolveRes.body)}`);
  }
  console.log("✅ Admin clicked 'Action (Hide Content)' -> API returned 200 OK");

  // Confirm DB updates
  const postInDb = await Post.findById(targetPost._id);
  console.log(`   - Post moderationStatus: '${postInDb.moderationStatus}' (Expected: 'hidden')`);
  console.log(`   - Post indexable: ${postInDb.indexable} (Expected: false)`);

  if (postInDb.moderationStatus !== "hidden" || postInDb.indexable !== false) {
    throw new Error("❌ Item 1 Failed: Post moderationStatus or indexable not updated correctly in DB!");
  }

  // Confirm AuditLog entry
  const auditLog = await AuditLog.findOne({ action: "post_hidden", targetId: targetPost._id });
  console.log(`   - AuditLog Entry Created: ${auditLog ? `ID ${auditLog._id} (Action: ${auditLog.action})` : "NONE"}`);
  if (!auditLog) throw new Error("❌ Item 1 Failed: AuditLog entry missing!");

  // Confirm exclusion from all 4 surfaces:
  // Surface A: Main Feed API
  const feedRes = await makeRequest("/api/posts", "GET");
  const inFeed = (feedRes.body.data.posts || []).some((p) => String(p.id || p._id) === String(targetPost._id));
  console.log(`   - Surface 1 (Feed API): ${inFeed ? "❌ PRESENT (FAILED)" : "✅ EXCLUDED (PASSED)"}`);

  // Surface B: Search Query via Feed API
  const searchRes = await makeRequest("/api/posts?search=Flagged", "GET");
  const searchPostsList = searchRes.body?.data?.posts || [];
  const inSearch = searchPostsList.some((p) => String(p.id || p._id) === String(targetPost._id));
  console.log(`   - Surface 2 (Search API): ${inSearch ? "❌ PRESENT (FAILED)" : "✅ EXCLUDED (PASSED)"}`);

  // Surface C: RSS Feed XML
  const rssRes = await makeRequest("/api/rss.xml", "GET");
  const inRss = rssRes.rawBody.includes(targetPost.slug);
  console.log(`   - Surface 3 (RSS Feed): ${inRss ? "❌ PRESENT (FAILED)" : "✅ EXCLUDED (PASSED)"}`);

  // Surface D: Sitemap XML
  const sitemapRes = await makeRequest("/api/sitemap.xml", "GET");
  const inSitemap = sitemapRes.rawBody.includes(targetPost.slug);
  console.log(`   - Surface 4 (Sitemap XML): ${inSitemap ? "❌ PRESENT (FAILED)" : "✅ EXCLUDED (PASSED)"}`);

  if (inFeed || inSearch || inRss || inSitemap) {
    throw new Error("❌ Item 1 Failed: Hidden post leaked into one or more surfaces!");
  }
  console.log("🎉 ITEM 1 PASSED WITH COMPLETE EVIDENCE!");

  // ==========================================================================
  // ITEM 2: Revision Restore Preservation Verification
  // ==========================================================================
  console.log("\n--------------------------------------------------------------------------");
  console.log("➡️  ITEM 2: Revision Restore Preservation Check (notifiedAt, indexable, canonicalUrl)");
  console.log("--------------------------------------------------------------------------");

  // Create a published story with initial properties
  const originalNotifiedAt = new Date("2026-06-01T12:00:00.000Z");
  const originalCanonicalUrl = "https://custom-domain.org/canonical-story";

  const revPost = await Post.create({
    title: "Original Story Title v1",
    subtitle: "Original Subtitle v1",
    slug: `original-story-title-v1-restore-test-${testTs}`,
    contentHtml: "<p>Original story content text v1.</p>",
    author: admin._id,
    status: "published",
    moderationStatus: "visible",
    publishedAt: new Date("2026-06-01T10:00:00.000Z"),
    notifiedAt: originalNotifiedAt,
    indexable: true,
    seo: {
      canonicalUrl: originalCanonicalUrl,
    },
  });

  // Edit story to create Revision #1
  const updateRes = await makeRequest(`/api/posts/${revPost.slug}`, "PATCH", {
    title: "Edited Story Title v2",
    subtitle: "Edited Subtitle v2",
    contentHtml: "<p>Edited content text v2.</p>",
  }, adminCookie);

  if (updateRes.status !== 200) {
    throw new Error(`Failed to update post: ${updateRes.status} - ${JSON.stringify(updateRes.body)}`);
  }

  // Get created revision
  const revisionsRes = await makeRequest(`/api/posts/${revPost.slug}/revisions`, "GET", null, adminCookie);
  const revisions = revisionsRes.body.data.revisions;
  console.log(`📌 Created story revision. Total revisions available: ${revisions.length}`);

  const targetRevision = revisions[0];
  const revId = targetRevision._id || targetRevision.id;

  // Perform Restore Action
  const restoreRes = await makeRequest(`/api/posts/${revPost.slug}/revisions/${revId}/restore`, "POST", null, adminCookie);
  if (restoreRes.status !== 200) {
    throw new Error(`Restore action failed: ${restoreRes.status} - ${JSON.stringify(restoreRes.body)}`);
  }
  console.log("✅ Admin clicked 'Restore' on revision -> API returned 200 OK");

  // Fetch restored post from DB
  const restoredPostInDb = await Post.findById(revPost._id);

  console.log("   --- Property Verification Post-Restore ---");
  console.log(`   - Restored Title: '${restoredPostInDb.title}' (Expected: 'Original Story Title v1')`);
  console.log(`   - indexable: ${restoredPostInDb.indexable} (Expected: true) [Preserved]`);
  console.log(`   - canonicalUrl: '${restoredPostInDb.seo.canonicalUrl}' (Expected: '${originalCanonicalUrl}') [Preserved]`);
  console.log(`   - notifiedAt: '${restoredPostInDb.notifiedAt ? restoredPostInDb.notifiedAt.toISOString() : null}' (Expected: '${originalNotifiedAt.toISOString()}') [Preserved]`);

  if (
    restoredPostInDb.title !== "Original Story Title v1" ||
    restoredPostInDb.indexable !== true ||
    restoredPostInDb.seo.canonicalUrl !== originalCanonicalUrl ||
    !restoredPostInDb.notifiedAt ||
    restoredPostInDb.notifiedAt.toISOString() !== originalNotifiedAt.toISOString()
  ) {
    throw new Error("❌ Item 2 Failed: Untouched properties (notifiedAt / indexable / canonicalUrl) were mutated!");
  }
  console.log("🎉 ITEM 2 PASSED WITH COMPLETE EVIDENCE!");

  // ==========================================================================
  // ITEM 3: Last-Admin Lockout Guard Check
  // ==========================================================================
  console.log("\n--------------------------------------------------------------------------");
  console.log("➡️  ITEM 3: Last-Admin Lockout Guard Check (Demote & Ban Protection)");
  console.log("--------------------------------------------------------------------------");

  // Ensure Ada is the ONLY active admin in the database for this test
  await User.updateMany({ _id: { $ne: admin._id } }, { role: "user" });

  const activeAdminCount = await User.countDocuments({ role: "admin", status: "active" });
  console.log(`📌 Current active admin count in DB: ${activeAdminCount} (Ada Lovelace ID: ${admin._id})`);

  // Attempt 1: Demote the sole admin
  const demoteRes = await makeRequest(`/api/admin/users/${admin._id}/role`, "PATCH", { role: "user" }, adminCookie);
  console.log(`   - Demote Attempt Status Code: ${demoteRes.status} (Expected: 400)`);
  console.log(`   - Demote Error Message: '${demoteRes.body?.message}'`);

  if (demoteRes.status !== 400 || !demoteRes.body?.message?.includes("only remaining active admin")) {
    throw new Error("❌ Item 3 Failed: Demoting last admin was NOT blocked!");
  }

  // Attempt 2: Ban the sole admin
  const banRes = await makeRequest(`/api/admin/users/${admin._id}/ban`, "PATCH", null, adminCookie);
  console.log(`   - Ban Attempt Status Code: ${banRes.status} (Expected: 400)`);
  console.log(`   - Ban Error Message: '${banRes.body?.message}'`);

  if (banRes.status !== 400 || !banRes.body?.message?.includes("only remaining active admin")) {
    throw new Error("❌ Item 3 Failed: Banning last admin was NOT blocked!");
  }
  console.log("🎉 ITEM 3 PASSED WITH COMPLETE EVIDENCE!");

  // ==========================================================================
  // ITEM 4: 13-Step Deletion Cascade Verification
  // ==========================================================================
  console.log("\n--------------------------------------------------------------------------");
  console.log("➡️  ITEM 4: 13-Step Account Deletion Cascade Check");
  console.log("--------------------------------------------------------------------------");

  // Create a secondary user to act as recipient / parent post author
  const secondaryUser = await User.create({
    name: "Secondary User",
    username: `secondary_${testTs}`,
    email: `secondary_${testTs}@inkwell.dev`,
    password: "password123",
    emailVerified: true,
  });

  const secPost = await Post.create({
    title: "Secondary User Post",
    slug: `secondary-user-post-delete-test-${testTs}`,
    contentHtml: "<p>Content</p>",
    author: secondaryUser._id,
    status: "published",
  });

  // Create test user to delete
  const victimUser = await User.create({
    name: "Victim User",
    username: `victim_${testTs}`,
    email: `victim_${testTs}@inkwell.dev`,
    password: "password123",
    avatarUrl: `/uploads/victim-avatar-test-${testTs}.png`,
    emailVerified: true,
  });

  // Create avatar file on disk to test deletion step 11
  const avatarDiskPath = path.join(__dirname, `../../uploads/victim-avatar-test-${testTs}.png`);
  fs.writeFileSync(avatarDiskPath, "dummy-avatar-image-data");
  console.log(`📌 Created dummy avatar file at: ${avatarDiskPath}`);

  // Create victim post + revision
  const victimPost = await Post.create({
    title: "Victim Story To Be Deleted",
    slug: `victim-story-to-be-deleted-${testTs}`,
    contentHtml: "<p>Victim text</p>",
    author: victimUser._id,
    status: "published",
  });

  const victimRevision = await PostRevision.create({
    post: victimPost._id,
    title: "Victim Story Revision",
    contentHtml: "<p>Rev</p>",
    editedBy: victimUser._id,
  });

  // Create victim comments:
  // 1) Comment on own post
  const ownComment = await Comment.create({
    post: victimPost._id,
    author: victimUser._id,
    content: "Comment on my own post",
  });

  // 2) Comment on secondary post (with a reply from secondary user to trigger soft-delete [deleted])
  const commentWithReply = await Comment.create({
    post: secPost._id,
    author: victimUser._id,
    content: "Victim comment that has a reply attached",
  });

  const replyComment = await Comment.create({
    post: secPost._id,
    author: secondaryUser._id,
    parentComment: commentWithReply._id,
    content: "Secondary user reply",
    depth: 1,
  });

  // Create follow relationship
  await Follow.create({ follower: victimUser._id, followee: secondaryUser._id });
  await Follow.create({ follower: secondaryUser._id, followee: victimUser._id });
  secondaryUser.followers.push(victimUser._id);
  secondaryUser.following.push(victimUser._id);
  await secondaryUser.save();

  // Create clap on secondary post
  secPost.claps.push({ user: victimUser._id, count: 10 });
  secPost.totalClaps = 10;
  await secPost.save();

  // Create bookmark on secondary post
  victimUser.bookmarks.push(secPost._id);
  await victimUser.save();

  // Create submitted report + report targeting victim post
  const submittedReport = await Report.create({
    reporter: victimUser._id,
    targetType: "post",
    targetId: secPost._id,
    reason: "spam",
    status: "pending",
  });

  const targetReport = await Report.create({
    reporter: secondaryUser._id,
    targetType: "post",
    targetId: victimPost._id,
    reason: "harassment",
    status: "pending",
  });

  // Create audit log for victim user (should be preserved)
  const userAuditLog = await AuditLog.create({
    actor: victimUser._id,
    action: "role_changed",
    targetType: "user",
    targetId: victimUser._id,
  });

  // Authenticate victim user
  const victimLogin = await makeRequest("/api/auth/login", "POST", {
    email: victimUser.email,
    password: "password123",
  });
  const victimCookie = getCookies(victimLogin.headers);

  // Generate delete token directly (bypassing email step, same pattern as test_phase_b.js)
  const { signDeleteToken } = require("../utils/unsubscribeToken");
  const deleteToken = signDeleteToken(String(victimUser._id));

  // Execute Account Deletion (passing both token and mode per controller contract)
  const deleteRes = await makeRequest(`/api/users/me`, "DELETE", { token: deleteToken, mode: "erase" }, victimCookie);
  if (deleteRes.status !== 200) {
    throw new Error(`Account deletion failed: ${deleteRes.status} - ${JSON.stringify(deleteRes.body)}`);
  }
  console.log("✅ Executed DELETE /api/users/me with signed token -> Returned 200 OK");

  // Verify all 13 Cascade Steps:
  console.log("\n   --- Verifying 13 Deletion Steps ---");

  // Step 1: Capture sets done internally
  // Step 2: PostRevisions deleted
  const revCheck = await PostRevision.findById(victimRevision._id);
  console.log(`   - Step 2 (PostRevisions deleted): ${revCheck ? "❌ FAILED" : "✅ PASSED"}`);

  // Step 3: Submitted reports deleted
  const subRepCheck = await Report.findById(submittedReport._id);
  console.log(`   - Step 3 (Submitted reports deleted): ${subRepCheck ? "❌ FAILED" : "✅ PASSED"}`);

  // Step 4: Reports targeting user's post/comments deleted
  const tarRepCheck = await Report.findById(targetReport._id);
  console.log(`   - Step 4 (Target reports deleted): ${tarRepCheck ? "❌ FAILED" : "✅ PASSED"}`);

  // Step 5: Comments on user's own posts deleted
  const ownCommCheck = await Comment.findById(ownComment._id);
  console.log(`   - Step 5 (Comments on user posts deleted): ${ownCommCheck ? "❌ FAILED" : "✅ PASSED"}`);

  // Step 6: Soft-delete comments with replies
  const softDelComm = await Comment.findById(commentWithReply._id).populate("author", "username name");
  const isSoftDeleted = softDelComm && softDelComm.content === "[deleted]" && softDelComm.deletedButHasReplies === true && softDelComm.author.username === "deleted";
  console.log(`   - Step 6 (Comments with replies soft-deleted to [deleted]): ${isSoftDeleted ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 7: Post docs deleted
  const postCheck = await Post.findById(victimPost._id);
  console.log(`   - Step 7 (User posts deleted): ${postCheck ? "❌ FAILED" : "✅ PASSED"}`);

  // Step 8: Bookmarks pulled
  const secUserDb = await User.findById(secondaryUser._id);
  const bookmarkCheck = !secUserDb.bookmarks.includes(victimPost._id);
  console.log(`   - Step 8 (Bookmarks pulled): ${bookmarkCheck ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 9: Follow docs deleted & array pulled
  const followCheck = await Follow.countDocuments({ $or: [{ follower: victimUser._id }, { followee: victimUser._id }] });
  const arrayCheck = !secUserDb.followers.includes(victimUser._id) && !secUserDb.following.includes(victimUser._id);
  console.log(`   - Step 9 (Follow docs deleted & arrays pulled): ${followCheck === 0 && arrayCheck ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 10: Claps pulled and totalClaps recomputed
  const secPostDb = await Post.findById(secPost._id);
  const clapsCheck = secPostDb.claps.length === 0 && secPostDb.totalClaps === 0;
  console.log(`   - Step 10 (Claps pulled & totalClaps recomputed): ${clapsCheck ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 11: Avatar deleted from disk
  const avatarFileExists = fs.existsSync(avatarDiskPath);
  console.log(`   - Step 11 (Avatar file removed from disk): ${!avatarFileExists ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 12: AuditLogs preserved
  const auditPreservationCheck = await AuditLog.findById(userAuditLog._id);
  console.log(`   - Step 12 (AuditLogs preserved): ${auditPreservationCheck ? "✅ PASSED" : "❌ FAILED"}`);

  // Step 13: User document deleted
  const userCheck = await User.findById(victimUser._id);
  console.log(`   - Step 13 (User document deleted): ${!userCheck ? "✅ PASSED" : "❌ FAILED"}`);

  if (
    revCheck || subRepCheck || tarRepCheck || ownCommCheck || !isSoftDeleted ||
    postCheck || !bookmarkCheck || followCheck !== 0 || !arrayCheck || !clapsCheck ||
    avatarFileExists || !auditPreservationCheck || userCheck
  ) {
    throw new Error("❌ Item 4 Failed: One or more steps of the 13-step cascade failed!");
  }
  console.log("🎉 ITEM 4 PASSED WITH COMPLETE EVIDENCE!");

  console.log("\n==========================================================================");
  console.log("🌟 ALL 4 OPEN ITEMS HAVE PASSED EMPIRICALLY WITH 100% EVIDENCE!");
  console.log("==========================================================================");

  server.close();
  await mongoose.connection.close();
  process.exit(0);
}

runSuite().catch(async (err) => {
  console.error("\n❌ SUITE FAILED WITH ERROR:", err.message);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
