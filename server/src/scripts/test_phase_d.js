"use strict";

const mongoose = require("mongoose");
const http = require("http");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = require("../app");
const env = require("../config/env");
const User = require("../models/User");
const Post = require("../models/Post");
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
    const validSignature = crypto
      .createHmac("sha256", "rzp_test_key_secret_default")
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
      .createHmac("sha256", "rzp_test_webhook_secret_default")
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

    // --- Step 4 Verification: 14-Step Cascade Update ---
    console.log("\n--- Step 4: 14-Step Account Deletion Cascade Update ---");
    
    // Delete subscriber user (freeUser now active)
    const delSubId = updatedFreeUser._id;
    const delToken = jwt.sign({ sub: delSubId, purpose: "delete" }, env.jwtAccessSecret, { expiresIn: "30m" });

    const delRes = await makeRequest("/api/users/me", "DELETE", { token: delToken, mode: "erase" }, freeCookie);
    if (delRes.status !== 200) {
      throw new Error(`Account deletion failed: ${JSON.stringify(delRes.body)}`);
    }

    // Verify viewer ReadEvents deleted
    const remainingViewerEvents = await ReadEvent.countDocuments({ viewer: delSubId });
    if (remainingViewerEvents !== 0) {
      throw new Error(`Cascade deletion failed! Found ${remainingViewerEvents} viewer ReadEvents for deleted user.`);
    }

    // Verify historical MembershipPayment records preserved
    const preservedPayments = await MembershipPayment.countDocuments({ user: delSubId });
    if (preservedPayments === 0) {
      throw new Error("Cascade failure! Financial MembershipPayment records were deleted instead of preserved.");
    }
    console.log("   ✅ 14-Step Cascade verified: viewer ReadEvents deleted, financial MembershipPayment audit records preserved.");

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
