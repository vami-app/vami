"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Post Domain Integration (/api/posts & /api/tags)", () => {
  let authorUser, subscriberUser, nonSubUser;
  let authorToken, subscriberToken, nonSubToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    authorUser = await User.create({
      name: "Author Person",
      username: "authorperson",
      email: "author@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    subscriberUser = await User.create({
      name: "Subscriber Person",
      username: "subscriberperson",
      email: "subscriber@test.com",
      password: "Password123!",
      emailVerified: true,
      membershipStatus: "active",
    });

    nonSubUser = await User.create({
      name: "Non Subscriber",
      username: "nonsub",
      email: "nonsub@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    authorToken = signAccessToken(String(authorUser._id));
    subscriberToken = signAccessToken(String(subscriberUser._id));
    nonSubToken = signAccessToken(String(nonSubUser._id));
  });

  it("creates a published story and handles public feed pagination + search", async () => {
    const createRes = await request(app)
      .post("/api/posts")
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({
        title: "Building Scale Applications",
        subtitle: "A architecture study",
        contentHtml: "<p>Paragraph 1</p><p>Paragraph 2</p>",
        tags: ["architecture", "javascript"],
        status: "published",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.post.slug).toContain("building-scale-applications");

    const feedRes = await request(app).get("/api/posts?tag=architecture");
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.data.posts).toHaveLength(1);

    const sitemapRes = await request(app).get("/api/posts/sitemap-data");
    expect(sitemapRes.status).toBe(200);
    expect(sitemapRes.body.data.posts.length).toBeGreaterThanOrEqual(1);
  });

  it("increments view count on public fetch and truncates locked content for non-subscribers", async () => {
    const lockedPost = await Post.create({
      title: "Locked Masterclass",
      slug: "locked-masterclass",
      contentHtml: "<p>Para 1</p><p>Para 2</p><p>Para 3</p><p>Para 4</p><p>Para 5</p>",
      author: authorUser._id,
      status: "published",
      locked: true,
      previewParagraphCount: 2,
    });

    // Exhaust non-subscriber's 3 monthly free reads
    const ReadEvent = require("../../src/models/ReadEvent");
    for (let i = 0; i < 3; i++) {
      await ReadEvent.create({
        post: lockedPost._id,
        viewer: nonSubUser._id,
        viewerWasMember: false,
        activeSeconds: 60,
        createdAt: new Date(),
      });
    }

    // Fetch as non-subscriber (with exhausted free read quota)
    const nonSubRes = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${nonSubToken}`]);

    expect(nonSubRes.status).toBe(200);
    expect(nonSubRes.body.data.post.previewOnly).toBe(true);
    expect(nonSubRes.body.data.post.contentHtml).toBe("<p>Para 1</p><p>Para 2</p>");

    // Fetch as active subscriber
    const subRes = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);

    expect(subRes.status).toBe(200);
    expect(subRes.body.data.post.previewOnly).toBe(false);
    expect(subRes.body.data.post.contentHtml).toContain("Para 5");
  });

  it("handles multi-clapping up to 50 cap and bookmarking toggles", async () => {
    const post = await Post.create({
      title: "Clappable Story",
      slug: "clappable-story",
      contentHtml: "<p>Content</p>",
      author: authorUser._id,
      status: "published",
    });

    // Clap 20 times
    const clapRes = await request(app)
      .post(`/api/posts/${post.slug}/clap`)
      .set("Cookie", [`accessToken=${subscriberToken}`])
      .send({ count: 20 });

    expect(clapRes.status).toBe(200);
    expect(clapRes.body.data.viewerClapCount).toBe(20);

    // Bookmark toggle
    const b1 = await request(app)
      .post(`/api/posts/${post.slug}/bookmark`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);
    expect(b1.status).toBe(200);
    expect(b1.body.data.bookmarked).toBe(true);

    const b2 = await request(app)
      .post(`/api/posts/${post.slug}/bookmark`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);
    expect(b2.status).toBe(200);
    expect(b2.body.data.bookmarked).toBe(false);
  });

  it("allows author to update and delete their own story", async () => {
    const post = await Post.create({
      title: "Story To Edit",
      slug: "story-to-edit",
      contentHtml: "<p>Original</p>",
      author: authorUser._id,
      status: "draft",
    });

    const editRes = await request(app)
      .patch(`/api/posts/${post.slug}`)
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({ title: "Updated Story Title" });

    expect(editRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/posts/story-to-edit`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(deleteRes.status).toBe(200);

    const checkPost = await Post.findById(post._id);
    expect(checkPost).toBeNull();
  });
});
