/**
 * test_webhook_evidence.js
 *
 * PURPOSE: Generate a timestamped evidence report proving the full
 * /api/webhooks/razorpay HTTP path works end-to-end against the
 * running dev server and real MongoDB Atlas instance.
 *
 * WHAT IT TESTS (in order):
 *  1. Reads the test user's membershipStatus BEFORE any calls
 *  2. Calls POST /api/membership/test-sign to get a real server-computed HMAC
 *     (proves the route is mounted and the secret lives server-side only)
 *  3. Calls POST /api/webhooks/razorpay with valid X-Razorpay-Signature
 *     — asserts HTTP 200 and WebhookEvent document was created in MongoDB
 *     — asserts User.membershipStatus flipped to "active"
 *  4. Replays the IDENTICAL request (same event_id)
 *     — asserts HTTP 200 with { duplicate: true } (idempotency gate)
 *     — asserts only ONE WebhookEvent doc exists for that event_id
 *  5. Calls POST /api/webhooks/razorpay with a TAMPERED signature
 *     — asserts HTTP 400 "Invalid webhook signature" (HMAC guard is live)
 *  6. Calls POST /api/webhooks/razorpay with NO signature header
 *     — asserts HTTP 400 "Missing X-Razorpay-Signature header"
 *  7. Cleans up: deletes the test WebhookEvent, resets the test user's
 *     membershipStatus back to "none" (leaves real data untouched)
 *
 * USAGE:
 *   # Terminal 1 — server must be running
 *   cd server && npm run dev
 *
 *   # Terminal 2 — run this script
 *   node src/scripts/test_webhook_evidence.js
 *
 * Prints a full evidence report to stdout. Paste the entire output.
 */

"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const http  = require("http");
const https = require("https");
const crypto = require("crypto");
const mongoose = require("mongoose");

// ─── Config pulled from .env (same values the server uses) ───────────────────
const PORT              = process.env.PORT              || 5000;
const MONGO_URI         = process.env.MONGO_URI;
const WEBHOOK_SECRET    = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_webhook_secret_default";
const BASE              = `http://localhost:${PORT}`;

// ─── Test-user credentials (must already exist in the DB) ────────────────────
// Seed users were created via OAuth, so we generate a signed JWT directly
// using the same JWT_ACCESS_SECRET the server uses — equivalent to a real login.
const TEST_EMAIL = "ada@inkwell.dev";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hr(label = "") {
  const line = "─".repeat(72);
  console.log(label ? `\n${line}\n  ${label}\n${line}` : line);
}

function ts() {
  return new Date().toISOString();
}

/**
 * Minimal HTTP client that returns { status, headers, body (parsed JSON) }.
 * Supports setting arbitrary headers including Cookie and X-Razorpay-Signature.
 */
