"use strict";

/**
 * seed-data.js
 * ─────────────────────────────────────────────────────────
 * Shared vocabulary pools, helpers, and static definitions
 * used by seed.js, seed-content.js, and seed-moderation.js.
 * ─────────────────────────────────────────────────────────
 */

// ── Deterministic PRNG (reproducible across runs) ──────────
let _s = 42;
function rand()             { _s = (_s * 1664525 + 1013904223) & 0xffffffff; return ((_s >>> 0) / 0xffffffff); }
function randInt(min, max)  { return min + Math.floor(rand() * (max - min + 1)); }
function pick(arr)          { return arr[Math.floor(rand() * arr.length)]; }
function pickN(arr, n) {
  const c = [...arr]; const r = [];
  for (let i = 0; i < Math.min(n, c.length); i++)
    r.push(c.splice(Math.floor(rand() * (c.length - i)), 1)[0]);
  return r;
}

// ── Name pools ─────────────────────────────────────────────
const FIRST = [
  "Ada","James","Grace","Maya","Leo","Sarah","Marcus","Aria","David","Simone",
  "Albert","Virginia","Alan","Richard","Katherine","Margaret","Linus","Donald","Ursula","Isaac",
  "Arthur","Octavia","Mary","Emily","Friedrich","Hannah","Frantz","Bell","Michel","Priya",
  "Kwame","Yuki","Carlos","Amara","Nadia","Ivan","Fatima","Oliver","Zara","Chen",
  "Aisha","Ravi","Elena","Omar","Ingrid","Kofi","Mei","Tariq","Sofia","Anders",
  "Keiko","Santiago","Layla","Dmitri","Chloe","Emeka","Elif","Rafael","Nour","Bjorn",
  "Akira","Mateo","Selin","Viktor","Hana","Diego","Yasmin","Finn","Amira","Takeshi",
  "Leila","Cruz","Zoe","Alexei","Rosa","Haruto","Fatou","Erik","Chiara","Tobias",
  "Ananya","Julian","Senna","Magnus","Bea","Nico","Tara","Lukas","Lena","Soo",
  "Ren","Kai","Lyra","Theo","Pita","Imani","Wren","Aditi","Felix","Mira",
];

const LAST = [
  "Lovelace","Baldwin","Hopper","Chen","Torres","Jenkins","Aurelius","Thorne","Miller","Beauvoir",
  "Camus","Woolf","Turing","Feynman","Johnson","Hamilton","Torvalds","Knuth","LeGuin","Asimov",
  "Clarke","Butler","Shelley","Dickinson","Nietzsche","Locke","Arendt","Fanon","Hooks","Foucault",
  "Kumar","Osei","Tanaka","Mendez","Diallo","Petrov","Hassan","Wright","Kimura","ElAmin",
  "Nakamura","Rahman","Volkov","Flores","AlRashid","Andersen","Park","Mbeki","Rossi","Singh",
  "Eriksson","Sato","Reyes","AlFarsi","Ivanov","Lindqvist","Boateng","Yilmaz","Ferreira","Mansour",
  "Holm","Suzuki","Vargas","Celik","Sokolov","Takahashi","Diop","Ozturk","Cardoso","Hadid",
  "Nkosi","Yamamoto","Castro","Khalil","Larsen","Wang","Adeyemi","Yildirim","Oliveira","Romano",
  "Nielsen","Patel","Martinez","Aydin","Bello","Hashimoto","Coulibaly","Andrade","Ferrari","Dubois",
  "Spinoza","Hobbes","Descartes","Mill","Weber","Martineau","Mead","Thomas","Znaniecki","Park",
];

const BIO_POOL = [
  "Writing about computation, poetry, and the space between.",
  "Engineer by day, climber by night. Building things that matter.",
  "Exploring the intersection of design systems and distributed systems.",
  "Pragmatic thinker obsessed with web performance.",
  "Former Navy officer. Now writing about what I learned.",
  "Resilient engineer. Notes on craft, systems, and life.",
  "Product designer and occasional gardener. Notes on calm.",
  "Researcher studying accessibility in the modern age.",
  "Author of essays on philosophy, ethics, and everything between.",
  "Debugging life one commit at a time.",
  "Coffee, cycling, and the economics of small things.",
  "Digital nomad. Writing from Berlin and Nairobi.",
  "Stoic engineer. Control your reactions; you cannot control the cloud.",
  "UX researcher fascinated by friction, speed, and cognitive load.",
  "Minimalist baker and compiler enthusiast.",
  "System administrator who enjoys sleeping through outages.",
  "Frontend developer, accessibility advocate, and cat enthusiast.",
  "Writing daily essays on self-discipline and craft.",
  "Composer and sound engineer. Translating environments to synthesizers.",
  "PhD in machine learning. Now making it accessible to everyone.",
  "Open source contributor. Opinions are my own.",
  "Making things and writing about what I learn.",
  "10 years in startups. Here to share what nobody tells you.",
  "Curious about everything. Expert in nothing. Writing anyway.",
  "Sovereign publisher exploring decentralization and ultramarathons.",
];

