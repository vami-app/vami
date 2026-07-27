"use strict";

const User = require("../../src/models/User");
const MembershipPayment = require("../../src/models/MembershipPayment");
const PayoutLedgerEntry = require("../../src/models/PayoutLedgerEntry");
const WebhookEvent = require("../../src/models/WebhookEvent");
const ReadEvent = require("../../src/models/ReadEvent");
const { membershipRepository, membershipService } = require("../../src/modules/membership/membership.module");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");

describe("Membership Module Extraction & Bridge Shims (/src/modules/membership)", () => {
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    testUser = await User.create({
      name: "Membership Module User",
      username: "memmoduser",
      email: "memmod@test.com",
      password: "Password123!",
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Scenario 1: Model bridge shims export models correctly
  it("Scenario 1: Model bridge shims in /src/models/ re-export membership models cleanly", () => {
    expect(MembershipPayment.modelName).toBe("MembershipPayment");
    expect(PayoutLedgerEntry.modelName).toBe("PayoutLedgerEntry");
    expect(WebhookEvent.modelName).toBe("WebhookEvent");
    expect(ReadEvent.modelName).toBe("ReadEvent");
  });

  // Scenario 2: MongoMembershipRepository creates & queries Payment & Ledger entries
  it("Scenario 2: MongoMembershipRepository creates and queries payment and ledger records", async () => {
    const payment = await membershipRepository.createPayment({
      user: testUser._id,
      amountCents: 49900,
      razorpayPaymentId: "pay_test_memmod_123",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
    });

    expect(payment._id).toBeDefined();
    expect(payment.razorpayPaymentId).toBe("pay_test_memmod_123");

    const foundPayments = await membershipRepository.findPaymentsByUser(testUser._id);
    expect(foundPayments.length).toBe(1);

    const ledger = await membershipRepository.createLedgerEntry({
      writer: testUser._id,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      eligibleActiveSeconds: 3600,
      platformActiveSeconds: 10000,
      poolCents: 50000,
      payoutCents: 18000,
    });

    expect(ledger._id).toBeDefined();
    const writerEntries = await membershipRepository.findLedgerEntriesByWriter(testUser._id);
    expect(writerEntries.length).toBe(1);
    expect(writerEntries[0].payoutCents).toBe(18000);
  });

  // Scenario 3: Webhook Idempotency Contract
  it("Scenario 3: MongoMembershipRepository enforces webhook event idempotency contract", async () => {
    const eventId = "evt_test_idempotent_999";
    const processedBefore = await membershipRepository.isWebhookProcessed(eventId);
    expect(processedBefore).toBe(false);

    await membershipRepository.recordWebhookEvent(eventId, "subscription.charged");

    const processedAfter = await membershipRepository.isWebhookProcessed(eventId);
    expect(processedAfter).toBe(true);
  });
});
