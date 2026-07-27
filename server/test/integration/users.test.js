"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Comment = require("../../src/models/Comment");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");
const { signDeleteToken, signUnsubscribeToken } = require("../../src/utils/unsubscribeToken");

describe("Users & Auth Domain Integration (/api/auth & /api/users & /api/admin/users)", () => {
  let adminUser, regularUser, adminToken, regularToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    adminUser = await User.create({
      name: "Admin User",
      username: "adminuser",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
      emailVerified: true,
    });

    regularUser = await User.create({
      name: "Regular User",
      username: "regularuser",
      email: "regular@test.com",
      password: "Password123!",
      role: "user",
      emailVerified: true,
    });

    adminToken = signAccessToken(String(adminUser._id));
    regularToken = signAccessToken(String(regularUser._id));
  });

  it("registers a new user and logs in", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      name: "New Person",
      username: "newperson",
      email: "newperson@test.com",
      password: "Password123!",
    });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.username).toBe("newperson");

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "newperson@test.com",
      password: "Password123!",
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.headers["set-cookie"]).toBeDefined();
  });

  it("handles profile retrieval, update, and subdomain modifications", async () => {
    // Public profile
    const profileRes = await request(app).get(`/api/users/${regularUser.username}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.user.username).toBe("regularuser");

    // Profile update
    const updateRes = await request(app)
      .patch("/api/users/me")
      .set("Cookie", [`accessToken=${regularToken}`])
      .send({ bio: "Updated Bio Text" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.bio).toBe("Updated Bio Text");

    // Subdomain update
    const subRes = await request(app)
      .patch("/api/users/me/subdomain")
      .set("Cookie", [`accessToken=${regularToken}`])
      .send({ subdomain: "myblog" });
    expect(subRes.status).toBe(200);
    expect(subRes.body.data.user.subdomain).toBe("myblog");
  });

  it("allows unsubscribe via unsubscribe token", async () => {
    const token = signUnsubscribeToken(String(regularUser._id));
    const res = await request(app).get(`/api/auth/unsubscribe?token=${token}`);
    expect(res.status).toBe(200);

    const updated = await User.findById(regularUser._id);
    expect(updated.emailPrefs.allEmails).toBe(false);
  });

  it("enforces admin management (list, role update, ban/unban)", async () => {
    // List users
    const listRes = await request(app)
      .get("/api/admin/users")
      .set("Cookie", [`accessToken=${adminToken}`]);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.users.length).toBeGreaterThanOrEqual(2);

    // Promote to admin
    const roleRes = await request(app)
      .patch(`/api/admin/users/${regularUser._id}/role`)
      .set("Cookie", [`accessToken=${adminToken}`])
      .send({ role: "admin" });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.user.role).toBe("admin");

    // Ban user
    const banRes = await request(app)
      .patch(`/api/admin/users/${regularUser._id}/ban`)
      .set("Cookie", [`accessToken=${adminToken}`]);
    expect(banRes.status).toBe(200);
    expect(banRes.body.data.user.status).toBe("banned");
  });

  it("executes account deletion cascade on user erasure", async () => {
    const post = await Post.create({
      title: "Test Post for Erasure",
      slug: "test-post-for-erasure",
      contentHtml: "<p>Content</p>",
      author: regularUser._id,
      status: "published",
    });

    const deleteToken = signDeleteToken(String(regularUser._id));
    const delRes = await request(app)
      .delete("/api/users/me")
      .set("Cookie", [`accessToken=${regularToken}`])
      .send({ token: deleteToken, mode: "erase" });

    expect(delRes.status).toBe(200);

    const checkUser = await User.findById(regularUser._id);
    expect(checkUser).toBeNull();

    const checkPost = await Post.findById(post._id);
    expect(checkPost).toBeNull();
  });
});
