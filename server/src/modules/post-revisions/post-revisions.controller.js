"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../../utils/apiResponse");

function createPostRevisionController(postRevisionService) {
  const listRevisions = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await postRevisionService.listRevisions({
      slug,
      viewer: req.user,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, { revisions: result.revisions });
  });

  const getRevisionDetails = asyncHandler(async (req, res) => {
    const { slug, revisionId } = req.params;
    const result = await postRevisionService.getRevisionDetails({
      slug,
      revisionId,
      viewer: req.user,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, { revision: result.revision });
  });

  const restoreRevision = asyncHandler(async (req, res) => {
    const { slug, revisionId } = req.params;
    const result = await postRevisionService.restoreRevision({
      slug,
      revisionId,
      viewer: req.user,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, { post: result.post }, "Revision restored successfully.");
  });

  return {
    listRevisions,
    getRevisionDetails,
    restoreRevision,
  };
}

module.exports = createPostRevisionController;
