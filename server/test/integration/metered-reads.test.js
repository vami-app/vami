"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const ReadEvent = require("../../src/models/ReadEvent");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Metered Free Reads Integration (/api/posts/:slug)", () => {
  let author, authorToken;
  let nonMemberReader, nonMemberToken;
  let activeMemberReader, memberToken;
  let lockedPost;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "Locked Post Author",
      username: "lockedauthor",
      email: "author@locked.test",
      password: "Password123!",
      role: "user",
      emailVerified: true,
    });
    authorToken = signAccessToken(String(author._id));

    nonMemberReader = await User.create({
      name: "Non-Member Reader",
      username: "nonmember",
      email: "reader@nonmember.test",
      password: "Password123!",
      membershipStatus: "none",
    });
    nonMemberToken = signAccessToken(String(nonMemberReader._id));

    activeMemberReader = await User.create({
      name: "Active Member Reader",
      username: "activemember",
      email: "reader@member.test",
      password: "Password123!",
      membershipStatus: "active",
    });
    memberToken = signAccessToken(String(activeMemberReader._id));

    lockedPost = await Post.create({
      title: "Exclusive Paywalled Story",
      slug: "exclusive-paywalled-story",
      contentHtml: "<p>Paragraph 1: Teaser introduction to the exclusive story.</p><p>Paragraph 2: Deep dive analysis and research findings.</p><p>Paragraph 3: Key takeaways and conclusions.</p><p>Paragraph 4: Premium bonus insights.</p>",
      author: author._id,
      status: "published",
      locked: true,
      previewParagraphCount: 1,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Scenario 1: Metered Read Consumption (Initial read allowed)
  it("Scenario 1: Non-member reader gets full access to locked story when remainingFreeReads > 0", async () => {
    const res = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${nonMemberToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.isLocked).toBe(true);
    expect(res.body.data.post.previewOnly).toBe(false);
    expect(res.body.data.post.freeReadContext.remainingFreeReads).toBe(3);
    expect(res.body.data.post.freeReadContext.isFreeReadApplied).toBe(true);
    expect(res.body.data.post.contentHtml).toContain("Paragraph 4");
  });

  // Scenario 2: Quota Exhaustion (4th attempt paywalled)
  it("Scenario 2: Non-member reader is paywalled with previewOnly: true after consuming 3 monthly free reads", async () => {
    const now = new Date();
    // Simulate 3 prior ReadEvents in current month
    for (let i = 0; i < 3; i++) {
      await ReadEvent.create({
        post: lockedPost._id,
        viewer: nonMemberReader._id,
        viewerWasMember: false,
        activeSeconds: 120,
        createdAt: now,
      });
    }

    const res = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${nonMemberToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.post.previewOnly).toBe(true);
    expect(res.body.data.post.freeReadContext.remainingFreeReads).toBe(0);
    expect(res.body.data.post.freeReadContext.isFreeReadApplied).toBe(false);
    expect(res.body.data.post.contentHtml).not.toContain("Paragraph 4");
    expect(res.body.data.post.contentHtml).toContain("Paragraph 1");
  });

  // Scenario 3: Active Member Exemption
  it("Scenario 3: Active member reader bypasses metered free read quota with unlimited access", async () => {
    const res = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${memberToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.post.previewOnly).toBe(false);
    expect(res.body.data.post.contentHtml).toContain("Paragraph 4");
  });

  // Scenario 4: Monthly Quota Reset
  it("Scenario 4: Past month ReadEvents do not count against current month's free read quota", async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Create 3 ReadEvents in past month
    for (let i = 0; i < 3; i++) {
      await ReadEvent.create({
        post: lockedPost._id,
        viewer: nonMemberReader._id,
        viewerWasMember: false,
        activeSeconds: 120,
        createdAt: lastMonth,
      });
    }

    const res = await request(app)
      .get(`/api/posts/${lockedPost.slug}`)
      .set("Cookie", [`accessToken=${nonMemberToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.post.previewOnly).toBe(false);
    expect(res.body.data.post.freeReadContext.remainingFreeReads).toBe(3);
  });
});
