"use strict";

const { canReadFull } = require("../../utils/entitlement");

class HighlightService {
  constructor(highlightRepository, postRepository) {
    this.repo = highlightRepository;
    this.posts = postRepository;
  }

  async createHighlight({ slug, viewer, quote, contextBefore, contextAfter, note }) {
    if (!quote || typeof quote !== "string" || !quote.trim()) {
      return { error: 400, message: "Highlight quote is required" };
    }

    const post = await this.posts.findBySlug(slug);
    if (!post) {
      return { error: 404, message: "Post not found" };
    }

    if (!canReadFull(post, viewer)) {
      return { error: 403, message: "You must be an active subscriber or author to highlight locked stories" };
    }

    const highlight = await this.repo.create({
      owner: viewer._id,
      post: post._id,
      quote: quote.trim(),
      contextBefore: contextBefore || "",
      contextAfter: contextAfter || "",
      note: note ? note.trim() : "",
    });

    return { highlight };
  }

  async getPostHighlights({ slug, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) {
      return { error: 404, message: "Post not found" };
    }

    const highlights = await this.repo.findOwnByPost({
      ownerId: viewer._id,
      postId: post._id,
    });

    return { highlights };
  }

  async updateHighlight({ id, viewer, note }) {
    const existing = await this.repo.findByIdAndOwner({ id, ownerId: viewer._id });
    if (!existing) {
      return { error: 404, message: "Highlight not found" };
    }

    const updated = await this.repo.updateNote({ id, ownerId: viewer._id, note });
    return { highlight: updated };
  }

  async deleteHighlight({ id, viewer }) {
    const existing = await this.repo.findByIdAndOwner({ id, ownerId: viewer._id });
    if (!existing) {
      return { error: 404, message: "Highlight not found" };
    }

    await this.repo.deleteByIdAndOwner({ id, ownerId: viewer._id });
    return { ok: true };
  }
}

module.exports = HighlightService;
