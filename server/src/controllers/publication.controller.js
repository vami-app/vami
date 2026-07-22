"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { makeSlug } = require("../utils/slugify");
const Publication = require("../models/Publication");
const PublicationMember = require("../models/PublicationMember");
const Post = require("../models/Post");
const User = require("../models/User");

const RESERVED_SLUGS = [
  "admin",
  "api",
  "pub",
  "settings",
  "auth",
  "feed",
  "lists",
  "user",
  "users",
  "posts",
  "search",
  "tag",
  "tags",
  "dashboard",
];

const USER_FIELDS = "name username avatarUrl bio";

/**
 * Helper to check member role in a publication.
 * @param {string} publicationId
 * @param {string} userId
 * @returns {Promise<import('mongoose').Document|null>}
 */
async function getMembership(publicationId, userId) {
  if (!userId) return null;
  return PublicationMember.findOne({ publication: publicationId, user: userId });
}

/**
 * POST /api/publications — Create publication.
 */
const createPublication = asyncHandler(async (req, res) => {
  const { name, slug: customSlug, description, logoUrl, coverImage } = req.body;
  if (!name || !name.trim()) {
    throw new ApiError(400, "Publication name is required");
  }
  const { baseSlug } = require("../utils/slugify");
  const rawSlug = customSlug ? customSlug.toLowerCase().trim() : name;
  const base = baseSlug(rawSlug);

  if (!base || base.length < 2) {
    throw new ApiError(400, "Publication slug must be at least 2 characters long");
  }

  if (RESERVED_SLUGS.includes(base) || RESERVED_SLUGS.includes(rawSlug)) {
    throw new ApiError(400, `The slug '${rawSlug}' is reserved and cannot be used.`);
  }

  const slug = customSlug ? base : makeSlug(name);

  const existingPub = await Publication.findOne({ slug });
  if (existingPub) {
    throw new ApiError(400, "A publication with this slug already exists.");
  }

  const existingUserSubdomain = await User.findOne({ subdomain: slug });
  if (existingUserSubdomain) {
    throw new ApiError(400, "This slug collides with an existing subdomain namespace.");
  }

  const publication = await Publication.create({
    name: name.trim(),
    slug,
    description: description ? String(description).trim() : "",
    logoUrl: logoUrl || "",
    coverImage: coverImage || "",
    owner: req.user._id,
  });

  await PublicationMember.create({
    publication: publication._id,
    user: req.user._id,
    role: "owner",
    invitedBy: req.user._id,
  });

  return sendSuccess(res, 201, { publication }, "Publication created successfully");
});

/**
 * GET /api/publications/:slug — Public profile.
 */
const getPublicationBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const publication = await Publication.findOne({ slug, isArchived: false }).populate("owner", USER_FIELDS);
  if (!publication) {
    throw new ApiError(404, "Publication not found");
  }

  const memberDocs = await PublicationMember.find({ publication: publication._id })
    .populate("user", USER_FIELDS)
    .sort({ joinedAt: 1 });

  const members = memberDocs.map((m) => ({
    id: m._id,
    user: m.user ? m.user.toPublicJSON() : null,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  const posts = await Post.find(
    Post.visibleQuery({ publication: publication._id, submissionStatus: "approved" })
  )
    .sort({ publishedAt: -1, _id: -1 })
    .populate("author", USER_FIELDS);

  const viewerId = req.user ? req.user._id : null;
  const viewerMembership = viewerId ? await getMembership(publication._id, viewerId) : null;

  const cardPosts = posts.map((p) => p.toCardJSON(viewerId));

  return sendSuccess(res, 200, {
    publication,
    members,
    posts: cardPosts,
    viewerRole: viewerMembership ? viewerMembership.role : null,
  });
});

/**
 * PATCH /api/publications/:slug — Edit publication (owner/editor only).
 */
const updatePublication = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const publication = await Publication.findOne({ slug, isArchived: false });
  if (!publication) throw new ApiError(404, "Publication not found");

  const membership = await getMembership(publication._id, req.user._id);
  if (!membership || !["owner", "editor"].includes(membership.role)) {
    throw new ApiError(403, "Only publication owners and editors can update settings.");
  }

  const { name, description, logoUrl, coverImage } = req.body;
  if (name !== undefined && name.trim()) publication.name = name.trim();
  if (description !== undefined) publication.description = String(description).trim();
  if (logoUrl !== undefined) publication.logoUrl = logoUrl;
  if (coverImage !== undefined) publication.coverImage = coverImage;

  await publication.save();
  return sendSuccess(res, 200, { publication }, "Publication updated successfully");
});

