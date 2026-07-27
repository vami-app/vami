"use strict";

class ICommentRepository {
  async create(data) { throw new Error("not implemented"); }
  async findByPost(postId) { throw new Error("not implemented"); }
  async findById(id) { throw new Error("not implemented"); }
  async findByIdAndAuthor({ id, authorId }) { throw new Error("not implemented"); }
  async hasReplies(commentId) { throw new Error("not implemented"); }
  async softDelete(commentId) { throw new Error("not implemented"); }
  async hardDelete(commentId) { throw new Error("not implemented"); }
  async deleteManyByPostIds(postIds) { throw new Error("not implemented"); }
  async findOtherCommentsByAuthor(authorId, postIds) { throw new Error("not implemented"); }
  async anonymizeAndSoftDelete(commentId, deletedUserId) { throw new Error("not implemented"); }
}

module.exports = ICommentRepository;
