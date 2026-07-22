"use strict";

/**
 * seed-data.js
 * ─────────────────────────────────────────────────────────
 * Shared vocabulary pools, helpers, and static definitions
 * used by seed.js, seed-content.js, and seed-moderation.js.
 *
 * All content is written as realistic prose — not placeholder text.
 * ─────────────────────────────────────────────────────────
 */

// ── Deterministic PRNG (reproducible across runs) ──────────
let _s = 42;
function rand()            { _s = (_s * 1664525 + 1013904223) & 0xffffffff; return ((_s >>> 0) / 0xffffffff); }
function randInt(min, max) { return min + Math.floor(rand() * (max - min + 1)); }
function pick(arr)         { return arr[Math.floor(rand() * arr.length)]; }
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
  "Engineering leader at a remote-first team. I write to think.",
  "Staff engineer. I care about developer experience more than people expect.",
  "TypeScript by day. Woodworking by weekend. Notes on making.",
  "Documenting my journey from junior to principal engineer.",
  "Recovering perfectionist. Shipping is the point.",
  "Obsessed with tiny interfaces and large implications.",
  "Software + philosophy. Trying to write clearly about both.",
  "Human factors researcher. I study why things go wrong.",
  "I build databases and I have opinions about your schema.",
  "Systems thinking applied to everything including breakfast.",
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
  "kubernetes","docker","ci-cd","observability","monitoring","incident-response",
  "product-management","communication","freelancing","burnout","focus",
  "note-taking","journaling","creativity","fiction","non-fiction",
];

// ── 400+ Unique Post Titles ───────────────────────────────
const POST_TITLES = [
  // ── Engineering & Software (deep craft) ──────────────────
  "The Art of Finishing",
  "Notes on Slow Software",
  "Debugging Is Storytelling",
  "The Quiet Power of Defaults",
  "The Case for Boring Technology",
  "Writing Interfaces for Humans",
  "Why I Stopped Writing Perfect Code",
  "The Hidden Cost of Dependencies",
  "Designing for Error States Nobody Talks About",
  "When Abstractions Betray You",
  "The Pull Request Nobody Wants to Merge",
  "12 Things I Wish I Knew Before My First Outage",
  "Caching Is Not a Silver Bullet",
  "The Database Migration That Took Three Months",
  "Building APIs for People Not Machines",
  "Why Your CI Pipeline Is Lying to You",
  "The Senior Engineer Guide to Saying No",
  "From Monolith to Microservices: What We Lost",
  "On Writing Good Error Messages",
  "Type Safety Is a Love Language",
  "The Death of the 10x Developer",
  "Production Incident: A Postmortem in Prose",
  "Performance Budgets Are a Conversation Not a Number",
  "Accessibility Is Not a Feature",
  "The Myth of the Clean Codebase",
  "Learning to Love Legacy Code",
  "Event-Driven Architecture: Promise vs. Reality",
  "My Honest Review of Six Months with Rust",
  "Why Software Estimates Are Always Wrong",
  "The Seniority Trap",
  "How I Finally Understood Recursion",
  "The Art of the Technical Interview That Does Not Suck",
  "What Every Engineer Misunderstands About Transactions",
  "I Rewrote It in Go and Regretted It Immediately",
  "The N+1 Query That Took Down Production",
  "Horizontal Scaling Is a People Problem",
  "Why I Love Reading Other Peoples Code",
  "The Problem with Premature Optimization",
  "Naming Things Is Philosophy",
  "Code Review Is a Conversation",
  "The Infrastructure You Already Have Is Probably Enough",
  "Thinking About Time Zones Will Break Your Brain",
  "The Right Way to Handle Secrets in 2026",
  "Why We Keep Reinventing the Same Patterns",
  "On the Permanence of Deleted Data",
  "Technical Debt Is a Loan You Did Not Apply For",
  "The Most Dangerous Line of Code I Ever Wrote",
  "Reading the Source Code Changed Everything",
  "Soft Skills Are Just Skills",
  "The Underrated Skill of Knowing When to Stop",
  "How a Single Regex Brought Down Our Platform",
  "On Distributed Transactions and Broken Dreams",
  "The Pull Request Is a Product",
  "Lessons from Five Years of On-Call Rotations",
  "Why Every Engineer Should Write Documentation First",
  "The Zero-Bug Backlog Experiment",
  "Observability Is Not Just Logging",
  "Kubernetes Taught Me Humility",
  "The Real Cost of a Rewrite",
  "Two Years Maintaining an Open Source Library",
  "What Chess Taught Me About Software Architecture",

  // ── TypeScript / JavaScript / Frontend ───────────────────
  "Scaling Node.js in 2026: A Practical Guide",
  "C++ vs Rust: The Resume War",
  "TIL: Bash Variable Expansion Saves Lines",
  "Everything Wrong with Clean Code",
  "Why I Switched from React to Signals and Switched Back",
  "TypeScript Generics Finally Made Sense to Me",
  "The JavaScript Event Loop Is Not What You Think",
  "React Server Components: Six Months of Real Use",
  "My Webpack Config Is an Art Installation",
  "Stop Using useEffect for Everything",
  "The CSS I Wish I Had Written Twenty Years Ago",
  "Module Federation Saved Our Microfrontend Nightmare",
  "Why I Still Use Vanilla JavaScript for Small Projects",
  "Closures Explained Without the Jargon",
  "The State Management Library We Did Not Need",
  "An Honest Look at Deno in Production",
  "Bun Versus Node in a Real API Benchmark",
  "The Pain and Joy of Full-Stack TypeScript",
  "Web Workers Are Underrated",
  "Building a Design System in Three Weeks",

  // ── Writing & Craft ───────────────────────────────────────
  "On Writing Honestly",
  "Learning in Public",
  "Reading More by Reading Less",
  "The Sentence I Was Afraid to Write",
  "Writing as a Practice Not a Product",
  "Why I Publish Before I Am Ready",
  "On Rereading the Same Book Every Year",
  "The Writers Block Myth",
  "Notes on Taking Notes",
  "How I Wrote 1000 Words a Day for a Year",
  "The Editor You Did Not Know You Had",
  "First Drafts Are Supposed to Be Bad",
  "The Paragraph Is the Unit of Thought",
  "Why Short Sentences Work",
  "Writing for an Audience of One",
  "On the Discipline of Daily Essays",
  "What I Learned from Sending 200 Newsletters",
  "Every Good Essay Has a Turn",
  "The Specific Detail Is Always Better",
  "How I Structure Every Long-Form Piece I Write",
  "On Editing Your Own Work Without Losing Your Mind",
  "The Case for Writing by Hand",
  "Why I Stopped Outlining Before Writing",
  "Writing Under Constraint Produces Better Work",
  "The Difference Between a Draft and a Post",
  "Personal Essays Are a Form of Philosophy",
  "On the Ethics of Writing About Real People",
  "How Reading Poetry Made Me a Better Prose Writer",
  "The Ruthless Art of the Delete Key",
  "Substack, Ghost, or Roll Your Own",
  "Why Medium Burned Out an Entire Generation of Writers",
  "On Growing an Audience Without Compromising Your Voice",
  "The Newsletter Business Model Nobody Tells You About",
  "Writing for the Web Is Different and That Is Fine",
  "My Process for Publishing Three Times a Week",
  "On Not Having an Opinion About Everything",
  "The Danger of Writing for Approval",
  "How Constraints Unlock Creativity",
  "The Lost Art of the Long Essay",
  "Twelve Things I Learned Editing Other Peoples Writing",

  // ── Life, Mindset & Philosophy ────────────────────────────
  "A Garden Is a Kind of Diary",
  "The Economics of Small Things",
  "Climbing Taught Me to Rest",
  "A Short Defense of Long Walks",
  "Compounding Curiosity",
  "Stoic Mindset for Engineers",
  "On Quitting Things",
  "The Afternoon I Decided to Stop Being Busy",
  "What Running Taught Me About Software",
  "On Not Knowing What You Want",
  "The Value of Doing Nothing",
  "Slow Mornings as a Competitive Advantage",
  "Why I Deleted All My Productivity Apps",
  "Digital Minimalism: Six Months Later",
  "What Stoicism Actually Looks Like on a Bad Day",
  "The Philosophy of Enough",
  "On Saying No More Often",
  "The Unexpected Benefits of Boredom",
  "What I Learned from a Month Without Social Media",
  "The Long Game Is the Only Game",
  "On Not Being Interesting Online",
  "The Five-Year Horizon Exercise",
  "What My Grandmother Knew About Time",
  "Being a Generalist in a World of Specialists",
  "On the Freedom of Not Having a Brand",
  "The Paradox of Choice in Creative Work",
  "How I Stopped Optimizing My Life",
  "On Friendship in the Age of LinkedIn",
  "Attention Is the Scarcest Resource",
  "What Martial Arts Taught Me About Failure",
  "The Examined Life Is Not Always Comfortable",
  "On Mortality and the Work That Remains",
  "Boredom Is a Skill",
  "The Discipline of Returning",
  "On Having a Practice vs. Having a Hobby",
  "What a Sabbatical Actually Does to Your Mind",
  "In Defense of Routine",
  "The Things I Carry Every Day",
  "On Keeping Promises to Yourself",
  "How I Finally Stopped Procrastinating",

  // ── Design & UX ───────────────────────────────────────────
  "Design for the Tired User",
  "Designing Accessible Web Forms",
  "The Underrated Power of Whitespace",
  "Color Theory Nobody Taught Me",
  "The Typeface Decision That Changed Everything",
  "Motion Design Is Storytelling",
  "When Design Systems Fail",
  "Designing for Dyslexia",
  "The Hidden Complexity of a Simple Button",
  "Typography Is Not Decoration",
  "Dark Mode Is Not Just Aesthetics",
  "Designing Error States Nobody Sees Until They Matter",
  "What Makes a Great Onboarding Experience",
  "The Empty State Is a Design Opportunity",
  "Why I Stopped Using Drop Shadows",
  "Loading States Should Tell a Story",
  "The Most Overlooked Element in Every Design Review",
  "On Designing for Slow Connections",
  "Micro-Interactions That Actually Matter",
  "What Eye Tracking Taught Us About Our Navigation",
  "The Design Review Nobody Wants to Have",
  "On the Emotional Design of Destructive Actions",
  "Cognitive Load Is Not Your Users Problem to Solve",
  "The Cursor Is a Promise",
  "Contrast Ratios: The Spec That Saves People",
  "Why I Start Every Design Project with Research",
  "The Invisible Design Decisions in Great Products",
  "On Designing for People Who Are Not Like You",
  "What Designing in Public Taught Me About Feedback",
  "The Figma File Is Not the Source of Truth",

  // ── Career, Teams & Culture ───────────────────────────────
  "The Slow Death of the Blogosphere",
  "On Newsletters and the Future of Writing",
  "Why Twitter Made Us Worse Writers",
  "The Return of the Personal Website",
  "Monetizing Attention Is Not a Business Model",
  "On Being a Beginner Again",
  "The Loneliness of Remote Work",
  "Hot Take: Pair Programming Is Overrated",
  "In Defense of Long Emails",
  "The Weekly Review That Changed My Life",
  "How to Give Feedback That People Actually Use",
  "The 1-on-1 Meeting Framework That Works",
  "On Hiring Engineers Who Write Well",
  "What I Got Wrong About Staff Engineering",
  "The Engineering Manager Who Would Not Code",
  "Technical Leadership Without Ego",
  "On the Art of the Good Meeting",
  "Postmortem Culture Done Right",
  "How We Killed the Sprint and Became More Productive",
  "The Developer Experience Nobody Is Measuring",
  "Why Psychological Safety Is Not a Soft Concept",
  "On Disagreeing with Your Manager Productively",
  "The One Thing I Wish Someone Had Told Me as a Junior",
  "What Burnout Actually Feels Like from the Inside",
  "On Taking a Step Down in Seniority",
  "The Career Advice I Give to Everyone Who Asks",
  "On Being Underestimated",
  "Salary Negotiation Is a Skill You Can Learn",
  "What I Learned Switching from Big Tech to a Startup",
  "Why I Left a Six-Figure Job to Write on the Internet",
  "On Asking for Help Without Shame",
  "The Feedback Sandwich Does Not Work",
  "Mentorship Is Not What You Think It Is",
  "Growing While Remote: What I Did and What Worked",
  "On Staying Technical as a Manager",
  "The Hidden Cost of Heroism in Engineering Teams",
  "On Building Trust in a Distributed Team",
  "Performance Reviews Are Broken. Here Is What Works.",
  "What I Would Tell My Younger Engineering Self",
  "The Art of Sponsoring Someone's Career",

  // ── Startups & Product ────────────────────────────────────
  "Why Your MVP Is Too Big",
  "The Startup Postmortem Nobody Published",
  "What We Shipped in Year One and What We Killed",
  "Product-Market Fit Is a Feeling",
  "Why We Stopped Doing Weekly Demos",
  "The Feature We Built That Nobody Used",
  "On Raising Money Without Losing Your Soul",
  "What I Learned from 200 User Interviews",
  "Why We Fired Our Best Customer",
  "The Meeting That Saved the Company",
  "On Building Slow in a Fast-Moving Market",
  "The Day We Almost Deleted Everything",
  "What Nobody Tells You About Launching on Product Hunt",
  "We Made It to 1000 Users. Here Is What Happened Next.",
  "On Saying No to Investor Advice",
  "The Product Decision I Still Regret",
  "Why Retention Is the Only Metric That Matters",
  "Churn Is a Symptom Not a Problem",
  "How We Doubled Revenue Without Adding Features",
  "The Cheapest Way to Do Customer Discovery",

  // ── Mental Health, Focus & Wellbeing ─────────────────────
  "On Anxiety and the Engineering Mindset",
  "What Therapy Taught Me About Root Cause Analysis",
  "Burnout Is Not a Productivity Problem",
  "How I Stopped Being Angry About Code Reviews",
  "The Imposter Syndrome Trap",
  "On Working Through Grief While Remote",
  "Setting Boundaries with Notifications",
  "Why I Journal Every Morning Before I Open My Laptop",
  "On Mental Load and the Problem with Asynchronous Everything",
  "The Invisible Toll of Context Switching",
  "What a Digital Detox Actually Taught Me",
  "Sleep Is the Best Performance Optimization",
  "On Not Taking Criticism Personally",
  "How I Manage Decision Fatigue as an Engineering Lead",
  "The Emotional Weight of Shipping",

  // ── Open Source & Community ───────────────────────────────
  "Why I Contribute to Open Source for Free",
  "Maintaining an Open Source Project Is Emotional Labour",
  "On Getting Your First Pull Request Merged",
  "The Open Source License Nobody Reads Until It Matters",
  "Building in Public: The Honest Account",
  "How We Grew Our Discord to 5000 Members",
  "On Burnout in Open Source Maintainership",
  "The Contributor Who Changed Everything",
  "Documentation Is a Form of Respect",
  "On the Ethics of Forking Someone Else's Work",
  "What I Wish I Knew Before Starting an Open Source Project",
  "The GitHub Issue That Turned into a Friendship",
  "On Free Software and Its Discontents",
  "How to Write a CONTRIBUTING.md That People Actually Read",
  "The Pull Request Review That Taught Me the Most",

  // ── Edge-case titles for slug/boundary testing ────────────
  "The Art of Finishing Revisited",
  "The Art of Finishing: Part II",
  "Notes on Slow Software: A Follow-Up",
  "Why Your API Will Break and How to Design for It",
  "Implementing Distributed Locks Without Losing Your Mind",
  "The Comprehensive Guide to Building a Reliable Event Bus",
];

