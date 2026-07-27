"use strict";

class IPublicationRepository {
  async create(data) { throw new Error("not implemented"); }
  async findBySlug(slug, options) { throw new Error("not implemented"); }
  async findById(id) { throw new Error("not implemented"); }
  async update(id, fields) { throw new Error("not implemented"); }
  async archive(id) { throw new Error("not implemented"); }
  async updateOwner(id, newOwnerId) { throw new Error("not implemented"); }
}

module.exports = IPublicationRepository;
