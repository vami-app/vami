"use strict";

class IHighlightRepository {
  async create({ owner, post, quote, contextBefore, contextAfter, note }) {
    throw new Error("IHighlightRepository.create not implemented");
  }
  async findOwnByPost({ ownerId, postId }) {
    throw new Error("IHighlightRepository.findOwnByPost not implemented");
  }
  async findByIdAndOwner({ id, ownerId }) {
    throw new Error("IHighlightRepository.findByIdAndOwner not implemented");
  }
  async updateNote({ id, ownerId, note }) {
    throw new Error("IHighlightRepository.updateNote not implemented");
  }
  async deleteByIdAndOwner({ id, ownerId }) {
    throw new Error("IHighlightRepository.deleteByIdAndOwner not implemented");
  }
  async deleteManyByPostIds(postIds) {
    throw new Error("IHighlightRepository.deleteManyByPostIds not implemented");
  }
  async deleteManyByOwner(ownerId) {
    throw new Error("IHighlightRepository.deleteManyByOwner not implemented");
  }
}

module.exports = IHighlightRepository;
