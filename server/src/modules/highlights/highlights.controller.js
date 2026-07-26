"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../../utils/apiResponse");

function createHighlightController(highlightService) {
  const createHighlight = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { quote, contextBefore, contextAfter, note } = req.body;

    const result = await highlightService.createHighlight({
      slug,
      viewer: req.user,
      quote,
      contextBefore,
      contextAfter,
      note,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 201, { highlight: result.highlight }, "Highlight created");
  });

  const getPostHighlights = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const result = await highlightService.getPostHighlights({
      slug,
      viewer: req.user,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, { highlights: result.highlights }, "Highlights retrieved");
  });

  const updateHighlight = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    const result = await highlightService.updateHighlight({
      id,
      viewer: req.user,
      note,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, { highlight: result.highlight }, "Highlight updated");
  });

  const deleteHighlight = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await highlightService.deleteHighlight({
      id,
      viewer: req.user,
    });

    if (result.error) {
      throw new ApiError(result.error, result.message);
    }

    return sendSuccess(res, 200, null, "Highlight deleted");
  });

  return {
    createHighlight,
    getPostHighlights,
    updateHighlight,
    deleteHighlight,
  };
}

module.exports = createHighlightController;
