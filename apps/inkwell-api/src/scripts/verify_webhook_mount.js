"use strict";

const mongoose = require("mongoose");
const http = require("http");
const crypto = require("crypto");

const app = require("../app");
const env = require("../config/env");
const User = require("@vami/identity-service").User;
const WebhookEvent = require("../models/WebhookEvent");
const MembershipPayment = require("../models/MembershipPayment");

async function run() {
  console.log("=== Verification: Mounted Razorpay Webhook Endpoint over HTTP ===");

  await mongoose.connect(env.mongoUri);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`Server listening on http://127.0.0.1:${port}`);

  const testEmail = "webhook_mount_test@inkwell.org";
  const testSubId = "sub_webhook_mount_99";
  const testPaymentId = "pay_webhook_mount_100";
  const testEventId = "evt_webhook_mount_100";

  // Ensure clean test state
  await User.deleteMany({ email: testEmail });
  await WebhookEvent.deleteMany({ eventId: testEventId });
  await MembershipPayment.deleteMany({ razorpayPaymentId: testPaymentId });

  const testUser = await User.create({
    username: "webhookuser",
    email: testEmail,
    passwordHash: "$2a$10$abcdefghijklmnopqrstuuu",
    emailVerified: true,
    membershipStatus: "inactive",
    razorpaySubscriptionId: testSubId,
  });

  const rawPayload = JSON.stringify({
    event: "subscription.charged",
    event_id: testEventId,
    subscription_id: testSubId,
    payment_id: testPaymentId,
    email: testEmail,
  });

  const hmacSig = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawPayload)
    .digest("hex");

  function sendHttpRequest(path, payload, signature) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${port}${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "X-Razorpay-Signature": signature,
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          });
        }
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  }

  // 1. Initial Webhook HTTP Call
  console.log("Sending initial POST /api/webhooks/razorpay request over HTTP...");
  const res1 = await sendHttpRequest("/api/webhooks/razorpay", rawPayload, hmacSig);
  console.log(`HTTP Status: ${res1.statusCode}`, res1.body);

  if (res1.statusCode !== 200 || !res1.body.data || !res1.body.data.processed) {
    throw new Error(`Webhook request failed: ${JSON.stringify(res1.body)}`);
  }

  const updatedUser = await User.findById(testUser._id);
  if (updatedUser.membershipStatus !== "active") {
    throw new Error(`Expected membershipStatus to be 'active', got '${updatedUser.membershipStatus}'`);
  }
  console.log("✅ User membershipStatus correctly flipped to 'active'.");

  const dbEvent = await WebhookEvent.findOne({ eventId: testEventId });
  if (!dbEvent || dbEvent.status !== "processed") {
    throw new Error(`Expected WebhookEvent to be stored with status 'processed'`);
  }
  console.log("✅ WebhookEvent record stored in DB with status 'processed'.");

  // 2. Replay Same Webhook Event for Idempotency
  console.log("\nReplaying identical webhook payload to test idempotency dedup...");
  const res2 = await sendHttpRequest("/api/webhooks/razorpay", rawPayload, hmacSig);
  console.log(`HTTP Status: ${res2.statusCode}`, res2.body);

  if (res2.statusCode !== 200 || !res2.body.data || !res2.body.data.duplicate) {
    throw new Error(`Idempotency check failed: ${JSON.stringify(res2.body)}`);
  }

  const paymentCount = await MembershipPayment.countDocuments({ razorpayPaymentId: testPaymentId });
  if (paymentCount !== 1) {
    throw new Error(`Expected 1 MembershipPayment record, found ${paymentCount}`);
  }
  console.log("✅ Idempotency verified: replayed payload detected duplicate and avoided double processing.");

  // Cleanup
  await User.deleteMany({ email: testEmail });
  await WebhookEvent.deleteMany({ eventId: testEventId });
  await MembershipPayment.deleteMany({ razorpayPaymentId: testPaymentId });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();

  console.log("\n🎉 ALL WEBHOOK MOUNT & IDEMPOTENCY VERIFICATION CHECKS PASSED!");
}

run().catch((err) => {
  console.error("❌ Verification error:", err);
  process.exit(1);
});
