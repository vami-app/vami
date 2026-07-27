"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

class PublicationController {
  constructor(publicationService) {
    this.service = publicationService;
  }

  create = asyncHandler(async (req, res) => {
    const { name, slug, description, logoUrl, coverImage } = req.body;
    const publication = await this.service.createPublication({
      name,
      customSlug: slug,
      description,
      logoUrl,
      coverImage,
      ownerId: req.user._id,
    });
    return sendSuccess(res, 201, { publication }, "Publication created successfully");
  });

  getBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const viewerId = req.user ? req.user._id : null;
    const data = await this.service.getPublicationBySlug({ slug, viewerId });
    return sendSuccess(res, 200, data);
  });

  update = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { name, description, logoUrl, coverImage } = req.body;
    const publication = await this.service.updatePublication({
      slug,
      userId: req.user._id,
      fields: { name, description, logoUrl, coverImage },
    });
    return sendSuccess(res, 200, { publication }, "Publication updated successfully");
  });

  invite = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { username, role } = req.body;
    const member = await this.service.inviteMember({
      slug,
      requesterId: req.user._id,
      username,
      role,
    });
    return sendSuccess(res, 201, { member }, "Member invited successfully");
  });

  updateRole = asyncHandler(async (req, res) => {
    const { slug, userId } = req.params;
    const { role } = req.body;
    const member = await this.service.updateMemberRole({
      slug,
      requesterId: req.user._id,
      targetUserId: userId,
      newRole: role,
    });
    return sendSuccess(res, 200, { member }, "Member role updated successfully");
  });

  remove = asyncHandler(async (req, res) => {
    const { slug, userId } = req.params;
    const { isSelf } = await this.service.removeMember({
      slug,
      requesterId: req.user._id,
      targetUserId: userId,
    });
    return sendSuccess(
      res,
      200,
      null,
      isSelf ? "Left publication successfully" : "Member removed successfully"
    );
  });

  submit = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { publicationId, publicationSlug } = req.body;
    const post = await this.service.submitPost({
      postSlug: slug,
      publicationId,
      publicationSlug,
      authorId: req.user._id,
    });
    return sendSuccess(res, 200, { post }, "Story submitted for review");
  });

  review = asyncHandler(async (req, res) => {
    const { pubSlug, postId } = req.params;
    const { action, reviewNote } = req.body;
    const post = await this.service.reviewSubmission({
      pubSlug,
      postId,
      reviewerId: req.user._id,
      action,
      reviewNote,
    });
    return sendSuccess(res, 200, { post }, `Submission ${action}d successfully`);
  });

  withdraw = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const post = await this.service.withdrawSubmission({
      postSlug: slug,
      authorId: req.user._id,
    });
    return sendSuccess(res, 200, { post }, "Submission withdrawn");
  });

  dashboard = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.getPublicationDashboard({
      slug,
      userId: req.user._id,
    });
    return sendSuccess(res, 200, data);
  });

  mine = asyncHandler(async (req, res) => {
    const data = await this.service.getMyPublications(req.user._id);
    return sendSuccess(res, 200, data);
  });
}

module.exports = PublicationController;
