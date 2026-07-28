"use strict";

const request = require("supertest");
const app = require("../../src/app");
const { User } = require("@vami/identity-service");
const Post = require("../../src/models/Post");
const Highlight = require("../../src/models/Highlight");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("@vami/identity-service");

describe("Highlight / Annotation System", () => {
  let author, authorToken;
  let subscriber, subscriberToken;
  let nonSubscriber, nonSubscriberToken;
  let lockedPost, publicPost;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "Story Author",
      username: "storyauthor",
      email: "author@test.com",
      password: "Password123!",
    });
    authorToken = signAccessToken(author._id);

    subscriber = await User.create({
      name: "Subscriber User",
      username: "subscriberuser",
      email: "sub@test.com",
      password: "Password123!",
      membershipStatus: "active",
    });
    subscriberToken = signAccessToken(subscriber._id);

    nonSubscriber = await User.create({
      name: "Free User",
      username: "freeuser",
      email: "free@test.com",
      password: "Password123!",
      membershipStatus: "none",
    });
    nonSubscriberToken = signAccessToken(nonSubscriber._id);

    publicPost = await Post.create({
      title: "Public Story",
      slug: "public-story",
      contentHtml: "<p>This is a public story for everyone to read.</p>",
      author: author._id,
      status: "published",
      locked: false,
    });

    lockedPost = await Post.create({
      title: "Locked Premium Story",
      slug: "locked-premium-story",
      contentHtml: "<p>Exclusive insights for active subscribers only.</p>",
      author: author._id,
      status: "published",
      locked: true,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("allows active subscribers to create highlights on locked stories", async () => {
    const res = await request(app)
      .post(`/api/posts/${lockedPost.slug}/highlights`)
      .set("Cookie", [`accessToken=${subscriberToken}`])
      .send({
        quote: "Exclusive insights",
        contextBefore: "<p>",
        contextAfter: " for active subscribers",
        note: "Great key takeaway!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.highlight.quote).toBe("Exclusive insights");
    expect(res.body.data.highlight.note).toBe("Great key takeaway!");
  });

  it("BLOCKS non-subscribers from creating highlights on locked stories (Paywall Guard)", async () => {
    const res = await request(app)
      .post(`/api/posts/${lockedPost.slug}/highlights`)
      .set("Cookie", [`accessToken=${nonSubscriberToken}`])
      .send({
        quote: "Exclusive insights",
        note: "Attempted paywall bypass note",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("must be an active subscriber");
  });

  it("allows non-subscribers to highlight public stories", async () => {
    const res = await request(app)
      .post(`/api/posts/${publicPost.slug}/highlights`)
      .set("Cookie", [`accessToken=${nonSubscriberToken}`])
      .send({
        quote: "public story",
        note: "Highlighting public text",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("allows retrieving, updating, and deleting own highlights", async () => {
    const createRes = await request(app)
      .post(`/api/posts/${publicPost.slug}/highlights`)
      .set("Cookie", [`accessToken=${subscriberToken}`])
      .send({ quote: "read, write", note: "Original note" });

    const highlightId = createRes.body.data.highlight.id;

    // Get mine
    const getRes = await request(app)
      .get(`/api/posts/${publicPost.slug}/highlights/mine`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.highlights.length).toBe(1);

    // Update
    const patchRes = await request(app)
      .patch(`/api/highlights/${highlightId}`)
      .set("Cookie", [`accessToken=${subscriberToken}`])
      .send({ note: "Updated note content" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.highlight.note).toBe("Updated note content");

    // Delete
    const delRes = await request(app)
      .delete(`/api/highlights/${highlightId}`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);

    expect(delRes.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/posts/${publicPost.slug}/highlights/mine`)
      .set("Cookie", [`accessToken=${subscriberToken}`]);

    expect(checkRes.body.data.highlights.length).toBe(0);
  });
});
