"use strict";

const { ApiError } = require("../../utils/apiResponse");

function commentJSON(c) {
  const isSoftDeleted = c.deletedButHasReplies;
  return {
    id: c._id,
    content: isSoftDeleted ? "[deleted]" : c.content,
    author: isSoftDeleted
      ? {
          id: null,
          name: "Deleted User",
          username: "deleted",
          avatarUrl: "",
        }
      : (c.author && c.author.username
          ? {
              id: c.author._id,
              name: c.author.name,
              username: c.author.username,
              avatarUrl: c.author.avatarUrl,
            }
          : c.author),
    parentComment: c.parentComment || null,
    depth: c.depth || 0,
    deletedButHasReplies: isSoftDeleted,
    moderationStatus: c.moderationStatus || "visible",
    createdAt: c.createdAt,
  };
}

class CommentService {
  constructor(commentRepository, postRepository, notificationRepository) {
    this.repo = commentRepository;
    this.posts = postRepository;
    this.notifications = notificationRepository;
  }

  async listComments({ slug, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) throw new ApiError(404, "Story not found");

    const viewerId = viewer ? viewer._id : null;
    const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

    if (post.status === "draft" && !isAuthor) {
      throw new ApiError(404, "Story not found");
    }

    const comments = await this.repo.findByPost(post._id);
    return comments.map(commentJSON);
  }

  async addComment({ slug, viewer, content, parentComment }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) throw new ApiError(404, "Story not found");

    const viewerId = viewer ? viewer._id : null;
    const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

    if (post.status === "draft" && !isAuthor) {
      throw new ApiError(404, "Story not found");
    }

    let depth = 0;
    let parentId = null;

    if (parentComment) {
      const parentDoc = await this.repo.findById(parentComment);
      if (!parentDoc) {
        throw new ApiError(404, "Parent comment not found");
      }
      if (String(parentDoc.post) !== String(post._id)) {
        throw new ApiError(400, "Parent comment does not belong to this story");
      }
      parentId = parentDoc._id;
      depth = Math.min((parentDoc.depth || 0) + 1, 5);
    }

    const comment = await this.repo.create({
      post: post._id,
      author: viewer._id,
      content,
      parentComment: parentId,
      depth,
    });

    const recipientsNotified = new Set();

    // 1. Notify Post Author (comment) via notifications shim
    if (String(viewer._id) !== String(post.author)) {
      await this.notifications.createAndEmit({
        recipient: post.author,
        actor: viewer._id,
        type: parentId ? "reply" : "comment",
        targetType: "post",
        targetId: post._id,
      });
      recipientsNotified.add(String(post.author));
    }

    // 2. Notify Parent Comment Author (reply) if applicable and not already notified via notifications shim
    if (parentId) {
      const parent = await this.repo.findById(parentId);
      if (parent && String(viewer._id) !== String(parent.author) && !recipientsNotified.has(String(parent.author))) {
        await this.notifications.createAndEmit({
          recipient: parent.author,
          actor: viewer._id,
          type: "reply",
          targetType: "comment",
          targetId: parent._id,
        });
      }
    }

    return commentJSON(comment);
  }

  async deleteComment({ id, viewer }) {
    const comment = await this.repo.findById(id);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (String(comment.author) !== String(viewer._id)) {
      throw new ApiError(403, "You can only delete your own comments");
    }

    const hasReplies = await this.repo.hasReplies(comment._id);
    if (hasReplies) {
      const updated = await this.repo.softDelete(comment._id);
      return { softDeleted: true, comment: commentJSON(updated) };
    } else {
      await this.repo.hardDelete(comment._id);
      return { softDeleted: false, comment: null };
    }
  }
}

module.exports = { CommentService, commentJSON };
