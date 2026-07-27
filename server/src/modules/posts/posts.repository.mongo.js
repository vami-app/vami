"use strict";

const Post = require("../../models/Post");

const USER_FIELDS = "name username avatarUrl bio";

class MongoPostRepository {
  async findBySlug(slug) {
    return Post.findOne({ slug });
  }

  async findById(id) {
    return Post.findById(id);
  }

  async findByIdOrSlug({ postId, postSlug }) {
    if (postId) {
      return Post.findById(postId);
    }
    if (postSlug) {
      return Post.findOne({ slug: postSlug });
    }
    return null;
  }

  async findApprovedPublicationPosts(publicationId) {
    return Post.find(
      Post.visibleQuery({ publication: publicationId, submissionStatus: "approved" })
    )
      .sort({ publishedAt: -1, _id: -1 })
      .populate("author", USER_FIELDS);
  }

  async findSubmissions(publicationId) {
    return Post.find({
      publication: publicationId,
      submissionStatus: { $in: ["pending", "changes_requested"] },
    })
      .sort({ updatedAt: -1 })
      .populate("author", USER_FIELDS);
  }

  async submitPost({ postId, publicationId }) {
    const post = await Post.findById(postId);
    if (!post) return null;
    post.publication = publicationId;
    post.submissionStatus = "pending";
    post.reviewNote = "";
    await post.save();
    await post.populate("author", USER_FIELDS);
    return post;
  }

  async reviewSubmission({ postId, status, reviewNote }) {
    const post = await Post.findById(postId);
    if (!post) return null;
    post.submissionStatus = status;
    post.reviewNote = reviewNote;
    await post.save();
    await post.populate("author", USER_FIELDS);
    return post;
  }

  async withdrawSubmission(postId) {
    const post = await Post.findById(postId);
    if (!post) return null;
    post.publication = null;
    post.submissionStatus = "none";
    post.reviewNote = "";
    await post.save();
    return post;
  }
}

module.exports = MongoPostRepository;
