"use strict";

/**
 * Seed script — wipes and repopulates the database with detailed, large-scale,
 * realistic mock data across all Inkwell models (User, Post, Comment, Follow,
 * Report, AuditLog, PostRevision).
 * Run with: pnpm --filter server seed
 */

const mongoose = require("mongoose");
const env = require("../config/env");
const connectDB = require("../config/db");
const { sanitizeContent } = require("../utils/sanitize");
const { makeSlug } = require("../utils/slugify");
const { estimateReadTime } = require("../utils/readTime");

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Follow = require("../models/Follow");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const PostRevision = require("../models/PostRevision");

const DEMO_PASSWORD = "password123";

const MOCK_USERS = [
  { name: "Ada Lovelace", username: "ada", email: "ada@inkwell.dev", bio: "Writing about computation, poetry, and the space between.", role: "admin", status: "active" },
  { name: "James Baldwin", username: "jbaldwin", email: "james@inkwell.dev", bio: "Essays on identity, art, and the stories we tell ourselves.", role: "user", status: "active" },
  { name: "Grace Hopper", username: "grace", email: "grace@inkwell.dev", bio: "Debugging life one commit at a time. Ex-Navy. Loves nanoseconds.", role: "user", status: "active" },
  { name: "Maya Chen", username: "maya", email: "maya@inkwell.dev", bio: "Product designer & occasional gardener. Notes on craft and calm.", role: "user", status: "active" },
  { name: "Leo Torres", username: "leo", email: "leo@inkwell.dev", bio: "Coffee, climbing, and the economics of small things.", role: "user", status: "active" },
  { name: "Sarah Jenkins", username: "sarahj", email: "sarah@inkwell.dev", bio: "Digital anthropologist studying micro-communities on the web.", role: "user", status: "active" },
  { name: "Marcus Aurelius", username: "stoic", email: "marcus@stoic.dev", bio: "Daily reflections on self-discipline, mortality, and leadership.", role: "user", status: "active" },
  { name: "Hacker Spammer", username: "spammer", email: "spam@spammer.org", bio: "Affiliate marketer and crypto enthusiast. I post cool links!", role: "user", status: "banned" },
  { name: "Aria Thorne", username: "aria", email: "aria@inkwell.dev", bio: "Composer and sound engineer. Translating environments to synthesizers.", role: "user", status: "active" },
  { name: "David Miller", username: "davidm", email: "david@inkwell.dev", bio: "Frontend developer, accessibility advocate, and cat enthusiast.", role: "user", status: "active" },
];

const TAG_POOL = ["writing", "productivity", "craft", "engineering", "software", "design", "life", "stoicism", "music", "accessibility", "coffee", "debugging"];

const COVER_POOL = [
  "https://picsum.photos/seed/inkwell1/1200/600",
  "https://picsum.photos/seed/inkwell2/1200/600",
  "https://picsum.photos/seed/inkwell3/1200/600",
  "https://picsum.photos/seed/inkwell4/1200/600",
  "https://picsum.photos/seed/inkwell5/1200/600",
  "https://picsum.photos/seed/inkwell6/1200/600",
  "https://picsum.photos/seed/inkwell7/1200/600",
  "https://picsum.photos/seed/inkwell8/1200/600",
  "",
];

function body(lead) {
  return `
    <p>${lead}</p>
    <h2>Why this matters</h2>
    <p>There is a quiet craft to shipping something small and finishing it. Most ideas die not from bad execution but from never being written down. This is an attempt to write it down.</p>
    <blockquote>The scariest moment is always just before you start.</blockquote>
    <p>We often overestimate what we can do in a day and underestimate what we can do in a season. The trick is to keep the loop tight: <strong>write, publish, learn, repeat</strong>.</p>
    <h2>Key takeaways</h2>
    <ul>
      <li>Prefer clarity over cleverness.</li>
      <li>Ship the draft, then improve it.</li>
      <li>Read your work out loud.</li>
    </ul>
    <p>Here is a small snippet that captures the core concept:</p>
    <pre><code>function focus(task) {\n  return task.doOneThing();\n}</code></pre>
    <p>If any of this resonated, leave a response below — I read every one.</p>
  `;
}

