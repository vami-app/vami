"use strict";

const IHighlightRepository = require("./highlights.repository.interface");
const Highlight = require("./highlights.model");

class MongoHighlightRepository extends IHighlightRepository {
  async create({ owner, post, quote, contextBefore = "", contextAfter = "", note = "" }) {
    return Highlight.create({
      owner,
      post,
      quote,
      contextBefore,
      contextAfter,
      note,
    });
  }

  async findOwnByPost({ ownerId, postId }) {
    return Highlight.find({
      post: postId,
      owner: ownerId,
    }).sort({ createdAt: 1 });
  }

  async findByIdAndOwner({ id, ownerId }) {
    return Highlight.findOne({
      _id: id,
      owner: ownerId,
    });
  }

  async updateNote({ id, ownerId, note }) {
    const highlight = await Highlight.findOne({ _id: id, owner: ownerId });
    if (!highlight) return null;
    if (note !== undefined) {
      highlight.note = String(note).trim();
    }
    await highlight.save();
    return highlight;
  }

  async deleteByIdAndOwner({ id, ownerId }) {
    const highlight = await Highlight.findOne({ _id: id, owner: ownerId });
    if (!highlight) return false;
    await highlight.deleteOne();
    return true;
  }

  async deleteManyByPostIds(postIds) {
    return Highlight.deleteMany({ post: { $in: postIds } });
  }

  async deleteManyByOwner(ownerId) {
    return Highlight.deleteMany({ owner: ownerId });
  }
}

module.exports = MongoHighlightRepository;
