"use strict";

class IPostRevisionRepository {
  async createSnapshot({ post, title, subtitle, contentHtml, tags, coverImage, editedBy }) {
    throw new Error("not implemented");
  }

  async findByPost({ postId }) {
    throw new Error("not implemented");
  }

  async findByIdAndPost({ id, postId }) {
    throw new Error("not implemented");
  }

  async countByPost({ postId }) {
    throw new Error("not implemented");
  }

  async pruneOldRevisions({ postId, maxCount = 50 }) {
    throw new Error("not implemented");
  }

  async deleteManyByPostIds(postIds) {
    throw new Error("not implemented");
  }
}

module.exports = IPostRevisionRepository;
