"use strict";

class IPostRepository {
  // Core (§2.1)
  async findVisibleFeed({ cursor, limit, tag, authorId, search }) {}
  async create(data) {}
  async findBySlug(slug, options = {}) {}
  async findById(id) {}
  async findByIdAndAuthor({ id, authorId }) {}
  async update({ id, fields }) {}
  async deleteBySlug(slug) {}
  async incrementViewCount(id) {}
  async incrementClap({ slug, userId, count }) {}
  async findRelated({ postId, tags, limit }) {}
  async findSitemapProjection() {}

  // Cross-module (§2.2 #19-23)
  async findApprovedPublicationPosts(publicationId) {}
  async findSubmissions(publicationId) {}
  async submitPost({ postId, publicationId }) {}
  async reviewSubmission({ postId, status, reviewNote }) {}
  async withdrawSubmission(postId) {}
  async findByIdOrSlug({ postId, postSlug }) {}

  // Other-domain (§2.2 #12-18)
  async findForRSS({ scope, value, limit }) {}
  async findForAdmin(id) {}
  async setModerationVisibility({ id, hidden }) {}
  async findForTelemetry(slug) {}
  async findByAuthorForLedger(authorId) {}
  async findByAuthorForAnalytics(authorId) {}

  // Candidate assembly (§2.3 #25 & §4.6)
  async findCandidatesForRecommendation() {}
  async findTagCountsInWindow(days) {}
  async findTagsByPrefix(prefix, limit) {}


  // Cascade (§2.4)
  async findIdsByAuthor(authorId) {}
  async deleteManyByAuthor(authorId) {}
  async findByClapperAndRecompute(userId) {}

  // Scheduling (§2.3 #24)
  async findDueScheduled(now) {}
  async publishScheduled(id) {}
}

module.exports = IPostRepository;
