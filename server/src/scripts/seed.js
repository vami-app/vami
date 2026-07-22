"use strict";

/**
 * seed.js  — Inkwell Comprehensive Seed Script v2
 * ─────────────────────────────────────────────────────────────
 *  Simulates a realistic platform with 120 users (covering the
 *  statistical patterns of a 1,000+ user platform), seeding:
 *
 *    Users (120)        · Publications (5) · PublicationMembers
 *    Posts (500)        · Follows (800)    · Comments (1,200)
 *    Bookmarks          · Reading Lists    · Reports (120)
 *    AuditLogs (200)    · PostRevisions
 *
 *  Every model field, enum variant, edge case, and boundary
 *  condition is exercised.
 *
 *  Run:  pnpm --filter server seed
 * ─────────────────────────────────────────────────────────────
 */

const mongoose          = require("mongoose");
const connectDB         = require("../config/db");

const User              = require("../models/User");
const Post              = require("../models/Post");
const Comment           = require("../models/Comment");
const Follow            = require("../models/Follow");
const Report            = require("../models/Report");
const AuditLog          = require("../models/AuditLog");
const PostRevision      = require("../models/PostRevision");
const Publication       = require("../models/Publication");
const PublicationMember = require("../models/PublicationMember");
const ReadingList       = require("../models/ReadingList");
const ReadEvent         = require("../models/ReadEvent");
const MembershipPayment = require("../models/MembershipPayment");
const PayoutLedgerEntry = require("../models/PayoutLedgerEntry");
const WebhookEvent      = require("../models/WebhookEvent");

const { seedContent }    = require("./seed-content");
const { seedModeration } = require("./seed-moderation");

const {
  rand, randInt, pick, pickN,
  FIRST, LAST, BIO_POOL, ALL_TAGS,
  PUB_DEFS, NAMED_USERS,
} = require("./seed-data");

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────────────────────
const DEMO_PASSWORD = "password123";
const TARGET_USERS  = 120;

// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  const NOW = Date.now();

  // ── 0. Wipe all collections ──────────────────────────────
  console.log("[seed] Wiping database...");
  await Promise.all([
    User, Post, Comment, Follow, Report, AuditLog,
    PostRevision, Publication, PublicationMember, ReadingList,
    ReadEvent, MembershipPayment, PayoutLedgerEntry, WebhookEvent,
  ].map(M => M.deleteMany({})));

  // ──────────────────────────────────────────────────────────
  //  1. USERS
  // ──────────────────────────────────────────────────────────
  console.log(`[seed] Creating ${TARGET_USERS} users...`);
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userDocs = [];

  // 1a. Named users — fixed identities for test-suite compatibility
  for (let i = 0; i < NAMED_USERS.length; i++) {
    const def = NAMED_USERS[i];
    const avatarUrl = i % 7 === 0 ? "" : `https://i.pravatar.cc/200?img=${(i % 70) + 1}`;
    const followedTags = pickN(ALL_TAGS, i % 5);
    const subdomain = i < 15 ? def.username : undefined;

    const u = {
      name:          def.name,
      username:      def.username,
      email:         def.email,
      password:      hashedPassword,
      bio:           def.bio || "",
      avatarUrl,
      role:          def.role   || "user",
      status:        def.status || "active",
      subdomain,
      customDomain:  def.customDomain  || null,
      emailVerified: def.emailVerified !== false,
      followedTags,
      membershipStatus: i % 2 === 0 ? "active" : "none",
      razorpayCustomerId: i % 2 === 0 ? `cust_demo_${def.username}` : null,
      razorpaySubscriptionId: i % 2 === 0 ? `sub_demo_${def.username}` : null,
      emailPrefs: def.emailPrefsOff
        ? { allEmails: false, digestFrequency: "off" }
        : { allEmails: true,  digestFrequency: i % 3 === 0 ? "off" : "weekly" },
      lastDigestSentAt: i % 4 === 0 ? new Date(NOW - randInt(1, 14) * 86400000) : null,
    };

    if (def.exportStatus) {
      u.exportStatus       = def.exportStatus;
      u.exportRequestedAt  = new Date(NOW - (def._exportOffset || 1) * 86400000);
    }
    if (def._resetActive) {
      u.passwordResetTokenHash = "active-reset-token-hash-sha256";
      u.passwordResetExpiresAt = new Date(NOW + 1800000);
    }
    if (def._resetExpired) {
      u.passwordResetTokenHash = "expired-reset-token-hash-sha256";
      u.passwordResetExpiresAt = new Date(NOW - 3600000);
    }
    if (def._verifyActive) {
      u.emailVerifyTokenHash = "active-verify-token-hash-sha256";
      u.emailVerifyExpiresAt = new Date(NOW + 43200000);
    }
    if (def._verifyExpired) {
      u.emailVerifyTokenHash = "expired-verify-token-hash-sha256";
      u.emailVerifyExpiresAt = new Date(NOW - 10800000);
    }

    userDocs.push(u);
  }

  // 1b. Generated users — simulate diversity of a large platform
  const usedUsernames  = new Set(userDocs.map(u => u.username));
  const usedEmails     = new Set(userDocs.map(u => u.email.toLowerCase()));
  const usedSubdomains = new Set(userDocs.map(u => u.subdomain).filter(Boolean));
  const genCount       = TARGET_USERS - NAMED_USERS.length;

  for (let i = 0; i < genCount; i++) {
    const fn = pick(FIRST); const ln = pick(LAST);
    let baseUname = `${fn}${ln}`.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    if (baseUname.length < 3) baseUname = `user`;

    let uname = `${baseUname}${i + 1}`;
    let counter = 1;
    while (usedUsernames.has(uname)) {
      uname = `${baseUname}_${i + 1}_${counter++}`;
    }
    usedUsernames.add(uname);

    const emailDomains = ["inkwell.dev","gmail.com","outlook.com","yahoo.com","proton.me","hey.com","icloud.com"];
    let email = `${uname}@${pick(emailDomains)}`;
    let emailCounter = 1;
    while (usedEmails.has(email)) {
      email = `${uname}_${emailCounter++}@${pick(emailDomains)}`;
    }
    usedEmails.add(email);

    const avatarUrl = i % 15 === 0 ? "" : `https://i.pravatar.cc/200?img=${(i % 70) + 1}`;

    const status        = i < Math.floor(genCount * 0.03) ? "banned" : "active";
    const emailVerified = i % 10 !== 0;
    const followedTags  = pickN(ALL_TAGS, randInt(0, 6));
    const digestFreq    = rand() < 0.25 ? "off" : "weekly";
    const allEmails     = rand() > 0.1;

    const expStatus  = pick(["idle","idle","idle","idle","idle","pending","ready","failed"]);
    const lastDigest = rand() < 0.4 ? new Date(NOW - randInt(1, 30) * 86400000) : null;

    let subdomain = undefined;
    if (i < 25) {
      let candidateSub = uname;
      let subCounter = 1;
      while (usedSubdomains.has(candidateSub)) {
        candidateSub = `${uname}_sub${subCounter++}`;
      }
      subdomain = candidateSub;
      usedSubdomains.add(subdomain);
    }

    const isMember = i % 4 === 0;
    const u = {
      name:       `${fn} ${ln}`,
      username:   uname,
      email,
      password:   hashedPassword,
      bio:        pick(BIO_POOL),
      avatarUrl,
      role:       "user",
      status,
      emailVerified,
      followedTags,
      membershipStatus: isMember ? "active" : "none",
      razorpayCustomerId: isMember ? `cust_gen_${uname}` : null,
      razorpaySubscriptionId: isMember ? `sub_gen_${uname}` : null,
      emailPrefs:        { allEmails, digestFrequency: digestFreq },
      lastDigestSentAt:  lastDigest,
      exportStatus:      expStatus,
      exportRequestedAt: expStatus !== "idle" ? new Date(NOW - randInt(1, 5) * 3600000) : undefined,
      subdomain,
    };
    userDocs.push(u);
  }

  // Insert all users in a single bulk operation
  const users = await User.insertMany(userDocs);

  const userMap     = {};
  users.forEach(u => { userMap[u.username] = u; });
  const activeUsers = users.filter(u => u.status === "active");
  const bannedUsers = users.filter(u => u.status === "banned");
  const adminUsers  = users.filter(u => u.role   === "admin");

  console.log(`[seed] Users: ${users.length} (${activeUsers.length} active, ${bannedUsers.length} banned, ${adminUsers.length} admins)`);

  // ──────────────────────────────────────────────────────────
  //  2. PUBLICATIONS + MEMBERS
  // ──────────────────────────────────────────────────────────
  console.log("[seed] Creating publications and memberships...");
  const publications = [];
  const pubMembers   = {};  // { pubId → [{ user, role }] }

  // Power users own the publications
  const ownerPool = ["ada","jbaldwin","grace","maya","leo"]
    .map(u => userMap[u]).filter(Boolean);

  for (let pi = 0; pi < PUB_DEFS.length; pi++) {
    const def   = PUB_DEFS[pi];
    const owner = ownerPool[pi % ownerPool.length];

    const pub = await Publication.create({
      name:        def.name,
      slug:        def.slug,
      description: def.description,
      logoUrl:     def.logoUrl    || "",
      coverImage:  def.coverImage || "",
      owner:       owner._id,
      isArchived:  def.isArchived || false,
    });
    publications.push(pub);
    pubMembers[String(pub._id)] = [];

    // Owner membership
    await PublicationMember.create({
      publication: pub._id, user: owner._id, role: "owner",
      invitedBy: owner._id, joinedAt: new Date(NOW - randInt(60, 365) * 86400000),
    });
    pubMembers[String(pub._id)].push({ user: owner, role: "owner" });

    // Skip adding members to the archived publication
    if (def.isArchived) continue;

    // 1–2 editors
    const editors = pickN(activeUsers.filter(u => String(u._id) !== String(owner._id)), 2);
    for (const ed of editors) {
      await PublicationMember.create({
        publication: pub._id, user: ed._id, role: "editor",
        invitedBy: owner._id, joinedAt: new Date(NOW - randInt(30, 180) * 86400000),
      });
      pubMembers[String(pub._id)].push({ user: ed, role: "editor" });
    }

    // 3–8 writers
    const usedIds = new Set([String(owner._id), ...editors.map(u => String(u._id))]);
    const writers = pickN(activeUsers.filter(u => !usedIds.has(String(u._id))), randInt(3, 8));
    for (const wr of writers) {
      await PublicationMember.create({
        publication: pub._id, user: wr._id, role: "writer",
        invitedBy: editors[0]?._id || owner._id, joinedAt: new Date(NOW - randInt(7, 120) * 86400000),
      });
      pubMembers[String(pub._id)].push({ user: wr, role: "writer" });
    }
  }

  const activePubs = publications.filter(p => !p.isArchived);
  const pmCount    = await PublicationMember.countDocuments();
  console.log(`[seed] Publications: ${publications.length}, Members: ${pmCount}`);

  // ──────────────────────────────────────────────────────────
  //  3. CONTENT  (Posts, Follows, Comments, Bookmarks, Lists)
  // ──────────────────────────────────────────────────────────
  const { posts, publishedVisible } = await seedContent({
    users, userMap, activeUsers, bannedUsers, publications, activePubs, pubMembers, NOW,
  });

  // ──────────────────────────────────────────────────────────
  //  4. MODERATION  (Reports, Audit Logs, Post Revisions)
  // ──────────────────────────────────────────────────────────
  await seedModeration({
    users, activeUsers, adminUsers, posts, publishedVisible, NOW,
  });

  // ──────────────────────────────────────────────────────────
  //  FINAL STATS
  // ──────────────────────────────────────────────────────────
  const [uC, pC, cC, fC, rC, alC, prC, pubC, pmC, rlC, reC, mpC, pleC] = await Promise.all([
    User.countDocuments(), Post.countDocuments(), Comment.countDocuments(), Follow.countDocuments(),
    Report.countDocuments(), AuditLog.countDocuments(), PostRevision.countDocuments(),
    Publication.countDocuments(), PublicationMember.countDocuments(), ReadingList.countDocuments(),
    ReadEvent.countDocuments(), MembershipPayment.countDocuments(), PayoutLedgerEntry.countDocuments(),
  ]);

  const line = "=".repeat(54);
  console.log(`\n${line}`);
  console.log("  Inkwell Database Seeded Successfully!");
  console.log(line);
  console.log(`  Users             ${uC}`);
  console.log(`  Posts             ${pC}  (${publishedVisible.length} published+visible)`);
  console.log(`  Comments          ${cC}`);
  console.log(`  Follow edges      ${fC}`);
  console.log(`  Reports           ${rC}`);
  console.log(`  Audit Logs        ${alC}`);
  console.log(`  Post Revisions    ${prC}`);
  console.log(`  Publications      ${pubC}`);
  console.log(`  Pub Members       ${pmC}`);
  console.log(`  Reading Lists     ${rlC}`);
  console.log(`  Read Events       ${reC}`);
  console.log(`  Member Payments   ${mpC}`);
  console.log(`  Payout Ledger     ${pleC}`);
  console.log(line);
  console.log("  Demo accounts  (password: password123)");
  console.log("  [Admin]   ada@inkwell.dev");
  console.log("  [Admin]   turing@inkwell.dev");
  console.log("  [Admin]   margaret@inkwell.dev");
  console.log("  [Power]   james@inkwell.dev");
  console.log("  [Power]   grace@inkwell.dev");
  console.log("  [Banned]  spam@spammer.org");
  console.log("  [Unverif] simone@inkwell.dev  (token valid 12h)");
  console.log("  [Unverif] virginia@inkwell.dev (token expired)");
  console.log("  [No-mail] bell@inkwell.dev     (all emails off)");
  console.log(`${line}\n`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("[seed] Failed:", err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
