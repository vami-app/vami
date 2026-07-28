"use strict";

const { canReadFull } = require("../../src/utils/entitlement");

describe("Entitlement Helper (canReadFull)", () => {
  it("allows reading unlocked posts for any viewer (including unauthenticated)", () => {
    const unlockedPost = { locked: false, author: "user123" };
    expect(canReadFull(unlockedPost, null)).toBe(true);
    expect(canReadFull(unlockedPost, { _id: "user456", membershipStatus: "none" })).toBe(true);
  });

  it("rejects unauthenticated viewers for locked posts", () => {
    const lockedPost = { locked: true, author: "user123" };
    expect(canReadFull(lockedPost, null)).toBe(false);
  });

  it("allows author to read their own locked post", () => {
    const lockedPost = { locked: true, author: "user123" };
    const authorViewer = { _id: "user123", role: "user", membershipStatus: "none" };
    expect(canReadFull(lockedPost, authorViewer)).toBe(true);
  });

  it("allows admin to read any locked post", () => {
    const lockedPost = { locked: true, author: "user123" };
    const adminViewer = { _id: "admin999", role: "admin", membershipStatus: "none" };
    expect(canReadFull(lockedPost, adminViewer)).toBe(true);
  });

  it("allows active subscribers to read locked posts", () => {
    const lockedPost = { locked: true, author: "user123" };
    const memberViewer = { _id: "user777", role: "user", membershipStatus: "active" };
    expect(canReadFull(lockedPost, memberViewer)).toBe(true);
  });

  it("rejects non-members with inactive or canceled membership for locked posts", () => {
    const lockedPost = { locked: true, author: "user123" };
    const nonMember = { _id: "user888", role: "user", membershipStatus: "canceled" };
    expect(canReadFull(lockedPost, nonMember)).toBe(false);
  });
});