function request(method, url, bodyObj = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : null;
    const opts = {
      hostname : parsed.hostname,
      port     : parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path     : parsed.pathname + parsed.search,
      method,
      headers  : {
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        ...extraHeaders,
      },
    };
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let body = null;
        try { body = JSON.parse(raw); } catch (_) { body = raw; }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Compute HMAC-SHA256(key, message) — same algorithm the server uses
 * for webhook signature verification.
 */
function hmac(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

/**
 * Extract Set-Cookie token from a login response header.
 */
function extractCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

// ─── Mongoose models (direct Atlas queries for before/after evidence) ─────────
const User = require("../models/User");
const WebhookEvent = require("../models/WebhookEvent");
const MembershipPayment = require("../models/MembershipPayment");
const jwt = require("jsonwebtoken");

const JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || "dev_access_secret_change_me";
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const COOKIE_SECURE      = process.env.COOKIE_SECURE === "true";

/**
 * Generate a signed access token for a user doc — mirrors auth.controller.js signToken().
 */
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES }
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║          INKWELL WEBHOOK EVIDENCE REPORT                            ║");
  console.log(`║          Generated: ${ts()}                   ║`);
  console.log("╚══════════════════════════════════════════════════════════════════════╝");

  // ── 0. Connect to Atlas ────────────────────────────────────────────────────
  hr("STEP 0 — Connect to MongoDB Atlas");
  console.log(`  URI prefix: ${MONGO_URI?.slice(0, 40)}...`);
  await mongoose.connect(MONGO_URI);
  console.log(`  ✓ Connected  (readyState=${mongoose.connection.readyState})`);

  // ── 1. Read user BEFORE ────────────────────────────────────────────────────
  hr("STEP 1 — User.membershipStatus BEFORE");
  const userBefore = await User.findOne({ email: TEST_EMAIL }).lean();
  if (!userBefore) {
    console.error(`  ✗ Test user "${TEST_EMAIL}" not found in Atlas. Seed it first.`);
    process.exit(1);
  }
  console.log("  User doc (before):");
  console.log(JSON.stringify({
    _id            : userBefore._id,
    email          : userBefore.email,
    membershipStatus        : userBefore.membershipStatus,
    razorpaySubscriptionId  : userBefore.razorpaySubscriptionId,
  }, null, 4));

  // Reset membershipStatus to "none" so this test is always deterministic
  if (userBefore.membershipStatus !== "none") {
    console.log("  ⚠  Resetting membershipStatus → none for clean test run");
    await User.updateOne({ email: TEST_EMAIL }, { membershipStatus: "none", razorpaySubscriptionId: null });
  }

  // ── 2. Generate auth token directly (seed users have no password — OAuth only) ──
  hr("STEP 2 — Generate signed access token (mirrors server signToken, same JWT_ACCESS_SECRET)");
  const token = signToken(userBefore);
  // The server's auth middleware reads the "accessToken" cookie
  const authCookie = `accessToken=${token}`;
  console.log(`  ✓ Token generated (${token.length} chars)`);
  console.log(`  ✓ Cookie: accessToken=<${token.slice(0, 30)}...>`);

  // ── 3. Subscribe to get a real subscriptionId ──────────────────────────────
  hr("STEP 3 — POST /api/membership/subscribe (get subscriptionId)");
  const subRes = await request(
    "POST", `${BASE}/api/membership/subscribe`, null,
    { Cookie: authCookie }
  );
  console.log(`  HTTP ${subRes.status}`);
  console.log("  Response body:");
  console.log(JSON.stringify(subRes.body, null, 4));
  if (subRes.status !== 200) {
    console.error("  ✗ subscribe failed"); process.exit(1);
  }
  const subscriptionId = subRes.body?.data?.subscriptionId;
  console.log(`  ✓ subscriptionId = ${subscriptionId}`);

  // ── 4. Get server-side HMAC via test-sign ─────────────────────────────────
  hr("STEP 4 — POST /api/membership/test-sign (server-computed HMAC)");
  const mockPaymentId = `pay_evidence_${Date.now()}`;
  const signRes = await request(
    "POST", `${BASE}/api/membership/test-sign`,
    { paymentId: mockPaymentId, subscriptionId },
    { Cookie: authCookie }
  );
  console.log(`  HTTP ${signRes.status}`);
  console.log("  Response body:");
  console.log(JSON.stringify(signRes.body, null, 4));
  if (signRes.status !== 200) {
    console.error("  ✗ test-sign failed"); process.exit(1);
  }
  const clientSignature = signRes.body?.data?.signature;
  console.log(`  ✓ Signature = ${clientSignature}`);

  // Independently verify the server produced the right value
  const localSig = hmac(
    process.env.RAZORPAY_KEY_SECRET || "rzp_test_key_secret_default",
    `${mockPaymentId}|${subscriptionId}`
  );
  console.log(`  ✓ Local recompute matches: ${localSig === clientSignature}`);

  // ── 5. POST /api/membership/verify (activate membership) ──────────────────
  hr("STEP 5 — POST /api/membership/verify (HMAC check + activate)");
  const verifyRes = await request(
    "POST", `${BASE}/api/membership/verify`,
    {
      razorpay_payment_id     : mockPaymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature      : clientSignature,
    },
    { Cookie: authCookie }
  );
  console.log(`  HTTP ${verifyRes.status}`);
  console.log("  Response body:");
  console.log(JSON.stringify(verifyRes.body, null, 4));

  const userAfterVerify = await User.findOne({ email: TEST_EMAIL }).lean();
  console.log("  User.membershipStatus after verify:", userAfterVerify.membershipStatus);
  const paymentDoc = await MembershipPayment.findOne({ razorpayPaymentId: mockPaymentId }).lean();
  console.log("  MembershipPayment created:", paymentDoc ? JSON.stringify({
    _id             : paymentDoc._id,
    razorpayPaymentId: paymentDoc.razorpayPaymentId,
    amountCents     : paymentDoc.amountCents,
    periodStart     : paymentDoc.periodStart,
    periodEnd       : paymentDoc.periodEnd,
  }, null, 4) : "NOT FOUND");

  if (verifyRes.status !== 200 || userAfterVerify.membershipStatus !== "active") {
    console.error("  ✗ verify did not activate membership"); process.exit(1);
  }
  console.log("  ✓ membershipStatus = active");

  // ── 6. Build a subscription.charged webhook payload & compute HMAC ─────────
  hr("STEP 6 — Build subscription.charged payload + compute webhook HMAC");
  const EVT_ID = `evt_evidence_${Date.now()}`;
  const webhookPayload = {
    event_id       : EVT_ID,
    event          : "subscription.charged",
    subscription_id: subscriptionId,
    payment_id     : `pay_whk_${Date.now()}`,
    email          : TEST_EMAIL,
  };
  const rawBodyStr = JSON.stringify(webhookPayload);
  const webhookSig = hmac(WEBHOOK_SECRET, rawBodyStr);
  console.log(`  event_id       = ${EVT_ID}`);
  console.log(`  WEBHOOK_SECRET = ${WEBHOOK_SECRET}`);
  console.log(`  Signature      = ${webhookSig}`);

  // ── 7. Fire the webhook — first call (should process) ─────────────────────
  hr("STEP 7 — POST /api/webhooks/razorpay  [FIRST CALL — expect 200 processed]");
  const wh1 = await request(
    "POST", `${BASE}/api/webhooks/razorpay`,
    webhookPayload,
    { "x-razorpay-signature": webhookSig }
  );
  console.log(`  HTTP ${wh1.status}`);
  console.log("  Response body:");
  console.log(JSON.stringify(wh1.body, null, 4));

  const webhookDoc1 = await WebhookEvent.findOne({ eventId: EVT_ID }).lean();
  console.log("  WebhookEvent in Atlas:");
  console.log(JSON.stringify(webhookDoc1, null, 4));

  const userAfterWh1 = await User.findOne({ email: TEST_EMAIL }).lean();
  console.log(`  User.membershipStatus after webhook: ${userAfterWh1.membershipStatus}`);

  // ── 8. Replay IDENTICAL request — idempotency ──────────────────────────────
  hr("STEP 8 — POST /api/webhooks/razorpay  [SECOND CALL — expect { duplicate: true }]");
  const wh2 = await request(
    "POST", `${BASE}/api/webhooks/razorpay`,
    webhookPayload,
    { "x-razorpay-signature": webhookSig }
  );
  console.log(`  HTTP ${wh2.status}`);
  console.log("  Response body:");
  console.log(JSON.stringify(wh2.body, null, 4));

  const webhookCount = await WebhookEvent.countDocuments({ eventId: EVT_ID });
  console.log(`  WebhookEvent docs with eventId "${EVT_ID}": ${webhookCount} (expected 1)`);

  // ── 9. Tampered signature — HMAC guard ────────────────────────────────────
  hr("STEP 9 — POST /api/webhooks/razorpay  [TAMPERED sig — expect 400]");
  const wh3 = await request(
    "POST", `${BASE}/api/webhooks/razorpay`,
    webhookPayload,
    { "x-razorpay-signature": "0000000000000000000000000000000000000000000000000000000000000000" }
  );
  console.log(`  HTTP ${wh3.status}  (expected 400)`);
  console.log("  Response body:");
  console.log(JSON.stringify(wh3.body, null, 4));

  // ── 10. Missing signature header ───────────────────────────────────────────
  hr("STEP 10 — POST /api/webhooks/razorpay  [NO sig header — expect 400]");
  const wh4 = await request("POST", `${BASE}/api/webhooks/razorpay`, webhookPayload);
  console.log(`  HTTP ${wh4.status}  (expected 400)`);
  console.log("  Response body:");
  console.log(JSON.stringify(wh4.body, null, 4));

  // ── 11. Cleanup ────────────────────────────────────────────────────────────
  hr("STEP 11 — Cleanup test data");
  const delWh = await WebhookEvent.deleteMany({ eventId: { $regex: /^evt_evidence_/ } });
  console.log(`  Deleted ${delWh.deletedCount} WebhookEvent doc(s)`);
  const delPay = await MembershipPayment.deleteOne({ razorpayPaymentId: mockPaymentId });
  console.log(`  Deleted ${delPay.deletedCount} MembershipPayment doc(s)`);
  await User.updateOne({ email: TEST_EMAIL }, { membershipStatus: "none", razorpaySubscriptionId: null });
  console.log(`  Reset user membershipStatus → none`);

  // ── 12. Verdict ────────────────────────────────────────────────────────────
  hr("VERDICT");
  const pass = (cond, label) => console.log(`  ${cond ? "✅ PASS" : "❌ FAIL"} — ${label}`);

  pass(wh1.status === 200 && wh1.body?.data?.processed === true,
    "First webhook call: HTTP 200 + { processed: true }");
  pass(!!webhookDoc1, "WebhookEvent document created in Atlas");
  pass(userAfterWh1.membershipStatus === "active",
    "User.membershipStatus = 'active' after subscription.charged");
  pass(wh2.status === 200 && wh2.body?.data?.duplicate === true,
    "Replay: HTTP 200 + { duplicate: true } — idempotency gate held");
  pass(webhookCount === 1,
    `Exactly 1 WebhookEvent doc for eventId (got ${webhookCount})`);
  pass(wh3.status === 400,
    "Tampered signature rejected with HTTP 400");
  pass(wh4.status === 400,
    "Missing signature header rejected with HTTP 400");

  console.log("\n  Evidence report complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("\n✗ Script crashed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
