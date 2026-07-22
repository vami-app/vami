"use strict";

/**
 * seed-content.js
 * ─────────────────────────────────────────────────────────
 * Seeds Posts, Follows, Comments, Bookmarks, and Reading Lists.
 * Called by seed.js after users and publications are created.
 * ─────────────────────────────────────────────────────────
 *
 * @param {Object} ctx — context passed from seed.js
 *   ctx.users          — all User documents
 *   ctx.userMap        — { username → User }
 *   ctx.activeUsers    — active User documents
 *   ctx.bannedUsers    — banned User documents
 *   ctx.publications   — all Publication documents
 *   ctx.activePubs     — non-archived publications
 *   ctx.pubMembers     — { pubId → [{ user, role }] }
 *   ctx.NOW            — seed timestamp (ms)
 * @returns {Object} { posts, publishedVisible }
 */

const User        = require("../models/User");
const Post        = require("../models/Post");
const Follow      = require("../models/Follow");
const Comment     = require("../models/Comment");
const ReadingList = require("../models/ReadingList");
const ReadEvent         = require("../models/ReadEvent");
const MembershipPayment = require("../models/MembershipPayment");
const PayoutLedgerEntry = require("../models/PayoutLedgerEntry");
const { computeLedgerForPeriod } = require("../controllers/ledger.controller");

const {
  rand, randInt, pick, pickN,
  ALL_TAGS, POST_TITLES, SUBTITLES, COMMENT_POOL, SPAM_COMMENTS,
  generateContentHtml, LIST_NAMES, COVER_SEEDS,
} = require("./seed-data");

const { sanitizeContent } = require("../utils/sanitize");
const { makeSlug }        = require("../utils/slugify");

// ── Configuration ─────────────────────────────────────────
const TARGET_POSTS    = 500;
const TARGET_FOLLOWS  = 800;
const TARGET_COMMENTS = 1200;

const PROG_ADJS  = ["Performant","Asynchronous","Pragmatic","Deliberate","Quiet","Resilient","Boring","Incremental","Reactive","Immutable"];
const PROG_NOUNS = ["Architecture","Refactoring","State Management","Systems","Codebases","Abstractions","Dependencies","Complexity"];

