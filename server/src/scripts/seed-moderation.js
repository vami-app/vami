"use strict";

/**
 * seed-moderation.js
 * ─────────────────────────────────────────────────────────
 * Seeds Reports, Audit Logs, and Post Revisions.
 * Called by seed.js after content is seeded.
 * ─────────────────────────────────────────────────────────
 *
 * @param {Object} ctx
 *   ctx.users           — all User documents
 *   ctx.activeUsers     — active User documents
 *   ctx.adminUsers      — admin User documents
 *   ctx.posts           — all Post documents
 *   ctx.publishedVisible — published+visible Post documents
 *   ctx.NOW             — seed timestamp (ms)
 */

const Comment     = require("../models/Comment");
const Report      = require("../models/Report");
const AuditLog    = require("../models/AuditLog");
const PostRevision = require("../models/PostRevision");

const { rand, randInt, pick, pickN, PARA_POOLS, weightedReason } = require("./seed-data");

const TARGET_REPORTS = 120;
const TARGET_AUDIT   = 200;

const AUDIT_ACTIONS = [
  "post_hidden","post_unhidden","comment_hidden","comment_unhidden",
  "user_banned","user_unbanned","role_changed","report_dismissed","report_actioned",
];

async function seedModeration(ctx) {
  const { users, activeUsers, adminUsers, posts, publishedVisible, NOW } = ctx;

  // ──────────────────────────────────────────────────────────
  //  1. REPORTS
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Generating ~${TARGET_REPORTS} reports...`);
  const reportPairs = new Set();
  const reports     = [];
  const allCommentDocs = await Comment.find({}).lean();

  // 1a. Priority-flagged hotspots — 4 reporters on 6 posts = 24 priority reports
  const hotPosts    = publishedVisible.slice(10, 16);
  const hotComments = allCommentDocs.filter(c => c.moderationStatus === "hidden").slice(0, 6);

  for (let h = 0; h < hotPosts.length; h++) {
    for (let u = 0; u < 4; u++) {
      const reporter = activeUsers[u + 5 + h];
      if (!reporter) continue;
      const key = `${reporter._id}_post_${hotPosts[h]._id}`;
      if (reportPairs.has(key)) continue;
      reportPairs.add(key);
      const r = await Report.create({
        reporter:   reporter._id,
        targetType: "post",
        targetId:   hotPosts[h]._id,
        reason:     weightedReason(),
        details:    `Report ${u + 1}: post contains misleading information about software architecture best practices.`,
        status:     "pending",
        priorityFlag: true,
      });
      reports.push(r);
    }
  }

  // Priority reports on hidden comments (spam/harassment clusters)
  for (let h = 0; h < hotComments.length; h++) {
    for (let u = 0; u < 3; u++) {
      const reporter = activeUsers[u + 10 + h];
      if (!reporter) continue;
      const key = `${reporter._id}_comment_${hotComments[h]._id}`;
      if (reportPairs.has(key)) continue;
      reportPairs.add(key);
      const r = await Report.create({
        reporter:   reporter._id,
        targetType: "comment",
        targetId:   hotComments[h]._id,
        reason:     weightedReason(),
        details:    "Harassment or spam detected in this comment thread.",
        status:     "pending",
        priorityFlag: true,
      });
      reports.push(r);
    }
  }

  // 1b. Regular reports — realistic status distribution, detail edge cases
  const repStatuses = ["pending","pending","pending","reviewed","dismissed","actioned"];
  let rs = 0;
  while (reports.length < TARGET_REPORTS && rs < 30000) {
    rs++;
    const reporter = pick(activeUsers);
    const isPost   = rand() < 0.6;
    const target   = isPost
      ? pick(publishedVisible)
      : allCommentDocs[randInt(0, allCommentDocs.length - 1)];
    if (!target) continue;
    // Don't report your own content
    if (target.author && String(target.author) === String(reporter._id)) continue;
    const key = `${reporter._id}_${isPost ? "post" : "comment"}_${target._id}`;
    if (reportPairs.has(key)) continue;
    reportPairs.add(key);

    // details edge cases: empty (8th), max 500 chars (9th), normal otherwise
    let details = "Content appears to violate community guidelines.";
    if (reports.length % 8 === 0) details = "";
    if (reports.length % 8 === 1) details = "x".repeat(500);

    const r = await Report.create({
      reporter:    reporter._id,
      targetType:  isPost ? "post" : "comment",
      targetId:    target._id,
      reason:      weightedReason(),
      details:     details.slice(0, 500),
      status:      pick(repStatuses),
      priorityFlag: rand() < 0.12,
    });
    reports.push(r);
  }

  console.log(`[seed] Reports: ${reports.length} (${reports.filter(r => r.priorityFlag).length} priority)`);

  // ──────────────────────────────────────────────────────────
  //  2. AUDIT LOGS
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Generating ${TARGET_AUDIT} audit log entries...`);

  // Multiple admin actors for realism
  const actors = adminUsers.length > 0 ? adminUsers : [users[0]];

  for (let i = 0; i < TARGET_AUDIT; i++) {
    const actor  = pick(actors);
    const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
    let targetType, targetId, metadata;

    if (action.includes("post")) {
      targetType = "post";
      targetId   = posts[i % posts.length]._id;
      metadata   = {
        reason:     pick(["spam","harassment","misinformation","guideline_violation"]),
        postTitle:  posts[i % posts.length].title.slice(0, 60),
        actionedBy: actor.username,
        prevStatus: action === "post_hidden" ? "visible" : "hidden",
      };
    } else if (action.includes("comment")) {
      targetType = "comment";
      targetId   = allCommentDocs[i % allCommentDocs.length]._id;
      metadata   = { reason: pick(["spam","harassment","off-topic"]), actionedBy: actor.username };
    } else if (action.includes("user") || action === "role_changed") {
      targetType = "user";
      targetId   = users[i % users.length]._id;
      metadata   = {
        userEmail:  users[i % users.length].email,
        banReason:  pick(["repeated_spam","harassment","terms_violation","impersonation"]),
        prevRole:   "user",
        newRole:    action === "role_changed" ? "admin" : undefined,
      };
    } else {
      // report_dismissed / report_actioned
      targetType = "report";
      targetId   = reports[i % reports.length]._id;
      metadata   = {
        reportReason: reports[i % reports.length].reason,
        decision:     action === "report_actioned" ? "content_removed" : "no_violation_found",
        actionedBy:   actor.username,
      };
    }

    // Stagger createdAt across the last 90 days
    const createdAt = new Date(NOW - randInt(0, 90) * 86400000 - randInt(0, 86400) * 1000);
    await AuditLog.create({ actor: actor._id, action, targetType, targetId, metadata, createdAt });
  }

  console.log(`[seed] Audit logs: ${TARGET_AUDIT}`);

  // ──────────────────────────────────────────────────────────
  //  3. POST REVISIONS
  // ──────────────────────────────────────────────────────────
  console.log("[seed] Generating post revisions...");
  let totalRevisions = 0;

  // 40 candidates from published+visible posts
  const revCandidates = posts
    .filter(p => p.status === "published" && p.moderationStatus === "visible")
    .slice(0, 40);

  for (let ri = 0; ri < revCandidates.length; ri++) {
    const post = revCandidates[ri];

    // Popular posts (lower index) had more edits in their history
    const revCount = ri < 10 ? randInt(3, 8) : randInt(1, 4);

    for (let v = 0; v < revCount; v++) {
      const editDate = new Date(
        (post.publishedAt || post.createdAt).getTime() - (revCount - v) * randInt(2, 24) * 3600000
      );
      await PostRevision.create({
        post:        post._id,
        editedBy:    post.author,
        title:       `${post.title} (Draft v${v + 1})`,
        subtitle:    post.subtitle ? `${post.subtitle} — iteration ${v + 1}` : "Incremental revision",
        contentHtml: `<p>Historical snapshot revision ${v + 1}. Preserved before live publication edits.</p><p>${PARA_POOLS[0][v % PARA_POOLS[0].length]}</p>`,
        tags:        post.tags.slice(0, Math.max(1, post.tags.length - (v % 2))),
        coverImage:  post.coverImage,
        createdAt:   editDate,
      });
      totalRevisions++;
    }

    // Boundary test: first post gets 52 revisions to trigger the 50-cap pruning logic
    if (ri === 0) {
      for (let ex = revCount; ex < 52; ex++) {
        await PostRevision.create({
          post:        post._id,
          editedBy:    post.author,
          title:       `${post.title} (Extra Rev ${ex + 1})`,
          subtitle:    "",
          contentHtml: `<p>Extra revision ${ex + 1} added to test the 50-revision cap enforcement and pruning logic in updatePost and restoreRevision controllers.</p>`,
          tags:        [],
          coverImage:  "",
          createdAt:   new Date(NOW - (60 - ex) * 3600000),
        });
        totalRevisions++;
      }
    }
  }

  console.log(`[seed] Post revisions: ${totalRevisions}`);
}

module.exports = { seedModeration };