// ── Tags ──────────────────────────────────────────────────
const ALL_TAGS = [
  "writing","productivity","craft","engineering","software","design","life",
  "stoicism","music","accessibility","coffee","debugging","nodejs","cpp",
  "react","python","go","rust","typescript","devops","career","ux","leadership",
  "philosophy","mental-health","creativity","science","startup","open-source",
  "web-performance","databases","security","machine-learning","ethics","reading",
  "minimalism","climate","remote-work","system-design","algorithms","testing",
  "css","html","api-design","refactoring","documentation","team-culture",
];

// ── Post titles ──────────────────────────────────────────
const POST_TITLES = [
  // Tech & Engineering
  "The Art of Finishing","Notes on Slow Software","Debugging Is Storytelling",
  "The Quiet Power of Defaults","The Case for Boring Technology","Writing Interfaces for Humans",
  "Why I Stopped Writing Perfect Code","The Hidden Cost of Dependencies",
  "Designing for Error States Nobody Talks About","When Abstractions Betray You",
  "The Pull Request Nobody Wants to Merge","12 Things I Wish I Knew Before My First Outage",
  "Caching Is Not a Silver Bullet","The Database Migration That Took Three Months",
  "Building APIs for People Not Machines","Why Your CI Pipeline Is Lying to You",
  "The Senior Engineer Guide to Saying No","From Monolith to Microservices What We Lost",
  "On Writing Good Error Messages","Type Safety Is a Love Language",
  "The Death of the 10x Developer","Production Incident A Postmortem in Prose",
  "Performance Budgets Are a Conversation Not a Number","Accessibility Is Not a Feature",
  "The Myth of the Clean Codebase","Learning to Love Legacy Code",
  "Event Driven Architecture Promise vs Reality","My Honest Review of Six Months with Rust",
  "Why Software Estimates Are Always Wrong","The Seniority Trap",
  // Writing & Craft
  "On Writing Honestly","Learning in Public","Reading More by Reading Less",
  "The Sentence I Was Afraid to Write","Writing as a Practice Not a Product",
  "Why I Publish Before I Am Ready","On Rereading the Same Book Every Year",
  "The Writers Block Myth","Notes on Taking Notes",
  "How I Wrote 1000 Words a Day for a Year","The Editor You Did Not Know You Had",
  // Life & Mindset
  "A Garden Is a Kind of Diary","The Economics of Small Things",
  "Climbing Taught Me to Rest","A Short Defense of Long Walks",
  "Compounding Curiosity","Stoic Mindset for Engineers",
  "On Quitting Things","The Afternoon I Decided to Stop Being Busy",
  "What Running Taught Me About Software","On Not Knowing What You Want",
  "The Value of Doing Nothing","Slow Mornings as a Competitive Advantage",
  "Why I Deleted All My Productivity Apps","Digital Minimalism Six Months Later",
  // Design
  "Design for the Tired User","Designing Accessible Web Forms",
  "The Underrated Power of Whitespace","Principles of Minimalist Coffee",
  "Ambient Environments as Music","Color Theory Nobody Taught Me",
  "The Typeface Decision That Changed Everything","Motion Design Is Storytelling",
  "When Design Systems Fail","Designing for Dyslexia",
  // Culture & Opinion
  "The Slow Death of the Blogosphere","On Newsletters and the Future of Writing",
  "Why Twitter Made Us Worse Writers","The Return of the Personal Website",
  "Monetizing Attention Is Not a Business Model","On Being a Beginner Again",
  "The Loneliness of Remote Work","Hot Take Pair Programming Is Overrated",
  "In Defense of Long Emails","The Weekly Review That Changed My Life",
  // Edge case titles (special chars, duplicate-slug scenario)
  "Scaling Nodejs in 2026 A Practical Guide",
  "C Plus Plus vs Rust The Resume War",
  "TIL Bash Variable Expansion Saves Lines",
  "Everything Wrong with Clean Code",
  "Why I Switched from React to Signals and Switched Back",
  "The Art of Finishing Revisited",
  "The Art of Finishing Part II",
];

