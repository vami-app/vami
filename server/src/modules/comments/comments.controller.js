"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

class CommentController {
  constructor(commentService) {
    this.service = commentService;
  }

  list = asyncHandler(async (req, res) => {
    const comments = await this.service.listComments({
      slug: req.params.slug,
      viewer: req.user,
    });
    return sendSuccess(res, 200, { comments });
  });

  create = asyncHandler(async (req, res) => {
    const comment = await this.service.addComment({
      slug: req.params.slug,
      viewer: req.user,
      content: req.body.content,
      parentComment: req.body.parentComment,
    });
    return sendSuccess(res, 201, { comment }, "Response added");
  });

  remove = asyncHandler(async (req, res) => {
    const result = await this.service.deleteComment({
      id: req.params.id,
      viewer: req.user,
    });

    if (result.softDeleted) {
      return sendSuccess(res, 200, { comment: result.comment }, "Comment soft-deleted");
    } else {
      return sendSuccess(res, 200, null, "Comment deleted");
    }
  });
}

module.exports = CommentController;
