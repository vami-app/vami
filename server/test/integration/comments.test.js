"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Comment = require("../../src/models/Comment");
const Notification = require("../../src/models/Notification");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Comments Domain Integration (/api/posts/:slug/comments & /api/comments/:id)", () => {
  let author, commenter, secondaryUser, authorToken, commenterToken, publishedPost, draftPost;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "Author User",
      username: "author",
      email: "author@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    commenter = await User.create({
      name: "Commenter User",
      username: "commenter",
      email: "commenter@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    secondaryUser = await User.create({
      name: "Secondary User",
      username: "secondary",
      email: "secondary@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    authorToken = signAccessToken(String(author._id));
    commenterToken = signAccessToken(String(commenter._id));

    publishedPost = await Post.create({
      title: "Published Story",
      slug: "published-story",
      contentHtml: "<p>Story content</p>",
      status: "published",
      author: author._id,
    });

    draftPost = await Post.create({
      title: "Draft Story",
      slug: "draft-story",
      contentHtml: "<p>Draft content</p>",
      status: "draft",
      author: author._id,
    });
  });

  it("lists comments for a published story and enforces draft protection for non-authors", async () => {
    await Comment.create({
      post: publishedPost._id,
      author: commenter._id,
      content: "First response",
    });

    const res = await request(app).get(`/api/posts/${publishedPost.slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comments).toHaveLength(1);
    expect(res.body.data.comments[0].content).toBe("First response");

    const draftRes = await request(app).get(`/api/posts/${draftPost.slug}/comments`);
    expect(draftRes.status).toBe(404);
  });

  it("creates a comment, triggers notification to post author, and clamps nesting depth", async () => {
    const res = await request(app)
      .post(`/api/posts/${publishedPost.slug}/comments`)
      .set("Cookie", [`accessToken=${commenterToken}`])
      .send({ content: "Great post!" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.content).toBe("Great post!");

    const notifs = await Notification.find({ recipient: author._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].type).toBe("comment");
    expect(String(notifs[0].actor)).toBe(String(commenter._id));

    // Reply to comment
    const parentId = res.body.data.comment.id;
    const replyRes = await request(app)
      .post(`/api/posts/${publishedPost.slug}/comments`)
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({ content: "Thanks for reading!", parentComment: parentId });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.comment.depth).toBe(1);

    // Reply notification triggered for parent comment author (commenter)
    const replyNotifs = await Notification.find({ recipient: commenter._id });
    expect(replyNotifs).toHaveLength(1);
    expect(replyNotifs[0].type).toBe("reply");
  });

  it("hard-deletes comments without replies and soft-deletes comments with replies", async () => {
    const parent = await Comment.create({
      post: publishedPost._id,
      author: commenter._id,
      content: "Parent comment to delete",
    });

    const single = await Comment.create({
      post: publishedPost._id,
      author: commenter._id,
      content: "Standalone comment",
    });

    // Hard-delete standalone comment
    const hardDelRes = await request(app)
      .delete(`/api/comments/${single._id}`)
      .set("Cookie", [`accessToken=${commenterToken}`]);
    expect(hardDelRes.status).toBe(200);
    const checkSingle = await Comment.findById(single._id);
    expect(checkSingle).toBeNull();

    // Create child reply under parent
    await Comment.create({
      post: publishedPost._id,
      author: secondaryUser._id,
      parentComment: parent._id,
      depth: 1,
      content: "Reply to parent",
    });

    // Soft-delete parent comment
    const softDelRes = await request(app)
      .delete(`/api/comments/${parent._id}`)
      .set("Cookie", [`accessToken=${commenterToken}`]);
    expect(softDelRes.status).toBe(200);
    expect(softDelRes.body.data.comment.deletedButHasReplies).toBe(true);
    expect(softDelRes.body.data.comment.content).toBe("[deleted]");

    const checkParent = await Comment.findById(parent._id);
    expect(checkParent.deletedButHasReplies).toBe(true);
    expect(checkParent.content).toBe("[deleted]");
  });

  it("blocks non-author from deleting comments with 403", async () => {
    const comment = await Comment.create({
      post: publishedPost._id,
      author: commenter._id,
      content: "Commenter content",
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(res.status).toBe(403);
  });
});
