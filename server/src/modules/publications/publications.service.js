"use strict";

const { ApiError } = require("../../utils/apiResponse");
const { makeSlug, baseSlug } = require("../../utils/slugify");
const User = require("../../models/User");

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

class PublicationService {
  constructor(publicationRepository, publicationMemberRepository, postRepository) {
    this.pubs = publicationRepository;
    this.members = publicationMemberRepository;
    this.posts = postRepository;
  }

  // --- Role Check Helpers ---
  async requireOwner({ publicationId, userId }) {
    const role = await this.members.findRoleFor({ publicationId, userId });
    if (!role || role !== "owner") {
      throw new ApiError(403, "Only publication owners can perform this action.");
    }
    return role;
  }

  async requireOwnerOrEditor({ publicationId, userId }, customErrorMsg) {
    const role = await this.members.findRoleFor({ publicationId, userId });
    if (!role || !["owner", "editor"].includes(role)) {
      throw new ApiError(
        403,
        customErrorMsg || "Only publication owners and editors can perform this action."
      );
    }
    return role;
  }

  async requireMember({ publicationId, userId }) {
    const role = await this.members.findRoleFor({ publicationId, userId });
    if (!role) {
      throw new ApiError(403, "Access denied. You are not a member of this publication.");
    }
    return role;
  }