const SUBTITLES = [
  "On shipping small and shipping often",
  "Why the fastest teams move deliberately",
  "The narrative hidden inside every stack trace",
  "How small decisions shape big behaviors",
  "Choose tools you can sleep through",
  "Words are UI too",
  "A practical guide to avoiding premature abstractions",
  "Notes on building accessible components at scale",
  "An exploration of performance bottlenecks in event driven pipelines",
  "The compound effect of resolving one minor lint warning every day",
  "Finding stability in ephemeral infrastructure",
  "Why clean code is a long term investment not a sprint",
  "What tending plants taught me about design",
  "Coffee compounding and attention",
  "Progress lives in the recovery",
  "Depth over volume",
  "Thinking with your feet",
  "Small questions asked daily",
  "Finding serenity in production outages",
  "Keyboard accessibility and screen readers",
  "The only style guide that ever helped me",
  "Lessons from three years of daily writing",
  "",  // intentionally empty subtitle
  "",
];

// ── Comment content ───────────────────────────────────────
const COMMENT_POOL = [
  "This resonated deeply. Thank you for sharing.",
  "Saving this to read again later so much here.",
  "The part about defaults really stuck with me.",
  "Needed this today. Sharing with my team.",
  "Beautifully put. The blockquote is going on my wall.",
  "I disagree slightly. In fast paced environments sometimes speed is the only way to validate.",
  "Brilliant overview. How do you apply this to multi functional teams?",
  "This is a masterpiece of writing. One of the best things I have read this year.",
  "I love this approach. We have been trying to solve something similar in our codebase.",
  "How does this compare to using a message queue or event streams?",
  "Honestly boring technology is underrated. Thanks for articulating this so well.",
  "Could you elaborate on the security implications of this abstraction layer?",
  "Great post. One thing I would add: observability is just as important as the architecture.",
  "Agree 100 percent. The recovery phase is where the compounding interest actually happens.",
  "We recently migrated our state system and saw a 40 percent reduction in cognitive load.",
  "Is there a GitHub repository where we can see the full implementation of this example?",
  "This is precisely why I prefer simplicity over premature optimizations.",
  "The timing of this post is perfect. We had a production incident last week.",
  "Every junior engineer should read this before their first pull request.",
  "Filed under things I should have known at 22.",
  "The section on failure modes changed how I think about this entirely.",
  "I literally paused what I was doing to read this twice. That is rare.",
  "Short and sharp. Exactly what I needed at 11pm while debugging this mess.",
  "Three years in this industry and I am still learning from posts like this.",
  "The analogy between gardening and software development keeps surfacing. Wonderful piece.",
  "Thank you. I have been writing for six months and never thought about editing this way.",
  "I shared this with my CTO and she immediately forwarded it to the whole engineering org.",
  "Counterpoint: complexity is unavoidable. But your point about defaults still stands.",
];

const SPAM_COMMENTS = [
  "Make 5000 per day from home click my link NOW",
  "Check out my crypto course limited spots DM for details",
  "This is fake news the author is lying wake up sheeple",
  "Nobody reads this garbage subscribe to my newsletter instead",
  "FIRST also follow me for more amazing tips",
];

