"use strict";

const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Post = require("../../src/models/Post");
const Publication = require("../../src/models/Publication");
const PublicationMember = require("../../src/models/PublicationMember");
const { connectTestDB, dropTestDB, closeTestDB } = require("../setup/db");
const { signAccessToken } = require("../../src/utils/jwt");
const { signDeleteToken } = require("../../src/utils/unsubscribeToken");

describe("Publications Domain Integration (/api/publications & /api/posts/:slug/submit)", () => {
  let owner, editor, writer, nonMember, ownerToken, editorToken, writerToken, nonMemberToken, post;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();

    owner = await User.create({
      name: "Owner User",
      username: "owneruser",
      email: "owner@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    editor = await User.create({
      name: "Editor User",
      username: "editoruser",
      email: "editor@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    writer = await User.create({
      name: "Writer User",
      username: "writeruser",
      email: "writer@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    nonMember = await User.create({
      name: "Non Member",
      username: "nonmember",
      email: "nonmember@test.com",
      password: "Password123!",
      emailVerified: true,
    });

    ownerToken = signAccessToken(String(owner._id));
    editorToken = signAccessToken(String(editor._id));
    writerToken = signAccessToken(String(writer._id));
    nonMemberToken = signAccessToken(String(nonMember._id));

    post = await Post.create({
      title: "Story for Submission",
      slug: "story-for-submission",
      contentHtml: "<p>Content</p>",
      status: "published",
      author: writer._id,
    });
  });

  it("creates a publication and assigns creator as owner", async () => {
    const res = await request(app)
      .post("/api/publications")
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({
        name: "Tech Digest",
        slug: "tech-digest",
        description: "Technology stories",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.publication.slug).toBe("tech-digest");

    const member = await PublicationMember.findOne({
      publication: res.body.data.publication.id,
      user: owner._id,
    });
    expect(member).not.toBeNull();
    expect(member.role).toBe("owner");
  });

  it("handles public profile fetch and enforces owner/editor update guards", async () => {
    const createRes = await request(app)
      .post("/api/publications")
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ name: "Science Journal", slug: "science-journal" });
    expect(createRes.status).toBe(201);
    const pubSlug = createRes.body.data.publication.slug;

    // Public fetch
    const getRes = await request(app).get(`/api/publications/${pubSlug}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.publication.name).toBe("Science Journal");

    // Non-member edit block
    const failUpdate = await request(app)
      .patch(`/api/publications/${pubSlug}`)
      .set("Cookie", [`accessToken=${nonMemberToken}`])
      .send({ name: "Hacked Journal" });
    expect(failUpdate.status).toBe(403);

    // Owner edit success
    const successUpdate = await request(app)
      .patch(`/api/publications/${pubSlug}`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ name: "Advanced Science Journal" });
    expect(successUpdate.status).toBe(200);
    expect(successUpdate.body.data.publication.name).toBe("Advanced Science Journal");
  });

  it("invites member, updates role, and prevents demoting/removing sole owner", async () => {
    const pub = await Publication.create({
      name: "Dev Digest",
      slug: "dev-digest",
      owner: owner._id,
    });

    await PublicationMember.create({
      publication: pub._id,
      user: owner._id,
      role: "owner",
      invitedBy: owner._id,
    });

    // Invite editor
    const inviteRes = await request(app)
      .post(`/api/publications/${pub.slug}/members`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ username: editor.username, role: "editor" });
    expect(inviteRes.status).toBe(201);

    // Sole owner demote attempt (must fail)
    const demoteSoleOwner = await request(app)
      .patch(`/api/publications/${pub.slug}/members/${owner._id}`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ role: "writer" });
    expect(demoteSoleOwner.status).toBe(400);

    // Promote editor to co-owner
    const promoteRes = await request(app)
      .patch(`/api/publications/${pub.slug}/members/${editor._id}`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ role: "owner" });
    expect(promoteRes.status).toBe(200);

    // Now demoting first owner works because there are 2 owners
    const demoteRes = await request(app)
      .patch(`/api/publications/${pub.slug}/members/${owner._id}`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ role: "writer" });
    expect(demoteRes.status).toBe(200);
  });

  it("manages story submission, review (approve/reject), and withdrawal workflow", async () => {
    const pub = await Publication.create({
      name: "Engineering Blog",
      slug: "engineering-blog",
      owner: owner._id,
    });

    await PublicationMember.create({
      publication: pub._id,
      user: owner._id,
      role: "owner",
      invitedBy: owner._id,
    });

    await PublicationMember.create({
      publication: pub._id,
      user: writer._id,
      role: "writer",
      invitedBy: owner._id,
    });

    // Submit post by writer
    const submitRes = await request(app)
      .post(`/api/posts/${post.slug}/submit`)
      .set("Cookie", [`accessToken=${writerToken}`])
      .send({ publicationId: pub._id });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.post.submissionStatus).toBe("pending");

    // Review submission by owner (approve)
    const reviewRes = await request(app)
      .patch(`/api/publications/${pub.slug}/submissions/${post._id}`)
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ action: "approve" });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.post.submissionStatus).toBe("approved");

    // Withdraw submission by writer
    const withdrawRes = await request(app)
      .delete(`/api/posts/${post.slug}/submit`)
      .set("Cookie", [`accessToken=${writerToken}`]);
    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.data.post.submissionStatus).toBe("none");
  });

  it("executes Cascade Step 13: transfers ownership to senior member if multiple members exist, or archives if sole owner", async () => {
    // Pub 1: owner + editor -> owner account deleted -> editor promoted to owner
    const pub1 = await Publication.create({
      name: "Transfer Pub",
      slug: "transfer-pub",
      owner: owner._id,
    });
    await PublicationMember.create({
      publication: pub1._id,
      user: owner._id,
      role: "owner",
      invitedBy: owner._id,
    });
    await PublicationMember.create({
      publication: pub1._id,
      user: editor._id,
      role: "editor",
      invitedBy: owner._id,
    });

    // Pub 2: sole owner -> owner account deleted -> pub archived
    const pub2 = await Publication.create({
      name: "Archive Pub",
      slug: "archive-pub",
      owner: owner._id,
    });
    await PublicationMember.create({
      publication: pub2._id,
      user: owner._id,
      role: "owner",
      invitedBy: owner._id,
    });

    // Delete owner account via cascade endpoint with valid deletion token
    const deleteToken = signDeleteToken(String(owner._id));
    const deleteRes = await request(app)
      .delete("/api/users/me")
      .set("Cookie", [`accessToken=${ownerToken}`])
      .send({ token: deleteToken, mode: "erase" });
    expect(deleteRes.status).toBe(200);

    // Verify Pub 1 transferred to editor
    const checkPub1 = await Publication.findById(pub1._id);
    expect(String(checkPub1.owner)).toBe(String(editor._id));
    expect(checkPub1.isArchived).toBe(false);

    const checkMember1 = await PublicationMember.findOne({
      publication: pub1._id,
      user: editor._id,
    });
    expect(checkMember1.role).toBe("owner");

    // Verify Pub 2 was archived
    const checkPub2 = await Publication.findById(pub2._id);
    expect(checkPub2.isArchived).toBe(true);

    // Verify owner's membership documents were completely removed
    const remainingOwnerMemberships = await PublicationMember.find({ user: owner._id });
    expect(remainingOwnerMemberships).toHaveLength(0);
  });
});
