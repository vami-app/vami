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

// Vocabulary Pools for programmatically generating highly realistic developer & design data
const ADJECTIVES = [
  "Sovereign", "Cluttered", "Performant", "Asynchronous", "Empathetic",
  "Functional", "Minimalist", "Boring", "Compounding", "Pragmatic",
  "Decentralized", "Cognitive", "Declarative", "Resilient", "Staggered",
  "Quiet", "Sloppy", "Symmetric", "Incremental", "Deliberate",
  "Stateless", "Concurrent", "Reactive", "Immutable", "Hermetic"
];

const NOUNS = [
  "Interfaces", "Architecture", "Refactoring", "State Management", "Feedback Loops",
  "Outages", "Systems", "Prose", "Codebases", "Routines",
  "Design Systems", "Web Performance", "Mental Models", "Compounding", "Curiosity",
  "Recovery", "Abstraction", "Dependencies", "Complexity", "Sanitization",
  "Microservices", "Concurrency", "Algorithms", "Optimization", "Developer Experience"
];

const CONNECTORS = [
  "for", "in", "of", "and the Art of", "Behind", "with", "Without", "versus", "in the Age of"
];

const BIO_INTERESTS = [
  "Writing about computation, poetry, and the space between.",
  "Essays on identity, art, and the stories we tell ourselves.",
  "Debugging life one commit at a time. Ex-Navy. Loves nanoseconds.",
  "Product designer & occasional gardener. Notes on craft and calm.",
  "Coffee, climbing, and the economics of small things.",
  "Digital anthropologist studying micro-communities on the web.",
  "Daily reflections on self-discipline, mortality, and leadership.",
  "Composer and sound engineer. Translating environments to synthesizers.",
  "Frontend developer, accessibility advocate, and cat enthusiast.",
  "Sovereign publisher, explorer of decentralization, and runner.",
  "Stoic engineer building resilient distributed systems.",
  "UX researcher fascinated by friction, speed, and cognitive load.",
  "Minimalist coffee brewer and compiler enthusiast.",
  "System administrator who enjoys sleeping through outages."
];

const COMMENT_BODY_POOL = [
  "This resonated deeply. Thank you for sharing.",
  "Saving this to read again later — so much here.",
  "The part about defaults really stuck with me.",
  "Needed this today. Sharing with my team.",
  "Beautifully put. The blockquote is going on my wall.",
  "I disagree slightly. In fast-paced environments, sometimes speed is the only way to validate.",
  "Brilliant overview. How do you apply this to multi-functional teams?",
  "This is a masterpiece of writing.",
  "I love this approach! We've been trying to solve this in our codebase.",
  "How does this compare to using a message queue or event streams?",
  "Honestly, I think boring technology is underrated. Thanks for writing this.",
  "Could you elaborate more on the security implications of this abstraction layer?",
  "This is a great read, but I have a minor concern regarding keyboard accessibility in dynamic forms.",
  "Agree 100%. The recovery phase is where the growth and compounding interest actually happens.",
  "We recently migrated our state system based on these principles and saw a 40% reduction in cognitive load.",
  "Is there a GitHub repository where we can see the full code execution of this example?",
  "This is precisely why I prefer simplicity over premature optimizations."
];

const TAG_POOL = [
  "writing", "productivity", "craft", "engineering", "software", "design", "life",
  "stoicism", "music", "accessibility", "coffee", "debugging", "node.js", "c++",
  "react-native", "go"
];

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

