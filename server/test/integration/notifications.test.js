"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Comment = require("../../src/models/Comment");
const Notification = require("../../src/models/Notification");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Notifications Domain Integration (/api/notifications & triggers)", () => {
  let userA, userB, tokenA, tokenB, post;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    userA = await User.create({
      name: "User A",
      username: "usera",
      email: "usera@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    userB = await User.create({
      name: "User B",
      username: "userb",
      email: "userb@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    tokenA = signAccessToken(String(userA._id));
    tokenB = signAccessToken(String(userB._id));

    post = await Post.create({
      title: "Story for Notifications",
      slug: "story-for-notifications",
      contentHtml: "<p>Story text</p>",
      status: "published",
      author: userA._id,
    });
  });

  it("fetches paginated notifications inbox for authenticated recipient", async () => {
    await Notification.create({
      recipient: userA._id,
      actor: userB._id,
      type: "follow",
      targetType: "user",
      targetId: userB._id,
    });

    const res = await request(app)
      .get("/api/notifications")
      .set("Cookie", [`accessToken=${tokenA}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.unreadCount).toBe(1);
  });

  it("marks a single notification and all notifications as read", async () => {
    const notif1 = await Notification.create({
      recipient: userA._id,
      actor: userB._id,
      type: "follow",
      targetType: "user",
      targetId: userB._id,
    });

    const notif2 = await Notification.create({
      recipient: userA._id,
      actor: userB._id,
      type: "clap",
      targetType: "post",
      targetId: post._id,
    });

    const markOneRes = await request(app)
      .patch(`/api/notifications/${notif1._id}/read`)
      .set("Cookie", [`accessToken=${tokenA}`]);
    expect(markOneRes.status).toBe(200);
    expect(markOneRes.body.data.notification.read).toBe(true);

    const markAllRes = await request(app)
      .patch("/api/notifications/read-all")
      .set("Cookie", [`accessToken=${tokenA}`]);
    expect(markAllRes.status).toBe(200);

    const checkNotif2 = await Notification.findById(notif2._id);
    expect(checkNotif2.read).toBe(true);
  });

  it("coalesces clap notifications within 1 hour", async () => {
    // First clap by userB on post by userA
    await request(app)
      .post(`/api/posts/${post.slug}/clap`)
      .set("Cookie", [`accessToken=${tokenB}`])
      .send({ count: 5 });

    let notifs = await Notification.find({ recipient: userA._id });
    expect(notifs).toHaveLength(1);

    // Mark as read
    notifs[0].read = true;
    await notifs[0].save();

    // Second clap within 1 hour
    await request(app)
      .post(`/api/posts/${post.slug}/clap`)
      .set("Cookie", [`accessToken=${tokenB}`])
      .send({ count: 5 });

    notifs = await Notification.find({ recipient: userA._id });
    expect(notifs).toHaveLength(1); // Coalesced, not duplicated
    expect(notifs[0].read).toBe(false); // Touched/reset to unread
  });

  it("triggers follow notification on user follow toggle", async () => {
    const res = await request(app)
      .post(`/api/users/${userA.username}/follow`)
      .set("Cookie", [`accessToken=${tokenB}`]);

    expect(res.status).toBe(200);
    const notifs = await Notification.find({ recipient: userA._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].type).toBe("follow");
  });
});
