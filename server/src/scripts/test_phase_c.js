"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const http = require("http");
const app = require("../app");
const User = require("../models/User");
const Post = require("../models/Post");
const Publication = require("../models/Publication");
const PublicationMember = require("../models/PublicationMember");
const ReadingList = require("../models/ReadingList");
const Follow = require("../models/Follow");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const PostRevision = require("../models/PostRevision");
const AuditLog = require("../models/AuditLog");

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function getCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function runTests() {
  console.log("🧪 Starting Inkwell Phase C (Growth Engine) Integration Suite...");

  // 1. Setup Database Connection & Clean Collections
  await connectDB();
  await User.deleteMany({});
  await Post.deleteMany({});
  await Publication.deleteMany({});
  await PublicationMember.deleteMany({});
  await ReadingList.deleteMany({});
  await Follow.deleteMany({});
  await Comment.deleteMany({});
  await Report.deleteMany({});
  await PostRevision.deleteMany({});
  await AuditLog.deleteMany({});

  // 2. Start Test Server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Test server running on ${BASE_URL}\n`);

  async function makeRequest(path, method = "GET", body = null, cookie = "") {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const headers = {
        "Cookie": cookie,
        "Content-Type": "application/json",
      };
      let bodyStr = "";
      if (body) {
        bodyStr = JSON.stringify(body);
        headers["Content-Length"] = Buffer.byteLength(bodyStr);
      }
      const options = { method, headers };
      const req = http.request(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        });
      });
      req.on("error", reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  try {
    // --- Step 0 Verification ---
    console.log("--- Step 0: Shared Visibility Filter & Models ---");
    const visibleFilter = Post.visibleQuery({ extra: 123 });
    if (visibleFilter.status !== "published" || visibleFilter.moderationStatus !== "visible" || visibleFilter.extra !== 123) {
      throw new Error("Post.visibleQuery helper failed to produce canonical filter object.");
    }
    console.log("   ✅ Post.visibleQuery static helper produces canonical filter.");

    // Seed test users
    const ownerRes = await makeRequest("/api/auth/register", "POST", {
      name: "Pub Owner",
      username: "pubowner",
      email: "owner@test.com",
      password: "Password123!",
    });
    const ownerCookie = getCookies(ownerRes.headers);
    const ownerId = ownerRes.body.data.user.id;

    const writerRes = await makeRequest("/api/auth/register", "POST", {
      name: "Writer One",
      username: "writerone",
      email: "writer1@test.com",
      password: "Password123!",
    });
    const writerCookie = getCookies(writerRes.headers);
    const writerId = writerRes.body.data.user.id;

    const readerRes = await makeRequest("/api/auth/register", "POST", {
      name: "Reader Two",
      username: "readertwo",
      email: "reader2@test.com",
      password: "Password123!",
    });
    const readerCookie = getCookies(readerRes.headers);

    // Verify email for owner and writer so they can publish
    await User.updateOne({ _id: ownerId }, { emailVerified: true });
    await User.updateOne({ _id: writerId }, { emailVerified: true });

    // --- Step 1 Verification: Publications ---
    console.log("\n--- Step 1: Publications & Submission Review Workflow ---");
    
    // Reserved slug block check
    const reservedRes = await makeRequest("/api/publications", "POST", { name: "Admin", slug: "admin" }, ownerCookie);
    if (reservedRes.status !== 400) {
      throw new Error(`Reserved publication slug check failed. Expected status 400, got ${reservedRes.status}: ${JSON.stringify(reservedRes.body)}`);
    }
    console.log("   ✅ Reserved slug collision block enforced.");

    // Create publication
    const pubRes = await makeRequest("/api/publications", "POST", {
      name: "Tech Pulse",
      slug: "tech-pulse",
      description: "Latest in tech and software architecture",
    }, ownerCookie);
    if (pubRes.status !== 201) throw new Error(`Publication creation failed: ${JSON.stringify(pubRes.body)}`);
    console.log("   ✅ Publication 'Tech Pulse' created by pubowner.");

    // Invite writerone to publication
    const inviteRes = await makeRequest("/api/publications/tech-pulse/members", "POST", {
      username: "writerone",
      role: "writer",
    }, ownerCookie);
    if (inviteRes.status !== 201) throw new Error(`Invite member failed: ${JSON.stringify(inviteRes.body)}`);
    console.log("   ✅ User 'writerone' invited as writer.");

    // Writer creates two posts (one to approve, one to reject)
    const post1Res = await makeRequest("/api/posts", "POST", {
      title: "Building Microservices with Node.js",
      contentHtml: "<p>Microservices guide</p>",
      tags: ["javascript", "backend"],
      status: "published",
    }, writerCookie);
    const post1Slug = post1Res.body.data.post.slug;
    const post1Id = post1Res.body.data.post.id;

    const post2Res = await makeRequest("/api/posts", "POST", {
      title: "Low Quality Spam Story",
      contentHtml: "<p>Spam content</p>",
      tags: ["spam"],
      status: "published",
    }, writerCookie);
    const post2Slug = post2Res.body.data.post.slug;
    const post2Id = post2Res.body.data.post.id;

    // Submit posts to publication
    const submit1 = await makeRequest(`/api/posts/${post1Slug}/submit`, "POST", { publicationSlug: "tech-pulse" }, writerCookie);
    if (submit1.status !== 200 || submit1.body.data.post.submissionStatus !== "pending") {
      throw new Error("Post submission failed.");
    }

    const submit2 = await makeRequest(`/api/posts/${post2Slug}/submit`, "POST", { publicationSlug: "tech-pulse" }, writerCookie);
    if (submit2.status !== 200 || submit2.body.data.post.submissionStatus !== "pending") {
      throw new Error("Second post submission failed.");
    }
    console.log("   ✅ Stories submitted to publication (status: pending).");

    // Owner reviews: approves post 1, rejects post 2 with note
    const reviewApprove = await makeRequest(`/api/publications/tech-pulse/submissions/${post1Id}`, "PATCH", { action: "approve" }, ownerCookie);
    if (reviewApprove.status !== 200 || reviewApprove.body.data.post.submissionStatus !== "approved") {
      throw new Error("Approval review failed.");
    }

    const reviewRejectNoNote = await makeRequest(`/api/publications/tech-pulse/submissions/${post2Id}`, "PATCH", { action: "reject" }, ownerCookie);
    if (reviewRejectNoNote.status !== 400) {
      throw new Error("Rejection without note was not blocked!");
    }

    const reviewReject = await makeRequest(`/api/publications/tech-pulse/submissions/${post2Id}`, "PATCH", { action: "reject", reviewNote: "Does not meet publication standards." }, ownerCookie);
    if (reviewReject.status !== 200 || reviewReject.body.data.post.submissionStatus !== "rejected") {
      throw new Error("Rejection review failed.");
    }
    console.log("   ✅ Review workflow executed (approved story 1, rejected story 2 with required note).");

    // Check public publication page
    const pubPublic = await makeRequest("/api/publications/tech-pulse");
    if (pubPublic.status !== 200) throw new Error("Could not fetch publication profile.");
    const pubPosts = pubPublic.body.data.posts;
    if (pubPosts.length !== 1 || pubPosts[0].slug !== post1Slug) {
      throw new Error(`Publication profile post filter failed! Found ${pubPosts.length} posts.`);
    }
    console.log("   ✅ Publication profile page contains ONLY approved posts.");

    // Last-owner lockout guard check
    const removeOwnerRes = await makeRequest(`/api/publications/tech-pulse/members/${ownerId}`, "DELETE", null, ownerCookie);
    if (removeOwnerRes.status !== 400) {
      throw new Error("Last owner removal guard failed!");
    }
    console.log("   ✅ Last-owner lockout guard correctly blocked sole owner removal.");

    // Audit Item 1: Authorial ownership guard — Editor/Owner cannot edit author's post content via PATCH /api/posts/:slug
    const editorPatchRes = await makeRequest(`/api/posts/${post1Slug}`, "PATCH", { title: "Hacked by Editor" }, ownerCookie);
    if (editorPatchRes.status !== 403) {
      throw new Error(`Authorial ownership guard failed! Expected status 403 when editor patches author's post, got ${editorPatchRes.status}`);
    }
    console.log("   ✅ Authorial ownership guard: Editor content PATCH attempt on author's post correctly blocked (403).");

    // Audit Item 2: Decoupled publishing — Rejected/pending posts stay status: published & visible on author's profile
    const post2Check = await Post.findById(post2Id);
    if (post2Check.status !== "published" || post2Check.submissionStatus !== "rejected") {
      throw new Error("Decoupled publishing failed: post status mutated during submission rejection.");
    }
    const authorProfilePosts = await makeRequest(`/api/posts?author=writerone`);
    if (authorProfilePosts.status !== 200 || !authorProfilePosts.body.data.posts.some(p => p.slug === post2Slug)) {
      throw new Error("Decoupled publishing failed: rejected post missing from author's public profile.");
    }
    console.log("   ✅ Decoupled publishing: Rejected post remains status 'published' and visible on author's profile.");

    // Audit Item 3: Exercise request_changes and withdrawSubmission
    const post3Res = await makeRequest("/api/posts", "POST", {
      title: "Story Needing Formatting Changes",
      contentHtml: "<p>Initial content</p>",
      tags: ["engineering"],
      status: "published",
    }, writerCookie);
    const post3Slug = post3Res.body.data.post.slug;
    const post3Id = post3Res.body.data.post.id;

    await makeRequest(`/api/posts/${post3Slug}/submit`, "POST", { publicationSlug: "tech-pulse" }, writerCookie);

    // Request changes
    const reqChangesRes = await makeRequest(`/api/publications/tech-pulse/submissions/${post3Id}`, "PATCH", {
      action: "request_changes",
      reviewNote: "Please expand section 2 and format code blocks.",
    }, ownerCookie);
    if (reqChangesRes.status !== 200 || reqChangesRes.body.data.post.submissionStatus !== "changes_requested" || reqChangesRes.body.data.post.reviewNote !== "Please expand section 2 and format code blocks.") {
      throw new Error(`request_changes review action failed: ${JSON.stringify(reqChangesRes.body)}`);
    }
    console.log("   ✅ Review action 'request_changes' executed successfully with review note.");

    // Withdraw submission
    const withdrawRes = await makeRequest(`/api/posts/${post3Slug}/submit`, "DELETE", null, writerCookie);
    if (withdrawRes.status !== 200 || withdrawRes.body.data.post.submissionStatus !== "none" || withdrawRes.body.data.post.publication !== null) {
      throw new Error(`withdrawSubmission failed: ${JSON.stringify(withdrawRes.body)}`);
    }
    console.log("   ✅ Writer successfully withdrew pending submission (status reset to 'none').");

    // --- Step 2 Verification: Recommendation Scoring ---
    console.log("\n--- Step 2: Personalized Recommendation Scoring & For You Feed ---");
    
    // User 'readertwo' follows tag 'javascript' and author 'writerone'
    await makeRequest("/api/posts/tags/javascript/follow", "POST", null, readerCookie);
    await makeRequest(`/api/users/${writerId}/follow`, "POST", null, readerCookie);

    // Call /api/posts/recommended for readertwo
    const recRes = await makeRequest("/api/posts/recommended", "GET", null, readerCookie);
    if (recRes.status !== 200) throw new Error(`Recommendation endpoint failed: ${JSON.stringify(recRes.body)}`);
    const recPosts = recRes.body.data.posts;
    if (recPosts.length === 0 || recPosts[0].slug !== post1Slug) {
      throw new Error("Personalized recommendation scoring failed to prioritize followed tag/author post!");
    }
    console.log("   ✅ 'For You' personalized feed prioritizes stories by followed tags & authors.");

    // --- Step 3 Verification: Reading Lists ---
    console.log("\n--- Step 3: Reading Lists ---");
    
    // Create 1 public list and 1 private list
    const list1Res = await makeRequest("/api/lists", "POST", { name: "JS Favorites", visibility: "public" }, readerCookie);
    const list1Id = list1Res.body.data.list.id;
    const list1Slug = list1Res.body.data.list.slug;

    const list2Res = await makeRequest("/api/lists", "POST", { name: "Private Drafts", visibility: "private" }, readerCookie);
    const list2Id = list2Res.body.data.list.id;
    const list2Slug = list2Res.body.data.list.slug;

    // Audit Item 4: Private list access block for non-owner / logged out
    const privateListLoggedOut = await makeRequest(`/api/lists/readertwo/${list2Slug}`);
    if (privateListLoggedOut.status !== 403 && privateListLoggedOut.status !== 404) {
      throw new Error(`Private list privacy test failed! Expected 403/404 for logged-out access to private list, got ${privateListLoggedOut.status}`);
    }

    const privateListOtherUser = await makeRequest(`/api/lists/readertwo/${list2Slug}`, "GET", null, writerCookie);
    if (privateListOtherUser.status !== 403 && privateListOtherUser.status !== 404) {
      throw new Error(`Private list privacy test failed! Expected 403/404 for another user accessing private list, got ${privateListOtherUser.status}`);
    }
    console.log("   ✅ Private reading list access control verified: blocked for logged-out and non-owner users.");

    // Create draft post by writer
    const draftRes = await makeRequest("/api/posts", "POST", {
      title: "Unpublished Secret Draft",
      contentHtml: "<p>Draft</p>",
      status: "draft",
    }, writerCookie);
    const draftId = draftRes.body.data.post.id;

    // Attempt to add draft post to reading list (must be blocked 400)
    const addDraftRes = await makeRequest(`/api/lists/${list1Id}/posts`, "POST", { postId: draftId }, readerCookie);
    if (addDraftRes.status !== 400) {
      throw new Error("Draft post addition to reading list was not blocked!");
    }
    console.log("   ✅ Interaction block: Draft post addition to reading list blocked.");

    // Add published post1 to reading list
    const addPostRes = await makeRequest(`/api/lists/${list1Id}/posts`, "POST", { postId: post1Id }, readerCookie);
    if (addPostRes.status !== 200) throw new Error("Failed to add published post to list.");
    console.log("   ✅ Published post added to reading list.");

    // Logged-out view of public list works
    const publicListView = await makeRequest(`/api/lists/readertwo/${list1Slug}`);
    if (publicListView.status !== 200 || publicListView.body.data.posts.length !== 1) {
      throw new Error("Public reading list view failed logged-out.");
    }
    console.log("   ✅ Public reading list accessible logged-out.");

    // Moderation hide post1 and check reading list renders placeholder
    await Post.updateOne({ _id: post1Id }, { moderationStatus: "hidden" });
    const hiddenListView = await makeRequest(`/api/lists/readertwo/${list1Slug}`);
    if (hiddenListView.status !== 200 || !hiddenListView.body.data.posts[0].isRemoved) {
      throw new Error("Dangling reference placeholder rendering failed for hidden post!");
    }
    console.log("   ✅ Dangling reference placeholder correctly rendered for hidden post in list.");
    
    // Restore post1 moderation status
    await Post.updateOne({ _id: post1Id }, { moderationStatus: "visible" });

    // --- Step 4 Verification: Related Posts & 7-Day Trending Tags ---
    console.log("\n--- Step 4: Related Posts & 7-Day Trending Tags ---");
    
    // Create another post sharing 'javascript' tag
    await makeRequest("/api/posts", "POST", {
      title: "Advanced JavaScript Async Generators",
      contentHtml: "<p>Async generators</p>",
      tags: ["javascript", "node"],
      status: "published",
    }, ownerCookie);

    const relatedRes = await makeRequest(`/api/posts/${post1Slug}/related`);
    if (relatedRes.status !== 200 || relatedRes.body.data.posts.length !== 1) {
      throw new Error("Related posts query failed!");
    }
    console.log("   ✅ Related posts query returned same-tag stories.");

    // Audit Item 5: Seed an 8-day old post with tag 'archaic-tag' and confirm it's EXCLUDED from trending tags
    const oldPost = new Post({
      title: "Ancient Archaic Story",
      slug: "ancient-archaic-story",
      contentHtml: "<p>Old story</p>",
      author: writerId,
      status: "published",
      moderationStatus: "visible",
      tags: ["archaic-tag"],
      createdAt: new Date(Date.now() - 9 * 86400000), // 9 days ago
      publishedAt: new Date(Date.now() - 9 * 86400000),
    });
    await oldPost.save();

    const trendingRes = await makeRequest("/api/posts/tags/trending");
    if (trendingRes.status !== 200 || !trendingRes.body.data.tags.some(t => t.tag === "javascript")) {
      throw new Error("7-day recency trending tags failed!");
    }
    if (trendingRes.body.data.tags.some(t => t.tag === "archaic-tag")) {
      throw new Error("Trending tags 7-day recency exclusion failed! 9-day old tag was included.");
    }
    console.log("   ✅ 7-day recency-weighted trending tags verified: 9-day old post tags correctly EXCLUDED.");

    // --- Step 5 Verification: Account Deletion Cascade ---
    console.log("\n--- Step 5: Account Deletion Cascade Updates ---");
    
    const jwt = require("jsonwebtoken");
    const env = require("../config/env");

    // Audit Item 6a: Delete user who owns reading lists & publication memberships (readertwo)
    const readerId = (await User.findOne({ username: "readertwo" }))._id;
    const readerDelToken = jwt.sign({ sub: readerId, purpose: "delete" }, env.jwtAccessSecret, { expiresIn: "30m" });
    const readerDelRes = await makeRequest("/api/users/me", "DELETE", { token: readerDelToken, mode: "erase" }, readerCookie);
    if (readerDelRes.status !== 200) throw new Error(`Reader account deletion failed: ${JSON.stringify(readerDelRes.body)}`);

    const remainingLists = await ReadingList.countDocuments({ owner: readerId });
    if (remainingLists !== 0) {
      throw new Error(`Reading list cascade deletion failed! Expected 0 lists owned by readertwo, found ${remainingLists}`);
    }
    const remainingMemberships = await PublicationMember.countDocuments({ user: readerId });
    if (remainingMemberships !== 0) {
      throw new Error(`PublicationMember cascade deletion failed! Expected 0 memberships for readertwo, found ${remainingMemberships}`);
    }
    console.log("   ✅ Reading list & publication membership deletion cascade verified (0 records remaining).");

    // Audit Item 6b: Sole owner with no remaining members soft-archive path test
    const soloOwnerRes = await makeRequest("/api/auth/register", "POST", {
      name: "Solo Owner",
      username: "soloowner",
      email: "solo@test.com",
      password: "Password123!",
    });
    const soloCookie = getCookies(soloOwnerRes.headers);
    const soloId = soloOwnerRes.body.data.user.id;
    await User.updateOne({ _id: soloId }, { emailVerified: true });

    await makeRequest("/api/publications", "POST", { name: "Solo Magazine", slug: "solo-mag" }, soloCookie);

    const soloDelToken = jwt.sign({ sub: soloId, purpose: "delete" }, env.jwtAccessSecret, { expiresIn: "30m" });
    await makeRequest("/api/users/me", "DELETE", { token: soloDelToken, mode: "erase" }, soloCookie);

    const soloPubAfterDel = await Publication.findOne({ slug: "solo-mag" });
    if (!soloPubAfterDel || !soloPubAfterDel.isArchived) {
      throw new Error("Sole-owner soft-archive publication cascade failed!");
    }
    console.log("   ✅ Sole-owner with no members soft-archive path verified (publication auto-archived).");

    // Delete publication owner (pubowner) -> ownership transferred to senior member (writerone)
    const delToken = jwt.sign({ sub: ownerId, purpose: "delete" }, env.jwtAccessSecret, { expiresIn: "30m" });
    const delRes = await makeRequest("/api/users/me", "DELETE", { token: delToken, mode: "erase" }, ownerCookie);
    if (delRes.status !== 200) throw new Error(`Account deletion failed: ${JSON.stringify(delRes.body)}`);

    // Verify publication ownership was transferred to senior member (writerone)
    const pubAfterDel = await Publication.findOne({ slug: "tech-pulse" });
    if (String(pubAfterDel.owner) !== String(writerId)) {
      throw new Error("Publication owner transfer on delete failed!");
    }
    console.log("   ✅ Account deletion transferred publication ownership to senior member 'writerone'.");

    console.log("\n🎉 ALL PHASE C INTEGRATION TESTS PASSED CLEANLY!");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed with error:", err);
  process.exit(1);
});
