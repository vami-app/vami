"use strict";

const Post = require("./posts.model");
const IPostRepository = require("./posts.repository.interface");

const USER_FIELDS = "name username avatarUrl bio";

/**
 * Size-20 bounded min-heap for O(t log 20) top tag extraction (§4.2).
 */
class TagMinHeap {
  constructor(maxSize = 20) {
    this.maxSize = maxSize;
    this.heap = [];
  }

  _isSmaller(a, b) {
    if (a.count !== b.count) {
      return a.count < b.count;
    }
    return a._id.localeCompare(b._id) > 0;
  }

  push(item) {
    if (this.heap.length < this.maxSize) {
      this.heap.push(item);
      this._up(this.heap.length - 1);
    } else if (this._isSmaller(this.heap[0], item)) {
      this.heap[0] = item;
      this._down(0);
    }
  }

  _up(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this._isSmaller(this.heap[i], this.heap[p])) {
        [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
        i = p;
      } else {
        break;
      }
    }
  }

  _down(i) {
    const len = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < len && this._isSmaller(this.heap[left], this.heap[smallest])) {
        smallest = left;
      }
      if (right < len && this._isSmaller(this.heap[right], this.heap[smallest])) {
        smallest = right;
      }
      if (smallest !== i) {
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
        i = smallest;
      } else {
        break;
      }
    }
  }

  getSortedResults() {
    return [...this.heap].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a._id.localeCompare(b._id);
    });
  }
}

class MongoPostRepository extends IPostRepository {
  // Core (§2.1)

