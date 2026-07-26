"use strict";

const IPostRevisionRepository = require("./post-revisions.repository.interface");
const PostRevision = require("./post-revisions.model");

class MongoPostRevisionRepository extends IPostRevisionRepository {
  async createSnapshot({ post, title, subtitle, contentHtml, tags, coverImage, editedBy }) {
    return await PostRevision.create({
      post,
      title,
      subtitle,
      contentHtml,
      tags,
      coverImage,
      editedBy,
    });
  }

  async findByPost({ postId }) {
    return await PostRevision.find({ post: postId })
      .sort({ createdAt: -1 })
      .select("_id createdAt editedBy")
      .populate("editedBy", "name username avatarUrl");
  }

  async findByIdAndPost({ id, postId }) {
    return await PostRevision.findOne({ _id: id, post: postId })
      .populate("editedBy", "name username avatarUrl");
  }

  async countByPost({ postId }) {
    return await PostRevision.countDocuments({ post: postId });
  }

  async pruneOldRevisions({ postId, maxCount = 50 }) {
    const revisionsCount = await this.countByPost({ postId });
    if (revisionsCount > maxCount) {
      const oldestRevisions = await PostRevision.find({ post: postId })
        .sort({ createdAt: 1 })
        .limit(revisionsCount - maxCount);
      const oldestIds = oldestRevisions.map((r) => r._id);
      await PostRevision.deleteMany({ _id: { $in: oldestIds } });
    }
  }

  async deleteManyByPostIds(postIds) {
    return await PostRevision.deleteMany({ post: { $in: postIds } });
  }
}

module.exports = MongoPostRevisionRepository;
