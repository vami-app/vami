"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Publication = require("../../src/models/Publication");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");

describe("Disclosed AI Authorship Integration (/api/posts)", () => {
  let author, authorToken, pub;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    author = await User.create({
      name: "AI Disclosure Author",
      username: "aiauthor",
      email: "author@ai.test",
      password: "Password123!",
      role: "user",
      emailVerified: true,
    });
    authorToken = signAccessToken(String(author._id));

    pub = await Publication.create({
      name: "AI & Future Tech Pub",
      slug: "ai-future-tech",
      description: "A publication exploring artificial intelligence and editorial ethics.",
      owner: author._id,
      editors: [author._id],
      writers: [author._id],
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Scenario 1: Create post with AI disclosure ('edited' and 'co-written')
  it("Scenario 1: Creates a post with explicit aiAssisted disclosure ('edited' / 'co-written') and returns disclosure in toCardJSON", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({
        title: "Exploring Synthetic Creativity",
        subtitle: "A story copyedited with LLM assistance",
        contentHtml: "<p>This story was written by a human and refined with AI assistance.</p>",
        tags: ["ai", "creativity"],
        status: "published",
        aiAssisted: "edited",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.aiAssisted).toBe("edited");

    const dbPost = await Post.findById(res.body.data.post.id);
    expect(dbPost).toBeDefined();
    expect(dbPost.aiAssisted).toBe("edited");
    expect(dbPost.toCardJSON().aiAssisted).toBe("edited");
  });

  // Scenario 2: Edge Case 1 - Update aiAssisted value post-publish
  it("Scenario 2 (Edge Case 1): Updates aiAssisted from 'none' to 'co-written' via PATCH /api/posts/:slug", async () => {
    const createRes = await request(app)
      .post("/api/posts")
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({
        title: "Drafting the Algorithmic Future",
        contentHtml: "<p>Initial human draft.</p>",
        status: "published",
        aiAssisted: "none",
      });

    const slug = createRes.body.data.post.slug;
    expect(createRes.body.data.post.aiAssisted).toBe("none");

    const patchRes = await request(app)
      .patch(`/api/posts/${slug}`)
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({
        aiAssisted: "co-written",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.post.aiAssisted).toBe("co-written");

    const updatedDbPost = await Post.findOne({ slug });
    expect(updatedDbPost.aiAssisted).toBe("co-written");
  });

  // Scenario 3: Edge Case 2 - Pre-field PostRevision snapshot compatibility & 'unspecified' state
  it("Scenario 3 (Edge Case 2): Handles historical revision snapshots cleanly, returning aiAssisted: 'unspecified' for legacy revisions", async () => {
    const PostRevision = require("../../src/models/PostRevision");

    const post = await Post.create({
      title: "Historical Legacy Post",
      slug: "historical-legacy-post",
      contentHtml: "<p>Legacy content created before Phase J Step 4.</p>",
      author: author._id,
      status: "published",
    });

    // Create a legacy PostRevision snapshot without specifying aiAssisted
    const legacyRevision = await PostRevision.create({
      post: post._id,
      title: "Historical Legacy Post - Draft 1",
      contentHtml: "<p>Original draft.</p>",
      editedBy: author._id,
    });

    // Assert legacy revision defaults to 'unspecified'
    expect(legacyRevision.aiAssisted).toBe("unspecified");

    // Query revision endpoint
    const res = await request(app)
      .get(`/api/posts/${post.slug}/revisions/${legacyRevision._id}`)
      .set("Cookie", [`accessToken=${authorToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.revision.aiAssisted).toBe("unspecified");
  });

  // Scenario 4: Edge Case 3 - Co-Authored Publication Post Submission
  it("Scenario 4 (Edge Case 3): Preserves post-level aiAssisted disclosure when submitted to a publication", async () => {
    const createRes = await request(app)
      .post("/api/posts")
      .set("Cookie", [`accessToken=${authorToken}`])
      .send({
        title: "Publication Feature Story on Synthetic Media",
        contentHtml: "<p>Deep dive into synthetic media governance.</p>",
        status: "published",
        aiAssisted: "co-written",
        publication: pub._id,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.post.aiAssisted).toBe("co-written");

    const getRes = await request(app)
      .get(`/api/posts/${createRes.body.data.post.slug}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.post.aiAssisted).toBe("co-written");
  });
});
