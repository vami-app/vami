"use strict";

const { makeSlug } = require("../../utils/slugify");
const User = require("../../models/User");

class ReadingListService {
  constructor(readingListRepository, postRepository) {
    this.repo = readingListRepository;
    this.posts = postRepository;
  }

  async createList({ user, name, visibility }) {
    if (!name || !name.trim()) {
      return { error: 400, message: "List name is required" };
    }

    const slug = makeSlug(name);
    if (!slug) {
      return { error: 400, message: "Invalid list name" };
    }

    const existingList = await this.repo.findByOwnerAndSlug({
      ownerId: user._id,
      slug,
    });
    if (existingList) {
      return { error: 400, message: "You already have a reading list with this name." };
    }

    const list = await this.repo.create({
      owner: user._id,
      name: name.trim(),
      slug,
      visibility: visibility === "public" ? "public" : "private",
    });

    return { list };
  }

  async getMine({ user }) {
    const lists = await this.repo.findOwn(user._id);
    return { lists };
  }

  async getUserPublicLists({ username, viewer }) {
    const targetUser = await User.findOne({
      username: String(username).toLowerCase().trim(),
    });
    if (!targetUser) {
      return { error: 404, message: "User not found" };
    }

    const isOwner = viewer && String(viewer._id) === String(targetUser._id);
    const filter = {};
    if (!isOwner) {
      filter.visibility = "public";
    }

    const lists = await this.repo.findByOwner(targetUser._id, filter);
    return { lists };
  }

  async getSingleList({ username, slug, viewer }) {
    const ownerUser = await User.findOne({
      username: String(username).toLowerCase().trim(),
    });
    if (!ownerUser) {
      return { error: 404, message: "Reading list not found" };
    }

    const list = await this.repo.findByOwnerAndSlug({
      ownerId: ownerUser._id,
      slug,
    });
    if (!list) {
      return { error: 404, message: "Reading list not found" };
    }

    const isOwner = viewer && String(viewer._id) === String(ownerUser._id);
    if (list.visibility === "private" && !isOwner) {
      return { error: 404, message: "Reading list not found" };
    }

    await this.repo.populateListPosts(list);

    const viewerId = viewer ? viewer._id : null;

    const processedPosts = list.posts.map((item) => {
      const p = item.post;
      if (!p || p.moderationStatus === "hidden") {
        return {
          id: null,
          isRemoved: true,
          title: "[Content unavailable]",
          subtitle: "This story is no longer available or was removed.",
          addedAt: item.addedAt,
        };
      }
      const cardData = p.toCardJSON(viewerId);
      cardData.addedAt = item.addedAt;
      return cardData;
    });

    return {
      listData: {
        list: {
          id: list._id,
          name: list.name,
          slug: list.slug,
          visibility: list.visibility,
          owner: ownerUser.toPublicJSON(),
          createdAt: list.createdAt,
        },
        posts: processedPosts,
      },
    };
  }

  async updateList({ id, user, name, visibility }) {
    const list = await this.repo.findById(id);
    if (!list) {
      return { error: 404, message: "Reading list not found" };
    }

    if (String(list.owner) !== String(user._id)) {
      return { error: 403, message: "You can only update your own reading lists." };
    }

    if (name !== undefined && name.trim()) {
      list.name = name.trim();
      list.slug = makeSlug(name);
    }
    if (visibility !== undefined && ["public", "private"].includes(visibility)) {
      list.visibility = visibility;
    }

    await this.repo.save(list);
    return { list };
  }

  async addPostToList({ id, user, postId, postSlug }) {
    const list = await this.repo.findById(id);
    if (!list) {
      return { error: 404, message: "Reading list not found" };
    }

    if (String(list.owner) !== String(user._id)) {
      return { error: 403, message: "You can only add posts to your own reading lists." };
    }

    const post = await this.posts.findByIdOrSlug({ postId, postSlug });
    if (!post) {
      return { error: 404, message: "Story not found" };
    }

    if (post.status !== "published" || post.moderationStatus === "hidden") {
      return {
        error: 400,
        message: "Draft or hidden stories cannot be added to reading lists.",
      };
    }

    const exists = list.posts.some(
      (item) => String(item.post) === String(post._id)
    );
    if (!exists) {
      list.posts.push({ post: post._id, addedAt: new Date() });
      await this.repo.save(list);
    }

    return { list };
  }

  async removePostFromList({ id, user, postId }) {
    const list = await this.repo.findById(id);
    if (!list) {
      return { error: 404, message: "Reading list not found" };
    }

    if (String(list.owner) !== String(user._id)) {
      return { error: 403, message: "You can only edit your own reading lists." };
    }

    list.posts = list.posts.filter((item) => String(item.post) !== String(postId));
    await this.repo.save(list);

    return { list };
  }

  async deleteList({ id, user }) {
    const list = await this.repo.findById(id);
    if (!list) {
      return { error: 404, message: "Reading list not found" };
    }

    if (String(list.owner) !== String(user._id)) {
      return { error: 403, message: "You can only delete your own reading lists." };
    }

    await this.repo.delete(list);
    return { ok: true };
  }
}

module.exports = ReadingListService;
