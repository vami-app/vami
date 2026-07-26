"use strict";

const Post = require("../../models/Post");

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
}

module.exports = MongoPostRepository;