// ── 80+ Subtitles ─────────────────────────────────────────
const SUBTITLES = [
  "On shipping small and shipping often",
  "Why the fastest teams move deliberately",
  "The narrative hidden inside every stack trace",
  "How small decisions shape big behaviors",
  "Choose tools you can sleep through",
  "Words are UI too",
  "A practical guide to avoiding premature abstractions",
  "Notes on building accessible components at scale",
  "An exploration of performance bottlenecks in event-driven pipelines",
  "The compound effect of resolving one minor lint warning every day",
  "Finding stability in ephemeral infrastructure",
  "Why clean code is a long-term investment not a sprint",
  "What tending plants taught me about design",
  "Coffee, compounding, and attention",
  "Progress lives in the recovery",
  "Depth over volume",
  "Thinking with your feet",
  "Small questions asked daily",
  "Finding serenity in production outages",
  "Keyboard accessibility and screen readers",
  "The only style guide that ever helped me",
  "Lessons from three years of daily writing",
  "What nobody tells you at the beginning",
  "A field report from eighteen months of trying",
  "The honest version of this conversation",
  "How I finally stopped overthinking it",
  "Six months in and I have some thoughts",
  "The part everyone glosses over",
  "What changed when I stopped optimizing",
  "Notes from the ground floor",
  "A case study in doing less",
  "When theory meets production on a Friday afternoon",
  "The thing I keep coming back to",
  "An argument for slower, better thinking",
  "What this looks like in practice",
  "Unlearning what school taught me about this",
  "I was wrong and here is how I know",
  "The uncomfortable truth about modern engineering culture",
  "Why the simple answer keeps winning",
  "A love letter to boring choices",
  "Building with intention instead of momentum",
  "The cost nobody puts in the budget",
  "What your future self will thank you for",
  "On finishing what you start",
  "The system I use and why it works",
  "Rethinking everything I thought I knew",
  "An honest autopsy",
  "What measuring it revealed",
  "The conversation teams avoid having",
  "Why I finally wrote this down",
  "Examining the assumption everyone shares",
  "From the weeds of a six-month migration",
  "How we got it wrong and then right",
  "The pattern I keep seeing across codebases",
  "Three years and one crucial lesson",
  "What surprised me after the launch",
  "The missing chapter nobody writes",
  "On the discipline of letting go",
  "Making peace with good enough",
  "What ten thousand lines of logs revealed",
  "The principle that changed how I work",
  "An essay on patience in engineering",
  "When elegance is the enemy of clarity",
  "The debugging session that became a philosophy",
  "On the quiet satisfaction of maintenance work",
  "How to read code you did not write",
  "The refactor that became a rewrite",
  "Why I now start with the error message",
  "What the junior engineer saw that I missed",
  "On pair programming with your past self",
  "The tradeoff nobody explains upfront",
  "Shipping imperfect work on purpose",
  "What sleep deprivation does to architecture decisions",
  "Twelve weeks of daily commits and what I learned",
  "The incident postmortem I wish I had written earlier",
  "On the courage required to simplify",
  "",
  "",
  "",
];

