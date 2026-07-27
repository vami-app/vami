"use strict";

const ICommentRepository = require("./comments.repository.interface");
const Comment = require("./comments.model");

const AUTHOR_FIELDS = "name username avatarUrl";

class MongoCommentRepository extends ICommentRepository {
  async create(data) {
    const comment = await Comment.create(data);
    await comment.populate("author", AUTHOR_FIELDS);
    return comment;
  }

  async findByPost(postId) {
    return Comment.find({ post: postId, moderationStatus: "visible" })
      .sort({ createdAt: 1 })
      .populate("author", AUTHOR_FIELDS);
  }

  async findById(id) {
    return Comment.findById(id);
  }

  async findByIdAndAuthor({ id, authorId }) {
    return Comment.findOne({ _id: id, author: authorId });
  }

  async hasReplies(commentId) {
    const exists = await Comment.exists({ parentComment: commentId });
    return Boolean(exists);
  }

  async softDelete(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) return null;
    comment.content = "[deleted]";
    comment.deletedButHasReplies = true;
    await comment.save();
    return comment;
  }

  async hardDelete(commentId) {
    return Comment.deleteOne({ _id: commentId });
  }

  async deleteManyByPostIds(postIds) {
    return Comment.deleteMany({ post: { $in: postIds } });
  }

  async findOtherCommentsByAuthor(authorId, postIds) {
    return Comment.find({ author: authorId, post: { $nin: postIds } });
  }

  async anonymizeAndSoftDelete(commentId, deletedUserId) {
    const comment = await Comment.findById(commentId);
    if (!comment) return null;
    comment.content = "[deleted]";
    comment.deletedButHasReplies = true;
    comment.author = deletedUserId;
    await comment.save();
    return comment;
  }
}

module.exports = MongoCommentRepository;