const MOCK_POSTS = [
  { title: "The Art of Finishing", subtitle: "On shipping small and shipping often", lead: "Starting is easy. Finishing is a discipline you build one small win at a time." },
  { title: "Notes on Slow Software", subtitle: "Why the fastest teams move deliberately", lead: "Speed is a byproduct of clarity, not a substitute for it." },
  { title: "A Garden Is a Kind of Diary", subtitle: "What tending plants taught me about design", lead: "Every season the garden tells me what I got wrong last year." },
  { title: "Debugging Is Storytelling", subtitle: "The narrative hidden inside every stack trace", lead: "A bug is just a story where something happened that you did not expect." },
  { title: "On Writing Honestly", subtitle: "The only style guide that ever helped me", lead: "Write the sentence you are afraid to write, then keep going." },
  { title: "The Economics of Small Things", subtitle: "Coffee, compounding, and attention", lead: "The smallest recurring choices quietly compound into a life." },
  { title: "Design for the Tired User", subtitle: "Empathy at the end of a long day", lead: "Design for the person who is exhausted, distracted, and just wants it to work." },
  { title: "Learning in Public", subtitle: "Why I publish before I'm ready", lead: "Publishing before you feel ready is how you find out what you actually know." },
  { title: "The Quiet Power of Defaults", subtitle: "How small decisions shape big behaviors", lead: "Most people never change the defaults. That is a responsibility, not a shortcut." },
  { title: "Climbing Taught Me to Rest", subtitle: "Progress lives in the recovery", lead: "You do not get stronger while climbing. You get stronger while resting." },
  { title: "Reading More by Reading Less", subtitle: "Depth over volume", lead: "I stopped counting books and started rereading the ones that mattered." },
  { title: "The Case for Boring Technology", subtitle: "Choose tools you can sleep through", lead: "Boring technology is a feature. Excitement is a cost you pay at 3am." },
  { title: "Writing Interfaces for Humans", subtitle: "Words are UI too", lead: "The words in your product are the most-used interface you will ever ship." },
  { title: "A Short Defense of Long Walks", subtitle: "Thinking with your feet", lead: "Some problems can only be solved at three miles an hour." },
  { title: "Compounding Curiosity", subtitle: "Small questions, asked daily", lead: "Curiosity is the only interest rate that never falls." },
  { title: "Stoic Mindset for Engineers", subtitle: "Finding serenity in production outages", lead: "Control your reactions, because you cannot control the cloud provider." },
  { title: "Designing Accessible Web Forms", subtitle: "Keyboard accessibility and screen readers", lead: "A form that cannot be filled by a keyboard is not a form; it's a gate." },
  { title: "Spam Link Hub Post - Free Money", subtitle: "Earn 5000 USD from home daily guaranteed", lead: "Click my link to claim free crypto immediately and start earning fast money from home." },
  { title: "Ambient Environments as Music", subtitle: "Synthesizing nature inside the studio", lead: "Recording birds and wind and feeding them into granular synthesizers creates organic textures." },
  { title: "Principles of Minimalist Coffee", subtitle: "How simple gear makes better brews", lead: "You don't need a three-thousand dollar machine to extract the soul of a bean." },
];

const COMMENT_CONTENTS = [
  "This resonated deeply. Thank you for sharing.",
  "Saving this to read again later — so much here.",
  "The part about defaults really stuck with me.",
  "Needed this today. Sharing with my team.",
  "Beautifully put. The blockquote is going on my wall.",
  "I disagree slightly. In fast-paced environments, sometimes speed is the only way to validate.",
  "Brilliant overview. How do you apply this to multi-functional teams?",
  "This is a masterpiece of writing.",
];

