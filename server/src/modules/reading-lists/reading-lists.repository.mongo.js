"use strict";

const IReadingListRepository = require("./reading-lists.repository.interface");
const ReadingList = require("./reading-lists.model");

const AUTHOR_FIELDS = "name username avatarUrl bio";

class MongoReadingListRepository extends IReadingListRepository {
  async create({ owner, name, slug, visibility }) {
    return ReadingList.create({
      owner,
      name,
      slug,
      visibility,
    });
  }

  async findOwn(ownerId) {
    return ReadingList.find({ owner: ownerId }).sort({ updatedAt: -1 });
  }

  async findByOwner(ownerId, filter = {}) {
    return ReadingList.find({ owner: ownerId, ...filter }).sort({ updatedAt: -1 });
  }

  async findByOwnerAndSlug({ ownerId, slug }) {
    return ReadingList.findOne({ owner: ownerId, slug });
  }

  async findById(id) {
    return ReadingList.findById(id);
  }

  async findByIdAndOwner({ id, ownerId }) {
    const list = await ReadingList.findById(id);
    if (!list) return null;
    if (String(list.owner) !== String(ownerId)) return null;
    return list;
  }

  async populateListPosts(listDoc) {
    await listDoc.populate({
      path: "posts.post",
      populate: { path: "author", select: AUTHOR_FIELDS },
    });
    return listDoc;
  }

  async save(listDoc) {
    return listDoc.save();
  }

  async delete(listDoc) {
    return listDoc.deleteOne();
  }

  async deleteManyByOwner(ownerId) {
    return ReadingList.deleteMany({ owner: ownerId });
  }
}

module.exports = MongoReadingListRepository;