// ── 100+ Comment variants with diverse tone & length ────────
const COMMENT_POOL = [
  // Positive, substantive
  "This resonated deeply. Thank you for putting it into words so clearly.",
  "Saving this to read again. There is a lot to unpack here.",
  "The part about defaults really stuck with me. I have been thinking about it all morning.",
  "Needed this today. Sending to my entire team right now.",
  "Beautifully written. That blockquote is going on my wall.",
  "One of the best things I have read this year. And I read a lot.",
  "This changed how I think about the problem. Genuinely.",
  "I paused what I was doing to read this twice. That is rare for me.",
  "Shared this with my CTO who immediately forwarded it to the whole org.",
  "This is the essay I have been trying to write for six months. You nailed it.",
  "Three years in the industry and posts like this still teach me something new.",
  "The analogy you used in the middle section is going to stick with me.",
  "Exactly what I needed at 11pm while debugging this mess.",
  "Filed under: things I should have known at 22.",
  "Short and sharp. Exactly right.",
  "The clarity of this is remarkable given how complex the topic is.",
  "Bookmarked, shared, and will probably reread quarterly.",
  "You articulated something I have felt but never been able to express.",
  "This is why I subscribe. More like this please.",
  "Writing like this makes me want to write more. Thank you.",

  // Substantive agreement with addition
  "Agree completely. I would add that the tooling around this has gotten dramatically better in the last two years.",
  "Yes to all of this. One thing worth mentioning: the team culture piece is often the blocker, not the technology.",
  "Spot on. The part about testing in production is particularly underrated. Our team was afraid of it until we tried.",
  "Everything here tracks with my experience. The one thing I would emphasize even more is documentation.",
  "Great post. One thing I would add: observability matters as much as the architecture itself.",
  "The recovery phase is where the compounding interest actually happens. Agree 100 percent.",
  "We tried this exact approach last quarter and saw a 40 percent reduction in deployment failures.",
  "This mirrors what we found when we rebuilt our pipeline. The subtle part is in the ordering.",
  "Could not agree more about simplicity. The hard part is convincing stakeholders it is not laziness.",
  "We made exactly this mistake. The hidden cost showed up nine months later and it was brutal.",

  // Disagreement / counterpoint (constructive)
  "I disagree slightly. In fast-paced environments speed of validation sometimes matters more than correctness.",
  "Respectfully, I think this undersells the complexity. In regulated industries you do not always have the luxury of simplicity.",
  "I see where you are coming from but my experience has been the opposite. Context matters enormously here.",
  "This is mostly right but I would push back on the testing section. The nuance matters a lot.",
  "Counterpoint: complexity is sometimes unavoidable. But your core argument about defaults still stands.",
  "Hot take but I think this view is a little too idealistic for most engineering orgs in the real world.",
  "I have read three other essays making exactly this argument and I am still not convinced. Could you address the failure mode where this breaks?",
  "The premise is solid but the conclusion does not quite follow. What about the long-tail cases?",
  "Worth noting that this advice works in certain team sizes. At our scale the calculus changes.",
  "Strong disagree on the meeting point. Some problems really do need synchronous collaboration.",

  // Questions
  "Brilliant overview. How do you apply this to multi-functional teams where ownership is blurry?",
  "How does this compare to using a message queue or event streams instead?",
  "Is there a GitHub repository where we can see a full implementation of this pattern?",
  "Could you elaborate on the security implications of this abstraction layer?",
  "How do you handle the rollback scenario when things go wrong mid-migration?",
  "What does the monitoring setup look like for this? That part is usually glossed over.",
  "Have you tried this with Postgres as the backing store? Curious about the performance characteristics.",
  "How do you decide when this is overkill versus when it is necessary?",
  "What would you do differently if you were starting fresh today with current tooling?",
  "Did you consider the operational burden on the on-call team? That is usually where these decisions bite.",
  "What is your take on using this pattern with serverless functions? The statefulness seems like an issue.",
  "How long did it take your team to get comfortable with this approach?",
  "Great writeup. Any resources you would recommend for going deeper on the distributed systems side?",
  "This makes sense for greenfield projects. How do you apply it incrementally to existing systems?",

  // Personal story / anecdote
  "We had almost the exact same incident three years ago. Took us two weeks to find the root cause. This would have saved us days.",
  "I have been on three teams that tried this and it has worked differently each time depending on how the leadership responded.",
  "My senior engineer said something almost identical in a design review last week. Glad to see it articulated here.",
  "Reminds me of a failure mode we hit in 2022 that cost us a week of engineering time to untangle.",
  "I tried the approach described in the third section and it genuinely transformed how our team ships.",
  "We are currently in the middle of this exact situation. Going to share this with the team as reading material before our retrospective.",
  "This mirrors advice I got from a mentor early in my career and it has held up across four different companies.",
  "I left my last job in part because we could not have this conversation. The culture made it impossible.",
  "Spent six months at a company that did the opposite of everything here. It went exactly as badly as you would expect.",
  "Your description of the incident postmortem section is almost verbatim what happened to us in March. Eerie.",

  // Short, casual reactions
  "This is the post.",
  "Wow. Just wow.",
  "Needed to read this today of all days.",
  "Sent this to my whole team.",
  "I have been saying this for years.",
  "The title alone is worth the click.",
  "Absolutely pinning this.",
  "Why is nobody talking about this more.",
  "This is so good.",
  "Finally someone said it.",
  "Chef's kiss.",
  "Genuinely could not have put it better.",
  "Subscribed after reading this.",
  "First post of yours I have read. Not the last.",
  "This one hit differently.",

  // Emoji-heavy casual (realistic for web audiences)
  "🔥 This is exactly the content I come here for.",
  "So much yes to all of this 👏",
  "The bit about the pull request process 😩 been there.",
  "Section 3 is the entire career arc of every frontend developer 😂",
  "Late night debugging session + this post = saved my week 🙏",
  "The tooling section aged really well 💯",
  "Bookmarked ⭐ will revisit before every code review.",
  "Cannot believe nobody has written this before 😤",
  "You just described my last three sprints 😅",
  "The last paragraph 🤌 perfect ending.",

  // Technical specifics
  "We implemented exactly this pattern with Kafka and the latency characteristics are excellent. Happy to share numbers.",
  "Worth noting that this breaks down when you introduce CDC from the database. There is a workaround but it complicates things.",
  "The index strategy described here is correct but the execution plan can still be bad depending on your data distribution.",
  "We ran this in production for six months. The p99 latency improved significantly but the operational complexity went up.",
  "The thing that surprised us most was the memory footprint. Make sure you profile before committing to this approach.",
  "One subtle issue: this pattern assumes idempotency at the consumer. If that is not guaranteed you will get duplicates.",
  "The retry logic described here is solid but you should also add jitter to avoid the thundering herd problem.",
  "This is essentially the outbox pattern from DDD. Worth reading about the broader context if you are going this route.",
  "Works well until your team size crosses about 15 engineers and Conway's Law starts making the architecture messy.",
  "Our tests for this scenario took three sprints to get right. The happy path is easy. The sad path will surprise you.",

  // Long-form thoughtful engagement
  "I want to push back gently on one part of this. The framing assumes that teams have the autonomy to make these decisions unilaterally. In many organizations the actual constraint is political not technical. The dependency graph is a reflection of team boundaries and changing it requires a different kind of work.",
  "This is excellent but I think there is a missing piece around feedback loops. The reason most teams do not do this is not that they do not know better. It is that the feedback on bad decisions comes too slowly. By the time you feel the pain of the wrong abstraction the team that made it has already moved on.",
  "The argument in the second half is solid but I would frame it differently. The real insight is about reversibility. The decisions that hurt are the ones that are expensive to undo. Everything else is just optimization.",
  "I spent two years building something similar at a previous company. What this post captures really well is the asymmetry between the cost of the correct decision and the cost of the wrong one. The wrong one compounds silently.",
  "One thing worth adding to the monitoring section: the difference between operational metrics and business metrics is not just semantic. When your on-call is paged for a symptom that is two levels removed from the root cause, the response time goes up by 10x. Alert on causes not effects.",
];

const SPAM_COMMENTS = [
  "Make 5000 per day from home click my link NOW",
  "Check out my crypto course limited spots DM for details",
  "This is fake news the author is lying wake up sheeple",
  "Nobody reads this subscribe to my newsletter instead lol",
  "FIRST! also follow me for more amazing life tips",
  "I make 12k monthly working from home ask me how",
  "Your article is wrong visit my blog for the real truth",
  "Great post! Come check my OF for exclusive content 🔥",
  "Anyone want to earn passive income DM me seriously",
  "This whole blog is a data collection scam be careful",
  "Buy my ebook 99 dollars but use code FREE for 80 off",
  "Unsubscribed. This platform is dying. Join us on Radix.",
];

