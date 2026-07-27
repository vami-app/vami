"use strict";

class PostRevisionService {
  constructor(postRevisionRepository, postRepository) {
    this.repo = postRevisionRepository;
    this.posts = postRepository;
  }

  async listRevisions({ slug, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) {
      return { error: 404, message: "Story not found" };
    }

    const authorId = post.author ? (post.author._id || post.author) : null;
    if (String(authorId) !== String(viewer._id)) {
      return { error: 403, message: "You can only view revisions of your own stories" };
    }

    const revisions = await this.repo.findByPost({ postId: post._id });
    return { revisions };
  }

  async getRevisionDetails({ slug, revisionId, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) {
      return { error: 404, message: "Story not found" };
    }

    const authorId = post.author ? (post.author._id || post.author) : null;
    if (String(authorId) !== String(viewer._id)) {
      return { error: 403, message: "You can only view revisions of your own stories" };
    }

    const revision = await this.repo.findByIdAndPost({ id: revisionId, postId: post._id });
    if (!revision) {
      return { error: 404, message: "Revision not found" };
    }

    return { revision };
  }

  async restoreRevision({ slug, revisionId, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) {
      return { error: 404, message: "Story not found" };
    }

    const authorId = post.author ? (post.author._id || post.author) : null;
    if (String(authorId) !== String(viewer._id)) {
      return { error: 403, message: "You can only restore revisions of your own stories" };
    }

    const revision = await this.repo.findByIdAndPost({ id: revisionId, postId: post._id });
    if (!revision) {
      return { error: 404, message: "Revision not found" };
    }

    // Snapshot the CURRENT state as a new revision (making this restore action undoable)
    await this.repo.createSnapshot({
      post: post._id,
      title: post.title,
      subtitle: post.subtitle,
      contentHtml: post.contentHtml,
      tags: post.tags,
      coverImage: post.coverImage,
      editedBy: viewer._id,
      aiAssisted: post.aiAssisted || "unspecified",
    });

    // Apply revision content
    post.title = revision.title;
    post.subtitle = revision.subtitle;
    post.contentHtml = revision.contentHtml;
    post.tags = revision.tags;
    post.coverImage = revision.coverImage;
    if (revision.aiAssisted && revision.aiAssisted !== "unspecified") {
      post.aiAssisted = revision.aiAssisted;
    }

    await post.save();

    // Prune revisions to keep max 50
    await this.repo.pruneOldRevisions({ postId: post._id, maxCount: 50 });

    return { post: post.toCardJSON(viewer._id) };
  }
}

module.exports = PostRevisionService;
