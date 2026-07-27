"use strict";

const IPublicationRepository = require("./publications.repository.interface");
const Publication = require("./publications.model");

const USER_FIELDS = "name username avatarUrl bio";

class MongoPublicationRepository extends IPublicationRepository {
  async create({ name, slug, description, logoUrl, coverImage, owner }) {
    return Publication.create({
      name,
      slug,
      description,
      logoUrl,
      coverImage,
      owner,
    });
  }

  async findBySlug(slug, { includeArchived = false, populateOwner = false } = {}) {
    const query = { slug };
    if (!includeArchived) query.isArchived = false;

    let req = Publication.findOne(query);
    if (populateOwner) {
      req = req.populate("owner", USER_FIELDS);
    }
    return req;
  }

  async findById(id) {
    return Publication.findById(id);
  }

  async update(id, fields) {
    const publication = await Publication.findById(id);
    if (!publication) return null;

    if (fields.name !== undefined) publication.name = fields.name;
    if (fields.description !== undefined) publication.description = fields.description;
    if (fields.logoUrl !== undefined) publication.logoUrl = fields.logoUrl;
    if (fields.coverImage !== undefined) publication.coverImage = fields.coverImage;

    await publication.save();
    return publication;
  }

  async archive(id) {
    return Publication.updateOne({ _id: id }, { isArchived: true });
  }

  async updateOwner(id, newOwnerId) {
    return Publication.updateOne({ _id: id }, { owner: newOwnerId });
  }
}

module.exports = MongoPublicationRepository;