async function seedContent(ctx) {
  const { users, userMap, activeUsers, bannedUsers, activePubs, pubMembers, NOW } = ctx;

  // ──────────────────────────────────────────────────────────
  //  1. POSTS
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Creating ${TARGET_POSTS} posts...`);
  const posts     = [];
  const usedSlugs = new Set();

  for (let i = 0; i < TARGET_POSTS; i++) {
    // Title / subtitle
    let title    = i < POST_TITLES.length ? POST_TITLES[i] : `${pick(PROG_ADJS)} ${pick(PROG_NOUNS)}`;
    let subtitle = pick(SUBTITLES);

    // Boundary test titles
    if (i === 60) title    = "The Comprehensive Guide to Building Highly Scalable Systems with Microservices Event Sourcing Message Queues xxxx".slice(0, 160);
    if (i === 61) subtitle = "A detailed investigation into performance bottlenecks architectural patterns and design trade offs of modern web applications under high concurrency yyyyyy".slice(0, 200);
    if (i === 62) title    = "Scaling Nodejs in 2026 The Philosophy of Scalable Code Unicode Test";

    // Unique slug (resolve collisions the same way the app does — append index)
    let slug = makeSlug(title);
    if (usedSlugs.has(slug)) slug = `${slug}-${i}`;
    usedSlugs.add(slug);

    // Author — power users get first 80 posts; rest distributed randomly
    const author = i < 80
      ? users[i % Math.min(11, users.length)]
      : users[randInt(0, users.length - 1)];

    // Moderation / status  distribution:
    //   ~62% published+visible, ~12% draft+visible, ~banned/spam → hidden
    let status, moderationStatus, publishedAt = null;
    if (author.status === "banned") {
      // All content by banned users is hidden
      status = "draft"; moderationStatus = "hidden";
    } else if (i === 70) {
      // Specific post that was published then admin-hidden
      status = "published"; moderationStatus = "hidden";
      publishedAt = new Date(NOW - randInt(1, 30) * 86400000);
    } else if (i % 8 === 0) {
      // Draft saved but never published
      status = "draft"; moderationStatus = "visible";
    } else {
      status = "published"; moderationStatus = "visible";
      publishedAt = new Date(NOW - i * 2.5 * 3600000); // staggered ~52 days back
    }

    // Content (varies length, tests XSS sanitizer, tests long-doc read-time estimator)
    const rawHtml    = generateContentHtml(title, subtitle, (i % 10) + 1, { isLong: i === 80, hasXSS: i === 81 });
    const contentHtml = sanitizeContent(rawHtml);

    // Cover image: ~40% external, ~30% local upload path, ~30% none
    let coverImage = "";
    if      (i % 10 < 4) coverImage = COVER_SEEDS[i % COVER_SEEDS.length];
    else if (i % 10 < 7) coverImage = `/uploads/cover-${i}.png`;

    // Tags: 0–5, deterministic by index
    const uniqueTags = [...new Set(
      Array.from({ length: i % 6 }, (_, t) => ALL_TAGS[(i + t * 3) % ALL_TAGS.length])
    )];

    // Views — power-law: most posts low, a few viral
    let views;
    if      (i % 20 === 0) views = 0;
    else if (i % 10 === 1) views = randInt(1, 50);
    else if (i % 5  === 2) views = randInt(500, 5000);
    else if (i % 7  === 3) views = randInt(10000, 100000);
    else if (i === 3)      views = 487392;   // viral post
    else                   views = randInt(100, 3000);

    // SEO override on 10% of posts
    const seo = i % 10 === 0
      ? { metaTitle: `[SEO] ${title}`.slice(0, 160), metaDescription: `Meta: ${subtitle || title}`.slice(0, 200), canonicalUrl: `https://external-blog.com/canonical/${i}` }
      : undefined;

    // notifiedAt — 90% of published posts get a notification timestamp
    const notifiedAt = status === "published" && publishedAt && rand() < 0.9
      ? new Date(publishedAt.getTime() + randInt(30, 300) * 1000)
      : null;

    // Publication submission — only for published+visible posts where author is a member
    let publication = null, submissionStatus = "none", reviewNote = "";
    if (status === "published" && moderationStatus === "visible" && i % 6 === 0 && activePubs.length > 0) {
      const tPub    = activePubs[i % activePubs.length];
      const members = pubMembers[String(tPub._id)] || [];
      if (members.some(m => String(m.user._id) === String(author._id))) {
        publication = tPub._id;
        const ss = ["approved","approved","approved","pending","rejected","changes_requested"];
        submissionStatus = ss[i % ss.length];
        if (submissionStatus === "rejected")          reviewNote = "Needs stronger evidence and more concrete examples.";
        if (submissionStatus === "changes_requested") reviewNote = "Please tighten the introduction and add a concrete case study.";
      }
    }

    const locked = status === "published" && moderationStatus === "visible" && i % 5 === 0;

    const post = new Post({
      title, subtitle: subtitle || "", slug, contentHtml, coverImage,
      tags: uniqueTags, author: author._id, status, moderationStatus, locked,
      views, publishedAt, notifiedAt, seo, publication, submissionStatus, reviewNote,
    });

    // Claps — power-law: 25% no claps, 25% single clapper (50), 50% multiple clappers
    let totalClaps = 0;
    if (status === "published" && i % 4 > 0) {
      const nc = i % 4 === 1 ? 1 : randInt(2, Math.min(8, users.length - 1));
      const clappers = pickN(users.filter(u => String(u._id) !== String(author._id)), nc);
      for (const c of clappers) {
        const cnt = nc === 1 ? 50 : randInt(1, 50);
        post.claps.push({ user: c._id, count: cnt });
        totalClaps += cnt;
      }
    }
    post.totalClaps = totalClaps;
    await post.save();
    posts.push(post);
  }

  const publishedVisible = posts.filter(p => p.status === "published" && p.moderationStatus === "visible");
  console.log(`[seed] Posts: ${posts.length} (${publishedVisible.length} published+visible, ${posts.filter(p => p.status === "draft").length} draft, ${posts.filter(p => p.moderationStatus === "hidden").length} hidden)`);

  // ──────────────────────────────────────────────────────────
  //  2. FOLLOW GRAPH
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Building follow graph (~${TARGET_FOLLOWS} edges)...`);
  const followPairs = new Set();

  async function createFollow(follower, followee, opts) {
    if (!follower || !followee) return;
    if (String(follower._id) === String(followee._id)) return;
    const key = `${follower._id}_${followee._id}`;
    if (followPairs.has(key)) return;
    followPairs.add(key);
    const days = opts && opts.days !== undefined ? opts.days : randInt(0, 90);
    const src  = opts && opts.src
      ? opts.src
      : (rand() < 0.25 && publishedVisible.length ? pick(publishedVisible)._id : null);
    await Follow.create({ follower: follower._id, followee: followee._id, followedAt: new Date(NOW - days * 86400000), sourcePost: src });
    follower.following = follower.following || [];
    followee.followers = followee.followers || [];
    follower.following.push(followee._id);
    followee.followers.push(follower._id);
  }

  // Curated social graph for named users
  const namedPairs = [
    ["jbaldwin","ada"],["grace","ada"],["maya","ada"],["leo","ada"],["sarahj","ada"],
    ["stoic","ada"],["aria","ada"],["davidm","ada"],["ada","grace"],["ada","jbaldwin"],
    ["ada","maya"],["grace","jbaldwin"],["jbaldwin","grace"],["stoic","jbaldwin"],
    ["maya","davidm"],["davidm","maya"],["leo","sarahj"],["sarahj","leo"],
    ["aria","stoic"],["stoic","aria"],["grace","turing"],["turing","ada"],
    ["margaret","ada"],["ada","turing"],["ada","margaret"],["jbaldwin","maya"],
    ["maya","jbaldwin"],["feynman","turing"],["camus","simone"],["simone","camus"],
    ["virginia","bell"],["bell","virginia"],["liwong","ada"],["francois","jbaldwin"],
    ["kierkegaard","stoic"],
  ];
  for (const [fn, fen] of namedPairs) await createFollow(userMap[fn], userMap[fen], { days: randInt(7, 365) });

  // Hub users — popular accounts accumulate many followers (power-law)
  const hubs = ["ada","jbaldwin","grace","maya","stoic"].map(u => userMap[u]).filter(Boolean);
  for (const hub of hubs) {
    const followers = pickN(activeUsers.filter(u => String(u._id) !== String(hub._id)), randInt(30, 80));
    for (const f of followers) await createFollow(f, hub);
  }

  // Random fill to reach target
  let sf = 0;
  while (followPairs.size < TARGET_FOLLOWS && sf < 30000) {
    sf++;
    await createFollow(pick(users), pick(users));
  }

  // Persist denormalized followers/following arrays on User docs via updateOne
  await Promise.all(users.map(u => User.updateOne(
    { _id: u._id },
    { $set: { followers: u.followers || [], following: u.following || [] } }
  )));
  console.log(`[seed] Follow edges: ${followPairs.size}`);

  // ──────────────────────────────────────────────────────────
  //  3. COMMENTS  (threaded, soft-deleted, hidden, boundary)
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Generating ~${TARGET_COMMENTS} comments...`);
  let totalComments = 0;
  const allComments = [];

  // 3a. Deep nested threads on first 8 popular posts
  for (let pi = 0; pi < Math.min(8, publishedVisible.length); pi++) {
    const p = publishedVisible[pi];

    // Thread: depth 0 → 5
    const c0 = await Comment.create({ post: p._id, author: users[(pi+1) % users.length]._id, content: "Excellent analysis on the topic. The framing really changed how I think about this entire domain.", depth: 0, parentComment: null });
    allComments.push(c0); totalComments++;
    const c1 = await Comment.create({ post: p._id, author: users[(pi+2) % users.length]._id, content: "Agreed. I would add that caching invalidation is notoriously hard. Phil Karlton was not joking.", depth: 1, parentComment: c0._id });
    allComments.push(c1); totalComments++;
    const c2 = await Comment.create({ post: p._id, author: users[(pi+3) % users.length]._id, content: "True, but staggered validation frequencies offset the latency enough in practice for most workloads.", depth: 2, parentComment: c1._id });
    allComments.push(c2); totalComments++;
    const c3 = await Comment.create({ post: p._id, author: users[(pi+4) % users.length]._id, content: "We tested this pattern in production with 10k requests per second. The numbers hold under sustained load.", depth: 3, parentComment: c2._id });
    allComments.push(c3); totalComments++;
    const c4 = await Comment.create({ post: p._id, author: users[(pi+5) % users.length]._id, content: "Can you share a benchmark repository? Would love to reproduce this setup on our staging environment.", depth: 4, parentComment: c3._id });
    allComments.push(c4); totalComments++;
    const c5 = await Comment.create({ post: p._id, author: users[(pi+6) % users.length]._id, content: "Posted to GitHub. Link in my profile. Run docker-compose up and you will see the results within minutes.", depth: 5, parentComment: c4._id });
    allComments.push(c5); totalComments++;

    // Soft-deleted parent with reply (deletedButHasReplies pattern)
    const bannedAuthor = bannedUsers.length > 0 ? bannedUsers[0]._id : users[7]._id;
    const sd = await Comment.create({ post: p._id, author: bannedAuthor, content: "[deleted]", deletedButHasReplies: true, depth: 0, parentComment: null });
    allComments.push(sd); totalComments++;
    await Comment.create({ post: p._id, author: users[(pi+8) % users.length]._id, content: "Replying to a deleted spam message. The underlying concept referenced was valid even if badly sourced.", depth: 1, parentComment: sd._id });
    totalComments++;

    // Hidden/moderated comment (spam)
    const hc = await Comment.create({ post: p._id, author: users[(pi+9) % users.length]._id, content: pick(SPAM_COMMENTS), depth: 0, parentComment: null, moderationStatus: "hidden" });
    allComments.push(hc); totalComments++;

    // Max-length comment (boundary: 2000 chars exactly)
    if (pi === 0) {
      await Comment.create({ post: p._id, author: users[2]._id, content: "Detailed technical feedback. ".repeat(70).slice(0, 1999), depth: 0 });
      totalComments++;
    }
  }

  // 3b. Regular comments across published+visible posts (power-law: popular posts get more)
  for (let i = 0; i < publishedVisible.length && totalComments < TARGET_COMMENTS; i++) {
    const p   = publishedVisible[i];
    const cnt = i < 20 ? randInt(3, 10) : randInt(0, 3);
    for (let c = 0; c < cnt && totalComments < TARGET_COMMENTS; c++) {
      let content = pick(COMMENT_POOL);
      if (c === 0 && i % 15 === 0) content = "This is exactly what I needed today. Bookmarked and shared immediately.";
      await Comment.create({ post: p._id, author: users[randInt(0, users.length - 1)]._id, content, depth: 0 });
      totalComments++;
    }
  }
  console.log(`[seed] Comments: ${totalComments}`);

  // ──────────────────────────────────────────────────────────
  //  4. BOOKMARKS  (denormalized on User doc)
  // ──────────────────────────────────────────────────────────
  console.log("[seed] Seeding bookmarks...");
  const visibleIds = publishedVisible.map(p => p._id);
  for (const u of users) {
    const n = randInt(0, 12);
    if (n === 0) continue;
    u.bookmarks = pickN(visibleIds, n);
    await User.updateOne({ _id: u._id }, { $set: { bookmarks: u.bookmarks } });
  }

  // ──────────────────────────────────────────────────────────
  //  5. READING LISTS
  // ──────────────────────────────────────────────────────────
  console.log("[seed] Generating reading lists...");

  // First 30 users get 1–4 reading lists each
  for (const owner of users.slice(0, 30)) {
    const listCount = randInt(1, 4);
    const usedLS    = new Set();
    for (let l = 0; l < listCount; l++) {
      const name = pick(LIST_NAMES);
      let slug   = makeSlug(name);
      if (usedLS.has(slug)) slug = `${slug}-${l}`;
      usedLS.add(slug);
      const visibility = rand() < 0.45 ? "public" : "private";
      // First list per user is intentionally empty (tests empty-list rendering)
      const postCount = l === 0 ? 0 : randInt(1, 15);
      const listPosts = pickN(visibleIds, postCount).map((id, idx) => ({
        post: id, addedAt: new Date(NOW - randInt(0, 60) * 86400000 - idx * 3600000),
      }));
      await ReadingList.create({ owner: owner._id, name, slug, visibility, posts: listPosts });
    }
  }

  // Edge-case reading lists on ada
  const ada = userMap.ada;
  if (ada) {
    // Max-size public list (30 posts)
    await ReadingList.create({
      owner: ada._id, name: "Essential Engineering Reads", slug: "essential-engineering-reads",
      visibility: "public",
      posts: pickN(visibleIds, 30).map((id, i) => ({ post: id, addedAt: new Date(NOW - i * 3600000) })),
    });
    // Private list (only owner can see — tests visibility gating)
    await ReadingList.create({
      owner: ada._id, name: "Admin Private Research", slug: "admin-private-research",
      visibility: "private",
      posts: pickN(visibleIds, 5).map((id, i) => ({ post: id, addedAt: new Date(NOW - i * 3600000) })),
    });
    // Public list containing hidden posts (dangling reference scenario)
    const hiddenPosts = posts.filter(p => p.moderationStatus === "hidden").slice(0, 3);
    if (hiddenPosts.length > 0) {
      await ReadingList.create({
        owner: ada._id, name: "Moderation Queue Archive", slug: "moderation-queue-archive",
        visibility: "public",
        posts: hiddenPosts.map((p, i) => ({ post: p._id, addedAt: new Date(NOW - i * 3600000) })),
      });
    }
  }

  console.log(`[seed] Reading lists: ${await ReadingList.countDocuments()}`);

  // ──────────────────────────────────────────────────────────
  //  6. PHASE D: TELEMETRY, PAYMENTS, & PAYOUT LEDGER
  // ──────────────────────────────────────────────────────────
  console.log("[seed] Seeding Phase D Telemetry, Membership Payments & Payout Ledger...");
  
  // 6a. Membership Payments for active subscribers
  const activeSubscribers = users.filter(u => u.membershipStatus === "active");
  const periodStart = new Date(NOW - 15 * 86400000);
  const periodEnd   = new Date(NOW + 15 * 86400000);

  for (let s = 0; s < activeSubscribers.length; s++) {
    const subUser = activeSubscribers[s];
    await MembershipPayment.create({
      user: subUser._id,
      amountCents: 49900, // ₹499.00
      razorpayPaymentId: `pay_seed_${subUser.username}_${s}`,
      periodStart,
      periodEnd,
    });
  }

  // 6b. ReadEvents telemetry across published+visible posts
  const readEventDocs = [];
  for (let r = 0; r < 1200; r++) {
    const targetPost = publishedVisible[r % publishedVisible.length];
    const viewer = users[r % users.length];
    
    // Exclude self-reads
    if (String(targetPost.author._id || targetPost.author) === String(viewer._id)) continue;

    readEventDocs.push({
      post: targetPost._id,
      viewer: viewer._id,
      viewerWasMember: viewer.membershipStatus === "active",
      activeSeconds: randInt(15, 600),
      createdAt: new Date(NOW - randInt(1, 14) * 86400000),
    });
  }

  await ReadEvent.insertMany(readEventDocs);

  // 6c. Compute Payout Ledger for current month
  await computeLedgerForPeriod(periodStart, periodEnd);

  const reCount  = await ReadEvent.countDocuments();
  const mpCount  = await MembershipPayment.countDocuments();
  const pleCount = await PayoutLedgerEntry.countDocuments();
  console.log(`[seed] Phase D: ${reCount} ReadEvents, ${mpCount} MembershipPayments, ${pleCount} PayoutLedgerEntries`);

  return { posts, publishedVisible };
}

module.exports = { seedContent };