// ── Content generation pools ──────────────────────────────
const PARA_POOLS = [
  [
    "Software architecture is fundamentally about managing trade-offs under conditions of uncertainty.",
    "A clean abstraction isolates internal state mutations providing consumers with a predictable contract.",
    "To mitigate architectural debt leading engineering organizations emphasize strict module boundaries.",
    "When evaluating new dependencies consider the maintenance lifecycle and performance footprint carefully.",
    "Refactoring should be an ongoing hygiene practice integrated into daily pull requests.",
  ],
  [
    "Modern web applications demand exceptional responsiveness across varying network conditions.",
    "The critical rendering path begins with network socket establishment and document parsing.",
    "Hydration overhead remains one of the largest bottlenecks in client heavy applications today.",
    "Profiling performance with browser developer tools reveals hidden memory leaks and forced reflows.",
    "Establishing performance budgets within CI pipelines ensures new deployments do not silently erode gains.",
  ],
  [
    "Database performance is the bedrock of application scalability as data volume grows.",
    "Designing efficient indexes requires analyzing query access patterns using the ESR rule.",
    "Connection pooling and query timeouts prevent connection starvation during peak traffic spikes.",
    "Data sharding introduces operational complexity but becomes mandatory when node boundaries are reached.",
    "Regularly auditing query execution plans highlights missing indexes before they cause outages.",
  ],
  [
    "Building resilient distributed systems requires accepting that hardware and network failures are inevitable.",
    "The Circuit Breaker pattern isolates failing remote dependencies by short circuiting calls during error spikes.",
    "Idempotency tokens guarantee that retried operations do not create duplicate transactions.",
    "Event driven messaging architectures decouple service execution enabling asynchronous processing.",
    "Comprehensive telemetry structured logging and distributed tracing enable rapid incident response.",
  ],
  [
    "Design systems serve as the shared language between product designers and frontend engineers.",
    "Semantic design tokens for color typography and spacing abstract raw values into meaningful context.",
    "Component APIs should favor composition over rigid configuration props for maximum flexibility.",
    "Accessibility is an essential quality dimension not an afterthought for any mature design system.",
    "Documenting component usage empowers feature teams to ship polished interfaces independently.",
  ],
];

const QUOTES = [
  "Simplicity is prerequisite for reliability. Edsger W. Dijkstra",
  "Make it work make it right make it fast. Kent Beck",
  "Boring technology is a feature not a drawback. Dan McKinley",
  "Perfection is achieved not when nothing is left to add but when nothing is left to take away.",
  "Software is a process of learning not a process of building. Dan North",
  "The function of good software is to make the complex appear simple. Grady Booch",
];

const CODE_SNIPPETS = [
  "<pre><code class=\"language-javascript\">const updateState = (s, a) => { switch(a.type) { case \"SET_DATA\": return {...s, data: a.payload}; default: return s; } };</code></pre>",
  "<pre><code class=\"language-javascript\">async function fetchWithRetry(url, o={}, n=3) { for(let i=0;i<n;i++) { try { const r=await fetch(url,o); if(r.ok) return r.json(); } catch(e){ if(i===n-1) throw e; await new Promise(r=>setTimeout(r,1000*2**i)); } } }</code></pre>",
  "<pre><code class=\"language-javascript\">postSchema.index({ status: 1, author: 1, publishedAt: -1 });</code></pre>",
  "<pre><code class=\"language-bash\">db.setProfilingLevel(1, { slowms: 100 }); db.system.profile.find().sort({ts:-1}).limit(5);</code></pre>",
];

/**
 * Generates realistic HTML content for a post.
 */
function generateContentHtml(title, subtitle, minutes, opts) {
  const { isLong, hasXSS } = opts || {};

  // Long whitepaper scenario (tests read-time estimator on huge docs)
  if (isLong) {
    let h = `<h1>${title}</h1><p><em>${subtitle}</em></p><h2>Exhaustive Blueprint</h2>`;
    for (let p = 0; p < 250; p++)
      h += `<p>Paragraph ${p + 1} of a long technical whitepaper covering software design, caching strategies, horizontal scaling, database sharding, and memory optimisation in distributed systems.</p>`;
    return h;
  }

  const targetWords = Math.floor(((minutes - 1) * 200 + 1 + minutes * 200) / 2);
  let hash = 0; for (const c of title) hash += c.charCodeAt(0);
  const pool  = PARA_POOLS[hash % PARA_POOLS.length];
  const quote = QUOTES[hash % QUOTES.length];
  const code  = CODE_SNIPPETS[hash % CODE_SNIPPETS.length];

  let h = `<h1>${title}</h1>`;
  if (subtitle) h += `<p><em>${subtitle}</em></p>`;

  // XSS payload for sanitizer test — should be stripped by sanitizeContent()
  if (hasXSS) h += `<script>alert(1)</script><img src=x onerror=alert(1)><iframe src=javascript:alert(1)></iframe>`;

  h += `<h2>1. Context and Motivation</h2><p>${pool[0]}</p>`;
  if (minutes >= 2) h += `<p>${pool[1]}</p><blockquote>${quote}</blockquote>`;
  if (minutes >= 3) h += `<h2>2. Implementation Strategy</h2><p>${pool[2]}</p>${code}<p>${pool[3]}</p>`;
  if (minutes >= 4) h += `<h2>3. Key Takeaways</h2><ul><li>Establish clear contracts early.</li><li>Automate regression testing within CI.</li><li>Monitor operational telemetry continuously.</li></ul>`;

  let si = 4, pc = 0;
  let cw = h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  while (cw < targetWords) {
    if (pc % 3 === 0) h += `<h2>${si++}. Deep Dive Phase ${si - 4}</h2>`;
    h += `<p>${pool[pc % pool.length]} Furthermore evaluating these structural considerations against production telemetry ensures stability under fluctuating load profiles.</p>`;
    cw = h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    pc++; if (pc > 200) break;
  }
  return h;
}

