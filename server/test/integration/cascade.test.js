"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Comment = require("../../src/models/Comment");
const ReadingList = require("../../src/models/ReadingList");
const Highlight = require("../../src/modules/highlights/highlights.model");
const Notification = require("../../src/models/Notification");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");
const { signDeleteToken } = require("../../src/utils/unsubscribeToken");

describe("User Account Deletion Cascade (DELETE /api/users/me)", () => {
  let userToDelete, tokenToDelete;
  let otherUser, otherToken;
  let postByDeletedUser, postByOtherUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    userToDelete = await User.create({
      name: "Cascade Target",
      username: "cascadetarget",
      email: "cascade@test.com",
      password: "Password123!",
    });
    tokenToDelete = signAccessToken(userToDelete._id);

    otherUser = await User.create({
      name: "Other User",
      username: "otheruser",
      email: "other@test.com",
      password: "Password123!",
    });
    otherToken = signAccessToken(otherUser._id);

    postByDeletedUser = await Post.create({
      title: "Deleted User Story",
      slug: "deleted-user-story",
      contentHtml: "<p>Content</p>",
      author: userToDelete._id,
      status: "published",
    });

    postByOtherUser = await Post.create({
      title: "Other User Story",
      slug: "other-user-story",
      contentHtml: "<p>Content</p>",
      author: otherUser._id,
      status: "published",
    });

    // Create ReadingList owned by user
    await ReadingList.create({
      owner: userToDelete._id,
      name: "Favorites",
      slug: "favorites",
      posts: [{ post: postByOtherUser._id }],
    });

    // Create Highlight owned by user
    await Highlight.create({
      owner: userToDelete._id,
      post: postByOtherUser._id,
      quote: "Content",
      note: "Private annotation",
    });

    // Create Highlight on postByDeletedUser owned by otherUser
    await Highlight.create({
      owner: otherUser._id,
      post: postByDeletedUser._id,
      quote: "Content",
      note: "Other user note",
    });

    // Create notification for user
    await Notification.create({
      recipient: userToDelete._id,
      actor: otherUser._id,
      type: "follow",
      targetType: "user",
      targetId: otherUser._id,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("executes complete 18-step cascade deletion on account erasure", async () => {
    const deleteToken = signDeleteToken(userToDelete._id);
    const res = await request(app)
      .delete("/api/users/me")
      .set("Cookie", [`accessToken=${tokenToDelete}`])
      .send({ token: deleteToken, mode: "erase" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify User doc deleted
    const deletedUserCheck = await User.findById(userToDelete._id);
    expect(deletedUserCheck).toBeNull();

    // Verify authored posts deleted in erase mode
    const deletedPostCheck = await Post.findById(postByDeletedUser._id);
    expect(deletedPostCheck).toBeNull();

    // Verify ReadingList deleted
    const listCheck = await ReadingList.find({ owner: userToDelete._id });
    expect(listCheck.length).toBe(0);

    // Verify Highlights owned by deleted user deleted
    const ownHighlights = await Highlight.find({ owner: userToDelete._id });
    expect(ownHighlights.length).toBe(0);

    // Verify Highlights on deleted user's erased post deleted
    const postHighlights = await Highlight.find({ post: postByDeletedUser._id });
    expect(postHighlights.length).toBe(0);

    // Verify Notifications received by user deleted
    const notifCheck = await Notification.find({ recipient: userToDelete._id });
    expect(notifCheck.length).toBe(0);
  });
});