/**
 * POST /api/publications/:slug/members — Invite a user by username.
 */
const inviteMember = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { username, role } = req.body;

  if (!username) throw new ApiError(400, "Username is required");
  const targetRole = role || "writer";
  if (!["editor", "writer"].includes(targetRole)) {
    throw new ApiError(400, "Role must be 'editor' or 'writer'");
  }

  const publication = await Publication.findOne({ slug, isArchived: false });
  if (!publication) throw new ApiError(404, "Publication not found");

  const membership = await getMembership(publication._id, req.user._id);
  if (!membership || !["owner", "editor"].includes(membership.role)) {
    throw new ApiError(403, "Only publication owners and editors can invite members.");
  }

  if (targetRole === "editor" && membership.role !== "owner") {
    throw new ApiError(403, "Only the publication owner can add editors.");
  }

  const targetUser = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (!targetUser) throw new ApiError(404, "User to invite not found");

  const existingMember = await PublicationMember.findOne({
    publication: publication._id,
    user: targetUser._id,
  });
  if (existingMember) {
    throw new ApiError(400, "User is already a member of this publication.");
  }

  const newMember = await PublicationMember.create({
    publication: publication._id,
    user: targetUser._id,
    role: targetRole,
    invitedBy: req.user._id,
  });

  await newMember.populate("user", USER_FIELDS);

  return sendSuccess(res, 201, { member: newMember }, "Member invited successfully");
});

/**
 * PATCH /api/publications/:slug/members/:userId — Change member role (owner only).
 */
const updateMemberRole = asyncHandler(async (req, res) => {
  const { slug, userId } = req.params;
  const { role } = req.body;

  if (!["owner", "editor", "writer"].includes(role)) {
    throw new ApiError(400, "Invalid role. Choose 'owner', 'editor', or 'writer'.");
  }

  const publication = await Publication.findOne({ slug, isArchived: false });
  if (!publication) throw new ApiError(404, "Publication not found");

  const requesterMembership = await getMembership(publication._id, req.user._id);
  if (!requesterMembership || requesterMembership.role !== "owner") {
    throw new ApiError(403, "Only publication owners can change member roles.");
  }

  const targetMember = await PublicationMember.findOne({
    publication: publication._id,
    user: userId,
  });
  if (!targetMember) throw new ApiError(404, "Member not found in this publication");

  // Last-owner lockout guard
  if (targetMember.role === "owner" && role !== "owner") {
    const ownerCount = await PublicationMember.countDocuments({
      publication: publication._id,
      role: "owner",
    });
    if (ownerCount <= 1) {
      throw new ApiError(400, "Cannot demote the sole owner of a publication.");
    }
  }

  targetMember.role = role;
  await targetMember.save();

  return sendSuccess(res, 200, { member: targetMember }, "Member role updated successfully");
});

/**
 * DELETE /api/publications/:slug/members/:userId — Remove member / leave (owner only, or self).
 */
const removeMember = asyncHandler(async (req, res) => {
  const { slug, userId } = req.params;

  const publication = await Publication.findOne({ slug, isArchived: false });
  if (!publication) throw new ApiError(404, "Publication not found");

  const isSelf = String(req.user._id) === String(userId);
  const requesterMembership = await getMembership(publication._id, req.user._id);

  if (!isSelf && (!requesterMembership || requesterMembership.role !== "owner")) {
    throw new ApiError(403, "Only the publication owner can remove other members.");
  }

  const targetMember = await PublicationMember.findOne({
    publication: publication._id,
    user: userId,
  });
  if (!targetMember) throw new ApiError(404, "Member not found in this publication");

  // Last-owner lockout guard
  if (targetMember.role === "owner") {
    const ownerCount = await PublicationMember.countDocuments({
      publication: publication._id,
      role: "owner",
    });
    if (ownerCount <= 1) {
      throw new ApiError(400, "Cannot remove the sole owner of a publication.");
    }
  }

  await targetMember.deleteOne();
  return sendSuccess(res, 200, null, isSelf ? "Left publication successfully" : "Member removed successfully");
});

/**
 * POST /api/posts/:slug/submit — Submit own post to a publication.
 */
const submitPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { publicationId, publicationSlug } = req.body;

  const post = await Post.findOne({ slug });
  if (!post) throw new ApiError(404, "Story not found");

  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only submit your own stories to a publication.");
  }

  let pub;
  if (publicationId) {
    pub = await Publication.findById(publicationId);
  } else if (publicationSlug) {
    pub = await Publication.findOne({ slug: publicationSlug });
  }

  if (!pub || pub.isArchived) {
    throw new ApiError(404, "Publication not found");
  }

  const membership = await getMembership(pub._id, req.user._id);
  if (!membership) {
    throw new ApiError(403, "You must be a member of this publication to submit stories.");
  }

  post.publication = pub._id;
  post.submissionStatus = "pending";
  post.reviewNote = "";

  await post.save();
  await post.populate("author", USER_FIELDS);

  return sendSuccess(res, 200, { post: post.toCardJSON(req.user._id) }, "Story submitted for review");
});

/**
 * PATCH /api/publications/:pubSlug/submissions/:postId — Review submission (editor/owner only).
 */
const reviewSubmission = asyncHandler(async (req, res) => {
  const { pubSlug, postId } = req.params;
  const { action, reviewNote } = req.body;

  if (!["approve", "reject", "request_changes"].includes(action)) {
    throw new ApiError(400, "Invalid action. Must be 'approve', 'reject', or 'request_changes'.");
  }

  if (["reject", "request_changes"].includes(action) && (!reviewNote || !reviewNote.trim())) {
    throw new ApiError(400, `A review note is required when action is '${action}'.`);
  }

  const publication = await Publication.findOne({ slug: pubSlug, isArchived: false });
  if (!publication) throw new ApiError(404, "Publication not found");

  const membership = await getMembership(publication._id, req.user._id);
  if (!membership || !["owner", "editor"].includes(membership.role)) {
    throw new ApiError(403, "Only publication owners and editors can review submissions.");
  }

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Submitted story not found");

  if (String(post.publication) !== String(publication._id)) {
    throw new ApiError(400, "Story is not submitted to this publication.");
  }

  if (action === "approve") {
    post.submissionStatus = "approved";
    post.reviewNote = reviewNote ? String(reviewNote).trim() : "";
  } else if (action === "reject") {
    post.submissionStatus = "rejected";
    post.reviewNote = String(reviewNote).trim();
  } else if (action === "request_changes") {
    post.submissionStatus = "changes_requested";
    post.reviewNote = String(reviewNote).trim();
  }

  await post.save();
  await post.populate("author", USER_FIELDS);

  return sendSuccess(res, 200, { post: post.toCardJSON(req.user._id) }, `Submission ${action}d successfully`);
});

/**
 * DELETE /api/posts/:slug/submit — Withdraw pending submission (author only).
 */
const withdrawSubmission = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug });
  if (!post) throw new ApiError(404, "Story not found");

  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only withdraw your own submissions.");
  }

  post.publication = null;
  post.submissionStatus = "none";
  post.reviewNote = "";

  await post.save();
  return sendSuccess(res, 200, { post: post.toCardJSON(req.user._id) }, "Submission withdrawn");
});

/**
 * GET /api/publications/:slug/dashboard — Member dashboard data.
 */
const getPublicationDashboard = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const publication = await Publication.findOne({ slug, isArchived: false }).populate("owner", USER_FIELDS);
  if (!publication) throw new ApiError(404, "Publication not found");

  const membership = await getMembership(publication._id, req.user._id);
  if (!membership) {
    throw new ApiError(403, "Access denied. You are not a member of this publication.");
  }

  const memberDocs = await PublicationMember.find({ publication: publication._id })
    .populate("user", USER_FIELDS)
    .sort({ joinedAt: 1 });

  const members = memberDocs.map((m) => ({
    id: m._id,
    userId: m.user ? m.user._id : null,
    user: m.user ? m.user.toPublicJSON() : null,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  let submissions = [];
  if (["owner", "editor"].includes(membership.role)) {
    const postDocs = await Post.find({
      publication: publication._id,
      submissionStatus: { $in: ["pending", "changes_requested"] },
    })
      .sort({ updatedAt: -1 })
      .populate("author", USER_FIELDS);
    submissions = postDocs.map((p) => p.toCardJSON(req.user._id));
  }

  return sendSuccess(res, 200, {
    publication,
    members,
    submissions,
    myRole: membership.role,
  });
});

module.exports = {
  createPublication,
  getPublicationBySlug,
  updatePublication,
  inviteMember,
  updateMemberRole,
  removeMember,
  submitPost,
  reviewSubmission,
  withdrawSubmission,
  getPublicationDashboard,
};