// ── Publication definitions ────────────────────────────────
const PUB_DEFS = [
  { name: "The Pragmatic Engineer", slug: "pragmatic-engineer",
    description: "Deep dives into software engineering craft, system design, and the culture of great engineering teams.",
    logoUrl: "https://picsum.photos/seed/pub-pe/200/200", coverImage: "https://picsum.photos/seed/pub-pe-cover/1200/400" },
  { name: "Design Perspectives", slug: "design-perspectives",
    description: "Essays on product design, UX research, design systems, and the philosophy of building for humans.",
    logoUrl: "https://picsum.photos/seed/pub-dp/200/200", coverImage: "https://picsum.photos/seed/pub-dp-cover/1200/400" },
  { name: "Words and Systems", slug: "words-and-systems",
    description: "Where writing meets technology. Essays for the thoughtful developer who still reads books.",
    logoUrl: "https://picsum.photos/seed/pub-ws/200/200", coverImage: "https://picsum.photos/seed/pub-ws-cover/1200/400" },
  { name: "Startup Autopsy", slug: "startup-autopsy",
    description: "Honest post-mortems and learnings from founders who have shipped products and tried again.",
    logoUrl: "https://picsum.photos/seed/pub-sa/200/200", coverImage: "https://picsum.photos/seed/pub-sa-cover/1200/400" },
  { name: "Archived Quarterly", slug: "archived-quarterly",
    description: "A publication that ran its course. Preserved for posterity.",
    logoUrl: "", coverImage: "", isArchived: true },
];

const LIST_NAMES = [
  "Engineering Deep Dives","Design Inspiration","To Read This Weekend",
  "Shared With Team","Leadership Reads","Writing Craft",
  "Career Advice I Actually Believe","Architecture Classics",
  "Personal Growth","Indie Web","Open Source Gems","2026 Reading List",
];

const COVER_SEEDS = Array.from({ length: 40 }, (_, i) =>
  `https://picsum.photos/seed/inkwell${i + 1}/1200/600`
);

const REPORT_REASONS  = ["spam", "harassment", "misinformation", "other"];
const REPORT_WEIGHTS  = [40, 25, 20, 15];
function weightedReason() {
  let r = rand() * 100;
  for (let i = 0; i < REPORT_WEIGHTS.length; i++) {
    if (r < REPORT_WEIGHTS[i]) return REPORT_REASONS[i];
    r -= REPORT_WEIGHTS[i];
  }
  return "other";
}

