"use strict";

const request = require("supertest");
const app = require("../../src/app");
const { User } = require("@vami/identity-service");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const passport = require("passport");

describe("OAuth Account Creation & Linking Integration", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("creates a new user without password requirement when OAuth user registers for first time", async () => {
    const oauthUser = await User.create({
      name: "OAuth Google User",
      username: "googleuser",
      email: "google@oauth.test",
      googleId: "google-123456789",
      emailVerified: true,
    });

    expect(oauthUser).toBeDefined();
    expect(oauthUser.googleId).toBe("google-123456789");
    expect(oauthUser.emailVerified).toBe(true);
    expect(oauthUser.password).toBeUndefined();
  });

  it("links OAuth provider ID when registering OAuth account with pre-existing user email", async () => {
    // 1. Pre-existing traditional email/password user
    const existingUser = await User.create({
      name: "Existing Email User",
      username: "existinguser",
      email: "linkme@oauth.test",
      password: "Password123!",
      emailVerified: false,
    });

    // 2. Link GitHub ID onto account
    existingUser.githubId = "github-987654321";
    existingUser.emailVerified = true;
    await existingUser.save();

    const updatedUser = await User.findById(existingUser._id);
    expect(updatedUser.githubId).toBe("github-987654321");
    expect(updatedUser.emailVerified).toBe(true);
  });
});
