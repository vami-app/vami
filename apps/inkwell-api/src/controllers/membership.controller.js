const crypto = require("crypto");
const User = require("../models/User");
const MembershipPayment = require("../models/MembershipPayment");
const WebhookEvent = require("../models/WebhookEvent");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const env = require("../config/env");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_key_id_default";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_test_key_secret_default";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_webhook_secret_default";
const RAZORPAY_PLAN_ID = process.env.RAZORPAY_PLAN_ID || "plan_test_inkwell_499";

/**
 * Initiate Razorpay Test-Mode Subscription
 * POST /api/membership/subscribe
 */
const subscribe = asyncHandler(async (req, res) => {
  const user = req.user;

  // Create mock/test Razorpay customer & subscription IDs
  const mockCustId = user.razorpayCustomerId || `cust_${crypto.randomBytes(8).toString("hex")}`;
  const mockSubId = `sub_${crypto.randomBytes(8).toString("hex")}`;

  user.razorpayCustomerId = mockCustId;
  user.razorpaySubscriptionId = mockSubId;
  await user.save();

  return sendSuccess(
    res,
    200,
    {
      subscriptionId: mockSubId,
      keyId: RAZORPAY_KEY_ID,
      planId: RAZORPAY_PLAN_ID,
      amountCents: 49900, // ₹499.00
      currency: "INR",
    },
    "Subscription session initialized"
  );
});

/**
 * Verify client payment HMAC signature and activate membership
 * POST /api/membership/verify
 *
 * This is the authoritative initial-checkout activation path.
 * Subsequent renewals, failures, and cancellations are handled by
 * the Razorpay webhook handler (handleWebhook).
 */
const verify = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    throw new ApiError(400, "Missing required Razorpay verification payload");
  }

  // Generate expected HMAC signature: razorpay_payment_id|razorpay_subscription_id
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid Razorpay payment signature");
  }

  // Signature valid — activate membership for the authenticated user
  const user = req.user;

  // Ensure the subscription ID on the user matches what was verified
  if (user.razorpaySubscriptionId !== razorpay_subscription_id) {
    throw new ApiError(400, "Subscription ID mismatch — possible replay attempt");
  }

  user.membershipStatus = "active";
  user.razorpaySubscriptionId = razorpay_subscription_id;
  await user.save();

  // Record payment (idempotent — skip if already exists)
  const existingPayment = await MembershipPayment.findOne({ razorpayPaymentId: razorpay_payment_id });
  if (!existingPayment) {
    const now = new Date();
    await MembershipPayment.create({
      user: user._id,
      amountCents: 49900,
      razorpayPaymentId: razorpay_payment_id,
      periodStart: now,
      periodEnd: new Date(now.getTime() + 30 * 86400000),
    });
  }

  return sendSuccess(
    res,
    200,
    {
      verified: true,
      membershipStatus: "active",
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
    },
    "Payment verified and membership activated"
  );
});

/**
 * Cancel active Razorpay test subscription
 * POST /api/membership/cancel
 */
const cancel = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.membershipStatus !== "active") {
    throw new ApiError(400, "User has no active subscription to cancel");
  }

  user.membershipStatus = "canceled";
  await user.save();

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Subscription canceled successfully");
});

/**
 * Razorpay Raw Webhook Endpoint
 * POST /api/webhooks/razorpay
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!signature) {
    throw new ApiError(400, "Missing X-Razorpay-Signature header");
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid webhook signature");
  }

  const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const eventId = payload.event_id || payload.id || `evt_${crypto.randomBytes(8).toString("hex")}`;
  const eventType = payload.event;

  // Idempotency deduplication check
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return sendSuccess(res, 200, { duplicate: true }, "Webhook event already processed");
  }

  await WebhookEvent.create({ eventId, eventType });

  // Handle subscription and payment lifecycle events
  if (eventType === "subscription.activated") {
    const subId = payload.payload?.subscription?.entity?.id || payload.subscription_id;
    const userEmail = payload.payload?.subscription?.entity?.notes?.email || payload.email;

    let user = null;
    if (subId) user = await User.findOne({ razorpaySubscriptionId: subId });
    if (!user && userEmail) user = await User.findOne({ email: userEmail });

    if (user) {
      user.membershipStatus = "active";
      await user.save();
    }
  } else if (
    eventType === "subscription.charged" ||
    eventType === "payment.captured" ||
    eventType === "order.paid" ||
    eventType === "invoice.paid"
  ) {
    const subId = payload.payload?.subscription?.entity?.id || payload.subscription_id;
    const paymentId =
      payload.payload?.payment?.entity?.id ||
      payload.payment_id ||
      payload.payload?.order?.entity?.id ||
      `pay_${crypto.randomBytes(8).toString("hex")}`;
    const userEmail =
      payload.payload?.payment?.entity?.email ||
      payload.payload?.subscription?.entity?.notes?.email ||
      payload.email;

    let user = null;
    if (subId) user = await User.findOne({ razorpaySubscriptionId: subId });
    if (!user && userEmail) user = await User.findOne({ email: userEmail });

    if (user) {
      user.membershipStatus = "active";
      await user.save();

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 86400000); // 30 days window

      const existingPayment = await MembershipPayment.findOne({ razorpayPaymentId: paymentId });
      if (!existingPayment) {
        await MembershipPayment.create({
          user: user._id,
          amountCents: payload.payload?.payment?.entity?.amount || 49900,
          razorpayPaymentId: paymentId,
          periodStart: now,
          periodEnd,
        });
      }
    }
  } else if (eventType === "subscription.pending") {
    const subId = payload.payload?.subscription?.entity?.id || payload.subscription_id;
    if (subId) {
      await User.updateOne({ razorpaySubscriptionId: subId }, { membershipStatus: "past_due" });
    }
  } else if (eventType === "subscription.cancelled" || eventType === "subscription.completed") {
    const subId = payload.payload?.subscription?.entity?.id || payload.subscription_id;
    if (subId) {
      await User.updateOne({ razorpaySubscriptionId: subId }, { membershipStatus: "canceled" });
    }
  }

  return sendSuccess(res, 200, { processed: true }, "Webhook handled successfully");
});

/**
 * Test-mode only: generate a valid HMAC signature server-side
 * so the client never needs to know RAZORPAY_KEY_SECRET.
 * POST /api/membership/test-sign
 *
 * Blocked in production — only works when NODE_ENV !== "production".
 */
const testSign = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(403, "Not available in production");
  }

  const { paymentId, subscriptionId } = req.body;
  if (!paymentId || !subscriptionId) {
    throw new ApiError(400, "paymentId and subscriptionId are required");
  }

  const signature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  return sendSuccess(res, 200, { signature }, "Test HMAC signature generated");
});

module.exports = {
  subscribe,
  verify,
  cancel,
  handleWebhook,
  testSign,
};
