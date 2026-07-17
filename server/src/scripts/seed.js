"use strict";

/**
 * Seed script — wipes and repopulates the database with demo users,
 * posts, comments, follows, claps, and bookmarks so the feed is not empty
 * on first run. Run with: pnpm --filter server seed
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

const DEMO_PASSWORD = "password123";

const USERS = [
  { name: "Ada Lovelace", username: "ada", email: "ada@inkwell.dev", bio: "Writing about computation, poetry, and the space between." },
  { name: "James Baldwin", username: "jbaldwin", email: "james@inkwell.dev", bio: "Essays on identity, art, and the stories we tell ourselves." },
  { name: "Grace Hopper", username: "grace", email: "grace@inkwell.dev", bio: "Debugging life one commit at a time. Ex-Navy. Loves nanoseconds." },
  { name: "Maya Chen", username: "maya", email: "maya@inkwell.dev", bio: "Product designer & occasional gardener. Notes on craft and calm." },
  { name: "Leo Torres", username: "leo", email: "leo@inkwell.dev", bio: "Coffee, climbing, and the economics of small things." },
];

const COVER_POOL = [
  "https://picsum.photos/seed/inkwell1/1200/600",
  "https://picsum.photos/seed/inkwell2/1200/600",
  "https://picsum.photos/seed/inkwell3/1200/600",
  "https://picsum.photos/seed/inkwell4/1200/600",
  "https://picsum.photos/seed/inkwell5/1200/600",
  "",
];

/**
 * Build a chunk of rich HTML body from paragraphs of lorem-ish prose.
 * @param {string} lead
 * @returns {string}
 */
function body(lead) {
  return `
    <p>${lead}</p>
    <h2>Why this matters</h2>
    <p>There is a quiet craft to shipping something small and finishing it. Most ideas die not from bad execution but from never being written down. This is an attempt to write it down.</p>
    <blockquote>The scariest moment is always just before you start.</blockquote>
    <p>We often overestimate what we can do in a day and underestimate what we can do in a season. The trick is to keep the loop tight: <strong>write, publish, learn, repeat</strong>.</p>
    <h2>A few principles</h2>
    <ul>
      <li>Prefer clarity over cleverness.</li>
      <li>Ship the draft, then improve it.</li>
      <li>Read your work out loud.</li>
    </ul>
    <p>Here is a small snippet that captures the idea:</p>
    <pre><code>function focus(task) {\n  return task.doOneThing();\n}</code></pre>
    <p>If any of this resonated, leave a response below — I read every one.</p>
  `;
}

const POSTS = [
  { title: "The Art of Finishing", subtitle: "On shipping small and shipping often", tags: ["writing", "productivity", "craft"], lead: "Starting is easy. Finishing is a discipline you build one small win at a time." },
  { title: "Notes on Slow Software", subtitle: "Why the fastest teams move deliberately", tags: ["engineering", "software", "process"], lead: "Speed is a byproduct of clarity, not a substitute for it." },
  { title: "A Garden Is a Kind of Diary", subtitle: "What tending plants taught me about design", tags: ["design", "life", "craft"], lead: "Every season the garden tells me what I got wrong last year." },
  { title: "Debugging Is Storytelling", subtitle: "The narrative hidden inside every stack trace", tags: ["engineering", "debugging", "software"], lead: "A bug is just a story where something happened that you did not expect." },
  { title: "On Writing Honestly", subtitle: "The only style guide that ever helped me", tags: ["writing", "essays", "craft"], lead: "Write the sentence you are afraid to write, then keep going." },
  { title: "The Economics of Small Things", subtitle: "Coffee, compounding, and attention", tags: ["economics", "life", "finance"], lead: "The smallest recurring choices quietly compound into a life." },
  { title: "Design for the Tired User", subtitle: "Empathy at the end of a long day", tags: ["design", "ux", "product"], lead: "Design for the person who is exhausted, distracted, and just wants it to work." },
  { title: "Learning in Public", subtitle: "Why I publish before I'm ready", tags: ["learning", "writing", "career"], lead: "Publishing before you feel ready is how you find out what you actually know." },
  { title: "The Quiet Power of Defaults", subtitle: "How small decisions shape big behaviors", tags: ["product", "design", "psychology"], lead: "Most people never change the defaults. That is a responsibility, not a shortcut." },
  { title: "Climbing Taught Me to Rest", subtitle: "Progress lives in the recovery", tags: ["life", "health", "sports"], lead: "You do not get stronger while climbing. You get stronger while resting." },
  { title: "Reading More by Reading Less", subtitle: "Depth over volume", tags: ["reading", "learning", "life"], lead: "I stopped counting books and started rereading the ones that mattered." },
  { title: "The Case for Boring Technology", subtitle: "Choose tools you can sleep through", tags: ["engineering", "software", "architecture"], lead: "Boring technology is a feature. Excitement is a cost you pay at 3am." },
  { title: "Writing Interfaces for Humans", subtitle: "Words are UI too", tags: ["design", "writing", "ux"], lead: "The words in your product are the most-used interface you will ever ship." },
  { title: "A Short Defense of Long Walks", subtitle: "Thinking with your feet", tags: ["life", "health", "creativity"], lead: "Some problems can only be solved at three miles an hour." },
  { title: "Compounding Curiosity", subtitle: "Small questions, asked daily", tags: ["learning", "creativity", "life"], lead: "Curiosity is the only interest rate that never falls." },
];

