"use strict";

const request = require("supertest");
const app = require("../../src/app");
const { User } = require("@vami/identity-service");
const Post = require("../../src/models/Post");
const ReadEvent = require("../../src/models/ReadEvent");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("@vami/identity-service");

describe("Writer Analytics Endpoint (GET /api/writer/analytics)", () => {
  let writerToken;
  let writerUser;
  let postDoc;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    writerUser = await User.create({
      name: "Analytics Writer",
      username: "analyticswriter",
      email: "writer@analytics.test",
      password: "Password123!",
      role: "user",
    });
    writerToken = signAccessToken(writerUser._id);

    postDoc = await Post.create({
      title: "Analytics Test Story",
      slug: "analytics-test-story",
      contentHtml: "<p>Hello analytics world</p>",
      author: writerUser._id,
      status: "published",
      views: 15,
      totalClaps: 5,
    });

    // Create a reader user & read event
    const readerUser = await User.create({
      name: "Private Reader",
      username: "privatereader",
      email: "reader@private.test",
      password: "Password123!",
    });

    await ReadEvent.create({
      post: postDoc._id,
      viewer: readerUser._id,
      viewerWasMember: true,
      activeSeconds: 120,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("returns aggregated writer analytics without leaking individual viewer identity", async () => {
    const res = await request(app)
      .get("/api/writer/analytics")
      .set("Cookie", [`accessToken=${writerToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data.analytics;
    expect(data.posts).toBeDefined();
    expect(data.posts.length).toBe(1);

    const pSummary = data.posts[0];
    expect(pSummary.title).toBe("Analytics Test Story");
    expect(pSummary.views).toBe(15);
    expect(pSummary.totalClaps).toBe(5);
    expect(pSummary.avgReadTimeSeconds).toBe(120);

    // PRIVACY CHECK: Ensure NO per-viewer fields or reader user details exist anywhere in response payload
    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain("privatereader");
    expect(jsonStr).not.toContain("reader@private.test");
    expect(jsonStr).not.toContain("Private Reader");
  });
});