async function seed() {
  await connectDB();
  console.log("[seed] Clearing database...");
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Follow.deleteMany({}),
    Report.deleteMany({}),
    AuditLog.deleteMany({}),
    PostRevision.deleteMany({}),
  ]);

  console.log("[seed] Creating users...");
  const users = [];
  for (let i = 0; i < MOCK_USERS.length; i += 1) {
    const u = MOCK_USERS[i];
    const user = await User.create({
      ...u,
      password: DEMO_PASSWORD,
      avatarUrl: u.avatarUrl || `https://i.pravatar.cc/200?img=${(i + 1) * 7}`,
      emailVerified: true,
    });
    users.push(user);
  }

  const [ada, jbaldwin, grace, maya, leo, sarah, marcus, spammer, aria, david] = users;

  console.log("[seed] Creating posts...");
  const posts = [];
  const now = Date.now();
  for (let i = 0; i < MOCK_POSTS.length; i += 1) {
    const p = MOCK_POSTS[i];
    const author = users[i % users.length];
    const html = sanitizeContent(body(p.lead));
    const publishedAt = new Date(now - i * 26 * 60 * 60 * 1000); // staggered 26h apart
    
    // Assign status (make some drafts, and make the spam post published)
    let status = "published";
    if (i === 5 || i === 12) status = "draft";

    // Set moderation status: make spam post hidden
    let moderationStatus = "visible";
    let indexable = status === "published";
    if (p.title.includes("Spam Link Hub")) {
      moderationStatus = "hidden";
      indexable = false;
    }

    const post = new Post({
      title: p.title,
      subtitle: p.subtitle,
      slug: makeSlug(p.title),
      contentHtml: html,
      coverImage: COVER_POOL[i % COVER_POOL.length],
      tags: [
        TAG_POOL[i % TAG_POOL.length],
        TAG_POOL[(i + 1) % TAG_POOL.length],
        TAG_POOL[(i + 2) % TAG_POOL.length],
      ].slice(0, 2 + (i % 2)),
      author: author._id,
      status,
      moderationStatus,
      indexable,
      readTimeMinutes: estimateReadTime(html),
      publishedAt,
      views: 50 + ((i * 47) % 800),
    });

    // Populate random claps
    let total = 0;
    const clappersCount = i % 4; // up to 3 clappers
    for (let c = 0; c < clappersCount; c++) {
      const clapper = users[(i + c + 1) % users.length];
      if (clapper._id.toString() !== author._id.toString()) {
        const count = 5 + ((i * 7 + c) % 40);
        post.claps.push({ user: clapper._id, count });
        total += count;
      }
    }
    post.totalClaps = total;

    await post.save();
    posts.push(post);
  }

  console.log("[seed] Creating post revisions...");
  // Create 3 historical revisions for the first post
  const firstPost = posts[0];
  const rev1 = await PostRevision.create({
    post: firstPost._id,
    editedBy: firstPost.author,
    title: "The Art of Ending",
    subtitle: "Draft version one of the subtitle",
    contentHtml: "<p>Original draft content. Short and sweet.</p>",
    tags: ["writing"],
    coverImage: "",
    createdAt: new Date(now - 48 * 60 * 60 * 1000),
  });

  const rev2 = await PostRevision.create({
    post: firstPost._id,
    editedBy: firstPost.author,
    title: "The Discipline of Finishing",
    subtitle: "On shipping small and often",
    contentHtml: "<p>Second draft content. Added a bit more prose here.</p>",
    tags: ["writing", "productivity"],
    coverImage: COVER_POOL[0],
    createdAt: new Date(now - 24 * 60 * 60 * 1000),
  });

  console.log("[seed] Creating nested comment threads (up to depth 5)...");
  // We'll build a thread on posts[0] and posts[1]
  const threadPost = posts[0];
  
  // Depth 0
  const c0 = await Comment.create({
    post: threadPost._id,
    author: grace._id,
    content: "This is a brilliant write-up. We struggle with finishing code all the time.",
    depth: 0,
    parentComment: null,
  });

  // Depth 1
  const c1 = await Comment.create({
    post: threadPost._id,
    author: jbaldwin._id,
    content: "I agree. The same holds true for writing novels. The last 10% is 90% of the effort.",
    depth: 1,
    parentComment: c0._id,
  });

  // Depth 2
  const c2 = await Comment.create({
    post: threadPost._id,
    author: grace._id,
    content: "Exactly! Do you have a routine or daily practice you follow to overcome this?",
    depth: 2,
    parentComment: c1._id,
  });

  // Depth 3
  const c3 = await Comment.create({
    post: threadPost._id,
    author: jbaldwin._id,
    content: "I write first thing in the morning before the noise of the world creeps in.",
    depth: 3,
    parentComment: c2._id,
  });

  // Depth 4
  const c4 = await Comment.create({
    post: threadPost._id,
    author: maya._id,
    content: "That sounds peaceful. I should try waking up earlier then.",
    depth: 4,
    parentComment: c3._id,
  });

  // Depth 5 (Clamped max depth)
  const c5 = await Comment.create({
    post: threadPost._id,
    author: grace._id,
    content: "Let's do a morning writing challenge next week!",
    depth: 5,
    parentComment: c4._id,
  });

  // Create a soft-deleted comment thread branch
  const s0 = await Comment.create({
    post: threadPost._id,
    author: spammer._id,
    content: "[deleted]",
    deletedButHasReplies: true,
    depth: 0,
  });

  await Comment.create({
    post: threadPost._id,
    author: leo._id,
    content: "This was in response to a spam comment, but I wanted to add that the advice here is solid.",
    depth: 1,
    parentComment: s0._id,
  });

  // Create 15 more miscellaneous comments across posts
  for (let i = 0; i < posts.length; i += 1) {
    const commentAuthor = users[(i + 3) % users.length];
    await Comment.create({
      post: posts[i]._id,
      author: commentAuthor._id,
      content: COMMENT_CONTENTS[i % COMMENT_CONTENTS.length],
      depth: 0,
    });
  }

  console.log("[seed] Wiring follows...");
  // Bulk follows
  const followPairs = [
    [jbaldwin, ada], [grace, ada], [maya, ada], [leo, ada], [sarah, ada], [marcus, ada], [aria, ada], [david, ada],
    [ada, grace], [ada, jbaldwin], [ada, maya], [grace, jbaldwin], [jbaldwin, grace], [marcus, jbaldwin],
  ];

  for (const [follower, followee] of followPairs) {
    await Follow.create({ follower: follower._id, followee: followee._id });
    follower.following.push(followee._id);
    followee.followers.push(follower._id);
  }

  // Save follower updates
  await Promise.all(users.map(u => u.save()));

  console.log("[seed] Creating moderation reports & audit logs...");
  // Post 1 (The Economics of Small Things) has 3 reports -> Priority flagged
  const reportedPost = posts.find(p => p.title.includes("Economics of Small Things"));
  
  await Report.create({
    reporter: grace._id,
    targetType: "post",
    targetId: reportedPost._id,
    reason: "misinformation",
    details: "This is economically inaccurate regarding compound interest rates.",
    priorityFlag: true,
    status: "pending",
  });

  await Report.create({
    reporter: jbaldwin._id,
    targetType: "post",
    targetId: reportedPost._id,
    reason: "spam",
    details: "Links to promotional courses.",
    priorityFlag: true,
    status: "pending",
  });

  await Report.create({
    reporter: maya._id,
    targetType: "post",
    targetId: reportedPost._id,
    reason: "other",
    details: "I feel like this post violates guidelines.",
    priorityFlag: true,
    status: "pending",
  });

  // Add a comment report
  const reportedComment = await Comment.findOne({ author: jbaldwin._id });
  await Report.create({
    reporter: sarah._id,
    targetType: "comment",
    targetId: reportedComment._id,
    reason: "harassment",
    details: "Aggressive tone towards the author.",
    status: "pending",
  });

  // Create an already-actioned report (Spam Link Hub)
  const spamPost = posts.find(p => p.title.includes("Spam Link Hub"));
  const actionedReport = await Report.create({
    reporter: marcus._id,
    targetType: "post",
    targetId: spamPost._id,
    reason: "spam",
    details: "Literal spam link.",
    status: "actioned",
  });

  // Write corresponding Audit Log for actioned report
  await AuditLog.create({
    action: "post_hidden",
    actor: ada._id,
    targetId: spamPost._id,
    targetType: "post",
    reason: "Actioned user spam report.",
  });

  console.log("\n✨ Inkwell Database Seeded Successfully!");
  console.log(`  - Users:          ${await User.countDocuments()}`);
  console.log(`  - Posts:          ${await Post.countDocuments()}`);
  console.log(`  - Comments:       ${await Comment.countDocuments()}`);
  console.log(`  - Follows:        ${await Follow.countDocuments()}`);
  console.log(`  - Reports:        ${await Report.countDocuments()}`);
  console.log(`  - Revisions:      ${await PostRevision.countDocuments()}`);
  console.log(`  - Audit Logs:     ${await AuditLog.countDocuments()}`);
  console.log("\n🔐 Demo Accounts Information:");
  console.log("  [Admin]       ada@inkwell.dev    -> password123");
  console.log("  [Standard]    james@inkwell.dev  -> password123");
  console.log("  [Standard]    grace@inkwell.dev  -> password123");
  console.log("  [Banned]      spam@spammer.org   -> password123");
  console.log("--------------------------------------------------\n");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("[seed] Failed:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
