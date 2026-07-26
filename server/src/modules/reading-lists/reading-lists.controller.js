"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../../utils/apiResponse");

class ReadingListController {
  constructor(readingListService) {
    this.service = readingListService;

    this.createList = this.createList.bind(this);
    this.getMine = this.getMine.bind(this);
    this.getUserPublicLists = this.getUserPublicLists.bind(this);
    this.getSingleList = this.getSingleList.bind(this);
    this.updateList = this.updateList.bind(this);
    this.addPostToList = this.addPostToList.bind(this);
    this.removePostFromList = this.removePostFromList.bind(this);
    this.deleteList = this.deleteList.bind(this);
  }

  createList = asyncHandler(async (req, res) => {
    const { name, visibility } = req.body;
    const result = await this.service.createList({ user: req.user, name, visibility });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 201, { list: result.list }, "Reading list created successfully");
  });

  getMine = asyncHandler(async (req, res) => {
    const result = await this.service.getMine({ user: req.user });
    return sendSuccess(res, 200, { lists: result.lists });
  });

  getUserPublicLists = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const result = await this.service.getUserPublicLists({ username, viewer: req.user });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, { lists: result.lists });
  });

  getSingleList = asyncHandler(async (req, res) => {
    const { username, slug } = req.params;
    const result = await this.service.getSingleList({ username, slug, viewer: req.user });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, result.listData);
  });

  updateList = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, visibility } = req.body;
    const result = await this.service.updateList({ id, user: req.user, name, visibility });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, { list: result.list }, "Reading list updated");
  });

  addPostToList = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { postId, postSlug } = req.body;
    const result = await this.service.addPostToList({ id, user: req.user, postId, postSlug });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, { list: result.list }, "Story added to reading list");
  });

  removePostFromList = asyncHandler(async (req, res) => {
    const { id, postId } = req.params;
    const result = await this.service.removePostFromList({ id, user: req.user, postId });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, { list: result.list }, "Story removed from reading list");
  });

  deleteList = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.deleteList({ id, user: req.user });
    if (result.error) {
      throw new ApiError(result.error, result.message);
    }
    return sendSuccess(res, 200, null, "Reading list deleted");
  });
}

module.exports = ReadingListController;