const COMMENTS = [
  "This resonated deeply. Thank you for writing it.",
  "Saving this to reread later — so much here.",
  "The part about defaults really stuck with me.",
  "Needed this today. Sharing with my team.",
  "Beautifully put. That blockquote is going on my wall.",
];

async function seed() {
  await connectDB();
  console.log("[seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
  ]);

  console.log("[seed] Creating users...");
  const users = [];
  for (let i = 0; i < USERS.length; i += 1) {
    const u = USERS[i];
    // create() triggers the pre-save hook that hashes the password
    const user = await User.create({
      ...u,
      password: DEMO_PASSWORD,
      avatarUrl: `https://i.pravatar.cc/200?img=${(i + 1) * 7}`,
      emailVerified: true,
    });
    users.push(user);
  }

  console.log("[seed] Creating posts...");
  const posts = [];
  const now = Date.now();
  for (let i = 0; i < POSTS.length; i += 1) {
    const p = POSTS[i];
    const author = users[i % users.length];
    const html = sanitizeContent(body(p.lead));
    // Stagger publishedAt over the past ~15 days
    const publishedAt = new Date(now - i * 26 * 60 * 60 * 1000);
    const post = new Post({
      title: p.title,
      subtitle: p.subtitle,
      slug: makeSlug(p.title),
      contentHtml: html,
      coverImage: COVER_POOL[i % COVER_POOL.length],
      tags: p.tags,
      author: author._id,
      status: "published",
      readTimeMinutes: estimateReadTime(html),
      publishedAt,
      views: 20 + ((i * 37) % 400),
    });
    // Deterministic-ish claps from a couple of users
    let total = 0;
    const clapCount = (i * 13) % 45;
    if (clapCount > 0) {
      const clapper = users[(i + 1) % users.length];
      post.claps.push({ user: clapper._id, count: clapCount });
      total += clapCount;
    }
    post.totalClaps = total;
    await post.save();
    posts.push(post);
  }

  console.log("[seed] Creating comments...");
  for (let i = 0; i < posts.length; i += 1) {
    const commentAuthor = users[(i + 2) % users.length];
    await Comment.create({
      post: posts[i]._id,
      author: commentAuthor._id,
      content: COMMENTS[i % COMMENTS.length],
    });
  }

  console.log("[seed] Wiring follows + bookmarks...");
  // Everyone follows ada + grace; ada follows a couple back
  const [ada, jbaldwin, grace, maya, leo] = users;
  const followEdges = [
    [jbaldwin, ada], [grace, ada], [maya, ada], [leo, ada],
    [ada, grace], [maya, grace], [ada, maya],
  ];
  for (const [follower, target] of followEdges) {
    if (!follower.following.some((f) => String(f) === String(target._id))) {
      follower.following.push(target._id);
      target.followers.push(follower._id);
    }
  }
  // Bookmarks
  ada.bookmarks.push(posts[1]._id, posts[3]._id);
  maya.bookmarks.push(posts[0]._id);
  await Promise.all(users.map((u) => u.save()));

  console.log("\n[seed] Done. Summary:");
  console.log(`  users:    ${await User.countDocuments()}`);
  console.log(`  posts:    ${await Post.countDocuments()} (all published)`);
  console.log(`  comments: ${await Comment.countDocuments()}`);
  console.log("\n[seed] Demo login → email: ada@inkwell.dev  password: password123");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("[seed] Failed:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {
    /* ignore */
  }
  process.exit(1);
});
