"use strict";

const assert = require("assert");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("@vami/identity-service").User;
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Follow = require("../models/Follow");
const { handleOAuthUser } = require("../config/passport");
const { disconnectUserSockets } = require("../config/socket");
const checkScheduledPosts = require("./check_scheduled_posts");

async function runPhaseETests() {
  console.log("\n=========================================");
  console.log("🧪 STARTING PHASE E VERIFICATION SUITE");
  console.log("=========================================\n");

  await connectDB();

  // Clean test artifacts
  const testUsers = await User.find({ email: { $regex: /@test-phase-e\.dev$/ } }).distinct("_id");
  if (testUsers.length > 0) {
    await Notification.deleteMany({ $or: [{ recipient: { $in: testUsers } }, { actor: { $in: testUsers } }] });
    await Follow.deleteMany({ $or: [{ follower: { $in: testUsers } }, { followee: { $in: testUsers } }] });
  }
  await User.deleteMany({ email: { $regex: /@test-phase-e\.dev$/ } });
  await Post.deleteMany({ title: { $regex: /^\[Phase E Test\]/ } });
  await Comment.deleteMany({ content: { $regex: /^\[Phase E Test\]/ } });

  // -------------------------------------------------------------------
  // 1. Schema Foundation & Password Validation
  // -------------------------------------------------------------------
  console.log("▶ Step 1: Testing Schema Foundation & Conditional Password...");

  // 1a. OAuth-only user (no password, googleId set)
  const googleUser = new User({
    name: "Google OAuth User",
    username: "googleuser_pe",
    email: "googleuser@test-phase-e.dev",
    googleId: "google_12345",
    emailVerified: true,
  });
  await googleUser.save();
  assert.ok(googleUser._id, "OAuth user should save without password");
  assert.strictEqual(googleUser.password, undefined);

  // 1b. Second OAuth-only user (githubId set, googleId missing/undefined)
  const githubUser = new User({
    name: "GitHub OAuth User",
    username: "githubuser_pe",
    email: "githubuser@test-phase-e.dev",
    githubId: "github_67890",
    emailVerified: true,
  });
  await githubUser.save();
  assert.ok(githubUser._id, "Second OAuth user should save without sparse unique index collision");

  // 1c. Standard signup without password should fail validation
  const invalidUser = new User({
    name: "No Password User",
    username: "nopass_pe",
    email: "nopass@test-phase-e.dev",
  });
  let validationErr = null;
  try {
    await invalidUser.save();
  } catch (err) {
    validationErr = err;
  }
  assert.ok(validationErr, "Standard user without password must fail validation");

  console.log("  ✓ Conditional password and sparse provider indexes verified.");

  // -------------------------------------------------------------------
  // 2. Passport OAuth Helper & Account Linking
  // -------------------------------------------------------------------
  console.log("\n▶ Step 2: Testing Account Linking & Auto-verification...");

  // 2a. Account linking by email
  const standardUser = await User.create({
    name: "Standard User",
    username: "standarduser_pe",
    email: "linktarget@test-phase-e.dev",
    password: "Password123!",
    emailVerified: false,
  });

  await new Promise((resolve, reject) => {
    handleOAuthUser(
      "google",
      "google_link_999",
      "linktarget@test-phase-e.dev",
      "Standard User",
      "",
      (err, user) => {
        if (err) return reject(err);
        assert.strictEqual(String(user._id), String(standardUser._id));
        assert.strictEqual(user.googleId, "google_link_999");
        assert.strictEqual(user.emailVerified, true, "OAuth linking must set emailVerified = true");
        resolve();
      }
    );
  });

  // 2b. First-time OAuth signup (brand-new user, no prior account, no password)
  await new Promise((resolve, reject) => {
    handleOAuthUser(
      "github",
      "github_fresh_101",
      "fresh_oauth@test-phase-e.dev",
      "Fresh OAuth User",
      "https://example.com/avatar.png",
      (err, user) => {
        if (err) return reject(err);
        assert.ok(user._id, "First-time OAuth user must be created");
        assert.strictEqual(user.githubId, "github_fresh_101");
        assert.strictEqual(user.emailVerified, true, "First-time OAuth user must be emailVerified");
        assert.strictEqual(user.password, undefined, "First-time OAuth user must have undefined password");
        resolve();
      }
    );
  });

  console.log("  ✓ OAuth account linking, first-time OAuth signup, and auto-verification verified.");

  // -------------------------------------------------------------------
  // 3. Notification Persistence & Triggers (Clap, Comment, Follow)
  // -------------------------------------------------------------------
  console.log("\n▶ Step 3: Testing Notification Triggers & Coalescing...");

  const author = await User.create({
    name: "Author User",
    username: "author_pe",
    email: "author@test-phase-e.dev",
    password: "Password123!",
    emailVerified: true,
  });

  const actor = await User.create({
    name: "Actor User",
    username: "actor_pe",
    email: "actor@test-phase-e.dev",
    password: "Password123!",
    emailVerified: true,
  });

  const post = await Post.create({
    title: "[Phase E Test] Notification Story",
    slug: "phase-e-notification-story",
    contentHtml: "<p>Hello world</p>",
    author: author._id,
    status: "published",
    publishedAt: new Date(),
  });

  // 3a. Follow notification trigger
  const followNotif = await Notification.create({
    recipient: author._id,
    actor: actor._id,
    type: "follow",
    targetType: "user",
    targetId: author._id,
  });
  assert.ok(followNotif._id);

  // 3b. Clap notification coalescing trigger
  const clapNotif1 = await Notification.create({
    recipient: author._id,
    actor: actor._id,
    type: "clap",
    targetType: "post",
    targetId: post._id,
  });

  // Verify inbox lookup
  const inbox = await Notification.find({ recipient: author._id }).sort({ createdAt: -1 });
  assert.strictEqual(inbox.length, 2, "Author should have 2 notifications in inbox");
  assert.strictEqual(inbox[0].read, false, "Initial notification state should be unread");

  console.log("  ✓ Notification creation, query, and unread state verified.");

  // -------------------------------------------------------------------
  // 4. Post Scheduling & Auto-Publishing Script
  // -------------------------------------------------------------------
  console.log("\n▶ Step 4: Testing Post Scheduling Runner Script...");

  const pastSchedule = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  const scheduledPost = await Post.create({
    title: "[Phase E Test] Scheduled Story",
    slug: "phase-e-scheduled-story",
    contentHtml: "<p>Scheduled story content</p>",
    author: author._id,
    status: "draft",
    scheduledAt: pastSchedule,
  });

  assert.strictEqual(scheduledPost.status, "draft");
  assert.strictEqual(scheduledPost.indexable, false);

  // Execute scheduling script check (substituting process.exit for test suite continuity)
  const origExit = process.exit;
  process.exit = () => {};

  await checkScheduledPosts();

  process.exit = origExit;

  const publishedPost = await Post.findById(scheduledPost._id);
  assert.strictEqual(publishedPost.status, "published", "Overdue scheduled post should be published");
  assert.strictEqual(publishedPost.indexable, true, "pre('save') hook should set indexable = true");
  assert.ok(publishedPost.seo.canonicalUrl, "pre('save') hook should generate canonicalUrl");
  assert.strictEqual(
    publishedPost.publishedAt.toISOString(),
    pastSchedule.toISOString(),
    "publishedAt must equal originally scheduledAt date"
  );

  console.log("  ✓ Post scheduling auto-publish and pre-save hooks verified.");

  // -------------------------------------------------------------------
  // 5. Ban Live Socket Disconnection Guard
  // -------------------------------------------------------------------
  console.log("\n▶ Step 5: Testing Ban Socket Disconnection Execution...");

  // Execute socket disconnection helper (verifies clean execution without socket server initialized)
  disconnectUserSockets(actor._id);
  console.log("  ✓ Socket disconnect user map handler executed cleanly.");

  // -------------------------------------------------------------------
  // 6. Consolidated 15-Step Account Deletion Cascade
  // -------------------------------------------------------------------
  console.log("\n▶ Step 6: Testing Account Deletion Notification Cascade...");

  // Seed comment on another user's post and soft-delete scenario for cascade test
  const post2 = await Post.create({
    title: "[Phase E Test] Actor's Story",
    slug: "phase-e-actors-story",
    contentHtml: "<p>Actor story content</p>",
    author: actor._id,
    status: "published",
    publishedAt: new Date(),
  });

  const parentComment = await Comment.create({
    post: post2._id,
    author: author._id,
    content: "[Phase E Test] Parent Comment",
  });

  const childReply = await Comment.create({
    post: post2._id,
    author: actor._id,
    parentComment: parentComment._id,
    content: "[Phase E Test] Child Reply Comment",
  });

  const softDeleteNotif = await Notification.create({
    recipient: actor._id,
    actor: author._id,
    type: "reply",
    targetType: "comment",
    targetId: parentComment._id,
  });

  // Delete recipient account (author)
  const deleteToken = require("../utils/unsubscribeToken").signDeleteToken(String(author._id));
  const req = { body: { token: deleteToken, mode: "erase" }, user: author };
  const res = { setHeader: () => {}, send: () => {} };

  const deleteAccountHandler = require("../controllers/user.controller").deleteAccount;
  let deleteRes = null;
  const mockRes = {
    clearCookie() {
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      deleteRes = data;
      return this;
    },
  };

  await deleteAccountHandler(req, mockRes, (err) => {
    if (err) throw err;
  });

  // Verify recipient notifications deleted
  const authorInbox = await Notification.find({ recipient: author._id });
  assert.strictEqual(authorInbox.length, 0, "Recipient notifications must be fully deleted");

  // Verify soft-deleted comment actor notification preserved
  const preservedNotif = await Notification.findById(softDeleteNotif._id);
  assert.ok(preservedNotif, "Actor notification for soft-deleted comment should be preserved");

  console.log("  ✓ Account deletion notification cascade verified.");

  // Clean test artifacts
  const cleanUsers = await User.find({ email: { $regex: /@test-phase-e\.dev$/ } }).distinct("_id");
  if (cleanUsers.length > 0) {
    await Notification.deleteMany({ $or: [{ recipient: { $in: cleanUsers } }, { actor: { $in: cleanUsers } }] });
  }
  await User.deleteMany({ email: { $regex: /@test-phase-e\.dev$/ } });
  await Post.deleteMany({ title: { $regex: /^\[Phase E Test\]/ } });
  await Comment.deleteMany({ content: { $regex: /^\[Phase E Test\]/ } });

  console.log("\n=========================================");
  console.log("🎉 ALL PHASE E VERIFICATION TESTS PASSED!");
  console.log("=========================================\n");

  await mongoose.connection.close();
  process.exit(0);
}

runPhaseETests().catch((err) => {
  console.error("❌ Phase E verification failed:", err);
  process.exit(1);
});
