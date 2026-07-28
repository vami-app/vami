"use strict";

const mongoose = require("mongoose");
const http = require("http");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = require("../app");
const env = require("../config/env");
const User = require("@vami/identity-service").User;
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Follow = require("../models/Follow");
const Report = require("../models/Report");
const PostRevision = require("../models/PostRevision");
const ReadEvent = require("../models/ReadEvent");
const MembershipPayment = require("../models/MembershipPayment");
const PayoutLedgerEntry = require("../models/PayoutLedgerEntry");
const WebhookEvent = require("../models/WebhookEvent");
const { computeLedgerForPeriod } = require("../controllers/ledger.controller");

let server;
let baseUrl;

function makeRequest(path, method = "GET", body = null, cookie = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...extraHeaders };
    let payload = null;

    if (body) {
      payload = typeof body === "string" ? body : JSON.stringify(body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    if (cookie) {
      headers["Cookie"] = cookie;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          let parsed = resData;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: resData });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function runTests() {
  console.log("🧪 Starting Inkwell Phase D (Monetization Mechanism) Integration Suite...\n");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  const PORT = 5004;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  baseUrl = `http://localhost:${PORT}`;
  console.log(`✅ Test server running on ${baseUrl}\n`);

  try {
    // --- Setup Test Users ---
    await User.deleteMany({ email: /@phased-test\.com$/ });
    await Post.deleteMany({ title: /Phase D/ });
    await ReadEvent.deleteMany({});
    await MembershipPayment.deleteMany({});
    await PayoutLedgerEntry.deleteMany({});
    await WebhookEvent.deleteMany({});

    // Register Author 1
    const author1Res = await makeRequest("/api/auth/register", "POST", {
      name: "Author One",
      username: "authorone",
      email: "author1@phased-test.com",
      password: "Password123!",
    });
    const author1Cookie = getCookies(author1Res.headers);
    const author1Id = author1Res.body.data.user.id;
    await User.updateOne({ _id: author1Id }, { emailVerified: true });

    // Register Author 2
    const author2Res = await makeRequest("/api/auth/register", "POST", {
      name: "Author Two",
      username: "authortwo",
      email: "author2@phased-test.com",
      password: "Password123!",
    });
    const author2Cookie = getCookies(author2Res.headers);
    const author2Id = author2Res.body.data.user.id;
    await User.updateOne({ _id: author2Id }, { emailVerified: true });

    // Register Subscriber User
    const subRes = await makeRequest("/api/auth/register", "POST", {
      name: "Subscriber Reader",
      username: "subreader",
      email: "sub@phased-test.com",
      password: "Password123!",
    });
    const subCookie = getCookies(subRes.headers);
    const subId = subRes.body.data.user.id;
    await User.updateOne({ _id: subId }, { emailVerified: true, membershipStatus: "active" });

    // Register Non-Subscriber Reader
    const freeRes = await makeRequest("/api/auth/register", "POST", {
      name: "Free Reader",
      username: "freereader",
      email: "free@phased-test.com",
      password: "Password123!",
    });
    const freeCookie = getCookies(freeRes.headers);

    // --- Step 0 Verification: Read-Time Telemetry ---
    console.log("--- Step 0: Read-Time Telemetry & Capping ---");
    const testPost1 = await Post.create({
      title: "Phase D Unlocked Story",
      subtitle: "Intro to telemetry",
      slug: "phase-d-unlocked-story",
      contentHtml: "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>",
      author: author1Id,
      status: "published",
      publishedAt: new Date(),
    });

    const telemetryRes = await makeRequest("/api/telemetry/read-event", "POST", {
      postId: testPost1._id,
      activeSeconds: 120,
    }, subCookie);

    if (telemetryRes.status !== 201) {
      throw new Error(`Read telemetry recording failed: ${JSON.stringify(telemetryRes.body)}`);
    }
    const recordedEvent = await ReadEvent.findById(telemetryRes.body.data.eventId);
    if (!recordedEvent || recordedEvent.activeSeconds !== 120 || !recordedEvent.viewerWasMember) {
      throw new Error("ReadEvent model schema assertions failed!");
    }
    console.log("   ✅ Read-time telemetry recording & viewerWasMember snapshot verified.");

    // --- Step 1 Verification: Paywall Truncation & Entitlement ---
    console.log("\n--- Step 1: Paywall Truncation & Entitlement ---");
    const lockedPost = await Post.create({
      title: "Phase D Paywalled Story",
      subtitle: "Member only insights",
      slug: "phase-d-paywalled-story",
      contentHtml: "<p>Paragraph 1 content.</p><p>Paragraph 2 content.</p><p>Paragraph 3 content.</p><p>Paragraph 4 secret content.</p><p>Paragraph 5 extra secret.</p>",
      author: author1Id,
      status: "published",
      locked: true,
      previewParagraphCount: 3,
      publishedAt: new Date(),
    });

    // Free reader calls GET /api/posts/phase-d-paywalled-story -> truncated
    const freeView = await makeRequest(`/api/posts/${lockedPost.slug}`, "GET", null, freeCookie);
    if (freeView.status !== 200 || !freeView.body.data.post.previewOnly || !freeView.body.data.post.isLocked) {
      throw new Error("Paywall truncation check failed for non-member viewer!");
    }
    if (freeView.body.data.post.contentHtml.includes("Paragraph 4 secret content")) {
      throw new Error("Paywall truncation leak! Non-member received full content.");
    }
    console.log("   ✅ Non-member API view correctly receives truncated preview (3 paragraphs).");

    // Active subscriber calls GET /api/posts/phase-d-paywalled-story -> full content
    const subView = await makeRequest(`/api/posts/${lockedPost.slug}`, "GET", null, subCookie);
    if (subView.status !== 200 || subView.body.data.post.previewOnly || !subView.body.data.post.contentHtml.includes("Paragraph 4 secret content")) {
      throw new Error("Paywall entitlement failed for active subscriber!");
    }
    console.log("   ✅ Active subscriber receives full paywalled story content.");

    // Post Author calls GET /api/posts/phase-d-paywalled-story -> full content
    const authorView = await makeRequest(`/api/posts/${lockedPost.slug}`, "GET", null, author1Cookie);
    if (!authorView.body.data.post.contentHtml.includes("Paragraph 4 secret content")) {
      throw new Error("Paywall entitlement failed for post author!");
    }
    console.log("   ✅ Author receives full content for their own paywalled story.");

    // RSS Feed check across all 3 feed builders (global, author, tag)
    const lockedWithTag = await Post.create({
      title: "Phase D Tagged Paywalled Story",
      subtitle: "Tagged preview test",
      slug: "phase-d-tagged-paywalled-story",
      contentHtml: "<p>Para 1</p><p>Para 2</p><p>Para 3</p><p>Secret Para 4</p>",
      author: author1Id,
      status: "published",
      locked: true,
      tags: ["phasedtag"],
      publishedAt: new Date(),
    });

    const rssGlobal = await makeRequest("/api/feed/rss");
    const rssUser   = await makeRequest(`/api/feed/user/authorone/rss`);
    const rssTag    = await makeRequest(`/api/feed/tag/phasedtag/rss`);

    [rssGlobal, rssUser, rssTag].forEach((res, idx) => {
      if (res.status !== 200 || !res.rawBody.includes("subscriber-only")) {
        throw new Error(`RSS feed builder #${idx + 1} truncation check failed!`);
      }
      if (res.rawBody.includes("Secret Para 4")) {
        throw new Error(`RSS feed builder #${idx + 1} leaked paywalled content!`);
      }
    });
    console.log("   ✅ RSS feed truncation verified across all 3 feed builders (global, author, tag).");

    // Locked + Hidden Precedence Check
    const hiddenLockedPost = await Post.create({
      title: "Phase D Hidden Locked Story",
      slug: "phase-d-hidden-locked-story",
      contentHtml: "<p>Hidden locked content</p>",
      author: author1Id,
      status: "published",
      moderationStatus: "hidden",
      locked: true,
      publishedAt: new Date(),
    });

    const visibleCount = await Post.countDocuments({
      _id: hiddenLockedPost._id,
      ...Post.visibleQuery(),
    });
    if (visibleCount !== 0) {
      throw new Error("Precedence failure! Moderation-hidden locked post leaked into Post.visibleQuery()!");
    }
    console.log("   ✅ Precedence verified: locked + moderationStatus:hidden correctly excluded from feeds.");

    // --- Step 2 Verification: Razorpay Test-Mode Integration ---
    console.log("\n--- Step 2: Razorpay Test-Mode Integration & HMAC ---");

    // Subscribe endpoint
    const subInitRes = await makeRequest("/api/membership/subscribe", "POST", null, freeCookie);
    if (subInitRes.status !== 200 || !subInitRes.body.data.subscriptionId) {
      throw new Error(`Subscribe endpoint failed: ${JSON.stringify(subInitRes.body)}`);
    }
    const testSubId = subInitRes.body.data.subscriptionId;
    console.log("   ✅ Subscription session initialized (subscriptionId generated).");

    // Invalid HMAC signature verify call -> 400
    const invalidVerify = await makeRequest("/api/membership/verify", "POST", {
      razorpay_payment_id: "pay_test123",
      razorpay_subscription_id: testSubId,
      razorpay_signature: "bad_signature",
    }, freeCookie);
    if (invalidVerify.status !== 400) {
      throw new Error("HMAC signature verification failed to block invalid signature!");
    }
    console.log("   ✅ HMAC verification correctly rejected tampered signature (400).");

    // Valid HMAC signature verify call -> 200
    const testPaymentId = "pay_test123";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_key_secret_default";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_webhook_secret_default";

    const validSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${testPaymentId}|${testSubId}`)
      .digest("hex");

    const validVerify = await makeRequest("/api/membership/verify", "POST", {
      razorpay_payment_id: testPaymentId,
      razorpay_subscription_id: testSubId,
      razorpay_signature: validSignature,
    }, freeCookie);
    if (validVerify.status !== 200 || !validVerify.body.data.verified) {
      throw new Error("Valid HMAC verification failed!");
    }

    // EXPLICIT ASSERTION: /verify MUST NOT flip membershipStatus on its own
    const verifyUserCheck = await User.findOne({ email: "free@phased-test.com" });
    if (verifyUserCheck.membershipStatus !== "none") {
      throw new Error("Security violation! /api/membership/verify mutated membershipStatus before webhook arrival!");
    }
    console.log("   ✅ Verified: /api/membership/verify handshake DOES NOT mutate membershipStatus (remains 'none').");

    // Raw Webhook signature check & idempotency deduplication
    const webhookPayload = JSON.stringify({
      event: "subscription.charged",
      event_id: "evt_test_charge_100",
      subscription_id: testSubId,
      payment_id: "pay_test_invoice_100",
      email: "free@phased-test.com",
    });

    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const webhookRes1 = await makeRequest(
      "/api/webhooks/razorpay",
      "POST",
      webhookPayload,
      null,
      { "X-Razorpay-Signature": validWebhookSig }
    );
    if (webhookRes1.status !== 200 || !webhookRes1.body.data.processed) {
      throw new Error(`Webhook processing failed: ${JSON.stringify(webhookRes1.body)}`);
    }

    // Verify user membershipStatus updated to 'active' exclusively via webhook
    const updatedFreeUser = await User.findOne({ email: "free@phased-test.com" });
    if (updatedFreeUser.membershipStatus !== "active") {
      throw new Error("Webhook processing failed to update user membershipStatus to 'active'!");
    }
    console.log("   ✅ Razorpay webhook processed: user membershipStatus flipped to 'active'.");

    // Direct User Subscription Cancel Endpoint call
    const cancelRes = await makeRequest("/api/membership/cancel", "POST", null, freeCookie);
    if (cancelRes.status !== 200 || !cancelRes.body.data.user) {
      throw new Error(`Direct /api/membership/cancel endpoint call failed: ${JSON.stringify(cancelRes.body)}`);
    }
    const canceledUser = await User.findOne({ email: "free@phased-test.com" });
    if (canceledUser.membershipStatus !== "canceled") {
      throw new Error("Cancel endpoint failed to set user membershipStatus to 'canceled'!");
    }
    console.log("   ✅ Direct user cancellation endpoint (/api/membership/cancel) set status to 'canceled'.");

    // Idempotency check: replay same webhook event ID
    const webhookRes2 = await makeRequest(
      "/api/webhooks/razorpay",
      "POST",
      webhookPayload,
      null,
      { "X-Razorpay-Signature": validWebhookSig }
    );
    if (webhookRes2.status !== 200 || !webhookRes2.body.data.duplicate) {
      throw new Error("Webhook idempotency deduplication failed on replayed event!");
    }
    const paymentCount = await MembershipPayment.countDocuments({ razorpayPaymentId: "pay_test_invoice_100" });
    if (paymentCount !== 1) {
      throw new Error(`Idempotency failure! Found ${paymentCount} MembershipPayment records for single event.`);
    }
    console.log("   ✅ Idempotency deduplication verified: duplicate webhook payload correctly handled.");

    // --- Step 3 Verification: Writer Payout Ledger Calculation ---
    console.log("\n--- Step 3: Engagement-Weighted Payout Ledger Arithmetic ---");
    await ReadEvent.deleteMany({}); // Clear prior telemetry events for clean ratio test

    const testPost2 = await Post.create({
      title: "Phase D Author Two Story",
      slug: "phase-d-author-two-story",
      contentHtml: "<p>Author two story content</p>",
      author: author2Id,
      status: "published",
      publishedAt: new Date(),
    });

    const now = new Date();
    const periodStart = new Date(now.getTime() - 86400000);
    const periodEnd = new Date(now.getTime() + 86400000);

    // Seed 70s read time for Author 1, 30s read time for Author 2 by subscriber
    await ReadEvent.create({
      post: testPost1._id,
      viewer: subId,
      viewerWasMember: true,
      activeSeconds: 70,
      createdAt: now,
    });

    await ReadEvent.create({
      post: testPost2._id,
      viewer: subId,
      viewerWasMember: true,
      activeSeconds: 30,
      createdAt: now,
    });

    // EXPLICIT ASSERTION: Author self-reads and short-reads (<10s) must be excluded from payout math
    await ReadEvent.create({
      post: testPost1._id,
      viewer: author1Id, // Author reading own post -> MUST BE EXCLUDED
      viewerWasMember: true,
      activeSeconds: 300,
      createdAt: now,
    });

    await ReadEvent.create({
      post: testPost1._id,
      viewer: subId,
      viewerWasMember: true,
      activeSeconds: 5, // Short read (<10s) -> MUST BE EXCLUDED
      createdAt: now,
    });

    // Run computeLedgerForPeriod
    const ledgerEntries = await computeLedgerForPeriod(periodStart, periodEnd);
    if (ledgerEntries.length < 2) {
      throw new Error(`Ledger computation returned ${ledgerEntries.length} entries, expected at least 2.`);
    }

    const a1Entry = ledgerEntries.find((e) => String(e.writer) === String(author1Id));
    const a2Entry = ledgerEntries.find((e) => String(e.writer) === String(author2Id));

    if (!a1Entry || !a2Entry) {
      throw new Error("Ledger entries missing for authors!");
    }

    const a1Ratio = a1Entry.eligibleActiveSeconds / a1Entry.platformActiveSeconds;
    const a2Ratio = a2Entry.eligibleActiveSeconds / a2Entry.platformActiveSeconds;

    if (Math.abs(a1Ratio - 0.7) > 0.01 || Math.abs(a2Ratio - 0.3) > 0.01) {
      throw new Error(`Ledger engagement-weighted math mismatch! Ratios: A1=${a1Ratio}, A2=${a2Ratio}`);
    }
    console.log("   ✅ Engagement-weighted payout ledger produced exact expected 70%/30% ratio split.");

    // Call GET /api/writer/payout-ledger
    const writerLedgerRes = await makeRequest("/api/writer/payout-ledger", "GET", null, author1Cookie);
    if (writerLedgerRes.status !== 200 || writerLedgerRes.body.data.entries.length === 0) {
      throw new Error("GET /api/writer/payout-ledger endpoint failed!");
    }
    console.log("   ✅ Writer payout ledger endpoint returned historical calculation entries.");

    // --- Step 4 Verification: Complete 14-Step Cascade Integration ---
    console.log("\n--- Step 4: Comprehensive 14-Step Account Deletion Cascade ---");

    // 1. Create Cascade Test User (active subscriber)
    const cascadeReg = await makeRequest("/api/auth/register", "POST", {
      name: "Cascade Owner User",
      username: "cascadeuser",
      email: "cascade@phased-test.com",
      password: "Password123!",
    });
    const cascadeCookie = getCookies(cascadeReg.headers);
    const cascadeUserId = cascadeReg.body.data.user.id;
    await User.updateOne(
      { _id: cascadeUserId },
      { emailVerified: true, membershipStatus: "active", razorpaySubscriptionId: "sub_cascade_test_99" }
    );

    // 2. Create Authored Post & PostRevision
    const cascadeSlug = `cascade-authored-story-${Date.now()}`;
    const cascadePost = await Post.create({
      title: "Cascade Authored Story",
      slug: cascadeSlug,
      contentHtml: "<p>Cascade authored content</p>",
      author: cascadeUserId,
      status: "published",
      publishedAt: new Date(),
    });
    const cascadeRevision = await PostRevision.create({
      post: cascadePost._id,
      editedBy: cascadeUserId,
      title: "Cascade Authored Story (Rev 1)",
      contentHtml: "<p>Original draft content</p>",
    });

    // 3. Reports: Submitted by cascadeUser & Targeting cascadeUser content
    const submittedReport = await Report.create({
      reporter: cascadeUserId,
      targetType: "post",
      targetId: testPost1._id,
      reason: "spam",
    });
    const targetedReport = await Report.create({
      reporter: author1Id,
      targetType: "post",
      targetId: cascadePost._id,
      reason: "harassment",
    });

    // 4. Comments on cascadePost by another user
    const commentOnCascadePost = await Comment.create({
      post: cascadePost._id,
      author: author1Id,
      content: "Comment on cascade post",
    });

    // 5. cascadeUser's comments on other people's posts (one with reply -> soft, one without -> hard)
    const commentWithReply = await Comment.create({
      post: testPost1._id,
      author: cascadeUserId,
      content: "Comment to be soft deleted",
    });
    const childReply = await Comment.create({
      post: testPost1._id,
      author: author1Id,
      parentComment: commentWithReply._id,
      content: "Reply to cascade comment",
    });
    const commentNoReply = await Comment.create({
      post: testPost1._id,
      author: cascadeUserId,
      content: "Comment to be hard deleted",
    });

    // 6. Bookmarks: author1 bookmarks cascadePost
    await User.updateOne({ _id: author1Id }, { $push: { bookmarks: cascadePost._id } });

    // 7. Follows: two-way follow graph
    await Follow.create({ follower: cascadeUserId, followee: author1Id });
    await Follow.create({ follower: author1Id, followee: cascadeUserId });
    await User.updateOne({ _id: cascadeUserId }, { $push: { following: author1Id, followers: author1Id } });
    await User.updateOne({ _id: author1Id }, { $push: { following: cascadeUserId, followers: cascadeUserId } });

    // 8. Claps: cascadeUser claps on testPost1
    testPost1.claps.push({ user: cascadeUserId, count: 50 });
    testPost1.totalClaps += 50;
    await testPost1.save();

    // 9. Reading List: owned by cascadeUser
    const Publication = require("../models/Publication");
    const PublicationMember = require("../models/PublicationMember");
    const ReadingList = require("../models/ReadingList");

    const cascadeList = await ReadingList.create({
      owner: cascadeUserId,
      name: "Cascade Reading List",
      slug: "cascade-reading-list",
    });

    // 10. Publication Ownership & Member Transfer
    const cascadePubSlug = `cascade-pub-${Date.now()}`;
    const cascadePub = await Publication.create({
      name: "Cascade Publication",
      slug: cascadePubSlug,
      owner: cascadeUserId,
    });
    await PublicationMember.create({
      publication: cascadePub._id,
      user: cascadeUserId,
      role: "owner",
      invitedBy: cascadeUserId,
      joinedAt: new Date(now.getTime() - 86400000),
    });
    await PublicationMember.create({
      publication: cascadePub._id,
      user: author1Id,
      role: "writer",
      invitedBy: cascadeUserId,
      joinedAt: now,
    });

    // 11. Viewer Telemetry & Authored Telemetry
    const viewerReadEvent = await ReadEvent.create({
      post: testPost1._id,
      viewer: cascadeUserId,
      viewerWasMember: true,
      activeSeconds: 150,
    });
    const authoredReadEvent = await ReadEvent.create({
      post: cascadePost._id,
      viewer: author1Id,
      viewerWasMember: true,
      activeSeconds: 250,
    });

    // 12. Membership Payment Audit Record
    const cascadePayment = await MembershipPayment.create({
      user: cascadeUserId,
      amountCents: 49900,
      razorpayPaymentId: "pay_cascade_audit_999",
      periodStart: now,
      periodEnd: now,
    });

    // Execute 14-step Account Deletion Cascade via API
    const delToken = jwt.sign({ sub: cascadeUserId, purpose: "delete" }, env.jwtAccessSecret, { expiresIn: "30m" });
    const delRes = await makeRequest("/api/users/me", "DELETE", { token: delToken, mode: "erase" }, cascadeCookie);

    if (delRes.status !== 200) {
      throw new Error(`Cascade execution failed: ${JSON.stringify(delRes.body)}`);
    }

    // --- EMPIRICAL ASSERTIONS FOR ALL 14 STEPS ---
    // 1. PostRevisions deleted for authored post
    const remainingRevisions = await PostRevision.countDocuments({ post: cascadePost._id });
    if (remainingRevisions !== 0) throw new Error("Step 1 Failure: PostRevision was not deleted!");

    // 2. Submitted reports deleted
    const remSubReports = await Report.countDocuments({ _id: submittedReport._id });
    if (remSubReports !== 0) throw new Error("Step 2 Failure: Submitted report was not deleted!");

    // 3. Targeted reports deleted
    const remTargReports = await Report.countDocuments({ _id: targetedReport._id });
    if (remTargReports !== 0) throw new Error("Step 3 Failure: Targeted report was not deleted!");

    // 4. Comments on authored post deleted
    const remPostComments = await Comment.countDocuments({ post: cascadePost._id });
    if (remPostComments !== 0) throw new Error("Step 4 Failure: Comments on authored post were not deleted!");

    // 5. Comments on other posts: soft vs hard delete check
    const softDeletedComment = await Comment.findById(commentWithReply._id);
    if (!softDeletedComment || softDeletedComment.content !== "[deleted]" || !softDeletedComment.deletedButHasReplies) {
      throw new Error("Step 5 Failure: Comment with replies was not soft-deleted!");
    }
    const hardDeletedComment = await Comment.findById(commentNoReply._id);
    if (hardDeletedComment) throw new Error("Step 5 Failure: Comment without replies was not hard-deleted!");

    // 6. Authored Post deleted
    const remPost = await Post.findById(cascadePost._id);
    if (remPost) throw new Error("Step 6 Failure: Authored post was not deleted!");

    // 7. Bookmarks pulled
    const author1Doc = await User.findById(author1Id);
    if (author1Doc.bookmarks.some((b) => String(b) === String(cascadePost._id))) {
      throw new Error("Step 7 Failure: Bookmarks were not pulled!");
    }

    // 8. Follows deleted both directions
    const remFollows = await Follow.countDocuments({ $or: [{ follower: cascadeUserId }, { followee: cascadeUserId }] });
    if (remFollows !== 0) throw new Error("Step 8 Failure: Follow edges were not deleted!");

    // 9. Claps pulled and totalClaps recomputed
    const testPost1Doc = await Post.findById(testPost1._id);
    if (testPost1Doc.claps.some((c) => String(c.user) === String(cascadeUserId))) {
      throw new Error("Step 9 Failure: Claps were not pulled!");
    }

    // 10. Reading list deleted
    const remList = await ReadingList.findById(cascadeList._id);
    if (remList) throw new Error("Step 10 Failure: Reading list was not deleted!");

    // 11. Publication ownership transferred to senior member
    const updatedPub = await Publication.findById(cascadePub._id);
    if (String(updatedPub.owner) !== String(author1Id)) {
      throw new Error("Step 11 Failure: Publication ownership was not transferred to senior member!");
    }
    const remPubMember = await PublicationMember.countDocuments({ user: cascadeUserId });
    if (remPubMember !== 0) throw new Error("Step 11 Failure: PublicationMember was not deleted!");

    // 12. Viewer ReadEvents deleted
    const remViewerEvents = await ReadEvent.countDocuments({ viewer: cascadeUserId });
    if (remViewerEvents !== 0) throw new Error("Step 12 Failure: Viewer ReadEvents were not deleted!");

    // 13. Authored ReadEvents & Financial Audit records preserved
    const preservedAuthoredEvents = await ReadEvent.countDocuments({ post: cascadePost._id });
    if (preservedAuthoredEvents === 0) throw new Error("Step 13 Failure: Authored ReadEvents were not preserved!");
    const preservedPaymentDoc = await MembershipPayment.findById(cascadePayment._id);
    if (!preservedPaymentDoc) throw new Error("Step 13 Failure: MembershipPayment audit record was not preserved!");

    // 14. User deleted
    const delUserDoc = await User.findById(cascadeUserId);
    if (delUserDoc) throw new Error("Step 14 Failure: User document was not deleted!");

    console.log("   ✅ 14-Step Cascade single-pass verification complete: all 14 steps empirically verified!");
    console.log("\n🎉 ALL PHASE D INTEGRATION TESTS PASSED CLEANLY!");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed with error:", err);
  process.exit(1);
});
