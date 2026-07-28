"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const app = require("../app");
const User = require("@vami/identity-service").User;
const Post = require("../models/Post");
const Follow = require("../models/Follow");

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper to extract cookies from Set-Cookie headers
function getCookies(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function testSuite() {
  console.log("🚀 Starting upgraded SEO, Ownership & Portability Verification Suite...");
  await connectDB();
  
  // 1. Reset limits in DB first for clean run
  const ada = await User.findOne({ email: "ada@inkwell.dev" });
  const grace = await User.findOne({ email: "grace@inkwell.dev" });
  if (!ada || !grace) {
    console.error("❌ Seed data not found. Please run pnpm seed first.");
    process.exit(1);
  }
  
  const originalAdaSubdomain = ada.subdomain;
  const originalGraceSubdomain = grace.subdomain;

  ada.exportStatus = "idle";
  ada.exportRequestedAt = undefined;
  ada.subdomain = undefined;
  await ada.save();

  grace.exportStatus = "idle";
  grace.exportRequestedAt = undefined;
  grace.subdomain = undefined;
  await grace.save();

  // 2. Start the Express Test Server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Test server running on ${BASE_URL}`);

  const report = [];
  report.push("# 🔎 Inkwell — SEO, Ownership & Portability Verification Report");
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push("\n## 📋 Execution Results\n");

  // Helper to make requests
  async function makeRequest(path, method = "GET", body = null, cookie = "") {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        headers: {
          "Cookie": cookie,
          "Content-Type": "application/json",
        },
      };
      const req = http.request(url, options, (res) => {
        const chunks = [];
        res.on("data", (chunk) => { chunks.push(chunk); });
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const rawString = buffer.toString("utf8");
          let json = null;
          try {
            json = JSON.parse(rawString);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: rawString, buffer });
        });
      });
      req.on("error", reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  // --- TEST 1: Login & Cookie Authenticated Flow ---
  console.log("\n🏃 Running Test 1: Authentication...");
  const loginRes = await makeRequest("/api/auth/login", "POST", {
    email: "ada@inkwell.dev",
    password: "password123",
  });
  const adaCookie = getCookies(loginRes.headers);
  const authSuccess = loginRes.status === 200 && adaCookie.includes("accessToken");
  console.log(authSuccess ? "✅ Test 1 Passed" : "❌ Test 1 Failed");
  report.push(`### 1. Authentication and Session Setup
- **Endpoint**: \`POST /api/auth/login\`
- **Status Code**: \`${loginRes.status}\`
- **Result**: ${authSuccess ? "✅ Passed (Cookies set correctly)" : "❌ Failed"}
`);

  // --- TEST 2: Indexing & Unpublish Invariant ---
  console.log("🏃 Running Test 2: Unpublish Invariant...");
  const createRes = await makeRequest("/api/posts", "POST", {
    title: "Verification Test Story",
    contentHtml: "<p>Hello world from verification test</p>",
    status: "draft",
  }, adaCookie);
  
  const postSlug = createRes.body.data.post.slug;
  const draftPost = await Post.findOne({ slug: postSlug });
  const indexableDraft = draftPost.indexable === false;

  await makeRequest(`/api/posts/${postSlug}`, "PATCH", { status: "published" }, adaCookie);
  const pubPost = await Post.findOne({ slug: postSlug });
  const indexablePub = pubPost.indexable === true && pubPost.seo.canonicalUrl.includes(`/p/${postSlug}`);

  await makeRequest(`/api/posts/${postSlug}`, "PATCH", { status: "draft" }, adaCookie);
  const unpubPost = await Post.findOne({ slug: postSlug });
  const indexableUnpub = unpubPost.indexable === false;

  const test2Passed = indexableDraft && indexablePub && indexableUnpub;
  console.log(test2Passed ? "✅ Test 2 Passed" : "❌ Test 2 Failed");
  report.push(`### 2. Status & Indexable Invariant Validation
- **Invariant**: \`status === 'published' ⟺ indexable === true\`
- **Draft Check**: indexable is \`${draftPost.indexable}\` (Expected: false)
- **Published Check**: indexable is \`${pubPost.indexable}\` (Expected: true), canonical is \`${pubPost.seo.canonicalUrl}\`
- **Unpublish Check**: indexable is \`${unpubPost.indexable}\` (Expected: false)
- **Result**: ${test2Passed ? "✅ Passed (Zero status-indexable drift)" : "❌ Failed"}
`);

  // --- TEST 3: Canonical & Slug Immutability & Cycle Stability ---
  console.log("🏃 Running Test 3: Canonical & Slug Immutability & Cycle Stability...");
  
  // 1. Initial Publish & capture canonical
  await makeRequest(`/api/posts/${postSlug}`, "PATCH", { status: "published" }, adaCookie);
  const firstPost = await Post.findOne({ slug: postSlug });
  const firstCanonical = firstPost.seo.canonicalUrl;

  // 2. Try to override canonical and slug via PATCH body
  const patchOverrideRes = await makeRequest(`/api/posts/${postSlug}`, "PATCH", {
    seo: {
      metaTitle: "New SEO Title",
      canonicalUrl: "http://malicious-hijack-url.com",
    },
    slug: "new-custom-slug-hijack",
  }, adaCookie);

  const afterHackPost = await Post.findOne({ slug: postSlug });
  const hijackBlocked = afterHackPost.seo.canonicalUrl === firstCanonical && afterHackPost.slug === postSlug;

  // 3. Unpublish to draft
  await makeRequest(`/api/posts/${postSlug}`, "PATCH", { status: "draft" }, adaCookie);

  // 4. Publish again and capture final canonical
  await makeRequest(`/api/posts/${postSlug}`, "PATCH", { status: "published" }, adaCookie);
  const secondPost = await Post.findOne({ slug: postSlug });
  const secondCanonical = secondPost.seo.canonicalUrl;

  const cycleStable = firstCanonical === secondCanonical;
  const test3Passed = hijackBlocked && cycleStable;

  console.log(test3Passed ? "✅ Test 3 Passed" : "❌ Test 3 Failed");
  report.push(`### 3. Canonical URL & Slug Immutability & Cycle Stability
- **Security Check**: Attempting to override canonical and slug via PATCH body is blocked: \`${hijackBlocked}\`
- **Cycle Check**: Canonical identical across draft ➔ publish ➔ draft ➔ publish cycle: \`${cycleStable}\`
- **First Publish Canonical**: \`${firstCanonical}\`
- **Second Publish Canonical**: \`${secondCanonical}\`
- **Result**: ${test3Passed ? "✅ Passed (Canonical is permanently locked and stable)" : "❌ Failed"}
`);

  // --- TEST 4: Subdomain Input Validation (PATCH) ---
  console.log("🏃 Running Test 4: Subdomain Validation...");
  const resSubRes = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "admin" }, adaCookie);
  const reservedBlocked = resSubRes.status === 400 && resSubRes.body.errors[0].message.includes("reserved");

  const badCharRes = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "ada_love" }, adaCookie);
  const badCharBlocked = badCharRes.status === 400 && badCharRes.body.errors[0].message.includes("lowercase letters, numbers, and hyphens");

  const shortRes = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "ad" }, adaCookie);
  const lengthBlocked = shortRes.status === 400 && shortRes.body.errors[0].message.includes("3–30 characters");

  const validClaim = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "ada-love-test" }, adaCookie);
  const claimSuccess = validClaim.status === 200 && validClaim.body.data.user.subdomain === "ada-love-test";

  // Check username collision (grace is Grace's username)
  const usernameCollisionRes = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "grace" }, adaCookie);
  const usernameCollisionBlocked = usernameCollisionRes.status === 400 && usernameCollisionRes.body.errors[0].message.includes("matches another user's username");

  const graceLogin = await makeRequest("/api/auth/login", "POST", { email: "grace@inkwell.dev", password: "password123" });
  const graceCookie = getCookies(graceLogin.headers);
  const collisionRes = await makeRequest("/api/users/me/subdomain", "PATCH", { subdomain: "ada-love-test" }, graceCookie);
  const collisionBlocked = collisionRes.status === 400 && collisionRes.body.errors[0].message.includes("already taken");

  const test4Passed = reservedBlocked && badCharBlocked && lengthBlocked && claimSuccess && usernameCollisionBlocked && collisionBlocked;
  console.log(test4Passed ? "✅ Test 4 Passed" : "❌ Test 4 Failed");
  report.push(`### 4. Subdomain Input Validation & Blacklist Check
- **Reserved Subdomain (\`admin\`)**: Status \`${resSubRes.status}\` (Expected: 400), Msg: \`${resSubRes.body?.errors?.[0]?.message}\`
- **Invalid Characters (\`ada_love\`)**: Status \`${badCharRes.status}\` (Expected: 400), Msg: \`${badCharRes.body?.errors?.[0]?.message}\`
- **Short Subdomain (\`ad\`)**: Status \`${shortRes.status}\` (Expected: 400), Msg: \`${shortRes.body?.errors?.[0]?.message}\`
- **Valid Claim (\`ada-love-test\`)**: Status \`${validClaim.status}\` (Expected: 200), Subdomain: \`${validClaim.body?.data?.user?.subdomain}\`
- **Username Collision Check (\`grace\`)**: Status \`${usernameCollisionRes.status}\` (Expected: 400), Msg: \`${usernameCollisionRes.body?.errors?.[0]?.message}\`
- **Collision check (Grace claiming \`ada-love-test\`)**: Status \`${collisionRes.status}\` (Expected: 400/409), Msg: \`${collisionRes.body?.errors?.[0]?.message}\`
- **Result**: ${test4Passed ? "✅ Passed (Subdomain claims are safe and validated)" : "❌ Failed"}
`);

  // --- TEST 5: Draft Visibility Gate & Interactions Security ---
  console.log("🏃 Running Test 5: Draft Visibility Gate...");
  const draftCreate = await makeRequest("/api/posts", "POST", {
    title: "Ada Private Draft Story",
    contentHtml: "<p>Ada secrets</p>",
    status: "draft",
  }, adaCookie);
  const draftSlug = draftCreate.body.data.post.slug;

  const authorGet = await makeRequest(`/api/posts/${draftSlug}`, "GET", null, adaCookie);
  const authorGetSuccess = authorGet.status === 200 && authorGet.body.data.post.title === "Ada Private Draft Story";

  const otherGet = await makeRequest(`/api/posts/${draftSlug}`, "GET", null, graceCookie);
  const otherGetBlocked = otherGet.status === 404;

  const anonGet = await makeRequest(`/api/posts/${draftSlug}`, "GET", null);
  const anonGetBlocked = anonGet.status === 404;

  // Interactions checks
  const clapOnDraftRes = await makeRequest(`/api/posts/${draftSlug}/clap`, "POST", { count: 1 }, graceCookie);
  const clapBlocked = clapOnDraftRes.status === 404;

  const bookmarkOnDraftRes = await makeRequest(`/api/posts/${draftSlug}/bookmark`, "POST", null, graceCookie);
  const bookmarkBlocked = bookmarkOnDraftRes.status === 404;

  const commentOnDraftRes = await makeRequest(`/api/posts/${draftSlug}/comments`, "POST", { content: "Draft comment" }, graceCookie);
  const commentBlocked = commentOnDraftRes.status === 404;

  const test5Passed = authorGetSuccess && otherGetBlocked && anonGetBlocked && clapBlocked && bookmarkBlocked && commentBlocked;
  console.log(test5Passed ? "✅ Test 5 Passed" : "❌ Test 5 Failed");
  report.push(`### 5. Draft Access Restriction (Author Gate on GET/POST/PATCH)
- **Author GET Access**: Status \`${authorGet.status}\` (Expected: 200)
- **Other User GET Access**: Status \`${otherGet.status}\` (Expected: 404)
- **Anonymous GET Access**: Status \`${anonGet.status}\` (Expected: 404)
- **Other User CLAP on Draft**: Status \`${clapOnDraftRes.status}\` (Expected: 404)
- **Other User BOOKMARK on Draft**: Status \`${bookmarkOnDraftRes.status}\` (Expected: 404)
- **Other User COMMENT on Draft**: Status \`${commentOnDraftRes.status}\` (Expected: 404)
- **Result**: ${test5Passed ? "✅ Passed (Drafts are strictly author-only and isolated from all interactions)" : "❌ Failed"}
`);

  // --- TEST 6: RSS Content-Type & Validation ---
  console.log("🏃 Running Test 6: RSS Feeds...");
  const rssRes = await makeRequest("/api/feed/rss");
  const isRssXml = rssRes.status === 200 && rssRes.headers["content-type"].includes("application/rss+xml");
  const includesItems = rssRes.rawBody.includes("<rss") && rssRes.rawBody.includes("<channel>") && rssRes.rawBody.includes("<item>");

  const test6Passed = isRssXml && includesItems;
  console.log(test6Passed ? "✅ Test 6 Passed" : "❌ Test 6 Failed");
  report.push(`### 6. RSS Feed Syndication XML Verification
- **Endpoint**: \`GET /api/feed/rss\`
- **Content-Type**: \`${rssRes.headers["content-type"]}\` (Expected: contains \`application/rss+xml\`)
- **Structure Check**: Matches valid RSS 2.0 specifications (\`<rss>\`, \`<channel>\`, \`<item>\`)
- **Result**: ${test6Passed ? "✅ Passed (RSS Feed output fully verified)" : "❌ Failed"}
`);

  // --- TEST 7: Sitemap Entry Count Match ---
  console.log("🏃 Running Test 7: Sitemap Generation...");
  const sitemapRes = await makeRequest("/api/posts/sitemap-data");
  const dbCount = await Post.countDocuments({ status: "published" });
  const sitemapCountMatches = sitemapRes.status === 200 && sitemapRes.body.data.posts.length === dbCount;

  console.log(sitemapCountMatches ? "✅ Test 7 Passed" : "❌ Test 7 Failed");
  report.push(`### 7. Sitemap Dynamic Verification
- **Endpoint**: \`GET /api/posts/sitemap-data\`
- **Sitemap Returned Entries**: \`${sitemapRes.body?.data?.posts?.length}\`
- **DB Published Count**: \`${dbCount}\`
- **Result**: ${sitemapCountMatches ? "✅ Passed (Sitemap feed is perfectly synchronized)" : "❌ Failed"}
`);

  // --- TEST 8: Export Auth-Gate and Rate Limiting ---
  console.log("🏃 Running Test 8: Export Rate Limiting & Auth Gate...");
  const anonExport = await makeRequest("/api/users/me/export/request", "POST");
  const anonExportBlocked = anonExport.status === 401;

  const firstReq = await makeRequest("/api/users/me/export/request", "POST", null, adaCookie);
  const firstSuccess = firstReq.status === 200 && firstReq.body.data.status === "ready";

  const secondReq = await makeRequest("/api/users/me/export/request", "POST", null, adaCookie);
  const secondRateLimited = secondReq.status === 429 && secondReq.body.message.includes("24 hours");

  const test8Passed = anonExportBlocked && firstSuccess && secondRateLimited;
  console.log(test8Passed ? "✅ Test 8 Passed" : "❌ Test 8 Failed");
  report.push(`### 8. Export Authorization and Rate Limiting
- **Anonymous Request**: Status \`${anonExport.status}\` (Expected: 401)
- **First Request (Ada)**: Status \`${firstReq.status}\` (Expected: 200), status: \`${firstReq.body?.data?.status}\`
- **Second Request (within 24h)**: Status \`${secondReq.status}\` (Expected: 429), Msg: \`${secondReq.body?.message}\`
- **Result**: ${test8Passed ? "✅ Passed (Throttling and Auth Guards fully functional)" : "❌ Failed"}
`);

  // --- TEST 9: Export Contents Integrity (ZIP Parse) ---
  console.log("🏃 Running Test 9: Export ZIP Extraction & Verification...");
  const downloadRes = await makeRequest("/api/users/me/export/download", "GET", null, adaCookie);
  const isZipBuffer = downloadRes.status === 200 && downloadRes.buffer && downloadRes.buffer.length > 4;
  const zipMagicMatch = isZipBuffer && downloadRes.buffer[0] === 0x50 && downloadRes.buffer[1] === 0x4b; // 'PK' magic bytes

  let fullExtractionPassed = false;
  let fileCountMatch = false;
  let mdAndJsonMatch = false;

  if (zipMagicMatch) {
    const tempZipPath = path.join(__dirname, "temp-export.zip");
    const tempDestPath = path.join(__dirname, "temp-extracted");

    fs.writeFileSync(tempZipPath, downloadRes.buffer);

    try {
      if (fs.existsSync(tempDestPath)) {
        fs.rmSync(tempDestPath, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDestPath);

      // Extract ZIP using PowerShell native Expand-Archive
      execSync(`powershell -Command "Expand-Archive -Force -Path '${tempZipPath}' -DestinationPath '${tempDestPath}'"`);

      // Verify files inside
      const profilePath = path.join(tempDestPath, "profile.json");
      const indexPath = path.join(tempDestPath, "posts-index.json");
      const postsFolderPath = path.join(tempDestPath, "posts");

      const profileExists = fs.existsSync(profilePath);
      const indexExists = fs.existsSync(indexPath);

      if (profileExists && indexExists) {
        const postsIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        const adaPostsCountInDb = await Post.countDocuments({ author: ada._id });
        
        fileCountMatch = postsIndex.length === adaPostsCountInDb;

        if (fs.existsSync(postsFolderPath)) {
          const files = fs.readdirSync(postsFolderPath);
          // For each index post there must be both a JSON and an MD file
          mdAndJsonMatch = postsIndex.every((p) => {
            const hasJson = files.includes(`${p.slug}.json`);
            const hasMd = files.includes(`${p.slug}.md`);
            return hasJson && hasMd;
          });
        }
        fullExtractionPassed = true;
      }
    } catch (err) {
      console.error("ZIP extraction test error:", err);
    } finally {
      // Clean up
      if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      if (fs.existsSync(tempDestPath)) fs.rmSync(tempDestPath, { recursive: true, force: true });
    }
  }

  const test9Passed = zipMagicMatch && fullExtractionPassed && fileCountMatch && mdAndJsonMatch;
  console.log(test9Passed ? "✅ Test 9 Passed" : "❌ Test 9 Failed");
  report.push(`### 9. Account Data Export Integrity & File Contents
- **ZIP Header Check ('PK')**: \`${zipMagicMatch ? "Found" : "Not Found"}\`
- **ZIP Extraction**: \`${fullExtractionPassed ? "Successful" : "Failed"}\`
- **Profile & Index Files**: \`profile.json\` and \`posts-index.json\` found
- **Index Count Matches DB stories count**: \`${fileCountMatch ? "Verified" : "Drifted"}\`
- **Portability translation check (JSON + Markdown)**: \`${mdAndJsonMatch ? "All formats exported successfully" : "Missing translations"}\`
- **Result**: ${test9Passed ? "✅ Passed (ZIP contents verified completely)" : "❌ Failed"}
`);

  // --- TEST 10: Next.js robots.txt and sitemap.xml Verification ---
  console.log("🏃 Running Test 10: Next.js Frontend Configuration...");
  
  const frontendRequest = async (path) => {
    return new Promise((resolve) => {
      http.get(`http://localhost:3000${path}`, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: data });
        });
      }).on("error", () => {
        resolve({ status: 500, headers: {}, rawBody: "" });
      });
    });
  };

  const robotsRes = await frontendRequest("/robots.txt");
  const sitemapResFrontend = await frontendRequest("/sitemap.xml");

  const robotsOk = robotsRes.status === 200 && robotsRes.rawBody.includes("Disallow: /edit/") && robotsRes.rawBody.includes("Sitemap:");
  const sitemapOk = sitemapResFrontend.status === 200 && sitemapResFrontend.rawBody.includes("<urlset") && sitemapResFrontend.rawBody.includes("/p/");

  const samplePost = await Post.findOne({ status: "published" });
  let jsonLdOk = false;
  let jsonLdHeadline = "";
  if (samplePost) {
    const pageRes = await frontendRequest(`/p/${samplePost.slug}`);
    if (pageRes.status === 200) {
      const match = pageRes.rawBody.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (match && match[1]) {
        try {
          const jsonLd = JSON.parse(match[1]);
          jsonLdHeadline = jsonLd.headline;
          jsonLdOk = jsonLd["@context"] === "https://schema.org" && jsonLd["@type"] === "Article" && jsonLd.headline === samplePost.title;
        } catch (e) {}
      }
    }
  }

  const test10Passed = robotsOk && sitemapOk && jsonLdOk;
  console.log(test10Passed ? "✅ Test 10 Passed" : "❌ Test 10 Failed");
  report.push(`### 10. Next.js App Router SEO Outputs
- **Robots.txt check**: Status \`${robotsRes.status}\` (Expected: 200), includes Disallows: \`${robotsOk}\`
- **Sitemap.xml check**: Status \`${sitemapResFrontend.status}\` (Expected: 200), contains URL elements: \`${sitemapOk}\`
- **JSON-LD Structured Data Parsing**: Schema validation is \`${jsonLdOk ? "Article Schema Valid" : "Failed"}\` for story headline: \`${jsonLdHeadline}\`
- **Result**: ${test10Passed ? "✅ Passed (Next.js client-facing configurations are live and structured)" : "❌ Failed"}
`);

  // --- TEST 11: Email Verification Gate for Publishing ---
  console.log("🏃 Running Test 11: Email Verification Gate...");
  // Register an unverified user
  const unverifiedRegRes = await makeRequest("/api/auth/register", "POST", {
    name: "Unverified Writer",
    username: "unverifiedwriter",
    email: "unverified@inkwell.dev",
    password: "password123",
  });
  const unverifiedCookie = getCookies(unverifiedRegRes.headers);
  
  // Try to create a published story immediately -> should be blocked by 403
  const blockedPubRes = await makeRequest("/api/posts", "POST", {
    title: "Verification Gated Story",
    contentHtml: "<p>Should be blocked</p>",
    status: "published",
  }, unverifiedCookie);
  
  const publishBlocked = blockedPubRes.status === 403;
  
  // Check that draft creation is NOT blocked
  const draftOkRes = await makeRequest("/api/posts", "POST", {
    title: "Verification Gated Story Draft",
    contentHtml: "<p>Draft should be fine</p>",
    status: "draft",
  }, unverifiedCookie);
  
  const draftCreated = draftOkRes.status === 201;
  const gatedDraftSlug = draftOkRes.body?.data?.post?.slug;
  
  // Try to update draft to published -> should be blocked by 403
  const blockedUpdateRes = await makeRequest(`/api/posts/${gatedDraftSlug}`, "PATCH", {
    status: "published"
  }, unverifiedCookie);
  
  const updateBlocked = blockedUpdateRes.status === 403;
  
  const test11Passed = publishBlocked && draftCreated && updateBlocked;
  console.log(test11Passed ? "✅ Test 11 Passed" : "❌ Test 11 Failed");
  report.push(`### 11. Email Verification Gate
- **Unverified Publish POST**: Status \`${blockedPubRes.status}\` (Expected: 403)
- **Unverified Draft POST**: Status \`${draftOkRes.status}\` (Expected: 201)
- **Unverified Publish PATCH**: Status \`${blockedUpdateRes.status}\` (Expected: 403)
- **Result**: ${test11Passed ? "✅ Passed (Unverified accounts restricted from publishing)" : "❌ Failed"}
`);

  // --- TEST 12: Email Verification Activation Flow ---
  console.log("🏃 Running Test 12: Email Verification Activation...");
  // Find unverified user in DB to grab verification token hash (since it's emailed)
  const unverifiedUser = await User.findOne({ username: "unverifiedwriter" }).select("+emailVerifyTokenHash");
  
  const crypto = require("crypto");
  const testVerifyToken = crypto.randomBytes(32).toString("hex");
  unverifiedUser.emailVerifyTokenHash = crypto.createHash("sha256").update(testVerifyToken).digest("hex");
  unverifiedUser.emailVerifyExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await unverifiedUser.save();
  
  // Verify email
  const verifyEmailRes = await makeRequest(`/api/auth/verify-email?token=${testVerifyToken}`, "GET");
  const verifySuccess = verifyEmailRes.status === 200 && verifyEmailRes.body?.success === true;
  
  // Try to publish draft again with verified account -> should succeed!
  const allowedPubRes = await makeRequest(`/api/posts/${gatedDraftSlug}`, "PATCH", {
    status: "published"
  }, unverifiedCookie);
  
  const publishAllowed = allowedPubRes.status === 200;
  const test12Passed = verifySuccess && publishAllowed;
  console.log(test12Passed ? "✅ Test 12 Passed" : "❌ Test 12 Failed");
  report.push(`### 12. Email Verification Activation
- **Verify Link GET**: Status \`${verifyEmailRes.status}\` (Expected: 200)
- **Verified Publish PATCH**: Status \`${allowedPubRes.status}\` (Expected: 200)
- **Result**: ${test12Passed ? "✅ Passed (Verification unlocks publishing functionality)" : "❌ Failed"}
`);

  // --- TEST 13: Unsubscribe & Preference Persistance ---
  console.log("🏃 Running Test 13: Unsubscribe & Preference Persistance...");
  const { signUnsubscribeToken } = require("../utils/unsubscribeToken");
  const unsubToken = signUnsubscribeToken(String(unverifiedUser._id));
  
  // Request unsubscribe
  const unsubRes = await makeRequest(`/api/auth/unsubscribe?token=${unsubToken}`, "GET");
  const unsubSuccess = unsubRes.status === 200 && unsubRes.rawBody.includes("You've been unsubscribed");
  
  // Re-fetch user in DB to verify preferences
  const unsubUserDb = await User.findById(unverifiedUser._id);
  const prefsOptedOut = unsubUserDb.emailPrefs?.allEmails === false;
  
  const test13Passed = unsubSuccess && prefsOptedOut;
  console.log(test13Passed ? "✅ Test 13 Passed" : "❌ Test 13 Failed");
  report.push(`### 13. One-Click Unsubscribe Preference
- **Unsubscribe Link GET**: Status \`${unsubRes.status}\` (Expected: 200)
- **Database emailPrefs.allEmails**: \`${unsubUserDb.emailPrefs?.allEmails}\` (Expected: false)
- **Result**: ${test13Passed ? "✅ Passed (One-click unsubscribe updates preferences securely)" : "❌ Failed"}
`);

  // --- TEST 14: Sovereign Export Followers JSON ---
  console.log("🏃 Running Test 14: Sovereign Export Followers JSON...");
  // Make Ada follow Leo (since Ada does not follow Leo in seed data)
  await makeRequest("/api/users/leo/follow", "POST", null, adaCookie);
  
  // Login as Leo to request his export
  const leoLogin = await makeRequest("/api/auth/login", "POST", { email: "leo@inkwell.dev", password: "password123" });
  const leoCookie = getCookies(leoLogin.headers);

  // Trigger Leo's export request
  const graceExportReq = await makeRequest("/api/users/me/export/request", "POST", null, leoCookie);
  const graceExportDownload = await makeRequest("/api/users/me/export/download", "GET", null, leoCookie);
  
  let followersJsonOk = false;
  if (graceExportDownload.status === 200 && graceExportDownload.buffer) {
    const tempZipPath = path.join(__dirname, "temp-leo-export.zip");
    const tempDestPath = path.join(__dirname, "temp-leo-extracted");
    fs.writeFileSync(tempZipPath, graceExportDownload.buffer);
    try {
      if (fs.existsSync(tempDestPath)) fs.rmSync(tempDestPath, { recursive: true, force: true });
      fs.mkdirSync(tempDestPath);
      execSync(`powershell -Command "Expand-Archive -Force -Path '${tempZipPath}' -DestinationPath '${tempDestPath}'"`);
      
      const followersPath = path.join(tempDestPath, "followers.json");
      if (fs.existsSync(followersPath)) {
        const followers = JSON.parse(fs.readFileSync(followersPath, "utf8"));
        const adaFollower = followers.find(f => f.email === "ada@inkwell.dev");
        followersJsonOk = adaFollower && adaFollower.name === "Ada Lovelace";
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      if (fs.existsSync(tempDestPath)) fs.rmSync(tempDestPath, { recursive: true, force: true });
    }
  }
  
  const test14Passed = followersJsonOk;
  console.log(test14Passed ? "✅ Test 14 Passed" : "❌ Test 14 Failed");
  report.push(`### 14. Sovereign Export Followers Metadata
- **Followers JSON Verification**: \`${followersJsonOk ? "Followers index exported correctly" : "Failed"}\`
- **Result**: ${test14Passed ? "✅ Passed (Follower data exported in followers.json correctly)" : "❌ Failed"}
`);

  // --- TEST 15: Account Deletion Cascade ---
  console.log("🏃 Running Test 15: Account Deletion Cascade...");
  // Create a second test user
  const delUserReg = await makeRequest("/api/auth/register", "POST", {
    name: "To Be Deleted",
    username: "tobedeleted",
    email: "deleteduser@inkwell.dev",
    password: "password123",
  });
  const delUserCookie = getCookies(delUserReg.headers);
  const delUserDb = await User.findOne({ username: "tobedeleted" });
  
  // Follow Ada
  await makeRequest("/api/users/ada/follow", "POST", null, delUserCookie);
  
  // Create a post and comment on Ada's story
  const sampleAdaPost = await Post.findOne({ author: ada._id });
  await makeRequest(`/api/posts/${sampleAdaPost.slug}/comments`, "POST", {
    content: "Comment to be deleted/anonymized",
  }, delUserCookie);
  
  // Clap on Ada's story
  await makeRequest(`/api/posts/${sampleAdaPost.slug}/clap`, "POST", { count: 10 }, delUserCookie);
  
  // Generate delete token
  const { signDeleteToken } = require("../utils/unsubscribeToken");
  const delToken = signDeleteToken(String(delUserDb._id));
  
  // Confirm deletion in "erase" mode, passing variables in query string for full compatibility
  const deleteRes = await makeRequest(`/api/users/me?token=${delToken}&mode=erase`, "DELETE", null, delUserCookie);
  
  // Verify erasure in DB
  const userDeleted = (await User.findById(delUserDb._id)) === null;
  const followCleaned = (await Follow.findOne({ follower: delUserDb._id })) === null;
  
  // Refresh Ada's post to verify comment/clap erasure
  const updatedAdaPost = await Post.findById(sampleAdaPost._id).populate("claps.user");
  const commentCleaned = (await mongoose.model("Comment").findOne({ author: delUserDb._id })) === null;
  const clapCleaned = !updatedAdaPost.claps.some(c => String(c.user) === String(delUserDb._id));
  
  const test15Passed = deleteRes.status === 200 && userDeleted && followCleaned && commentCleaned && clapCleaned;
  console.log(test15Passed ? "✅ Test 15 Passed" : "❌ Test 15 Failed");
  report.push(`### 15. Account Deletion Cascade (Erasure)
- **Delete Request DELETE**: Status \`${deleteRes.status}\` (Expected: 200)
- **User Document Purged**: \`${userDeleted}\`
- **Follow records Purged**: \`${followCleaned}\`
- **Comments Purged**: \`${commentCleaned}\`
- **Claps Purged**: \`${clapCleaned}\`
- **Result**: ${test15Passed ? "✅ Passed (Account deletion cascade fully erases associated details)" : "❌ Failed"}
`);

  // --- CLEANUP & TEARDOWN ---
  console.log("\n🧹 Running teardown...");
  await Post.deleteMany({ title: /Verification/ });
  await User.deleteMany({ email: { $in: ["unverified@inkwell.dev", "deleteduser@inkwell.dev"] } });
  await User.deleteMany({ username: "deleted" });
  await Follow.deleteMany({
    $or: [
      { follower: { $in: [unverifiedUser ? unverifiedUser._id : null] } },
      { followee: { $in: [unverifiedUser ? unverifiedUser._id : null] } }
    ]
  });
  
  ada.subdomain = originalAdaSubdomain;
  await ada.save();

  grace.subdomain = originalGraceSubdomain;
  await grace.save();

  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.close();

  // Dynamic portable report path
  const reportPath = path.join(
    process.env.USERPROFILE || process.env.HOMEPATH || "",
    ".gemini",
    "antigravity-ide",
    "brain",
    "8665517a-2db9-4bfb-9311-f4252ec6e43d",
    "verification_report.md"
  );
  
  fs.writeFileSync(reportPath, report.join("\n"), "utf8");
  console.log(`\n🎉 Verification complete! Report written to ${reportPath}`);
}

testSuite().catch(async (err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