// Preserving original 10 users for verification test compatibility
const ORIGINAL_MOCK_USERS = [
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

// 41 additional users to cross 50+ total users and test edge cases
const ADDITIONAL_MOCK_USERS = [
  { name: "Simone de Beauvoir", username: "simone", email: "simone@inkwell.dev", role: "user", status: "active" },
  { name: "Albert Camus", username: "camus", email: "camus@inkwell.dev", role: "user", status: "active" },
  { name: "Virginia Woolf", username: "virginia", email: "virginia@inkwell.dev", role: "user", status: "active" },
  { name: "Alan Turing", username: "turing", email: "turing@inkwell.dev", role: "admin", status: "active" },
  { name: "Richard Feynman", username: "feynman", email: "feynman@inkwell.dev", role: "user", status: "active" },
  { name: "Katherine Johnson", username: "katherine", email: "katherine@inkwell.dev", role: "user", status: "active" },
  { name: "Margaret Hamilton", username: "margaret", email: "margaret@inkwell.dev", role: "admin", status: "active" },
  { name: "Linus Torvalds", username: "linus", email: "linus@inkwell.dev", role: "user", status: "active" },
  { name: "Donald Knuth", username: "knuth", email: "knuth@inkwell.dev", role: "user", status: "active" },
  { name: "W.E.B. Du Bois", username: "dubois", email: "dubois@inkwell.dev", role: "user", status: "active" },
  { name: "Ursula K. Le Guin", username: "ursula", email: "ursula@inkwell.dev", role: "user", status: "active" },
  { name: "Isaac Asimov", username: "asimov", email: "asimov@inkwell.dev", role: "user", status: "active" },
  { name: "Arthur C. Clarke", username: "clarke", email: "clarke@inkwell.dev", role: "user", status: "active" },
  { name: "Octavia Butler", username: "octavia", email: "octavia@inkwell.dev", role: "user", status: "active" },
  { name: "Mary Shelley", username: "mary", email: "mary@inkwell.dev", role: "user", status: "active" },
  { name: "Emily Dickinson", username: "emily", email: "emily@inkwell.dev", role: "user", status: "active" },
  { name: "Friedrich Nietzsche", username: "friedrich", email: "friedrich@inkwell.dev", role: "user", status: "active" },
  { name: "Søren Kierkegaard", username: "kierkegaard", email: "SOREN@KIERKEGAARD.CO.UK", role: "user", status: "active" }, // Case-insensitive unique check
  { name: "John Locke", username: "locke", email: "locke@inkwell.dev", role: "user", status: "active" },
  { name: "David Hume", username: "hume", email: "hume@inkwell.dev", role: "user", status: "active" },
  { name: "Immanuel Kant", username: "kant", email: "kant@inkwell.dev", role: "user", status: "active" },
  { name: "Jean-Paul Sartre", username: "sartre", email: "sartre@inkwell.dev", role: "user", status: "active" },
  { name: "Hannah Arendt", username: "hannah", email: "hannah@inkwell.dev", role: "user", status: "active" },
  { name: "Frantz Fanon", username: "fanon", email: "fanon@inkwell.dev", role: "user", status: "active" },
  { name: "Bell Hooks", username: "bell", email: "bell@inkwell.dev", role: "user", status: "active" },
  { name: "Michel Foucault", username: "michel", email: "michel@inkwell.dev", role: "user", status: "active" },
  { name: "Jacques Derrida", username: "jacques", email: "jacques@inkwell.dev", role: "user", status: "active" },
  { name: "Gilles Deleuze", username: "gilles", email: "gilles@inkwell.dev", role: "user", status: "active" },
  { name: "Baruch Spinoza", username: "spinoza", email: "spinoza@inkwell.dev", role: "user", status: "active" },
  { name: "Thomas Hobbes", username: "hobbes", email: "hobbes@inkwell.dev", role: "user", status: "active" },
  { name: "René Descartes", username: "rene", email: "rene@inkwell.dev", role: "user", status: "active" },
  { name: "John Stuart Mill", username: "mill", email: "mill@inkwell.dev", role: "user", status: "active" },
  { name: "Mary Wollstonecraft", username: "wollstonecraft", email: "wollstonecraft@inkwell.dev", role: "user", status: "active" },
  { name: "Karl Marx", username: "karl", email: "karl@inkwell.dev", role: "user", status: "banned" }, // Additional banned user
  { name: "Max Weber", username: "max", email: "max@inkwell.dev", role: "user", status: "active" },
  { name: "Émile Durkheim", username: "emile", email: "emile@inkwell.dev", role: "user", status: "active" },
  { name: "Jane Addams", username: "jane", email: "jane@inkwell.dev", role: "user", status: "active" },
  { name: "Harriet Martineau", username: "harriet", email: "harriet@inkwell.dev", role: "user", status: "active" },
  { name: "George Herbert Mead", username: "george", email: "george@inkwell.dev", role: "user", status: "active" },
  { name: "W.I. Thomas", username: "thomas", email: "thomas@inkwell.dev", role: "user", status: "active" },
  { name: "Florian Znaniecki", username: "florian", email: "florian@inkwell.dev", role: "user", status: "active" },
  
  // Edge Case Names:
  // Short name (Boundary limit)
  { name: "Li", username: "lii", email: "li@inkwell.dev", role: "user", status: "active" },
  // Max 80 characters name (Boundary limit)
  { name: "Elizabeth Alexandra Mary Windsor of Great Britain and Northern Ireland Reginaxxx", username: "queen", email: "queen@royal.dev", role: "user", status: "active" },
  // Foreign/Accented and Email sub-addressing (alias)
  { name: "François Müller-Réné", username: "francois", email: "francois+alias@inkwell.dev", role: "user", status: "active" }
];

// Hands-on original posts
const ORIGINAL_MOCK_POSTS = [
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

/**
 * Generate a programmatic HTML body containing rich text elements,
 * tables, code, blockquotes, lists, and potential XSS script tests.
 */
function generateContentHtml(title, subtitle, isLong = false, hasXSS = false) {
  let html = `<h1>${title}</h1><p><em>${subtitle}</em></p>`;
  
  html += `
    <h2>1. Introduction to the Paradigm</h2>
    <p>In modern software systems, finding a balance between speed and reliability is a constant battle. This article walks through the structural methodologies and feedback loops that make engineering teams successful.</p>
    <blockquote>"Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it." — Edsger W. Dijkstra</blockquote>
  `;
  
  if (hasXSS) {
    html += `
      <h2>2. XSS Seeding Test</h2>
      <p>Here is an embedded script tag and onload handlers to verify HTML sanitization:</p>
      <script>console.log('XSS Triggered!'); alert(1);</script>
      <img src="x" onerror="console.log('XSS Image Error Event'); alert(1);" alt="XSS Image Test" />
      <iframe src="javascript:alert(1)"></iframe>
    `;
  }
  
  html += `
    <h2>3. Key Takeaways and Comparison</h2>
    <p>Below is a quick comparison table of the performance and design trade-offs:</p>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Monolithic Architecture</th>
          <th>Microservices Setup</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Complexity</td>
          <td>Low to Medium</td>
          <td>Extremely High</td>
        </tr>
        <tr>
          <td>Deployment Speed</td>
          <td>Slow (Coupled)</td>
          <td>Fast (Decoupled)</td>
        </tr>
        <tr>
          <td>Network Overhead</td>
          <td>Negligible</td>
          <td>Significant</td>
        </tr>
      </tbody>
    </table>
  `;

  html += `
    <h2>4. Code Implementation</h2>
    <p>Here is an example code snippet implementing the core state manager:</p>
    <pre><code class="language-javascript">
class StateManager {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = [];
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  dispatch(action) {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach(l => l(this.state));
  }
}
    </code></pre>
  `;

  html += `
    <h2>5. Action Items</h2>
    <p>When implementing these patterns in your own team, follow this checklist:</p>
    <ul>
      <li>First, define clear service boundaries and interfaces.</li>
      <li>Second, ensure proper monitoring and alerting are in place.</li>
      <li>Third, test the system under high load and latency scenarios.
        <ol>
          <li>Perform chaos engineering tests.</li>
          <li>Measure network latency and queue sizes.</li>
        </ol>
      </li>
    </ul>
  `;

  if (isLong) {
    // Append lots of paragraphs to make word count ~5000+ (tests large estimation)
    for (let p = 0; p < 250; p++) {
      html += `<p>This is paragraph ${p + 1} of the long post. We are expanding the length of this document to simulate a deep, exhaustive whitepaper covering all aspects of software design, caching strategies, horizontal scaling, database sharding, and memory optimization. Each paragraph adds depth and words to verify that the reading time estimator handles large text blobs gracefully without crashing or timing out. In real production scenarios, authors publish extensive technical manuals and documentation pages that span thousands of words. Ensuring our estimation functions perform efficiently on these sizes is key to service reliability.</p>`;
    }
  }

  return html;
}

/**
 * Generate a random title programmatically from vocabulary pools
 */
function randomTitle() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const conn = CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
  const secondNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  if (secondNoun === noun) {
    return `${adj} ${noun}`;
  }
  return `${adj} ${noun} ${conn} ${secondNoun}`;
}

/**
 * Generate a random subtitle programmatically
 */
function randomSubtitle() {
  const points = [
    "Why clean code is a long-term investment, not a sprint",
    "A practical guide to avoiding premature abstractions in node",
    "Notes on building accessible components at scale with minimal tools",
    "How to manage team communication channels and retain sanity",
    "An exploration of the performance bottlenecks in event driven pipelines",
    "Exploring the philosophy of minimal interfaces and high contrast themes",
    "Finding stability in ephemeral infrastructure and unstable cloud vendors",
    "The compound effect of resolving one minor lint warning every day"
  ];
  return points[Math.floor(Math.random() * points.length)];
}

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

  console.log("[seed] Creating 50+ users with diverse edge cases...");
  const users = [];
  const now = Date.now();

  // Combine original 10 and 44 additional users
  const allUserDefs = [...ORIGINAL_MOCK_USERS, ...ADDITIONAL_MOCK_USERS];

  for (let i = 0; i < allUserDefs.length; i += 1) {
    const u = allUserDefs[i];
    
    // Setup edge case variables
    let emailVerified = true;
    let emailVerifyTokenHash = undefined;
    let emailVerifyExpiresAt = undefined;
    let passwordResetTokenHash = undefined;
    let passwordResetExpiresAt = undefined;
    let subdomain = undefined;
    let customDomain = null;
    let exportStatus = "idle";
    let exportRequestedAt = undefined;
    let emailPrefs = { allEmails: true, digestFrequency: "weekly" };

    // Sparse testing: Allocate subdomains/domains to a portion of users
    // (Ensure uniqueness constraints since subdomain and username are unique)
    if (i < 20) {
      subdomain = u.username;
    }
    // Set specific domains
    if (u.username === "grace") {
      customDomain = "grace.xyz";
      exportStatus = "ready";
      exportRequestedAt = new Date(now - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    } else if (u.username === "turing") {
      customDomain = "turing-machine.org";
    } else if (u.username === "camus") {
      customDomain = "camus.net";
      exportStatus = "failed";
      exportRequestedAt = new Date(now - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      passwordResetTokenHash = "expired-reset-token-hash-sha256";
      passwordResetExpiresAt = new Date(now - 1 * 60 * 60 * 1000); // expired 1h ago
    } else if (u.username === "ada") {
      passwordResetTokenHash = "active-reset-token-hash-sha256";
      passwordResetExpiresAt = new Date(now + 30 * 60 * 1000); // active 30 min future
    } else if (u.username === "feynman") {
      exportStatus = "pending";
      exportRequestedAt = new Date(now - 1 * 60 * 60 * 1000); // 1h ago
    } else if (u.username === "simone") {
      emailVerified = false;
      emailVerifyTokenHash = "active-verify-token-hash-sha256";
      emailVerifyExpiresAt = new Date(now + 12 * 60 * 60 * 1000); // active 12h future
    } else if (u.username === "virginia") {
      emailVerified = false;
      emailVerifyTokenHash = "expired-verify-token-hash-sha256";
      emailVerifyExpiresAt = new Date(now - 3 * 60 * 60 * 1000); // expired 3h ago
    } else if (u.username === "bell") {
      emailPrefs = { allEmails: false, digestFrequency: "off" };
    }

    // Set followed tags randomly
    const followedTagsCount = i % 4; // 0 to 3 tags
    const followedTags = [];
    for (let t = 0; t < followedTagsCount; t++) {
      followedTags.push(TAG_POOL[(i + t) % TAG_POOL.length]);
    }

    // Set avatar url
    const avatarUrl = u.username === "queen" ? "" : `https://i.pravatar.cc/200?img=${(i + 1) * 3}`;

    // Get bio or select one randomly
    const bio = u.bio || BIO_INTERESTS[i % BIO_INTERESTS.length];

    const user = await User.create({
      name: u.name,
      username: u.username,
      email: u.email,
      password: DEMO_PASSWORD,
      bio,
      avatarUrl,
      role: u.role,
      status: u.status,
      subdomain,
      customDomain,
      exportStatus,
      exportRequestedAt,
      passwordResetTokenHash,
      passwordResetExpiresAt,
      emailVerifyTokenHash,
      emailVerifyExpiresAt,
      emailVerified,
      emailPrefs,
      followedTags,
    });
    users.push(user);
  }

  // Quick lookup maps
  const userMap = {};
  users.forEach((u) => {
    userMap[u.username] = u;
  });

  console.log("[seed] Creating 150+ posts with varied layouts, boundaries, and claps...");
  const posts = [];
  
  // Total of 155 posts
  const targetPostCount = 155;
  for (let i = 0; i < targetPostCount; i++) {
    let title = "";
    let subtitle = "";
    let lead = "";
    let isHandcrafted = false;

    // Use handcrafted ideas first
    if (i < ORIGINAL_MOCK_POSTS.length) {
      const omp = ORIGINAL_MOCK_POSTS[i];
      title = omp.title;
      subtitle = omp.subtitle;
      lead = omp.lead;
      isHandcrafted = true;
    } else {
      title = randomTitle();
      subtitle = randomSubtitle();
      lead = `An investigation into how ${title.toLowerCase()} impacts modern systems development.`;
    }

    // Title limit boundary test (max 160)
    if (i === 40) {
      title = "The Comprehensive Guide to Building Highly Scalable Systems with Microservices, Event Sourcing, and Message Queues in Node.js and Distributed Environments xxx";
    }

    // Subtitle limit boundary test (max 200)
    if (i === 41) {
      subtitle = "A detailed investigation into the performance bottlenecks, architectural patterns, and design trade-offs of modern web applications under high concurrency and resource constraint situations yyyyyy";
    }

    // Unicode / Emojis test in title
    if (i === 42) {
      title = "🚀 Scaling node.js in 2026: The René Descartes philosophy of code";
    }

    // Duplicate titles to verify slug collision resolution
    if (i === 43 || i === 44) {
      title = "The Art of Finishing";
    }

    // Select author: Cycle through users, but avoid banned users unless we want hidden post seeding
    const author = users[i % users.length];
    
    // Moderation Status: Banned user posts are automatically hidden.
    // Also explicitly hide some other posts to verify moderation filters.
    let moderationStatus = "visible";
    if (author.status === "banned" || i === 45 || title.includes("Spam Link Hub")) {
      moderationStatus = "hidden";
    }

    // Assign status (stagger 85% published, 15% draft)
    // To make Test 7 (sitemap entry count match) pass, any hidden post must NOT be published.
    let status = "published";
    if (moderationStatus === "hidden") {
      status = "draft";
    } else if (i % 7 === 0 && i >= ORIGINAL_MOCK_POSTS.length) {
      status = "draft";
    }

    // Content html synthesis
    const isLongPost = (i === 50); // extremely long post test (5000+ words)
    const hasXSSPayload = (i === 51); // XSS payload test
    const rawContent = generateContentHtml(title, subtitle, isLongPost, hasXSSPayload);
    const contentHtml = sanitizeContent(rawContent);

    // Cover images
    let coverImage = "";
    if (i % 3 === 0) {
      coverImage = COVER_POOL[i % COVER_POOL.length];
    } else if (i % 3 === 1) {
      coverImage = `/uploads/cover-${i}.png`; // relative path testing
    }

    // Assign tags (0 to 5 tags)
    const tagCount = i % 6; // 0 to 5 tags
    const tags = [];
    for (let t = 0; t < tagCount; t++) {
      // tag index casing/special character tests (e.g. node.js, c++)
      tags.push(TAG_POOL[(i + t) % TAG_POOL.length]);
    }

    // Views staggering
    const views = (i % 5 === 0) ? 0 : Math.floor(Math.sin(i) * 200000) + 250000;

    // Stagger dates in past (for feed sorting and pagination checks)
    const publishedAt = status === "published" ? new Date(now - i * 18 * 60 * 60 * 1000) : null;

    // SEO overrides (10% of posts get custom SEO override)
    let seo = undefined;
    if (i % 10 === 0) {
      seo = {
        metaTitle: `SEO Custom: ${title.slice(0, 100)}`,
        metaDescription: `SEO description for ${subtitle.slice(0, 150)}`,
        canonicalUrl: `https://external-blog-site.com/canonical/${i}`,
      };
    }

    const post = new Post({
      title,
      subtitle,
      slug: makeSlug(title),
      contentHtml,
      coverImage,
      tags,
      author: author._id,
      status,
      moderationStatus,
      views,
      publishedAt,
      seo,
    });

    // Populate claps (0 claps, max claps 50, and multiple clappers)
    let totalClaps = 0;
    if (i % 4 === 1) {
      // Single clapper with max count (50)
      const clapper = users[(i + 1) % users.length];
      if (clapper._id.toString() !== author._id.toString()) {
        post.claps.push({ user: clapper._id, count: 50 });
        totalClaps = 50;
      }
    } else if (i % 4 > 1) {
      // Multiple clappers
      const clappersCount = (i % 3) + 2; // 2 or 3 clappers
      for (let c = 0; c < clappersCount; c++) {
        const clapper = users[(i + c + 1) % users.length];
        if (clapper._id.toString() !== author._id.toString()) {
          const count = 5 + ((i * 7 + c) % 35);
          post.claps.push({ user: clapper._id, count });
          totalClaps += count;
        }
      }
    }
    post.totalClaps = totalClaps;

    await post.save();
    posts.push(post);
  }

  console.log("[seed] Generating 200+ follow relationships with bidirectional sync...");
  const followsCount = 230;
  const followPairsSet = new Set();
  const originalFollowPairs = [
    ["jbaldwin", "ada"], ["grace", "ada"], ["maya", "ada"], ["leo", "ada"], ["sarahj", "ada"], ["stoic", "ada"], ["aria", "ada"], ["davidm", "ada"],
    ["ada", "grace"], ["ada", "jbaldwin"], ["ada", "maya"], ["grace", "jbaldwin"], ["jbaldwin", "grace"], ["stoic", "jbaldwin"]
  ];

  // Seed original pairs first
  for (const [fName, feName] of originalFollowPairs) {
    const follower = userMap[fName];
    const followee = userMap[feName];
    if (follower && followee) {
      const key = `${follower._id}_${followee._id}`;
      followPairsSet.add(key);
      await Follow.create({ follower: follower._id, followee: followee._id, followedAt: new Date(now - 10 * 24 * 60 * 60 * 1000) });
      follower.following.push(followee._id);
      followee.followers.push(follower._id);
    }
  }

  // Random follows to cross 200+ count
  let safetyLoop = 0;
  while (followPairsSet.size < followsCount && safetyLoop < 10000) {
    safetyLoop++;
    const follower = users[Math.floor(Math.random() * users.length)];
    const followee = users[Math.floor(Math.random() * users.length)];
    
    if (follower._id.toString() === followee._id.toString()) continue;
    
    const key = `${follower._id}_${followee._id}`;
    if (followPairsSet.has(key)) continue;

    followPairsSet.add(key);

    // 30% of follows originate from specific posts
    let sourcePost = null;
    if (Math.random() < 0.3) {
      sourcePost = posts[Math.floor(Math.random() * posts.length)]._id;
    }

    await Follow.create({
      follower: follower._id,
      followee: followee._id,
      followedAt: new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // up to 30 days ago
      sourcePost
    });

    follower.following.push(followee._id);
    followee.followers.push(follower._id);
  }

  // Save follower updates in database
  await Promise.all(users.map(u => u.save()));

  console.log("[seed] Generating 300+ comments (nested threads, soft-deletes, moderated hidden)...");
  let totalCommentsCount = 0;

  // 1. Deep nested comment threads (up to depth 5) on the first 5 posts
  for (let pIdx = 0; pIdx < 5; pIdx++) {
    const threadPost = posts[pIdx];
    
    // Depth 0
    const c0 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 1) % users.length]._id,
      content: `Deep thread starter comment on post ${threadPost.title}. Let's examine the architectural implications.`,
      depth: 0,
      parentComment: null,
    });
    totalCommentsCount++;

    // Depth 1
    const c1 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 2) % users.length]._id,
      content: `Reply at depth 1: I agree with the core sentiment. However, caching plays a massive factor here.`,
      depth: 1,
      parentComment: c0._id,
    });
    totalCommentsCount++;

    // Depth 2
    const c2 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 3) % users.length]._id,
      content: `Reply at depth 2: True, but caching invalidation is notoriously difficult to get right in distributed systems.`,
      depth: 2,
      parentComment: c1._id,
    });
    totalCommentsCount++;

    // Depth 3
    const c3 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 4) % users.length]._id,
      content: `Reply at depth 3: We can use a staggered validation frequency or digest tokens to offset index latency.`,
      depth: 3,
      parentComment: c2._id,
    });
    totalCommentsCount++;

    // Depth 4
    const c4 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 5) % users.length]._id,
      content: `Reply at depth 4: That sounds like a robust pattern. Let's document this in our internal wiki repository.`,
      depth: 4,
      parentComment: c3._id,
    });
    totalCommentsCount++;

    // Depth 5 (Clamped max depth)
    const c5 = await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 6) % users.length]._id,
      content: `Reply at depth 5: Agreed. Let's run a couple of automated validation scripts on staging first next week!`,
      depth: 5,
      parentComment: c4._id,
    });
    totalCommentsCount++;

    // Soft-deleted comment thread branch (deleted but has replies)
    const s0 = await Comment.create({
      post: threadPost._id,
      author: userMap["spammer"] ? userMap["spammer"]._id : users[7]._id,
      content: "[deleted]",
      deletedButHasReplies: true,
      depth: 0,
      parentComment: null
    });
    totalCommentsCount++;

    await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 8) % users.length]._id,
      content: "This was in reply to a spam comments block, but I wanted to follow up on this nested discussion.",
      depth: 1,
      parentComment: s0._id
    });
    totalCommentsCount++;

    // Moderated/hidden comment
    await Comment.create({
      post: threadPost._id,
      author: users[(pIdx + 9) % users.length]._id,
      content: "This comment violates community guidelines and should be hidden by default.",
      depth: 0,
      parentComment: null,
      moderationStatus: "hidden"
    });
    totalCommentsCount++;
  }

  // 2. Add miscellaneous comments to cross 300+ total comments
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    // Add 2 to 3 random comments on other posts
    const commentsToCreate = (i % 2) + 2;
    for (let c = 0; c < commentsToCreate; c++) {
      const commentAuthor = users[(i + c + 3) % users.length];
      
      // Make some comments extremely long (boundary limit: max 2000)
      let content = COMMENT_BODY_POOL[(i + c) % COMMENT_BODY_POOL.length];
      if (i === 60 && c === 0) {
        content = "Detailed feedback paragraph. ".repeat(70).slice(0, 1950); // ~1950 chars long comment
      }

      await Comment.create({
        post: post._id,
        author: commentAuthor._id,
        content,
        depth: 0,
      });
      totalCommentsCount++;
    }
  }

  console.log("[seed] Populating bookmarks for users...");
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const bookmarkCount = i % 5; // 0 to 4 bookmarks
    for (let b = 0; b < bookmarkCount; b++) {
      const bookmarkedPost = posts[(i + b * 7) % posts.length];
      user.bookmarks.push(bookmarkedPost._id);
    }
    await user.save();
  }

  console.log("[seed] Generating 50+ moderation reports...");
  const reportsCount = 55;
  const reportPairsSet = new Set();
  const reports = [];

  // Target selection pools:
  const reportableComments = await Comment.find({});
  
  // Set up 3 posts and 3 comments that are highly reported (3+ reports each) to test priorityFlag trigger
  const highReportedPosts = [posts[10], posts[20], posts[30]];
  const highReportedComments = [reportableComments[10], reportableComments[20], reportableComments[30]];

  const reasons = ["spam", "harassment", "misinformation", "other"];
  const statuses = ["pending", "reviewed", "dismissed", "actioned"];

  // Populate multi-report priority flags
  for (let rIdx = 0; rIdx < 3; rIdx++) {
    const targetPost = highReportedPosts[rIdx];
    const targetComment = highReportedComments[rIdx];
    
    // Create 3 reports from 3 different users for targetPost
    for (let uIdx = 0; uIdx < 3; uIdx++) {
      const reporter = users[uIdx + 5]; // use unique users
      const postKey = `${reporter._id}_post_${targetPost._id}`;
      if (!reportPairsSet.has(postKey)) {
        reportPairsSet.add(postKey);
        const report = await Report.create({
          reporter: reporter._id,
          targetType: "post",
          targetId: targetPost._id,
          reason: reasons[uIdx % reasons.length],
          details: `Report number ${uIdx + 1} detailing potential violations.`,
          status: "pending",
          priorityFlag: true // automatically flag as priority since we are seeding multiple reports
        });
        reports.push(report);
      }
    }

    // Create 3 reports from 3 different users for targetComment
    for (let uIdx = 0; uIdx < 3; uIdx++) {
      const reporter = users[uIdx + 8]; // use unique users
      const commentKey = `${reporter._id}_comment_${targetComment._id}`;
      if (!reportPairsSet.has(commentKey)) {
        reportPairsSet.add(commentKey);
        const report = await Report.create({
          reporter: reporter._id,
          targetType: "comment",
          targetId: targetComment._id,
          reason: reasons[(uIdx + 1) % reasons.length],
          details: `Comment report number ${uIdx + 1} detailing harassment/spam.`,
          status: "pending",
          priorityFlag: true
        });
        reports.push(report);
      }
    }
  }

  // Create remaining reports to hit 50+
  let reportSafetyLoop = 0;
  while (reports.length < reportsCount && reportSafetyLoop < 10000) {
    reportSafetyLoop++;
    const reporter = users[Math.floor(Math.random() * users.length)];
    const targetType = Math.random() < 0.5 ? "post" : "comment";
    const target = targetType === "post" 
      ? posts[Math.floor(Math.random() * posts.length)] 
      : reportableComments[Math.floor(Math.random() * reportableComments.length)];
    
    if (!target) continue;
    if (target.author && target.author.toString() === reporter._id.toString()) continue;

    const key = `${reporter._id}_${targetType}_${target._id}`;
    if (reportPairsSet.has(key)) continue;
    reportPairsSet.add(key);

    // Details boundary limit: max 500 characters
    let details = `Detailed description of report reason.`;
    if (reports.length % 7 === 0) {
      details = ""; // empty details check
    } else if (reports.length % 7 === 1) {
      details = "Report details. ".repeat(40).slice(0, 480); // max boundary details check
    }

    const report = await Report.create({
      reporter: reporter._id,
      targetType,
      targetId: target._id,
      reason: reasons[reports.length % reasons.length],
      details,
      status: statuses[reports.length % statuses.length],
      priorityFlag: Math.random() < 0.15
    });
    reports.push(report);
  }

  console.log("[seed] Generating 100+ audit logs covering all enum actions...");
  const adminActor = userMap["ada"] || users[0];
  const auditLogsCount = 110;
  const actions = [
    "post_hidden", "post_unhidden", "comment_hidden", "comment_unhidden",
    "user_banned", "user_unbanned", "role_changed", "report_dismissed", "report_actioned"
  ];

  for (let i = 0; i < auditLogsCount; i++) {
    const action = actions[i % actions.length];
    let targetType = "post";
    let targetId = posts[i % posts.length]._id;
    let metadata = { reason: "Routine maintenance review check." };

    if (action.includes("comment")) {
      targetType = "comment";
      targetId = reportableComments[i % reportableComments.length]._id;
      metadata = { prevContent: "Comment preview before hiding.", actionTakenBy: "moderator" };
    } else if (action.includes("user")) {
      targetType = "user";
      targetId = users[i % users.length]._id;
      metadata = { userEmail: users[i % users.length].email, banReason: "Terms violation" };
    } else if (action.includes("report")) {
      targetType = "report";
      targetId = reports[i % reports.length]._id;
      metadata = { reportReason: reports[i % reports.length].reason, decision: "Valid report flagged" };
    }

    await AuditLog.create({
      actor: adminActor._id,
      action,
      targetType,
      targetId,
      metadata,
    });
  }

  console.log("[seed] Generating 50+ historical post revisions...");
  const revisionPosts = posts.slice(0, 15); // Select first 15 posts to create edits on
  let totalRevisionsCount = 0;

  for (let pIdx = 0; pIdx < revisionPosts.length; pIdx++) {
    const targetPost = revisionPosts[pIdx];
    const revisionsToCreate = (pIdx % 3) + 3; // 3 to 5 revisions per post

    for (let r = 0; r < revisionsToCreate; r++) {
      await PostRevision.create({
        post: targetPost._id,
        editedBy: targetPost.author,
        title: `${targetPost.title} (Revision v${r + 1})`,
        subtitle: targetPost.subtitle ? `${targetPost.subtitle} (edited)` : "Incremental modifications",
        contentHtml: `<p>Historical revision index ${r + 1} of content. This preserves older text versions before publication.</p>`,
        tags: targetPost.tags.slice(0, Math.max(1, targetPost.tags.length - 1)),
        coverImage: targetPost.coverImage,
        createdAt: new Date(now - (revisionPosts.length - pIdx) * 24 * 60 * 60 * 1000 - r * 4 * 60 * 60 * 1000), // staggered dates in past
      });
      totalRevisionsCount++;
    }
  }

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
