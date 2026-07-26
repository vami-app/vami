"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const PostRevision = require("../../src/models/PostRevision");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Post Revisions Domain Integration (/api/posts/:slug/revisions)", () => {
  let author, otherUser, authorToken, otherToken, post, revision1, revision2;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "Author User",
      username: "authoruser",
      email: "author@test.com",
      password: "Password123!",
    });
    authorToken = signAccessToken(author._id);

    otherUser = await User.create({
      name: "Other User",
      username: "otheruser",
      email: "other@test.com",
      password: "Password123!",
    });
    otherToken = signAccessToken(otherUser._id);

    post = await Post.create({
      title: "Current Live Title",
      subtitle: "Current Live Subtitle",
      contentHtml: "<p>Current Live Content</p>",
      slug: "current-live-title",
      author: author._id,
      status: "published",
    });

    revision1 = await PostRevision.create({
      post: post._id,
      title: "Initial Title V1",
      subtitle: "Initial Subtitle V1",
      contentHtml: "<p>Initial Content V1</p>",
      tags: ["v1"],
      editedBy: author._id,
    });

    revision2 = await PostRevision.create({
      post: post._id,
      title: "Edited Title V2",
      subtitle: "Edited Subtitle V2",
      contentHtml: "<p>Edited Content V2</p>",
      tags: ["v2"],
      editedBy: author._id,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("lists revision metadata for post author and blocks non-author with 403", async () => {
    const resAuthor = await request(app)
      .get(`/api/posts/${post.slug}/revisions`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(resAuthor.status).toBe(200);
    expect(resAuthor.body.success).toBe(true);
    expect(resAuthor.body.data.revisions).toHaveLength(2);

    const resOther = await request(app)
      .get(`/api/posts/${post.slug}/revisions`)
      .set("Cookie", [`accessToken=${otherToken}`]);

    expect(resOther.status).toBe(403);
    expect(resOther.body.success).toBe(false);
  });

  it("retrieves single revision details for post author and blocks non-author", async () => {
    const resAuthor = await request(app)
      .get(`/api/posts/${post.slug}/revisions/${revision1._id}`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(resAuthor.status).toBe(200);
    expect(resAuthor.body.success).toBe(true);
    expect(resAuthor.body.data.revision.title).toBe("Initial Title V1");

    const resOther = await request(app)
      .get(`/api/posts/${post.slug}/revisions/${revision1._id}`)
      .set("Cookie", [`accessToken=${otherToken}`]);

    expect(resOther.status).toBe(403);
    expect(resOther.body.success).toBe(false);
  });

  it("restores post content to prior revision AND creates a new undo revision of current state", async () => {
    const initialRevCount = await PostRevision.countDocuments({ post: post._id });
    expect(initialRevCount).toBe(2);

    const resRestore = await request(app)
      .post(`/api/posts/${post.slug}/revisions/${revision1._id}/restore`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(resRestore.status).toBe(200);
    expect(resRestore.body.success).toBe(true);

    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.title).toBe("Initial Title V1");
    expect(updatedPost.contentHtml).toBe("<p>Initial Content V1</p>");

    // Verify restore created an undo revision of "Current Live Title"
    const newRevCount = await PostRevision.countDocuments({ post: post._id });
    expect(newRevCount).toBe(3);

    const latestRevision = await PostRevision.findOne({ post: post._id }).sort({ createdAt: -1 });
    expect(latestRevision.title).toBe("Current Live Title");
  });
});
