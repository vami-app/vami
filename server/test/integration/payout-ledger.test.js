"use strict";

const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const ReadEvent = require("../../src/models/ReadEvent");
const MembershipPayment = require("../../src/models/MembershipPayment");
const PayoutLedgerEntry = require("../../src/models/PayoutLedgerEntry");
const { computeLedgerForPeriod } = require("../../src/controllers/ledger.controller");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");

describe("Payout Ledger Engine (computeLedgerForPeriod)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("distributes payout pool according to active read time ratios (e.g. 70/30 split)", async () => {
    const periodStart = new Date("2026-01-01T00:00:00.000Z");
    const periodEnd = new Date("2026-01-31T23:59:59.999Z");
    const midMonth = new Date("2026-01-15T12:00:00.000Z");

    const writerA = await User.create({
      name: "Writer A",
      username: "writera",
      email: "a@writer.test",
      password: "Password123!",
    });
    const writerB = await User.create({
      name: "Writer B",
      username: "writerb",
      email: "b@writer.test",
      password: "Password123!",
    });
    const subscriber = await User.create({
      name: "Subscriber",
      username: "subreader",
      email: "sub@reader.test",
      password: "Password123!",
      membershipStatus: "active",
    });

    const postA = await Post.create({
      title: "Story A",
      slug: "story-a",
      contentHtml: "<p>A</p>",
      author: writerA._id,
      status: "published",
    });

    const postB = await Post.create({
      title: "Story B",
      slug: "story-b",
      contentHtml: "<p>B</p>",
      author: writerB._id,
      status: "published",
    });

    // Seed $100.00 pool (10,000 cents)
    await MembershipPayment.create({
      user: subscriber._id,
      razorpayPaymentId: "pay_test_100",
      razorpaySubscriptionId: "sub_test_100",
      amountCents: 10000,
      currency: "INR",
      status: "captured",
      periodStart,
      periodEnd,
    });

    // 700 seconds for Writer A, 300 seconds for Writer B
    await ReadEvent.create({
      post: postA._id,
      viewer: subscriber._id,
      viewerWasMember: true,
      activeSeconds: 700,
      createdAt: midMonth,
    });

    await ReadEvent.create({
      post: postB._id,
      viewer: subscriber._id,
      viewerWasMember: true,
      activeSeconds: 300,
      createdAt: midMonth,
    });

    const ledgerEntries = await computeLedgerForPeriod(periodStart, periodEnd);
    expect(ledgerEntries.length).toBe(2);

    const entryA = ledgerEntries.find((e) => String(e.writer) === String(writerA._id));
    const entryB = ledgerEntries.find((e) => String(e.writer) === String(writerB._id));

    expect(entryA.eligibleActiveSeconds).toBe(700);
    expect(entryB.eligibleActiveSeconds).toBe(300);
    expect(entryA.platformActiveSeconds).toBe(1000);
    expect(entryB.platformActiveSeconds).toBe(1000);

    // 70% of 10000 cents = 7000 cents ($70.00)
    expect(entryA.payoutCents).toBe(7000);
    // 30% of 10000 cents = 3000 cents ($30.00)
    expect(entryB.payoutCents).toBe(3000);
  });

  it("returns breakdown object with formula fidelity on GET /api/writer/payout-ledger", async () => {
    const request = require("supertest");
    const app = require("../../src/app");
    const { signAccessToken } = require("../../src/utils/jwt");

    const periodStart = new Date("2026-01-01T00:00:00.000Z");
    const periodEnd = new Date("2026-01-31T23:59:59.999Z");

    const writer = await User.create({
      name: "Payout Writer",
      username: "payoutwriter",
      email: "payout@writer.test",
      password: "Password123!",
    });

    await PayoutLedgerEntry.create({
      writer: writer._id,
      periodStart,
      periodEnd,
      eligibleActiveSeconds: 700,
      platformActiveSeconds: 1000,
      poolCents: 10000,
      payoutCents: 7000,
    });

    const token = signAccessToken(String(writer._id));
    const res = await request(app)
      .get("/api/writer/payout-ledger")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entries).toHaveLength(1);

    const entry = res.body.data.entries[0];
    expect(entry.breakdown).toBeDefined();
    expect(entry.breakdown.attributedReadSeconds).toBe(700);
    expect(entry.breakdown.totalPoolReadSeconds).toBe(1000);
    expect(entry.breakdown.poolShareRatio).toBe(0.7);
    expect(entry.breakdown.poolSharePercentage).toBe("70.0%");
    expect(entry.breakdown.periodPoolAmountCents).toBe(10000);
    expect(entry.breakdown.calculatedAmountCents).toBe(7000);
    expect(entry.breakdown.calculatedAmountFormatted).toBe("$70.00");
  });
});