  async findVisibleFeed({ cursor, limit = 10, tag, authorId, search }) {
    const query = Post.visibleQuery();

    if (tag) {
      query.tags = tag;
    }
    if (authorId) {
      query.author = authorId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (cursor) {
      const cursorDoc = await Post.findById(cursor).select("publishedAt");
      if (cursorDoc && cursorDoc.publishedAt) {
        query.$or = [
          { publishedAt: { $lt: cursorDoc.publishedAt } },
          { publishedAt: cursorDoc.publishedAt, _id: { $lt: cursorDoc._id } },
        ];
      }
    }

    const posts = await Post.find(query)
      .sort({ publishedAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("author", USER_FIELDS);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id : null;

    return { posts: items, nextCursor, hasMore };
  }

  async create(data) {
    const post = await Post.create(data);
    await post.populate("author", USER_FIELDS);
    return post;
  }

  async findBySlug(slug, { includeUnpublished = false } = {}) {
    const query = { slug };
    if (!includeUnpublished) {
      query.status = "published";
      query.moderationStatus = "visible";
    }
    return Post.findOne(query).populate("author", USER_FIELDS);
  }

  async findById(id) {
    return Post.findById(id).populate("author", USER_FIELDS);
  }

  async findByIdAndAuthor({ id, authorId }) {
    return Post.findOne({ _id: id, author: authorId });
  }

  async update({ id, fields }) {
    const post = await Post.findById(id);
    if (!post) return null;

    Object.assign(post, fields);
    await post.save();
    await post.populate("author", USER_FIELDS);
    return post;
  }

  async deleteBySlug(slug) {
    return Post.findOneAndDelete({ slug });
  }

  async incrementViewCount(id) {
    return Post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  }

  async incrementClap({ slug, userId, count }) {
    const post = await Post.findOne({ slug });
    if (!post) return null;

    const existingClap = post.claps.find((c) => String(c.user) === String(userId));
    const currentCount = existingClap ? existingClap.count : 0;
    const allowedAdd = Math.min(count, 50 - currentCount);

    if (allowedAdd <= 0) {
      return { post, added: 0, totalUserClaps: currentCount };
    }

    if (existingClap) {
      existingClap.count += allowedAdd;
    } else {
      post.claps.push({ user: userId, count: allowedAdd });
    }

    post.totalClaps = post.claps.reduce((sum, c) => sum + c.count, 0);
    await post.save();
    await post.populate("author", USER_FIELDS);

    return { post, added: allowedAdd, totalUserClaps: currentCount + allowedAdd };
  }

  async findRelated({ postId, tags, limit = 3 }) {
    if (!tags || tags.length === 0) return [];
    return Post.find(
      Post.visibleQuery({
        _id: { $ne: postId },
        tags: { $in: tags },
      })
    )
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("author", USER_FIELDS);
  }

  async findSitemapProjection() {
    return Post.find(Post.visibleQuery())
      .select("slug updatedAt publishedAt")
      .sort({ publishedAt: -1 });
  }

  // Cross-module (§2.2 #19-23)

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

  async findByIdOrSlug({ postId, postSlug }) {
    if (postId) {
      return Post.findById(postId);
    }
    if (postSlug) {
      return Post.findOne({ slug: postSlug });
    }
    return null;
  }

  // Other-domain (§2.2 #12-18)

  async findForRSS({ scope, value, limit = 50 }) {
    const query = Post.visibleQuery();
    if (scope === "author") {
      const User = require("../users/users.model");
      const user = await User.findOne({ username: value.toLowerCase().trim() });
      if (!user) return { author: null, posts: [] };
      query.author = user._id;
      const posts = await Post.find(query)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate("author", USER_FIELDS);
      return { author: user, posts };
    }
    if (scope === "tag") {
      query.tags = value.toLowerCase().trim();
    }
    const posts = await Post.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("author", USER_FIELDS);
    return { posts };
  }

  async findForAdmin(id) {
    return Post.findById(id);
  }

  async setModerationVisibility({ id, hidden }) {
    const status = hidden ? "hidden" : "visible";
    return Post.findByIdAndUpdate(id, { moderationStatus: status }, { new: true });
  }

  async findForTelemetry(slug) {
    return Post.findOne({ slug }).populate("author", USER_FIELDS);
  }

  async findByAuthorForLedger(authorId) {
    return Post.find({ author: authorId }).select("_id views totalClaps publishedAt title slug");
  }

  async findByAuthorForAnalytics(authorId) {
    return Post.find({ author: authorId }).select("_id title slug views totalClaps publishedAt status");
  }

  // Candidate assembly (§2.3 #25)

  async findCandidatesForRecommendation() {
    return Post.find(Post.visibleQuery())
      .sort({ publishedAt: -1 })
      .limit(100)
      .populate("author", USER_FIELDS);
  }

  async findTagCountsInWindow(days = 7, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const groups = await Post.aggregate([
      { $match: { status: "published", moderationStatus: "visible", publishedAt: { $gte: since } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
    ]);

    const minHeap = new TagMinHeap(20);
    for (const group of groups) {
      minHeap.push(group);
    }
    const topGroups = minHeap.getSortedResults().slice(0, limit);
    return topGroups.map((r) => ({ tag: r._id, count: r.count }));
  }

  async findTagsByPrefix(prefix = "", limit = 10) {
    const PrefixTrie = require("../../utils/trie");
    const distinctTags = await Post.distinct("tags");
    const trie = new PrefixTrie();
    trie.insertMany(distinctTags);
    return trie.autocomplete(prefix, limit);
  }

  // Cascade (§2.4)


  async findIdsByAuthor(authorId) {
    const posts = await Post.find({ author: authorId }).select("_id");
    return posts.map((p) => p._id);
  }

  async deleteManyByAuthor(authorId) {
    return Post.deleteMany({ author: authorId });
  }

  async findByClapperAndRecompute(userId) {
    const clappedPosts = await Post.find({ "claps.user": userId });
    for (const post of clappedPosts) {
      post.claps = post.claps.filter((c) => String(c.user) !== String(userId));
      post.totalClaps = post.claps.reduce((sum, c) => sum + c.count, 0);
      await post.save();
    }
  }

  // Scheduling (§2.3 #24)

  async findDueScheduled(now = new Date()) {
    return Post.find({
      status: "draft",
      scheduledAt: { $ne: null, $lte: now },
    });
  }

  async publishScheduled(id) {
    const post = await Post.findById(id);
    if (!post) return null;
    post.status = "published";
    post.publishedAt = new Date();
    post.scheduledAt = null;
    await post.save();
    await post.populate("author", USER_FIELDS);
    return post;
  }
}

module.exports = MongoPostRepository;
