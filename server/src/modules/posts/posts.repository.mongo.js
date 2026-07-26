"use strict";

const Post = require("../../models/Post");

class MongoPostRepository {
  async findBySlug(slug) {
    return Post.findOne({ slug });
  }
}

module.exports = MongoPostRepository;
