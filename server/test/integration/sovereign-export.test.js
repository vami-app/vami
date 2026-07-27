"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Follow = require("../../src/models/Follow");
const PayoutLedgerEntry = require("../../src/models/PayoutLedgerEntry");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");
const { streamExport } = require("../../src/utils/exportAccount");
const { ZipArchive } = require("archiver");

describe("Sovereign Payment-Relationship Export (/api/users/me/export)", () => {
  let author, authorToken;
  let activeSubscriber, lapsedSubscriber;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "Sovereign Author",
      username: "sovereignauthor",
      email: "author@sovereign.test",
      password: "Password123!",
      role: "user",
    });
    authorToken = signAccessToken(String(author._id));

    activeSubscriber = await User.create({
      name: "Active Subscriber",
      username: "activesubscriber",
      email: "active@subscriber.test",
      password: "Password123!",
      membershipStatus: "active",
      razorpayCustomerId: "cust_active123",
      razorpaySubscriptionId: "sub_active123",
    });

    lapsedSubscriber = await User.create({
      name: "Lapsed Subscriber",
      username: "lapsedsubscriber",
      email: "lapsed@subscriber.test",
      password: "Password123!",
      membershipStatus: "canceled",
      razorpayCustomerId: "cust_lapsed456",
      razorpaySubscriptionId: "sub_lapsed456",
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Scenario 1: Export with active subscribers & payout history
  it("Scenario 1: Streams zip export containing payment-relationships.json with exact totalEarnedPayoutCents and PORTABILITY_DISCLOSURE.md", async () => {
    await Follow.create({ follower: activeSubscriber._id, followee: author._id });
    await PayoutLedgerEntry.create({
      writer: author._id,
      payoutCents: 1500,
      readTimeSeconds: 3600,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      status: "finalized",
    });

    // Test HTTP endpoint response
    const res = await request(app)
      .get("/api/users/me/export")
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("zip");

    // Inspect stream contents directly
    const appendCalls = [];
    const mockRes = {
      setHeader: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      write: () => true,
      end: () => {},
    };

    const spy = vi.spyOn(ZipArchive.prototype, "append").mockImplementation(function (content, opts) {
      appendCalls.push({ content: String(content), name: opts.name });
      return this;
    });

    await streamExport(author, mockRes, []);
    spy.mockRestore();

    const relEntry = appendCalls.find((c) => c.name === "payment-relationships.json");
    const discEntry = appendCalls.find((c) => c.name === "PORTABILITY_DISCLOSURE.md");

    expect(relEntry).toBeDefined();
    expect(discEntry).toBeDefined();

    const relData = JSON.parse(relEntry.content);
    expect(relData.writerName).toBe("Sovereign Author");
    expect(relData.totalEarnedPayoutCents).toBe(1500);
    expect(relData.payoutHistory.length).toBe(1);
    expect(relData.payoutHistory[0].payoutCents).toBe(1500);

    expect(relData.subscribers.length).toBe(1);
    expect(relData.subscribers[0].name).toBe("Active Subscriber");
    expect(relData.subscribers[0].email).toBe("active@subscriber.test");
    expect(relData.subscribers[0].membershipStatus).toBe("active");
    expect(relData.subscribers[0].isPlatformMember).toBe(true);
    expect(relData.subscribers[0].razorpaySubscriptionId).toBe("sub_active123");

    expect(discEntry.content).toContain("Sovereign Audience & Revenue Portability Disclosure");
    expect(discEntry.content).toContain("Pool-Based Revenue Model");
  });

  // Scenario 2: Edge Case 1 - Lapsed & cancelled subscribers included
  it("Scenario 2 (Edge Case 1): Includes lapsed/canceled subscribers in payment-relationships.json subscriber directory", async () => {
    await Follow.create({ follower: lapsedSubscriber._id, followee: author._id });

    const appendCalls = [];
    const mockRes = { setHeader: () => {}, on: () => {}, once: () => {}, emit: () => {}, write: () => true, end: () => {} };

    const spy = vi.spyOn(ZipArchive.prototype, "append").mockImplementation(function (content, opts) {
      appendCalls.push({ content: String(content), name: opts.name });
      return this;
    });

    await streamExport(author, mockRes, []);
    spy.mockRestore();

    const relEntry = appendCalls.find((c) => c.name === "payment-relationships.json");
    expect(relEntry).toBeDefined();

    const relData = JSON.parse(relEntry.content);
    expect(relData.subscribers.length).toBe(1);
    expect(relData.subscribers[0].membershipStatus).toBe("canceled");
    expect(relData.subscribers[0].isPlatformMember).toBe(false);
    expect(relData.subscribers[0].razorpaySubscriptionId).toBe("sub_lapsed456");
  });

  // Scenario 3: Edge Case 2 - Author with zero subscribers
  it("Scenario 3 (Edge Case 2): Completes export cleanly for authors with zero subscribers", async () => {
    const appendCalls = [];
    const mockRes = { setHeader: () => {}, on: () => {}, once: () => {}, emit: () => {}, write: () => true, end: () => {} };

    const spy = vi.spyOn(ZipArchive.prototype, "append").mockImplementation(function (content, opts) {
      appendCalls.push({ content: String(content), name: opts.name });
      return this;
    });

    await streamExport(author, mockRes, []);
    spy.mockRestore();

    const relEntry = appendCalls.find((c) => c.name === "payment-relationships.json");
    const discEntry = appendCalls.find((c) => c.name === "PORTABILITY_DISCLOSURE.md");

    expect(relEntry).toBeDefined();
    expect(discEntry).toBeDefined();

    const relData = JSON.parse(relEntry.content);
    expect(relData.subscribers).toEqual([]);
    expect(relData.totalEarnedPayoutCents).toBe(0);
  });

  // Scenario 4: Edge Case 3 - Partial data fallback
  it("Scenario 4 (Edge Case 3): Handles missing optional fields gracefully without throwing errors", async () => {
    const incompleteSubscriber = await User.create({
      name: "Incomplete Sub",
      username: "incompletesub",
      email: "incomplete@test.com",
      password: "Password123!",
    });

    await Follow.create({ follower: incompleteSubscriber._id, followee: author._id });

    const appendCalls = [];
    const mockRes = { setHeader: () => {}, on: () => {}, once: () => {}, emit: () => {}, write: () => true, end: () => {} };

    const spy = vi.spyOn(ZipArchive.prototype, "append").mockImplementation(function (content, opts) {
      appendCalls.push({ content: String(content), name: opts.name });
      return this;
    });

    await streamExport(author, mockRes, []);
    spy.mockRestore();

    const relEntry = appendCalls.find((c) => c.name === "payment-relationships.json");
    expect(relEntry).toBeDefined();

    const relData = JSON.parse(relEntry.content);
    expect(relData.subscribers.length).toBe(1);
    expect(relData.subscribers[0].name).toBe("Incomplete Sub");
    expect(relData.subscribers[0].membershipStatus).toBe("none");
    expect(relData.subscribers[0].isPlatformMember).toBe(false);
    expect(relData.subscribers[0].razorpaySubscriptionId).toBeNull();
  });
});
