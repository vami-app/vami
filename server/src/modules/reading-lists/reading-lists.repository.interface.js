"use strict";

class IReadingListRepository {
  async create({ owner, name, slug, visibility }) {
    throw new Error("Method not implemented");
  }

  async findOwn(ownerId) {
    throw new Error("Method not implemented");
  }

  async findByOwner(ownerId, filter = {}) {
    throw new Error("Method not implemented");
  }

  async findByOwnerAndSlug({ ownerId, slug }) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async findByIdAndOwner({ id, ownerId }) {
    throw new Error("Method not implemented");
  }

  async save(listDoc) {
    throw new Error("Method not implemented");
  }

  async delete(listDoc) {
    throw new Error("Method not implemented");
  }

  async deleteManyByOwner(ownerId) {
    throw new Error("Method not implemented");
  }
}

module.exports = IReadingListRepository;
