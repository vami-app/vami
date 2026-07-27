"use strict";

const { ApiError } = require("../../utils/apiResponse");
const { makeSlug } = require("../../utils/slugify");
const { sanitizeContent } = require("../../utils/sanitize");
const { notifyFollowersOfNewPost } = require("../../utils/notify");
const { canReadFull } = require("../../utils/entitlement");

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
    ),
  ].slice(0, 5);
}

class PostService {
  constructor(postRepository, userRepository) {
    this.posts = postRepository;
    this.users = userRepository;
  }

  async listPosts({ cursor, limit = 10, tag, author, q, status, viewer }) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 30);
    const wantDrafts = status === "draft" || status === "all";

    let authorId = null;
    let isOwner = false;

    if (author) {
      const User = require("../users/users.model");
      const authorUser = await User.findOne({ username: String(author).toLowerCase() });
      if (!authorUser) {
        return { posts: [], nextCursor: null };
      }
      authorId = authorUser._id;
      if (viewer && String(authorUser._id) === String(viewer._id)) {
        isOwner = true;
      }
    }

    // If fetching drafts or all posts and viewer is owner of author account
    if (wantDrafts && isOwner) {
      const Post = require("./posts.model");
      const filter = {};
      filter.author = authorId;
      if (status === "draft") filter.status = "draft";
      if (tag) filter.tags = String(tag).toLowerCase();
      if (q) filter.$text = { $search: String(q) };
      if (cursor && require("mongoose").isValidObjectId(cursor)) {
        filter._id = { $lt: new (require("mongoose").Types.ObjectId)(cursor) };
      }

      const docs = await Post.find(filter)
        .sort({ _id: -1 })
        .limit(parsedLimit + 1)
        .populate("author", "name username avatarUrl bio");

      const hasMore = docs.length > parsedLimit;
      const page = hasMore ? docs.slice(0, parsedLimit) : docs;
      const nextCursor = hasMore ? String(page[page.length - 1]._id) : null;
      const viewerId = viewer ? viewer._id : null;
      const posts = page.map((p) => p.toCardJSON(viewerId));

      return { posts, nextCursor };
    }

    const searchStr = q ? String(q) : undefined;
    const tagStr = tag ? String(tag).toLowerCase() : undefined;

    const data = await this.posts.findVisibleFeed({
      cursor,
      limit: parsedLimit,
      tag: tagStr,
      authorId,
      search: searchStr,
    });

    const viewerId = viewer ? viewer._id : null;
    const posts = data.posts.map((p) => p.toCardJSON(viewerId));
    return { posts, nextCursor: data.nextCursor ? String(data.nextCursor) : null };
  }

  async getPost({ slug, viewer }) {
    const post = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!post) throw new ApiError(404, "Story not found");

    const viewerId = viewer ? viewer._id : null;
    const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

    if (post.status === "draft" && !isAuthor) {
      throw new ApiError(404, "Story not found");
    }

    const isAdmin = viewer && viewer.role === "admin";
    if (post.moderationStatus === "hidden" && !isAuthor && !isAdmin) {
      throw new ApiError(404, "Story not found");
    }

    if (post.status === "published" && !isAuthor) {
      await this.posts.incrementViewCount(post._id);
      post.views += 1;
    }

    const data = post.toCardJSON(viewerId);

    // Compute metered free read context for non-member viewers on locked posts
    let freeReadContext = { remainingFreeReads: 0, totalMonthlyQuota: 3, isFreeReadApplied: false };
    const isMember = viewer && viewer.membershipStatus === "active";

    if (post.locked && !isAuthor && !isAdmin && !isMember) {
      const ReadEvent = require("../../models/ReadEvent");
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const filter = {
        viewerWasMember: false,
        createdAt: { $gte: startOfMonth },
      };
      if (viewerId) {
        filter.viewer = viewerId;
      }

      const freeReadsUsed = await ReadEvent.countDocuments(filter);
      const totalMonthlyQuota = 3;
      const remainingFreeReads = Math.max(0, totalMonthlyQuota - freeReadsUsed);
      const isFreeReadApplied = remainingFreeReads > 0;

      freeReadContext = { remainingFreeReads, totalMonthlyQuota, isFreeReadApplied };
    }

    const userCanRead = canReadFull(post, viewer, freeReadContext);

    if (post.locked && !userCanRead) {
      const pMatches = (post.contentHtml || "").match(/<p[\s\S]*?<\/p>/gi);
      const count = post.previewParagraphCount || 3;
      if (pMatches && pMatches.length > count) {
        data.contentHtml = pMatches.slice(0, count).join("");
      } else {
        data.contentHtml = post.contentHtml;
      }
      data.isLocked = true;
      data.previewOnly = true;
    } else {
      data.contentHtml = post.contentHtml;
      data.isLocked = Boolean(post.locked);
      data.previewOnly = false;
    }

    data.freeReadContext = freeReadContext;

    let bookmarked = false;
    if (viewer && viewer.bookmarks) {
      bookmarked = viewer.bookmarks.some((b) => String(b) === String(post._id));
    }
    data.viewerBookmarked = bookmarked;

    return { post: data };
  }

  async createPost({ author, title, subtitle, contentHtml, coverImage, tags, status, scheduledAt, seo, locked, aiAssisted }) {
    if (status === "published" && !author.emailVerified) {
      throw new ApiError(403, "Please verify your email address before publishing stories.");
    }

    const validAiValues = ["none", "edited", "co-written"];
    const aiAssistedVal = aiAssisted ? String(aiAssisted).toLowerCase() : "none";
    if (!validAiValues.includes(aiAssistedVal)) {
      throw new ApiError(400, "aiAssisted must be one of: none, edited, co-written");
    }

    let parsedScheduledAt = null;
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      if (isNaN(parsedScheduledAt.getTime()) || parsedScheduledAt <= new Date()) {
        throw new ApiError(400, "scheduledAt must be a future date and time");
      }
    }

    const postData = {
      title,
      subtitle: subtitle || "",
      slug: makeSlug(title),
      contentHtml: sanitizeContent(contentHtml || "<p></p>"),
      coverImage: coverImage || "",
      tags: normalizeTags(tags),
      author: author._id,
      status: status === "published" ? "published" : "draft",
      scheduledAt: parsedScheduledAt,
      locked: locked !== undefined ? Boolean(locked) : false,
      aiAssisted: aiAssistedVal,
      seo: {
        metaTitle: (seo && seo.metaTitle) ? String(seo.metaTitle).trim().slice(0, 160) : undefined,
        metaDescription: (seo && seo.metaDescription) ? String(seo.metaDescription).trim().slice(0, 200) : undefined,
      },
    };

    if (postData.status === "published") {
      postData.publishedAt = new Date();
    }

    const post = await this.posts.create(postData);

    if (post.status === "published" && !post.notifiedAt) {
      post.notifiedAt = new Date();
      await this.posts.update({ id: post._id, fields: { notifiedAt: post.notifiedAt } });
      notifyFollowersOfNewPost(post).catch((err) => console.error("Notification failed:", err));
    }

    return { post: post.toCardJSON(author._id) };
  }

  async updatePost({ slug, user, fields }) {
    const post = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!post) throw new ApiError(404, "Story not found");
    if (String(post.author._id || post.author) !== String(user._id)) {
      throw new ApiError(403, "You can only edit your own stories");
    }

    const { title, subtitle, contentHtml, coverImage, tags, status, scheduledAt, seo, locked, aiAssisted } = fields;

    const titleChanged = title !== undefined && title !== post.title;
    const subtitleChanged = subtitle !== undefined && subtitle !== post.subtitle;
    const contentChanged = contentHtml !== undefined && sanitizeContent(contentHtml) !== post.contentHtml;
    const coverImageChanged = coverImage !== undefined && coverImage !== post.coverImage;

    let tagsChanged = false;
    if (tags !== undefined) {
      const nextTags = normalizeTags(tags);
      if (nextTags.length !== post.tags.length || !nextTags.every((val, index) => val === post.tags[index])) {
        tagsChanged = true;
      }
    }

    if (titleChanged || subtitleChanged || contentChanged || coverImageChanged || tagsChanged) {
      const { postRevisionRepository } = require("../post-revisions/post-revisions.module");
      if (postRevisionRepository) {
        await postRevisionRepository.createSnapshot({
          post: post._id,
          title: post.title,
          subtitle: post.subtitle,
          contentHtml: post.contentHtml,
          tags: post.tags,
          coverImage: post.coverImage,
          editedBy: user._id,
          aiAssisted: post.aiAssisted || "unspecified",
        });
        await postRevisionRepository.pruneOldRevisions({ postId: post._id, maxCount: 50 });
      }
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (subtitle !== undefined) updateFields.subtitle = subtitle;
    if (contentHtml !== undefined) updateFields.contentHtml = sanitizeContent(contentHtml);
    if (coverImage !== undefined) updateFields.coverImage = coverImage;
    if (tags !== undefined) updateFields.tags = normalizeTags(tags);
    if (locked !== undefined) updateFields.locked = Boolean(locked);

    if (aiAssisted !== undefined) {
      const validAiValues = ["none", "edited", "co-written"];
      const val = String(aiAssisted).toLowerCase();
      if (!validAiValues.includes(val)) {
        throw new ApiError(400, "aiAssisted must be one of: none, edited, co-written");
      }
      updateFields.aiAssisted = val;
    }

    if (status === "published" && post.status !== "published" && !user.emailVerified) {
      throw new ApiError(403, "Please verify your email address before publishing stories.");
    }

    if (scheduledAt !== undefined) {
      if (scheduledAt === null || scheduledAt === "") {
        updateFields.scheduledAt = null;
      } else {
        const parsed = new Date(scheduledAt);
        if (isNaN(parsed.getTime()) || parsed <= new Date()) {
          throw new ApiError(400, "scheduledAt must be a future date and time");
        }
        updateFields.scheduledAt = parsed;
      }
    }

    if (status !== undefined && status !== post.status) {
      updateFields.status = status;
      if (status === "published" && !post.publishedAt) updateFields.publishedAt = new Date();
    }

    if (seo !== undefined) {
      updateFields.seo = {
        metaTitle: seo.metaTitle !== undefined ? String(seo.metaTitle).trim().slice(0, 160) : (post.seo ? post.seo.metaTitle : undefined),
        metaDescription: seo.metaDescription !== undefined ? String(seo.metaDescription).trim().slice(0, 200) : (post.seo ? post.seo.metaDescription : undefined),
        canonicalUrl: post.seo ? post.seo.canonicalUrl : undefined,
      };
    }

    const updated = await this.posts.update({ id: post._id, fields: updateFields });

    if (updated.status === "published" && !updated.notifiedAt) {
      updated.notifiedAt = new Date();
      await this.posts.update({ id: updated._id, fields: { notifiedAt: updated.notifiedAt } });
      notifyFollowersOfNewPost(updated).catch((err) => console.error("Notification failed:", err));
    }

    return { post: updated.toCardJSON(user._id) };
  }

  async deletePost({ slug, user }) {
    const post = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!post) throw new ApiError(404, "Story not found");
    if (String(post.author._id || post.author) !== String(user._id)) {
      throw new ApiError(403, "You can only delete your own stories");
    }

    await this.posts.deleteBySlug(slug);

    if (this.users && this.users.removeFromAllBookmarks) {
      await this.users.removeFromAllBookmarks([post._id]);
    } else {
      const User = require("../users/users.model");
      await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });
    }

    return { message: "Story deleted" };
  }

  async clapPost({ slug, user, count }) {
    const inc = Math.max(1, Math.min(parseInt(count, 10) || 1, 50));
    const post = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!post) throw new ApiError(404, "Story not found");

    const isAuthor = user && String(post.author._id || post.author) === String(user._id);
    if (post.status === "draft" && !isAuthor) {
      throw new ApiError(404, "Story not found");
    }
    if (post.status !== "published") {
      throw new ApiError(400, "Cannot clap an unpublished story");
    }

    const res = await this.posts.incrementClap({ slug, userId: user._id, count: inc });
    if (res.added > 0) {
      const { notificationService } = require("../notifications/notifications.module");
      if (notificationService) {
        await notificationService.notifyClap({ post: res.post, clapper: user });
      }
    }

    return {
      totalClaps: res.post.totalClaps,
      viewerClapCount: res.totalUserClaps,
      capped: res.totalUserClaps >= 50,
      applied: res.added,
    };
  }

  async toggleBookmark({ slug, user }) {
    const post = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!post) throw new ApiError(404, "Story not found");

    const isAuthor = user && String(post.author._id || post.author) === String(user._id);
    if (post.status === "draft" && !isAuthor) {
      throw new ApiError(404, "Story not found");
    }

    const idx = user.bookmarks.findIndex((b) => String(b) === String(post._id));
    let bookmarked;
    if (idx >= 0) {
      user.bookmarks.splice(idx, 1);
      bookmarked = false;
    } else {
      user.bookmarks.push(post._id);
      bookmarked = true;
    }
    await user.save();
    return { bookmarked };
  }

  async getTrendingTags(limit = 10) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 20);
    const tags = await this.posts.findTagCountsInWindow(7);
    return tags.slice(0, parsedLimit);
  }

  async getSitemapData() {
    const posts = await this.posts.findSitemapProjection();
    const formatted = posts.map((p) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
      authorUsername: p.author ? p.author.username : "deleted",
    }));
    return { posts: formatted };
  }

  async toggleTagFollow({ tag, user }) {
    const cleanTag = String(tag).toLowerCase().trim();
    if (!cleanTag) throw new ApiError(400, "Tag parameter is required");

    const Post = require("./posts.model");
    const tagExists = await Post.findOne(Post.visibleQuery({ tags: cleanTag }));
    if (!tagExists) {
      throw new ApiError(400, "That tag does not exist or has no published stories");
    }

    if (!user.followedTags) user.followedTags = [];
    const idx = user.followedTags.indexOf(cleanTag);
    let followed;
    if (idx >= 0) {
      user.followedTags.splice(idx, 1);
      followed = false;
    } else {
      user.followedTags.push(cleanTag);
      followed = true;
    }
    await user.save();
    return { followed, cleanTag };
  }

  async getRelatedPosts({ slug, viewer }) {
    const currentPost = await this.posts.findBySlug(slug, { includeUnpublished: true });
    if (!currentPost) throw new ApiError(404, "Story not found");

    const tags = currentPost.tags || [];
    if (tags.length === 0) return { posts: [] };

    const candidates = await this.posts.findRelated({ postId: currentPost._id, tags, limit: 20 });
    const currentTagSet = new Set(tags.map((t) => t.toLowerCase()));
    const scored = candidates.map((p) => ({
      post: p,
      matchCount: (p.tags || []).filter((t) => currentTagSet.has(t.toLowerCase())).length,
    }));

    scored.sort((a, b) => b.matchCount - a.matchCount);
    const viewerId = viewer ? viewer._id : null;
    const relatedPosts = scored.slice(0, 3).map((item) => item.post.toCardJSON(viewerId));
    return { posts: relatedPosts };
  }

  async getRecommendedPosts({ viewer, limit = 10 }) {
    const followedTags = viewer.followedTags || [];
    const Follow = require("../../models/Follow");
    const follows = await Follow.find({ follower: viewer._id }).select("followee");
    const followedAuthorIds = follows.map((f) => String(f.followee));

    const candidates = await this.posts.findCandidatesForRecommendation();
    const now = Date.now();

    const scoredPosts = candidates.map((post) => {
      const postTags = post.tags || [];
      const matchingTags = postTags.filter((t) => followedTags.includes(t.toLowerCase()));
      const tagScore = matchingTags.length * 3.0;

      const isAuthorFollowed = post.author && followedAuthorIds.includes(String(post.author._id || post.author));
      const authorScore = isAuthorFollowed ? 2.5 : 0.0;

      const totalClaps = post.totalClaps || 0;
      const views = post.views || 0;
      const engagementScore = Math.log(1 + totalClaps + views * 0.1) + 1.0;

      const pubDate = post.publishedAt ? new Date(post.publishedAt).getTime() : now;
      const ageInDays = Math.max(0, (now - pubDate) / (1000 * 60 * 60 * 24));
      const recencyDecay = Math.exp(-0.05 * ageInDays);

      const finalScore = (tagScore + authorScore + 1.0) * engagementScore * recencyDecay;

      return { post, score: finalScore };
    });

    scoredPosts.sort((a, b) => b.score - a.score);
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 30);
    const selected = scoredPosts.slice(0, parsedLimit);
    const posts = selected.map((s) => s.post.toCardJSON(viewer._id));

    return {
      posts,
      factors: {
        followedTagsCount: followedTags.length,
        followedAuthorsCount: followedAuthorIds.length,
      },
    };
  }
}

module.exports = PostService;