// ── 20 Article body templates (real distinct prose topics) ──
//    Each is an array of [intro, section1_title, section1_body,
//    section2_title, section2_body, section3_title, section3_body,
//    quote, code_block, closing]
const ARTICLE_TEMPLATES = [
  {
    topic: "software_architecture",
    intro: "Software architecture is not about drawing boxes on whiteboards. It is about making decisions under uncertainty and living with the consequences long after the meeting is over.",
    sections: [
      {
        heading: "The Decision That Cannot Be Undone",
        body: "Every codebase carries the archaeology of its past decisions. A table schema chosen in year one shapes the queries written in year five. An early choice to build synchronous request-response into the core of a system makes it genuinely hard to add streaming later. The most important architectural decisions are not the clever ones — they are the foundational ones, because those are the hardest to change.\n\nThe good news is that reversibility is itself a design property. When you are facing an uncertain decision, ask: if this is wrong, how expensive is it to fix? Some decisions lock you in. Others are easy to walk back. Prefer the ones that keep your options open, especially early.",
      },
      {
        heading: "Conway's Law Is Not a Metaphor",
        body: "Melvin Conway observed in 1968 that organizations produce systems that mirror their communication structures. This is not a soft observation. It is a hard constraint. If you have three teams working on three services, those services will develop three different opinions about what an error response looks like, and your clients will pay the price.\n\nThe implication is uncomfortable: you cannot fix your architecture without also thinking about your team structure. The dependency graph in your code is a reflection of the dependency graph between people. Untangling one without addressing the other is temporary at best.",
      },
      {
        heading: "On the Value of Boring Technology",
        body: "The technology choices that age best are the ones that were boring at the time of adoption. PostgreSQL, Redis, and plain HTTP have solved more problems in production than any distributed systems framework released in the last decade. The reason boring technology works is that it has been stressed, debugged, and documented by millions of engineers across thousands of failure modes. You inherit that knowledge when you adopt it.\n\nNew technology has its place — when the boring option genuinely cannot solve the problem. But that bar should be high. Every novel dependency is a bet that its authors have thought of the failure modes you will encounter in two years.",
      },
    ],
    quote: { text: "Simplicity is a prerequisite for reliability.", author: "Edsger W. Dijkstra" },
    codeBlock: `<pre><code class="language-javascript">// Prefer explicit over clever
function getUser(id) {
  if (!id) throw new Error("getUser requires a non-null id");
  return db.users.findOne({ _id: id });
}

// Not:
const getUser = id => id && db.users.findOne({ _id: id });</code></pre>`,
    closing: "The goal of architecture is not to be impressive. It is to be maintainable by the team you have, with the understanding they have, under the pressures of the product roadmap you did not plan for. Boring is underrated.",
  },

  {
    topic: "debugging",
    intro: "Every debugging session is a mystery novel. You have a symptom, a suspect list, and a deadline. The engineers who debug fastest are not the ones who know the most — they are the ones who ask the best questions.",
    sections: [
      {
        heading: "The First Question Is Always: What Changed?",
        body: "Almost every bug is a regression. Something worked, and then it did not. The fastest path to the root cause is almost always to answer: what was different before this broke? A deployment, a configuration change, a growing dataset, a new API client. Production systems rarely spontaneously develop new failure modes — they express failure modes that were always latent, triggered by a change in conditions.\n\nThis sounds obvious until you are three hours into reading source code that has not changed in six months, looking for a bug introduced by a dependency that updated last Tuesday.",
      },
      {
        heading: "Logging Is Not Observability",
        body: "A log file is a record of what you thought was interesting when you wrote the code. Observability is the ability to ask questions you did not think of beforehand and get answers from the running system. These are profoundly different.\n\nThe teams that recover from incidents fastest are not the ones with the most logs — they are the ones whose systems expose their internal state through structured, queryable telemetry. When something goes wrong at 3am, the question you ask is never exactly the question you anticipated. You need to be able to ask new questions of historical data.",
      },
      {
        heading: "The Art of the Minimal Reproduction Case",
        body: "The single most useful skill in debugging is the ability to construct a minimal reproduction. Strip the problem down to its essential form. Remove every variable you can. If you cannot reproduce the bug in isolation, you do not yet understand it.\n\nThis practice serves two purposes. First, it forces you to understand the conditions that trigger the failure. Second, it produces a test case that prevents regression. The engineers who regularly produce minimal reproductions spend less time in debugging sessions overall — not because they debug faster, but because they write code that breaks in more obvious ways.",
      },
    ],
    quote: { text: "If debugging is the process of removing bugs, then programming must be the process of putting them in.", author: "Edsger W. Dijkstra" },
    codeBlock: `<pre><code class="language-javascript">// Add context to your error messages
async function processPayment(orderId, amount) {
  try {
    return await stripe.charges.create({ amount, currency: "usd" });
  } catch (err) {
    throw new Error(\`Payment failed for order \${orderId}: \${err.message}\`);
  }
}</code></pre>`,
    closing: "Debugging is not a sign that something went wrong with your process. It is the process. The engineers who romanticize writing code over reading it spend twice as long in the debugger.",
  },

  {
    topic: "writing_craft",
    intro: "Writing is thinking made visible. The struggle to put something clearly on the page is inseparable from the struggle to understand it clearly in your head. Most writing problems are actually thinking problems wearing a costume.",
    sections: [
      {
        heading: "The First Draft Is an Excavation",
        body: "The first draft exists to discover what you actually think. Not to express it — to discover it. This distinction matters enormously. If you sit down to a first draft expecting to express a fully formed idea, you will find yourself stuck, rearranging words that should not yet exist.\n\nThe better posture is to treat the first draft as an exploration. Write toward the idea. Ask questions on the page. Follow the unexpected turns. You will throw most of it away. That is not waste — that is the necessary cost of finding what is actually worth keeping.",
      },
      {
        heading: "Specificity Is the Engine of Trust",
        body: "Vague writing signals vague thinking. When a writer says 'many engineers struggle with this problem,' the reader's guard goes up. When a writer says 'in 2023, three of our five on-call engineers reported spending more than four hours per week on false-positive alerts,' the reader leans in.\n\nThe specific detail does three things at once: it demonstrates that the writer has actually been in the situation they are describing, it gives the reader something concrete to evaluate, and it creates texture that makes the piece memorable. Generic observations evaporate. Specifics stick.",
      },
      {
        heading: "The Paragraph Is the Unit of Thought",
        body: "A well-structured essay is not a collection of sentences. It is a collection of paragraphs, each of which contains exactly one thought and moves the argument forward. You can diagnose most editing problems by testing each paragraph against a single question: what is the one thing this paragraph says?\n\nIf the answer requires more than one sentence to state, the paragraph is doing too much. If you cannot answer the question at all, the paragraph does not know what it is doing there. The fix is almost always to either split or delete — rarely to add.",
      },
    ],
    quote: { text: "The most valuable of all talents is that of never using two words when one will do.", author: "Thomas Jefferson" },
    codeBlock: `<pre><code class="language-markdown"># Before editing
The system is designed in such a way as to facilitate the handling
of requests in an asynchronous manner, which allows for better
scalability in high-load scenarios.

# After editing
The system handles requests asynchronously, which makes it scale
under load.</code></pre>`,
    closing: "The willingness to edit ruthlessly is what separates writing from drafting. Most people are afraid to delete what they worked hard to produce. The best writers have learned that the work is in the cutting, not the adding.",
  },

  {
    topic: "performance",
    intro: "Performance work is one of the most humbling disciplines in engineering. The system that seemed fast in development, under load, with real data, on actual hardware — the one that matters — behaves completely differently. Every assumption you made is now a hypothesis to be tested.",
    sections: [
      {
        heading: "Measure Before You Optimize",
        body: "The cardinal sin of performance engineering is optimizing the wrong thing. The thing that feels slow is rarely the actual bottleneck. Human intuition about performance is systematically miscalibrated — we tend to overestimate the cost of things we can see in the code and underestimate the cost of things that happen at the infrastructure layer.\n\nThe practice is simple in principle and hard in execution: measure first, then decide what to fix. A profiler attached to a production-representative load test will show you the actual bottleneck. It is almost never where you guessed.",
      },
      {
        heading: "The Database Is Usually the Bottleneck",
        body: "In most web applications, the bottleneck is the database. Not because database software is slow — modern databases are extraordinarily capable — but because the query patterns that emerge from application code are rarely designed with the query planner in mind.\n\nThe most common culprits are: missing indexes on frequently-filtered columns, N+1 query patterns hidden inside ORM convenience methods, queries that return more data than necessary, and transactions that hold locks for longer than required. Each of these is fixable once you can see it. The seeing is the hard part.",
      },
      {
        heading: "Performance Budgets Create Alignment",
        body: "A performance budget is a number your team agrees to defend. Not a target — a constraint. If the page must load in under two seconds on a 4G connection for the median user, that is a budget. Every feature request, every third-party script, every additional API call gets evaluated against it.\n\nThe value of a performance budget is not technical — it is organizational. It makes performance someone's job, which means it gets prioritized. Without an explicit budget, performance is everyone's vague concern and nobody's actual responsibility.",
      },
    ],
    quote: { text: "Premature optimization is the root of all evil — but that doesn't mean you should ignore performance until it's a crisis.", author: "Donald Knuth (paraphrased)" },
    codeBlock: `<pre><code class="language-javascript">// Use projection to return only what you need
const users = await User.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 }  // only fetch needed fields
).lean();  // skip mongoose document hydration</code></pre>`,
    closing: "Fast is a feature. Slow is a bug. The teams that treat performance as a first-class quality attribute — measured continuously, budgeted explicitly, reviewed regularly — ship products that people actually enjoy using.",
  },

  {
    topic: "leadership",
    intro: "The transition from individual contributor to engineering lead is one of the most disorienting experiences in a technical career. The skills that made you successful — deep focus, technical judgment, the ability to hold a complex system in your head — are suddenly less central to your job. New skills, ones you never had to develop before, now determine your effectiveness.",
    sections: [
      {
        heading: "Your Output Is No Longer Your Code",
        body: "The hardest thing for new engineering managers to internalize is that their job is to multiply the output of others, not to produce output themselves. This sounds abstract until you catch yourself taking an interesting ticket because you miss the hands-on work, or staying up until midnight to fix a bug that a team member could have fixed tomorrow morning.\n\nThe cost of that kind of heroism is not just your own time. It is the missed opportunity to develop the team member who could have fixed the bug. It is the signal you send that problems are solved by the leader, not the team. It compounds negatively.",
      },
      {
        heading: "The One-on-One Is Your Primary Product",
        body: "If you manage a team and your one-on-ones are agenda-free catch-ups, you are leaving most of the value on the table. The one-on-one is the highest-leverage conversation available to a manager. It is where you learn about team health before it becomes a crisis, where you understand what is blocking someone's growth, and where trust is built over time.\n\nThe best one-on-ones are run by the team member, not the manager. Their agenda, their concerns. The manager's job is to listen, ask questions, and remove obstacles. That is the whole meeting.",
      },
      {
        heading: "Technical Credibility Without Technical Involvement",
        body: "The most common mistake senior engineering managers make is drifting so far from technical work that they lose the credibility to push back on technical decisions. The team senses it before any explicit conversation happens. Estimates inflate. Complexity gets added without justification. Architectural decisions get made by default rather than by deliberate choice.\n\nYou do not need to be in the code to maintain technical credibility. But you do need to be in the design reviews, the postmortems, and the technical conversations where the real decisions are made. Presence and curiosity — not coding hours — are what matter.",
      },
    ],
    quote: { text: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker" },
    codeBlock: `<pre><code class="language-markdown"># One-on-one template (team member runs this)

## What's on my mind
- [things I want to discuss]

## Progress since last week
- [what moved, what didn't]

## Blockers I need help with
- [specific asks]

## How I'm feeling about the work
- [honest reflection]</code></pre>`,
    closing: "Engineering leadership is a craft. It requires as much deliberate practice as writing code — probably more, because the feedback loops are longer and the mistakes are harder to see in the moment.",
  },

  {
    topic: "accessibility",
    intro: "Accessibility is not a feature you add to a finished product. It is a quality attribute of how you build, in the same way that security or performance are qualities — not afterthoughts. The product that is hard to use for someone with low vision is usually also confusing for someone in a hurry with one hand occupied.",
    sections: [
      {
        heading: "The Business Case Nobody Needs",
        body: "The conversation about accessibility usually starts with the business case. How many users does this affect? What is the legal risk? What is the ROI? These are reasonable questions and there are good answers to all of them. But they miss the point.\n\nThe point is that you are designing for people. Some of those people have permanent disabilities. Some have temporary ones — a broken arm, an eye infection, a migraine. Some are in situational constraints — bright sunlight, a bumpy train, a baby in one arm. Designing for the edge case makes the whole system better. That is not a trade-off. That is the work.",
      },
      {
        heading: "What Screen Reader Users Actually Experience",
        body: "If you have never used a screen reader for more than five minutes, you do not understand what your application is like for a significant portion of your users. The experience is radically different. Tab order, heading structure, ARIA labels, focus management, skip links — these are not academic concerns. They are the difference between a product someone can use and one they cannot.\n\nThe single most effective thing a frontend team can do is spend two hours navigating their product with VoiceOver or NVDA, with the screen off, trying to complete the core user flows. The bugs you find in that session are almost impossible to find any other way.",
      },
      {
        heading: "Semantic HTML Is Not Optional",
        body: "A `<div>` that looks like a button is not a button. It does not receive keyboard focus by default. It does not communicate its role to assistive technologies. It does not respond to the Enter key. You can add all of those behaviors back with JavaScript and ARIA, but you are now implementing what the browser already does for free if you use a `<button>` element.\n\nThe same principle applies to headings, lists, form labels, and landmark regions. These elements exist because they carry meaning that matters to users who cannot rely on visual layout alone. Using them correctly costs nothing and gains everything.",
      },
    ],
    quote: { text: "The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect.", author: "Tim Berners-Lee" },
    codeBlock: `<pre><code class="language-html">&lt;!-- Wrong --&gt;
&lt;div class="btn" onclick="submit()"&gt;Submit&lt;/div&gt;

&lt;!-- Right --&gt;
&lt;button type="submit" aria-label="Submit payment form"&gt;
  Submit
&lt;/button&gt;

&lt;!-- Form labels: always explicit --&gt;
&lt;label for="email"&gt;Email address&lt;/label&gt;
&lt;input id="email" type="email" autocomplete="email" /&gt;</code></pre>`,
    closing: "Accessibility debt accumulates the same way technical debt does — slowly, invisibly, and then catastrophically when someone actually needs the thing to work. Build it right from the beginning.",
  },

  {
    topic: "remote_work",
    intro: "Remote work did not fail. The way most organizations implemented remote work failed. There is a crucial difference. The teams that thrive distributed are not the ones that recreated the office on a video call — they are the ones that rebuilt their communication from first principles around the constraints and affordances of asynchronous, text-first collaboration.",
    sections: [
      {
        heading: "Asynchronous Communication Is a Skill",
        body: "Most knowledge workers were never trained to communicate asynchronously. The default mode — the meeting, the hallway conversation, the quick Slack message that spawns a fifteen-message thread — are all synchronous by nature. They require both parties to be available at the same moment and they leave no durable record.\n\nAsync communication requires a different discipline. Write more. Be explicit about context. State your conclusion first, then your reasoning. Anticipate the follow-up question and answer it preemptively. This takes more time upfront and saves dramatically more time for everyone downstream.",
      },
      {
        heading: "The Meeting That Should Have Been a Document",
        body: "There is a specific type of meeting that is genuinely damaging to distributed teams: the status meeting. Ten people sit on a call for an hour to share information that could have been written down in twenty minutes and read asynchronously in five. The cost is not just the meeting time. It is the synchronization tax — the requirement that everyone be available at the same moment.\n\nThe teams that reduce unnecessary synchronous meetings do not become less coordinated. They become more coordinated, because the information is now written down, searchable, and available to people who were not in the room.",
      },
      {
        heading: "Documentation as Infrastructure",
        body: "In a collocated office, a huge amount of organizational knowledge lives in people's heads and travels through informal conversation. The new hire learns how things work by sitting next to someone. The decision that was made six months ago is remembered by whoever was in the room.\n\nDistributed teams cannot operate this way. They need documentation as infrastructure — not the kind you write and forget, but the kind you actively maintain as the authoritative source of truth. Decision logs, architecture records, onboarding guides that are updated every quarter. This is not busywork. It is the foundational layer that makes everything else possible.",
      },
    ],
    quote: { text: "Remote work is not about where you are. It is about how well you communicate.", author: "Jason Fried" },
    codeBlock: `<pre><code class="language-markdown"># RFC: [Decision Title]
**Status:** Proposed | Accepted | Rejected | Superseded
**Date:** 2026-07-22
**Authors:** @username

## Context
What problem are we solving and why now?

## Decision
What we decided and what we explicitly did not choose.

## Consequences
What becomes easier. What becomes harder. What we are uncertain about.

## Alternatives considered
Other options and why we did not choose them.</code></pre>`,
    closing: "The distributed teams that thrive are not more disciplined than others — they are more intentional. They have decided, explicitly, what kind of communication culture they want, and they maintain it with the same care they give to their codebase.",
  },

  {
    topic: "databases",
    intro: "Databases are one of those technologies that engineers either love deeply or treat as a necessary evil. The engineers who love them tend to have survived a production incident that was entirely caused by misunderstanding something fundamental about how the database works. Pain is a remarkable teacher.",
    sections: [
      {
        heading: "Indexes Are a Conversation with the Query Planner",
        body: "An index is not magic. It is a data structure that makes certain queries faster by trading write performance and storage for read performance. The question is never 'should this column have an index?' The question is 'what queries does this system run frequently, and what access pattern would make those queries efficient?'\n\nThe ESR rule — Equality, Sort, Range — provides a useful heuristic for composite index design. Put equality predicates first, sort fields second, and range predicates last. Understanding why this ordering works requires understanding how B-tree indexes are traversed, which is worth the hour it takes to learn.",
      },
      {
        heading: "Transactions Are Not Free",
        body: "A transaction is a promise from the database: this set of operations will appear atomic, consistent, isolated, and durable. That promise is expensive to keep. Holding a transaction open blocks other transactions from acquiring locks on the same rows. Holding it open longer blocks them for longer.\n\nThe practical implication: transactions should be as short as possible. Do all the data reads outside the transaction if you can. Do not make network calls inside a transaction. Do not perform user-interaction inside a transaction. Get in, make your changes atomically, get out.",
      },
      {
        heading: "Schema Design Is Permanent Until It Isn't",
        body: "The decisions you make about your data model in the first six months of a product tend to last for years. The column name that made sense in the original context becomes a lie once the concept it represents evolves. The table that was supposed to hold one thing now holds three different things because adding a column was easier than having the conversation.\n\nThe practice that mitigates this is treating schema changes the same way you treat API changes: with a public interface contract, a deprecation path, and a migration plan. It is slower. It is also how you avoid the 3am data migration emergency.",
      },
    ],
    quote: { text: "It's disk I/O that kills you, not CPU. Index early, index often, and index the right things.", author: "Michael Stonebraker" },
    codeBlock: `<pre><code class="language-javascript">// Always use transactions for multi-step writes
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Order.create([{ userId, items, total }], { session });
  await Inventory.updateMany(
    { sku: { $in: skus } },
    { $inc: { stock: -1 } },
    { session }
  );
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}</code></pre>`,
    closing: "The engineers who understand their database deeply are the ones whose systems behave predictably under load, whose incidents are short, and whose migrations run without drama. That fluency is worth cultivating early.",
  },

  {
    topic: "open_source",
    intro: "Maintaining an open source project is an act of generosity that can quietly become an act of self-destruction if you are not deliberate about it. The project that started as a weekend experiment becomes a dependency for thousands of people, and those people have opinions, deadlines, and a sense of entitlement that is genuinely surprising until you have experienced it.",
    sections: [
      {
        heading: "The Cost Nobody Tells You About",
        body: "When you publish an open source project and it gains traction, you inherit a support burden. Issues appear. Pull requests arrive, some useful, some not. People email you directly. People tweet at you. Someone finds a security vulnerability and expects a patch in 24 hours.\n\nNone of this is unreasonable in isolation. In aggregate, it is a second job. The maintainers who burn out are usually the ones who did not see this coming — who treated the growing issue queue as a sign of success rather than a scaling problem that required a deliberate solution.",
      },
      {
        heading: "Documentation Is a Contribution You Can Ask For",
        body: "The most consistently underprovisioned part of any open source project is documentation. And yet it is the contribution that has the highest leverage — good documentation reduces the issue queue, makes contributors self-sufficient, and allows the maintainer to step back without the project degrading.\n\nThe framing that works: when someone asks a question in an issue, answer it there, then immediately open a documentation PR that would have answered the question before they needed to ask. Over time, this creates a project where most users can get what they need without any interaction with the maintainer.",
      },
      {
        heading: "Saying No Is a Maintenance Strategy",
        body: "Every feature you add to an open source project is a feature you will maintain forever. The users who depend on it will expect it to stay, expect it to work, and be vocal when it breaks. The surface area of the project grows and the complexity of the mental model required to contribute safely grows with it.\n\nThe maintainers who sustain projects long-term are usually the ones who say no more often than yes. A narrow, well-maintained project with clear scope is more valuable than a broad, fragile one that tries to do everything. The contributors will be frustrated in the short term. The project will survive in the long term.",
      },
    ],
    quote: { text: "Given enough eyeballs, all bugs are shallow.", author: "Linus Torvalds" },
    codeBlock: `<pre><code class="language-markdown"># CONTRIBUTING.md template

## Before opening an issue
- [ ] Searched existing issues
- [ ] Read the documentation
- [ ] Reproduced in the latest version

## Pull Request checklist
- [ ] Tests pass
- [ ] Docs updated if relevant
- [ ] Changelog entry added
- [ ] Single purpose (one change per PR)

## What we will not merge
We maintain a narrow scope intentionally.
Features outside the core use case belong in plugins.</code></pre>`,
    closing: "Open source is a gift economy with all the complexity that implies. The projects that last are the ones maintained by people who have made peace with the fact that most of the work is invisible, most of the gratitude is implicit, and the reward is mostly intrinsic.",
  },

  {
    topic: "stoicism_life",
    intro: "The Stoics were not cheerful optimists who told you everything would work out. They were practitioners of a discipline for staying functional under conditions that are genuinely bad — a far more useful philosophy than one that only works when things are going well.",
    sections: [
      {
        heading: "The Dichotomy of Control",
        body: "Epictetus, who was born a slave and spent a significant portion of his life in chains, made a distinction that seems obvious until you try to live it: some things are in our control, and some things are not. What is in our control: our judgments, our impulses, our desires, our responses. What is not: our bodies, our reputations, our property, what other people think of us.\n\nThe daily practice of Stoicism is essentially this: catch yourself spending energy on things that are not in your control, and redirect that energy toward things that are. It is simple to describe and extraordinarily difficult to do. The difficulty is the practice.",
      },
      {
        heading: "Memento Mori Is Not Morbid",
        body: "Remembering that you will die — the Stoic practice of memento mori — sounds grim until you understand its purpose. Marcus Aurelius wrote in his private journals: 'Confine yourself to the present.' The awareness of finitude makes the present moment weigh more. It is the cognitive equivalent of the deadline that makes you actually start the project.\n\nThe engineers who seem most calm under pressure are often the ones who have, consciously or not, internalized this. The system is down. The incident is bad. And also: this is a moment that will pass, and it will have been a moment in a career that ends, in a life that ends. The scale helps.",
      },
      {
        heading: "Amor Fati: Love What Happens",
        body: "Nietzsche borrowed from the Stoics the concept of amor fati — love of fate. Not mere acceptance of what happens, but active affirmation of it. The idea is not masochism. It is the recognition that resistance to what has already happened is always futile, and that the energy spent in that resistance is energy that could be spent responding constructively.\n\nIn practice: the outage is happening. The project is cancelled. The relationship is over. The first response — after acknowledging the reality and the genuine difficulty of it — is to ask what can be done from here, not what could have prevented arriving here.",
      },
    ],
    quote: { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    codeBlock: `<pre><code class="language-markdown"># Daily reflection (Stoic format)

## Morning
What do I want to accomplish today?
What obstacles might I face?
How will I respond if things go wrong?

## Evening
What went well?
What did I fail at today, and what can I learn?
What am I grateful for that I might have taken for granted?</code></pre>`,
    closing: "Stoicism is not a belief system. It is a set of practices for remaining effective when the world does not cooperate. You do not have to believe in anything to try it. You just have to do it every day.",
  },

  {
    topic: "security",
    intro: "Security is not a feature that you add to a finished product. It is a quality that emerges — or fails to emerge — from every decision you make during design, development, and deployment. The breach that makes the news is almost never the result of a sophisticated attack. It is usually the result of something embarrassingly preventable.",
    sections: [
      {
        heading: "The Human Is Always the Attack Surface",
        body: "The overwhelming majority of security incidents in production systems involve social engineering, phishing, or credential theft — not technical exploits against hardened infrastructure. This does not mean technical hardening is unimportant. It means that a perfectly secured system is worthless if the employee with administrative access can be convinced to hand over their credentials by a convincing email.\n\nThe implication for engineering teams: security training for humans matters as much as security hardening for systems. The multi-factor authentication requirement that everyone finds annoying is the control that will stop the breach. The security token that expires every eight hours is inconvenient right up until it saves the company.",
      },
      {
        heading: "Secrets Management Is Non-Negotiable",
        body: "It happens in every organization at least once: a developer pushes credentials to a public repository. An API key in a .env file committed by accident. A database password in a config file that ends up on GitHub. The attacker's crawler finds it within minutes. The cleanup takes days.\n\nThe solution is not 'be more careful.' The solution is to make the careful behavior the path of least resistance. Secrets management tools — HashiCorp Vault, AWS Secrets Manager, environment-scoped secret stores — remove the option to accidentally commit a credential. Pre-commit hooks that scan for secret patterns add a safety net. Neither is perfect. Together, they make the accident dramatically less likely.",
      },
      {
        heading: "Defense in Depth Means Assuming Every Layer Fails",
        body: "The principle of defense in depth comes from military strategy: no single defensive position should be the last line of defense. Applied to software systems, it means designing every layer assuming that the layers above it have been compromised.\n\nYour API should validate and sanitize input even if your frontend already does it. Your database should enforce referential integrity even if your application already checks it. Your network should restrict traffic even if your service already authenticates it. This redundancy is not inefficiency. It is the architecture of systems that survive contact with reality.",
      },
    ],
    quote: { text: "Security is not a product, but a process.", author: "Bruce Schneier" },
    codeBlock: `<pre><code class="language-javascript">// Never trust user input — validate at every boundary
const schema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  amount: Joi.number().positive().precision(2).max(10000).required(),
  note: Joi.string().max(500).optional(),
});

const { error, value } = schema.validate(req.body, { abortEarly: false });
if (error) return res.status(400).json({ errors: error.details });</code></pre>`,
    closing: "Security debt is real and it compounds. The controls you skip today become the incident you manage at 3am two years from now. The engineers who take security seriously early are the ones who sleep through the night.",
  },

  {
    topic: "minimalism_design",
    intro: "Minimalism in design is not about removing things until the interface looks sparse. It is about removing every element that is not doing essential work. The difference matters. A sparse interface that has removed the wrong things is worse than a busy one. A minimal interface is one where everything present earns its place.",
    sections: [
      {
        heading: "The Cost of Every Element You Add",
        body: "Every element in an interface carries cognitive cost. A button requires the user to ask: what does this do? Should I click it now? What happens if I do? That is three questions for a single element. When the interface contains forty elements, the user is carrying an enormous cognitive load before they have done anything.\n\nThe minimalist discipline is to interrogate every element: what would happen if we removed this? If the answer is nothing meaningful changes, remove it. If the answer reveals that the element is load-bearing, you have learned something useful about your information architecture.",
      },
      {
        heading: "Whitespace Is Not Empty Space",
        body: "Designers who do not yet understand whitespace tend to fill it. The instinct is understandable — empty space looks unfinished, like something is missing. But whitespace is doing active work. It creates visual hierarchy. It draws attention to what is present. It gives the eye a place to rest, which paradoxically makes the surrounded content easier to process.\n\nThe practical test: take the design with the most whitespace you think is appropriate, then add 20 percent more. You will almost always find that it is better. The discomfort with 'empty' space is a design instinct worth overriding.",
      },
      {
        heading: "Good Defaults Are a Form of Respect",
        body: "A default is a decision you make on behalf of the user. When you set a default, you are saying: this is the best choice for most people in most situations. Defaults should be designed with the same care as the interface itself, because most users will never change them.\n\nThe worst defaults are ones that serve the product's interests rather than the user's — the pre-checked newsletter subscription, the auto-enabled notification, the opt-out privacy setting. These erode trust. The best defaults are ones that make the right thing the easy thing, where 'right' is defined by what the user actually wants to accomplish.",
      },
    ],
    quote: { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
    codeBlock: `<pre><code class="language-css">/* Less is more: a consistent spacing scale */
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  32px;
  --space-xl:  64px;
}

/* Use it everywhere — no magic numbers */
.card { padding: var(--space-md); gap: var(--space-sm); }
.section { margin-block: var(--space-xl); }</code></pre>`,
    closing: "Minimalism is not a style. It is a discipline. The discipline of knowing what matters and having the confidence to remove everything else. It gets easier with practice and harder to stop.",
  },

  {
    topic: "startups",
    intro: "The startup mythology — two founders, a garage, an idea that changes the world — erases everything messy and real about building a company from nothing. The reality involves more spreadsheets, more uncomfortable conversations, more pivots, and more genuine uncertainty than any origin story admits.",
    sections: [
      {
        heading: "Product-Market Fit Is a Feeling Before It Is a Metric",
        body: "You will know you have product-market fit before any metric confirms it. The signal is a change in the texture of your customer conversations. Instead of asking whether the product is useful, customers start asking when you will add the thing they need. Instead of explaining why someone should try it, you find yourself explaining why there is a waiting list.\n\nThe metrics that people use to define product-market fit — retention curves that flatten, NPS above 40, specific growth rates — are lagging indicators. The leading indicator is qualitative: do the people who use this thing actually care about it?",
      },
      {
        heading: "The Feature Nobody Asked For",
        body: "Almost every successful product has at least one feature that customers did not ask for and now cannot imagine living without. This is not an argument for ignoring customer feedback. It is an argument for deeply understanding the problem behind the request rather than the surface-level ask.\n\nCustomers are experts in their own problems. They are rarely experts in the solutions to those problems. When a customer says 'I need a report,' the underlying problem might be 'I cannot convince my manager that this is working.' The right solution might be a shareable dashboard, not a PDF export.",
      },
      {
        heading: "The Meeting That Changes Everything",
        body: "There is a particular kind of conversation that startups have, usually once or twice in their life, that changes the trajectory of everything. It is usually uncomfortable. It involves someone saying something that was obvious to everyone but unspeakable.\n\nThe companies that have this conversation early — about the business model that does not work, the co-founder relationship that is broken, the market that is not the right market — adapt. The ones that avoid it until it is unavoidable spend the extra months pretending, and the adaptation is correspondingly harder.",
      },
    ],
    quote: { text: "If you're not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman" },
    codeBlock: `<pre><code class="language-javascript">// Ship the simplest version that tests the hypothesis
async function chargeCustomer(userId, priceId) {
  // v1: no retry logic, no webhook handling, no refund flow
  // We need to learn if people pay before we build the machinery
  const session = await stripe.checkout.sessions.create({
    customer: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: \`\${ENV.BASE_URL}/welcome\`,
    cancel_url: \`\${ENV.BASE_URL}/pricing\`,
  });
  return session.url;
}</code></pre>`,
    closing: "Building a startup is mostly a series of humbling experiences that teach you things you could not have learned any other way. The companies that survive are not the smartest ones. They are the ones that stayed honest about what they did not know.",
  },

  {
    topic: "machine_learning",
    intro: "Machine learning has a gap between how it is discussed and how it actually works in production. The gap is not about the algorithms — it is about the data, the infrastructure, the organizational dynamics, and the ways systems fail silently when the distribution of production data drifts from the distribution of training data.",
    sections: [
      {
        heading: "The Data Problem Is the Hard Problem",
        body: "Every practitioner who has deployed a machine learning system in production will tell you the same thing: the model is rarely the problem. The data is almost always the problem. Missing values, mislabeled examples, train-test leakage, distribution shift — these are the failure modes that matter in practice, and they are all data problems.\n\nThe implication is that investing in data quality, data infrastructure, and data observability pays better returns than investing in more sophisticated models, in most production contexts. A simple model trained on clean, well-labeled data outperforms a complex model trained on noisy data, almost every time.",
      },
      {
        heading: "Model Monitoring Is Not Optional",
        body: "A software system that stops working fails loudly. An API returns 500. A queue backs up. Alerts fire. A machine learning model that stops working fails silently. The predictions continue to arrive. They are just gradually, quietly wrong. The degradation can continue for months before it is noticed — if it is noticed at all.\n\nThis is why model monitoring matters more, not less, than traditional application monitoring. You need to track the distribution of inputs over time, the distribution of outputs over time, and — where you have labels — the actual accuracy over time. These require different tooling and different intuitions from traditional observability.",
      },
      {
        heading: "Explainability Is an Engineering Problem",
        body: "The question 'why did the model make this decision?' is not just a research question. It is an engineering requirement in any context where the model's decisions affect people. A loan denial, a content moderation decision, a medical diagnosis — these require explanations, both for regulatory compliance and for basic fairness.\n\nThe good news is that explainability has mature tooling. SHAP values, LIME, attention maps, and decision trees as surrogate models can all produce human-readable explanations for black-box model decisions. The engineering challenge is integrating these into the prediction pipeline without unacceptable latency.",
      },
    ],
    quote: { text: "A learning machine is any device whose actions are influenced by past experience.", author: "Nils Nilsson" },
    codeBlock: `<pre><code class="language-python"># Always validate distribution shift before deployment
from scipy import stats

def check_distribution_shift(train_feature, prod_feature, threshold=0.05):
    """Returns True if distributions are significantly different."""
    statistic, p_value = stats.ks_2samp(train_feature, prod_feature)
    if p_value < threshold:
        logger.warning(f"Distribution shift detected: p={p_value:.4f}")
        return True
    return False</code></pre>`,
    closing: "Machine learning in production is less like research and more like plumbing — unglamorous, essential, and immediately apparent when it goes wrong. Treat your models like services: monitor them, version them, and have a rollback plan.",
  },

  {
    topic: "burnout",
    intro: "Burnout is not the result of working hard. It is the result of working hard in the wrong direction, without adequate recovery, without visible progress, and without genuine autonomy over how the work gets done. Knowing the difference matters because the interventions are completely different.",
    sections: [
      {
        heading: "What Burnout Actually Feels Like",
        body: "The early symptoms of burnout are easy to explain away. You are tired, but you are busy. You are less excited about work, but everyone goes through phases. The cynicism that starts to creep in — the eye-roll at the sprint planning meeting, the genuine disbelief that the thing being shipped matters — this feels like realism, not a symptom.\n\nBy the time burnout is unmistakable, it has usually been present for six to twelve months. The recovery from clinical burnout takes three to six months of deliberate rest and change. The earlier you catch it, the shorter the recovery. The best reason to understand what burnout feels like is not to identify it in yourself once you are deep in it — it is to recognize it before it fully develops.",
      },
      {
        heading: "The Recovery Nobody Talks About",
        body: "The advice given to burned-out engineers is usually 'take a vacation.' This is not wrong, but it is insufficient. A week of vacation followed by a return to the same conditions produces a week of relief and then a faster descent. Recovery from burnout requires a structural change, not a temporary reprieve.\n\nThe structural change might be: a different project, a different team, a different company, or a fundamental renegotiation of what you are doing and why. The question to ask during recovery is not 'how do I rest enough to get back to full capacity?' It is 'what was I doing that was burning me out, and what would I have to change to avoid going back there?'",
      },
      {
        heading: "Prevention Is a Leadership Responsibility",
        body: "Individual engineers are not solely responsible for preventing their own burnout. The conditions that produce burnout — unsustainable pace, unclear priorities, lack of autonomy, invisible work, absence of recognition — are organizational conditions, and they are within the power of leaders to change.\n\nThe leading indicators of team burnout are measurable: declining velocity, increasing incident rates, reduced participation in optional activities, turnover of strong performers. Teams that monitor these and respond to them early spend less time managing the downstream consequences.",
      },
    ],
    quote: { text: "You cannot pour from an empty cup.", author: "Unknown" },
    codeBlock: `<pre><code class="language-markdown"># Burnout early warning checklist (self-assessment)

Rate each item 1-5, where 1=strongly agree:
- [ ] I find meaning in my work
- [ ] I have adequate control over how I do my job  
- [ ] The pace of work feels sustainable
- [ ] My contributions are recognized
- [ ] I have time to recover between intense periods

Score below 15: Have a conversation with your manager.
Score below 10: Treat this as a medical concern.</code></pre>`,
    closing: "Burnout is the system telling you that something fundamental about the relationship between you and your work needs to change. Ignoring it does not make it go away. It makes the message louder.",
  },

  {
    topic: "api_design",
    intro: "An API is a product. It has users — they are developers — and those users form opinions about it within minutes of their first interaction. A well-designed API feels like it was made by people who respected their users' time. A poorly designed one feels like it was designed for the convenience of the people who built it.",
    sections: [
      {
        heading: "Consistency Is the Most Important API Virtue",
        body: "The most common API design failures are consistency failures. An endpoint that returns `userId` in one place and `user_id` in another. A date field that is sometimes a Unix timestamp and sometimes an ISO string. Error responses that have completely different shapes depending on which controller threw the error.\n\nConsistency reduces cognitive load for API consumers. It means that once you understand how one part of the API behaves, you can make confident predictions about other parts. It means that the SDK or client library is simpler because there are fewer special cases. Consistency is harder to achieve than any individual good decision — it requires enforcing conventions across the entire team, consistently, over time.",
      },
      {
        heading: "Error Messages Are Part of the User Experience",
        body: "The error response is the most important message your API sends. It is the message your user receives precisely when they are confused and need help. Most APIs treat error responses as an afterthought — a status code and a terse string that made sense to the developer who wrote it and is opaque to everyone else.\n\nA good error response answers three questions: what went wrong, why did it go wrong, and what should I do about it? The third question is the one that most APIs skip. 'Invalid email' is better than 'Bad request.' 'Email must be in name@domain format' is better still. 'Your email was missing the @ symbol, and here is a valid example format' is what actually helps.",
      },
      {
        heading: "Version Your API Before You Need To",
        body: "API versioning is one of those things that seems like unnecessary overhead until you have a production API that you cannot change because a thousand clients depend on its current behavior. At that point, the absence of a versioning strategy is a hard constraint on your ability to evolve the product.\n\nThe simplest approach is URL versioning: /v1/ and /v2/ as path prefixes. It is not the most elegant solution but it is the most discoverable, the most debuggable, and the one that produces the fewest surprises for API consumers. Elegant solutions to versioning tend to create elegant problems that show up later.",
      },
    ],
    quote: { text: "A good API is not just correct. It is also hard to misuse.", author: "Joshua Bloch" },
    codeBlock: `<pre><code class="language-javascript">// Consistent error response shape across all endpoints
function createApiError(code, message, details = null) {
  return {
    error: {
      code,          // machine-readable: "VALIDATION_ERROR"
      message,       // human-readable: "Email is required"
      details,       // optional structured data for clients
      requestId: req.id,  // for support correlation
      timestamp: new Date().toISOString(),
    }
  };
}

// Usage
if (!req.body.email) {
  return res.status(400).json(
    createApiError("MISSING_FIELD", "Email address is required", { field: "email" })
  );
}</code></pre>`,
    closing: "The API you design today will be called by code that does not yet exist, by developers you have not met, for use cases you did not anticipate. Design for that reality.",
  },

  {
    topic: "team_culture",
    intro: "Culture is not the ping-pong table or the unlimited vacation policy. Culture is what happens in the absence of rules — the default behaviors, the unspoken norms, the things people do when nobody is watching. Most organizational culture is invisible until someone violates it.",
    sections: [
      {
        heading: "Psychological Safety Is Measurable",
        body: "Amy Edmondson's research on psychological safety produced one of the most counterintuitive findings in organizational behavior: the teams that reported the most errors were also the best-performing teams. Not because they made more errors — because they were willing to talk about them. The errors in lower-performing teams were present but invisible.\n\nThe measurement is simple: survey the team on whether they feel safe raising concerns, admitting mistakes, and disagreeing with the leader. The results will not tell you everything, but they will tell you whether you have a culture where problems surface or a culture where problems hide.",
      },
      {
        heading: "The Norms Around Disagreement Determine Everything",
        body: "The most important cultural question in any engineering team is not 'do we disagree?' — all healthy teams disagree. The question is 'how do we disagree?' Teams that have learned to disagree productively — to separate ideas from identities, to make decisions that can be revisited, to commit to outcomes even when individuals preferred different paths — make better decisions and maintain better relationships.\n\nThe mechanism that makes this possible is usually explicit: a decision-making framework that everyone has agreed to, a norm around writing proposals before meetings, a culture of 'disagree and commit' that is actually practiced rather than just sloganed.",
      },
      {
        heading: "Recognition Is Not the Same as Feedback",
        body: "Most engineering cultures are better at feedback than recognition. Feedback is about correction — what to do differently. Recognition is about acknowledgment — what was done well and why it mattered. Both are necessary. The absence of recognition creates a culture where the floor is defined but the ceiling is not, where people know how to avoid failure but have no model of what exceptional looks like.\n\nThe recognition that matters most is specific, immediate, and connected to impact. 'Good job on the release' is noise. 'The way you structured the migration script meant we had zero data errors across four terabytes — that was exactly the right call' is signal.",
      },
    ],
    quote: { text: "Culture eats strategy for breakfast.", author: "Peter Drucker" },
    codeBlock: `<pre><code class="language-markdown"># Incident postmortem template (blameless)

## Timeline
[Chronological sequence of events]

## What happened
[Factual description, no attribution to individuals]

## Why it happened  
[Root causes — 5 Whys analysis]

## What we are doing about it
[Concrete action items with owners and dates]

## What went well
[Acknowledge effective responses — important for morale]

## What we learned
[Distributable insights for the broader team]</code></pre>`,
    closing: "Culture is built in the moments that do not feel significant: the question someone asks in a design review, the way a senior engineer responds to a junior's mistake, the decision about whether to hold the 9pm incident call. Those moments, accumulated, are your culture.",
  },

  {
    topic: "note_taking",
    intro: "Note-taking is one of those skills that looks simple from the outside and turns out, on close examination, to be a practice with significant depth. The difference between taking notes as a transcription service and taking notes as a thinking tool is the difference between a filled notebook and an external brain.",
    sections: [
      {
        heading: "The Note That You Never Reread",
        body: "Most notes are never reread. This is not a criticism — it is an empirical observation that should inform how you take notes. The note that exists only to be read later and is never read later has no value. But the act of taking it may still have significant value, because writing forces engagement with the material in a way that passive reading or listening does not.\n\nThe implication is that you should design your note-taking practice around the kind of value you actually want. If rereadability matters to you, optimize for that — structured formats, good tagging, regular review. If the value is in the processing, optimize for that — fast, messy, discarded after the session.",
      },
      {
        heading: "Linking Ideas Creates Understanding",
        body: "The tools that became popular in the connected note-taking movement — Roam, Obsidian, Logseq — are built around a simple idea: knowledge is a graph, not a hierarchy. The insight you had while reading about evolutionary biology is related to the insight from the organizational behavior paper. Making that connection explicit — by linking the two notes — creates something neither note contained alone.\n\nYou do not need special software for this. You need the practice of asking, when you record something new: what does this connect to? Where have I seen this pattern before? The answer to those questions is where your thinking actually lives.",
      },
      {
        heading: "The Weekly Review As a Forcing Function",
        body: "The notes you take during the week are raw material. Without a regular processing step, they accumulate but do not compound. The weekly review — which does not need to take more than thirty minutes — is where you process the raw material: capture the things you want to remember, identify the actions that did not get taken, notice what themes keep appearing.\n\nThe review is also where you maintain the system. Note-taking systems that are not maintained decay. Tags become inconsistent. Folders fill with notes that belong elsewhere. The regular maintenance session is what keeps the system useful over months and years rather than just weeks.",
      },
    ],
    quote: { text: "The palest ink is better than the sharpest memory.", author: "Chinese Proverb" },
    codeBlock: `<pre><code class="language-markdown"># Zettelkasten-style note template

**ID:** 2026-07-22-1423
**Tags:** #system-design #tradeoffs #architecture

## Claim
[One sentence stating the main idea]

## Evidence
[What supports this? Sources, examples, experience]

## Connections
- [[related-note-id]] because [why they connect]
- [[another-note]] — contrast with this idea

## Questions this raises
- [What I still don't understand]

## Source
[Book, article, conversation — with page/timestamp if relevant]</code></pre>`,
    closing: "The goal of a note-taking system is not a full notebook. It is a thinking partner — a system that helps you make connections, surface relevant ideas at the right moment, and compound your understanding over time. That takes longer to build than a week, and it is worth building.",
  },
];

// ── 20 Real quotes ─────────────────────────────────────────
const QUOTES = [
  { text: "Simplicity is a prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Boring technology is a feature, not a drawback.", author: "Dan McKinley" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "Software is a process of learning, not a process of building.", author: "Dan North" },
  { text: "The function of good software is to make the complex appear simple.", author: "Grady Booch" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "The most dangerous kind of waste is the waste we do not recognize.", author: "Shigeo Shingo" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "An approximate answer to the right question is worth a great deal more than a precise answer to the wrong one.", author: "John Tukey" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward Berard" },
  { text: "In preparing for battle I have always found that plans are useless, but planning is indispensable.", author: "Dwight D. Eisenhower" },
  { text: "A language that doesn't affect the way you think about programming is not worth knowing.", author: "Alan Perlis" },
  { text: "The most valuable of all talents is that of never using two words when one will do.", author: "Thomas Jefferson" },
  { text: "Security is not a product, but a process.", author: "Bruce Schneier" },
  { text: "Given enough eyeballs, all bugs are shallow.", author: "Linus Torvalds" },
];

// ── 12 Real code snippets across different topics ──────────
const CODE_SNIPPETS = [
  // Reducer pattern
  `<pre><code class="language-javascript">const updateState = (state, action) => {
  switch (action.type) {
    case "SET_USER":    return { ...state, user: action.payload };
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_ERROR":   return { ...state, error: action.payload, loading: false };
    default:            return state;
  }
};</code></pre>`,

  // Retry with exponential backoff
  `<pre><code class="language-javascript">async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}</code></pre>`,

  // MongoDB index
  `<pre><code class="language-javascript">// ESR rule: Equality → Sort → Range
postSchema.index({ status: 1, moderationStatus: 1, publishedAt: -1 });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.index({ tags: 1, publishedAt: -1 });
postSchema.index({ title: "text", subtitle: "text", tags: "text" });</code></pre>`,

  // MongoDB query profiling
  `<pre><code class="language-javascript">// Analyse slow queries in production
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find(
  { millis: { $gt: 100 } },
  { op: 1, ns: 1, millis: 1, planSummary: 1, ts: 1 }
).sort({ ts: -1 }).limit(10).pretty();</code></pre>`,

  // JWT auth middleware
  `<pre><code class="language-javascript">const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub).lean();
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};</code></pre>`,

  // React custom hook
  `<pre><code class="language-javascript">function useFetch(url) {
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null, loading: true, error: null,
  });
  useEffect(() => {
    if (!url) return;
    dispatch({ type: "FETCH_START" });
    fetch(url)
      .then(r => r.json())
      .then(data => dispatch({ type: "FETCH_SUCCESS", payload: data }))
      .catch(err => dispatch({ type: "FETCH_ERROR", payload: err.message }));
  }, [url]);
  return state;
}</code></pre>`,

  // Rate limiter
  `<pre><code class="language-javascript">import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  keyGenerator: (req) => req.user?.id ?? req.ip,
});</code></pre>`,

  // Event emitter pattern
  `<pre><code class="language-javascript">class EventBus extends EventEmitter {
  constructor() { super(); this.setMaxListeners(50); }

  publish(event, payload) {
    console.log(\`[EventBus] \${event}\`, payload);
    this.emit(event, payload);
  }

  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler); // returns unsubscribe
  }
}
export default new EventBus(); // singleton</code></pre>`,

  // Mongoose transaction
  `<pre><code class="language-javascript">async function transferCredits(fromId, toId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [from, to] = await Promise.all([
      User.findByIdAndUpdate(fromId, { $inc: { credits: -amount } }, { session, new: true }),
      User.findByIdAndUpdate(toId,   { $inc: { credits:  amount } }, { session, new: true }),
    ]);
    if (from.credits < 0) throw new Error("Insufficient credits");
    await session.commitTransaction();
    return { from, to };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}</code></pre>`,

  // CSS custom properties
  `<pre><code class="language-css">:root {
  --color-text-primary:   hsl(220, 20%, 10%);
  --color-text-secondary: hsl(220, 10%, 45%);
  --color-surface:        hsl(0, 0%, 100%);
  --color-accent:         hsl(250, 85%, 60%);
  --radius-md: 8px;
  --shadow-sm: 0 1px 3px hsl(0 0% 0% / 0.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary:   hsl(220, 20%, 95%);
    --color-surface:        hsl(220, 20%, 10%);
  }
}</code></pre>`,

  // Bash variable expansion
  `<pre><code class="language-bash">#!/bin/bash
# Safe defaults with parameter expansion
DB_HOST=\${DB_HOST:-localhost}
DB_PORT=\${DB_PORT:-27017}
DB_NAME=\${DB_NAME:?'DB_NAME is required'}

# String manipulation without sed
filename="report-2026-07-22.json"
base=\${filename%.json}          # remove suffix
date_part=\${base#report-}       # remove prefix
echo "Archiving: \$date_part"</code></pre>`,

  // Python type hints
  `<pre><code class="language-python">from typing import Optional, TypedDict
from datetime import datetime

class PostSummary(TypedDict):
    id: str
    title: str
    author_username: str
    published_at: Optional[datetime]
    read_time_minutes: int
    total_claps: int

def format_post(doc: dict) -> PostSummary:
    return PostSummary(
        id=str(doc["_id"]),
        title=doc["title"],
        author_username=doc["author"]["username"],
        published_at=doc.get("publishedAt"),
        read_time_minutes=doc.get("readTimeMinutes", 1),
        total_claps=doc.get("totalClaps", 0),
    )</code></pre>`,
];

/**
 * Generates realistic HTML article content from the ARTICLE_TEMPLATES pool.
 * Falls back to procedural generation for overflow posts beyond the template count.
 */
function generateContentHtml(title, subtitle, minutes, opts) {
  const { isLong, hasXSS, templateIndex } = opts || {};

  // Long whitepaper scenario (tests read-time estimator on huge docs)
  if (isLong) {
    let h = `<h1>${title}</h1><p><em>${subtitle}</em></p><h2>Executive Summary</h2>`;
    h += `<p>This document presents a comprehensive analysis of distributed systems design patterns, scalability bottlenecks, and operational strategies employed by engineering organizations at scale. The following sections cover caching architecture, database sharding, event-driven messaging, and observability infrastructure in depth.</p>`;
    for (let p = 0; p < 240; p++) {
      h += `<p>Section ${Math.floor(p / 10) + 1}, subsection ${(p % 10) + 1}: ${
        ["Software architecture decisions compound over time — the choices made in the first year of a system shape what is possible in the fifth.",
         "Horizontal scaling requires statelessness, and statelessness requires careful thought about where session data, cache state, and rate-limit counters live.",
         "The index that seems optional in development becomes critical in production when the dataset crosses 10 million rows and the query planner changes its strategy.",
         "Event-driven architectures decouple producers from consumers but introduce new failure modes around message ordering, deduplication, and dead-letter handling.",
         "Observability is the practice of making systems introspectable — not just monitored, but queryable in ways that were not anticipated when the instrumentation was written.",
        ][p % 5]
      }</p>`;
    }
    return h;
  }

  // XSS sanitizer test
  if (hasXSS) {
    let h = `<h1>${title}</h1><p><em>${subtitle}</em></p>`;
    h += `<script>alert('xss')</script>`;
    h += `<img src=x onerror="alert('img-xss')">`;
    h += `<iframe src="javascript:alert('iframe-xss')"></iframe>`;
    h += `<p onclick="alert('p-xss')">This paragraph has an inline event handler that should be stripped.</p>`;
    h += `<p>After sanitization, none of the above payloads should be executable. This tests that our sanitizeContent() utility correctly strips script tags, event attributes, and dangerous protocols.</p>`;
    return h;
  }

  // Use a real article template if available
  const idx = templateIndex !== undefined
    ? templateIndex % ARTICLE_TEMPLATES.length
    : (Math.abs(title.split("").reduce((a, c) => a + c.charCodeAt(0), 0))) % ARTICLE_TEMPLATES.length;

  const tpl = ARTICLE_TEMPLATES[idx];

  let h = `<h1>${title}</h1>`;
  if (subtitle) h += `<p><em>${subtitle}</em></p>`;

  h += `<p>${tpl.intro}</p>`;
  h += `<hr>`;

  tpl.sections.forEach((section, i) => {
    h += `<h2>${section.heading}</h2>`;
    // Render multi-paragraph bodies
    section.body.split("\n\n").forEach(para => {
      if (para.trim()) h += `<p>${para.trim()}</p>`;
    });
    // Interleave quote and code at strategic points
    if (i === 0 && tpl.quote) {
      h += `<blockquote><p>"${tpl.quote.text}"</p><cite>— ${tpl.quote.author}</cite></blockquote>`;
    }
    if (i === 1 && tpl.codeBlock) {
      h += tpl.codeBlock;
    }
  });

  if (minutes >= 5) {
    h += `<h2>Going Deeper</h2>`;
    h += `<p>The principles discussed above apply across a remarkably wide range of contexts. The teams that internalize them tend to make better decisions under pressure, because the framework for evaluation is already established — they are not inventing criteria from scratch in the moment when it matters most.</p>`;
    h += `<ul><li>Start with the problem, not the solution — the solution space is large; the problem space is often small.</li><li>Make the implicit explicit — the unstated assumption is the most dangerous kind.</li><li>Optimize for the reader, not the writer — the person who reads this code in eighteen months is more important than the person who writes it today.</li></ul>`;
  }

  if (minutes >= 8) {
    h += `<h2>A Note on Context</h2>`;
    h += `<p>None of the above is advice to be followed without judgment. Every engineering context is different. The team size, the domain, the regulatory environment, the technical debt, the organizational culture — all of these affect which principles apply and in what form. The goal is not to follow a recipe. It is to develop the judgment to know when a principle applies and when it does not.</p>`;
    h += `<p>That judgment comes from experience, from having been wrong and learned from it, and from being honest with yourself about what you do not yet understand. The engineers who make the best decisions are not the ones who know the most frameworks — they are the ones who ask the best questions before they commit to an approach.</p>`;
  }

  h += `<hr>`;
  h += `<p>${tpl.closing}</p>`;

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
  "Engineering Deep Dives", "Design Inspiration", "To Read This Weekend",
  "Shared With Team", "Leadership Reads", "Writing Craft",
  "Career Advice I Actually Believe", "Architecture Classics",
  "Personal Growth", "Indie Web", "Open Source Gems", "2026 Reading List",
  "The Fundamentals", "Decision Making", "Mental Models", "Product Strategy",
  "Security Reading", "Systems Thinking", "The Writing Room", "Accessibility Resources",
];

const COVER_SEEDS = Array.from({ length: 40 }, (_, i) =>
  `https://picsum.photos/seed/inkwell${i + 1}/1200/600`
);

const REPORT_REASONS = ["spam", "harassment", "misinformation", "other"];
const REPORT_WEIGHTS = [40, 25, 20, 15];
function weightedReason() {
  let r = rand() * 100;
  for (let i = 0; i < REPORT_WEIGHTS.length; i++) {
    if (r < REPORT_WEIGHTS[i]) return REPORT_REASONS[i];
    r -= REPORT_WEIGHTS[i];
  }
  return "other";
}

// ── Named users — stable for test-suite compatibility ────────
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
  // Banned (2 variants)
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
  // Email prefs off
  { name: "Bell Hooks",         username: "bell",         email: "bell@inkwell.dev",           role: "user",  status: "active",  bio: "Love as a practice not just a feeling.", emailPrefsOff: true },
  // Short name
  { name: "Li Wong",            username: "liwong",       email: "li@inkwell.dev",             role: "user",  status: "active",  bio: "" },
  // Max-length bio
  { name: "Max Bio User",       username: "maxbio",       email: "maxbio@inkwell.dev",         role: "user",  status: "active",  bio: "x".repeat(200) },
  // Email alias
  { name: "Francois Muller",    username: "francois",     email: "francois+alias@inkwell.dev", role: "user",  status: "active",  bio: "Accented names and email alias edge case." },
  // Uppercase email
  { name: "Soren Kierkegaard",  username: "kierkegaard",  email: "SOREN@KIERKEGAARD.CO.UK",    role: "user",  status: "active",  bio: "Leap of faith into the void." },
  // Active password reset
  { name: "Ada Lovelace Clone", username: "ada2",         email: "ada2@inkwell.dev",           role: "user",  status: "active",  bio: "Password reset active token test.", _resetActive: true },
];

module.exports = {
  rand, randInt, pick, pickN,
  FIRST, LAST, BIO_POOL, ALL_TAGS,
  POST_TITLES, SUBTITLES,
  COMMENT_POOL, SPAM_COMMENTS,
  ARTICLE_TEMPLATES, QUOTES, CODE_SNIPPETS,
  generateContentHtml,
  PUB_DEFS, LIST_NAMES, COVER_SEEDS,
  REPORT_REASONS, REPORT_WEIGHTS, weightedReason,
  NAMED_USERS,
};