  // --- Endpoints ---
  async createPublication({ name, customSlug, description, logoUrl, coverImage, ownerId }) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "Publication name is required");
    }

    const rawSlug = customSlug ? customSlug.toLowerCase().trim() : name;
    const base = baseSlug(rawSlug);

    if (!base || base.length < 2) {
      throw new ApiError(400, "Publication slug must be at least 2 characters long");
    }

    if (RESERVED_SLUGS.includes(base) || RESERVED_SLUGS.includes(rawSlug)) {
      throw new ApiError(400, `The slug '${rawSlug}' is reserved and cannot be used.`);
    }

    const slug = customSlug ? base : makeSlug(name);

    const existingPub = await this.pubs.findBySlug(slug, { includeArchived: true });
    if (existingPub) {
      throw new ApiError(400, "A publication with this slug already exists.");
    }

    const existingUserSubdomain = await User.findOne({ subdomain: slug });
    if (existingUserSubdomain) {
      throw new ApiError(400, "This slug collides with an existing subdomain namespace.");
    }

    const publication = await this.pubs.create({
      name: name.trim(),
      slug,
      description: description ? String(description).trim() : "",
      logoUrl: logoUrl || "",
      coverImage: coverImage || "",
      owner: ownerId,
    });

    await this.members.create({
      publication: publication._id,
      user: ownerId,
      role: "owner",
      invitedBy: ownerId,
    });

    return publication;
  }

  async getPublicationBySlug({ slug, viewerId }) {
    const publication = await this.pubs.findBySlug(slug, {
      includeArchived: false,
      populateOwner: true,
    });
    if (!publication) {
      throw new ApiError(404, "Publication not found");
    }

    const memberDocs = await this.members.listMembers(publication._id);
    const members = memberDocs.map((m) => ({
      id: m._id,
      user: m.user ? m.user.toPublicJSON() : null,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    const posts = await this.posts.findApprovedPublicationPosts(publication._id);
    const cardPosts = posts.map((p) => p.toCardJSON(viewerId));

    const viewerRole = viewerId
      ? await this.members.findRoleFor({ publicationId: publication._id, userId: viewerId })
      : null;

    return {
      publication,
      members,
      posts: cardPosts,
      viewerRole,
    };
  }

  async updatePublication({ slug, userId, fields }) {
    const publication = await this.pubs.findBySlug(slug, { includeArchived: false });
    if (!publication) throw new ApiError(404, "Publication not found");

    await this.requireOwnerOrEditor(
      { publicationId: publication._id, userId },
      "Only publication owners and editors can update settings."
    );

    const updated = await this.pubs.update(publication._id, fields);
    return updated;
  }

  async inviteMember({ slug, requesterId, username, role }) {
    if (!username) throw new ApiError(400, "Username is required");
    const targetRole = role || "writer";
    if (!["editor", "writer"].includes(targetRole)) {
      throw new ApiError(400, "Role must be 'editor' or 'writer'");
    }

    const publication = await this.pubs.findBySlug(slug, { includeArchived: false });
    if (!publication) throw new ApiError(404, "Publication not found");

    const requesterRole = await this.requireOwnerOrEditor(
      { publicationId: publication._id, userId: requesterId },
      "Only publication owners and editors can invite members."
    );

    if (targetRole === "editor" && requesterRole !== "owner") {
      throw new ApiError(403, "Only the publication owner can add editors.");
    }

    const targetUser = await User.findOne({ username: String(username).toLowerCase().trim() });
    if (!targetUser) throw new ApiError(404, "User to invite not found");

    const existingMember = await this.members.findByPublicationAndUser({
      publicationId: publication._id,
      userId: targetUser._id,
    });
    if (existingMember) {
      throw new ApiError(400, "User is already a member of this publication.");
    }

    const newMember = await this.members.create({
      publication: publication._id,
      user: targetUser._id,
      role: targetRole,
      invitedBy: requesterId,
    });

    return newMember;
  }

  async updateMemberRole({ slug, requesterId, targetUserId, newRole }) {
    if (!["owner", "editor", "writer"].includes(newRole)) {
      throw new ApiError(400, "Invalid role. Choose 'owner', 'editor', or 'writer'.");
    }

    const publication = await this.pubs.findBySlug(slug, { includeArchived: false });
    if (!publication) throw new ApiError(404, "Publication not found");

    await this.requireOwner({ publicationId: publication._id, userId: requesterId });

    const targetMember = await this.members.findByPublicationAndUser({
      publicationId: publication._id,
      userId: targetUserId,
    });
    if (!targetMember) throw new ApiError(404, "Member not found in this publication");

    if (targetMember.role === "owner" && newRole !== "owner") {
      const ownerCount = await this.members.countOwners(publication._id);
      if (ownerCount <= 1) {
        throw new ApiError(400, "Cannot demote the sole owner of a publication.");
      }
    }

    const updated = await this.members.updateRole({
      publicationId: publication._id,
      userId: targetUserId,
      role: newRole,
    });

    return updated;
  }

  async removeMember({ slug, requesterId, targetUserId }) {
    const publication = await this.pubs.findBySlug(slug, { includeArchived: false });
    if (!publication) throw new ApiError(404, "Publication not found");

    const isSelf = String(requesterId) === String(targetUserId);
    if (!isSelf) {
      await this.requireOwner({ publicationId: publication._id, userId: requesterId });
    }

    const targetMember = await this.members.findByPublicationAndUser({
      publicationId: publication._id,
      userId: targetUserId,
    });
    if (!targetMember) throw new ApiError(404, "Member not found in this publication");

    if (targetMember.role === "owner") {
      const ownerCount = await this.members.countOwners(publication._id);
      if (ownerCount <= 1) {
        throw new ApiError(400, "Cannot remove the sole owner of a publication.");
      }
    }

    await this.members.remove({ publicationId: publication._id, userId: targetUserId });
    return { isSelf };
  }

  async submitPost({ postSlug, publicationId, publicationSlug, authorId }) {
    const post = await this.posts.findBySlug(postSlug);
    if (!post) throw new ApiError(404, "Story not found");

    if (String(post.author) !== String(authorId)) {
      throw new ApiError(403, "You can only submit your own stories to a publication.");
    }

    let pub;
    if (publicationId) {
      pub = await this.pubs.findById(publicationId);
    } else if (publicationSlug) {
      pub = await this.pubs.findBySlug(publicationSlug, { includeArchived: true });
    }

    if (!pub || pub.isArchived) {
      throw new ApiError(404, "Publication not found");
    }

    const memberRole = await this.members.findRoleFor({ publicationId: pub._id, userId: authorId });
    if (!memberRole) {
      throw new ApiError(403, "You must be a member of this publication to submit stories.");
    }

    const updatedPost = await this.posts.submitPost({ postId: post._id, publicationId: pub._id });
    return updatedPost.toCardJSON(authorId);
  }

  async reviewSubmission({ pubSlug, postId, reviewerId, action, reviewNote }) {
    if (!["approve", "reject", "request_changes"].includes(action)) {
      throw new ApiError(400, "Invalid action. Must be 'approve', 'reject', or 'request_changes'.");
    }

    if (["reject", "request_changes"].includes(action) && (!reviewNote || !reviewNote.trim())) {
      throw new ApiError(400, `A review note is required when action is '${action}'.`);
    }

    const publication = await this.pubs.findBySlug(pubSlug, { includeArchived: false });
    if (!publication) throw new ApiError(404, "Publication not found");

    await this.requireOwnerOrEditor(
      { publicationId: publication._id, userId: reviewerId },
      "Only publication owners and editors can review submissions."
    );

    const post = await this.posts.findById(postId);
    if (!post) throw new ApiError(404, "Submitted story not found");

    if (String(post.publication) !== String(publication._id)) {
      throw new ApiError(400, "Story is not submitted to this publication.");
    }

    const statusMap = {
      approve: "approved",
      reject: "rejected",
      request_changes: "changes_requested",
    };

    const note = reviewNote ? String(reviewNote).trim() : "";
    const updatedPost = await this.posts.reviewSubmission({
      postId: post._id,
      status: statusMap[action],
      reviewNote: note,
    });

    return updatedPost.toCardJSON(reviewerId);
  }

  async withdrawSubmission({ postSlug, authorId }) {
    const post = await this.posts.findBySlug(postSlug);
    if (!post) throw new ApiError(404, "Story not found");

    if (String(post.author) !== String(authorId)) {
      throw new ApiError(403, "You can only withdraw your own submissions.");
    }

    const updatedPost = await this.posts.withdrawSubmission(post._id);
    return updatedPost.toCardJSON(authorId);
  }

  async getPublicationDashboard({ slug, userId }) {
    const publication = await this.pubs.findBySlug(slug, {
      includeArchived: false,
      populateOwner: true,
    });
    if (!publication) throw new ApiError(404, "Publication not found");

    const myRole = await this.requireMember({ publicationId: publication._id, userId });

    const memberDocs = await this.members.listMembers(publication._id);
    const members = memberDocs.map((m) => ({
      id: m._id,
      userId: m.user ? m.user._id : null,
      user: m.user ? m.user.toPublicJSON() : null,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    let submissions = [];
    if (["owner", "editor"].includes(myRole)) {
      const postDocs = await this.posts.findSubmissions(publication._id);
      submissions = postDocs.map((p) => p.toCardJSON(userId));
    }

    return {
      publication,
      members,
      submissions,
      myRole,
    };
  }

  async getMyPublications(userId) {
    const memberships = await this.members.findByUser(userId);
    const publications = memberships
      .filter((m) => m.publication && !m.publication.isArchived)
      .map((m) => ({
        id: m.publication._id,
        name: m.publication.name,
        slug: m.publication.slug,
        logoUrl: m.publication.logoUrl,
        role: m.role,
      }));

    return { publications };
  }
}

module.exports = PublicationService;