// Named users — kept stable for test-suite compatibility
const NAMED_USERS = [
  // Admins
  { name: "Ada Lovelace",       username: "ada",          email: "ada@inkwell.dev",           role: "admin", status: "active",  bio: "Writing about computation, poetry, and the space between." },
  { name: "Alan Turing",        username: "turing",       email: "turing@inkwell.dev",         role: "admin", status: "active",  bio: "Formalising the informal. Building the universal machine.", customDomain: "turing-machine.org" },
  { name: "Margaret Hamilton",  username: "margaret",     email: "margaret@inkwell.dev",       role: "admin", status: "active",  bio: "Software engineering is not just a job it is a discipline." },
  // Power users
  { name: "James Baldwin",      username: "jbaldwin",     email: "james@inkwell.dev",          role: "user",  status: "active",  bio: "Essays on identity, art, and the stories we tell ourselves." },
  { name: "Grace Hopper",       username: "grace",        email: "grace@inkwell.dev",          role: "user",  status: "active",  bio: "Debugging life one commit at a time. Ex-Navy. Loves nanoseconds.", customDomain: "grace.xyz", exportStatus: "ready", _exportOffset: 3 },
  { name: "Maya Chen",          username: "maya",         email: "maya@inkwell.dev",           role: "user",  status: "active",  bio: "Product designer and occasional gardener. Notes on craft and calm." },
  { name: "Leo Torres",         username: "leo",          email: "leo@inkwell.dev",            role: "user",  status: "active",  bio: "Coffee, climbing, and the economics of small things." },
  { name: "Sarah Jenkins",      username: "sarahj",       email: "sarah@inkwell.dev",          role: "user",  status: "active",  bio: "Digital anthropologist studying micro-communities on the web." },
  { name: "Marcus Aurelius",    username: "stoic",        email: "marcus@stoic.dev",           role: "user",  status: "active",  bio: "Daily reflections on self-discipline, mortality, and leadership." },
  { name: "Aria Thorne",        username: "aria",         email: "aria@inkwell.dev",           role: "user",  status: "active",  bio: "Composer and sound engineer. Translating environments to synthesizers." },
  { name: "David Miller",       username: "davidm",       email: "david@inkwell.dev",          role: "user",  status: "active",  bio: "Frontend developer, accessibility advocate, and cat enthusiast." },
  // Banned users (2 variants)
  { name: "Hacker Spammer",     username: "spammer",      email: "spam@spammer.org",           role: "user",  status: "banned",  bio: "Affiliate marketer and crypto enthusiast." },
  { name: "Karl Marx",          username: "karl",         email: "karl@inkwell.dev",           role: "user",  status: "banned",  bio: "From each according to his ability." },
  // Unverified — active token
  { name: "Simone de Beauvoir", username: "simone",       email: "simone@inkwell.dev",         role: "user",  status: "active",  bio: "One is not born but rather becomes a writer.", emailVerified: false, _verifyActive: true },
  // Unverified — expired token
  { name: "Virginia Woolf",     username: "virginia",     email: "virginia@inkwell.dev",       role: "user",  status: "active",  bio: "A room of ones own and a broadband connection.", emailVerified: false, _verifyExpired: true },
  // Export failed + expired password reset
  { name: "Albert Camus",       username: "camus",        email: "camus@inkwell.dev",          role: "user",  status: "active",  bio: "One must imagine Sisyphus debugging.", customDomain: "camus.net", exportStatus: "failed", _exportOffset: 2, _resetExpired: true },
  // Export pending
  { name: "Richard Feynman",    username: "feynman",      email: "feynman@inkwell.dev",        role: "user",  status: "active",  bio: "If you think you understand quantum mechanics.", exportStatus: "pending", _exportOffset: 1 },
  // Email prefs off (tests digest exclusion)
  { name: "Bell Hooks",         username: "bell",         email: "bell@inkwell.dev",           role: "user",  status: "active",  bio: "Love as a practice not just a feeling.", emailPrefsOff: true },
  // Short name edge case
  { name: "Li Wong",            username: "liwong",       email: "li@inkwell.dev",             role: "user",  status: "active",  bio: "" },
  // Max-length bio (200 chars exactly)
  { name: "Max Bio User",       username: "maxbio",       email: "maxbio@inkwell.dev",         role: "user",  status: "active",  bio: "x".repeat(200) },
  // Email alias (+ character in address)
  { name: "Francois Muller",    username: "francois",     email: "francois+alias@inkwell.dev", role: "user",  status: "active",  bio: "Accented names and email alias edge case." },
  // Uppercase email (tests lowercase normalization)
  { name: "Soren Kierkegaard",  username: "kierkegaard",  email: "SOREN@KIERKEGAARD.CO.UK",    role: "user",  status: "active",  bio: "Leap of faith into the void." },
  // Active password-reset token
  { name: "Ada Lovelace Clone", username: "ada2",         email: "ada2@inkwell.dev",           role: "user",  status: "active",  bio: "Password reset active token test.", _resetActive: true },
];

module.exports = {
  rand, randInt, pick, pickN,
  FIRST, LAST, BIO_POOL, ALL_TAGS,
  POST_TITLES, SUBTITLES, COMMENT_POOL, SPAM_COMMENTS,
  PARA_POOLS, QUOTES, CODE_SNIPPETS,
  generateContentHtml,
  PUB_DEFS, LIST_NAMES, COVER_SEEDS,
  REPORT_REASONS, REPORT_WEIGHTS, weightedReason,
  NAMED_USERS,
};
