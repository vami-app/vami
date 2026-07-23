"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Dark Mode Theme Preference (PATCH /api/users/me)", () => {
  let testUser, token;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    testUser = await User.create({
      name: "Theme User",
      username: "themeuser",
      email: "theme@test.com",
      password: "Password123!",
    });
    token = signAccessToken(testUser._id);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("updates user themePreference and sets theme cookie header", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Cookie", [`accessToken=${token}`])
      .send({ themePreference: "dark" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.themePreference).toBe("dark");

    const cookies = res.headers["set-cookie"] || [];
    const themeCookie = cookies.find((c) => c.startsWith("theme="));
    expect(themeCookie).toBeDefined();
    expect(themeCookie).toContain("theme=dark");

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.themePreference).toBe("dark");
  });

  it("rejects invalid theme preference enum value", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Cookie", [`accessToken=${token}`])
      .send({ themePreference: "neon-invalid" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
