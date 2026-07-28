# FAANG-Grade Monorepo Architecture

## Research, Design & Step-by-Step Implementation Plan

**Scope:** A production-style JavaScript monorepo (MERN/MEAN-class stack + JSDoc) built with registry-pattern + modular-monolith + feature-based architecture, a global atomic design system with per-product theming, shared platform services (Notification, Media, Upload/Download), global cursor pagination, DSA-driven data design, and single user identity across multiple products.

**How this document is organized**

- **Part A — Research:** what Google, Meta, Netflix, Slack, Shopify, Uber, Atlassian actually do, with citations, and _why_ it works at their scale.
- **Part B — Translation:** how each research finding maps onto your requirements and stack (JS/Node, not C++/Bazel).
- **Part C — Target Architecture:** the actual repo layout, module contracts, and diagrams.
- **Part D — Deep dives:** one section per requirement (registry pattern, atomic UI + theming, services, pagination, DSA/data design, identity).
- **Part E — Step-by-step build plan:** phased, in the order you should actually build it, with concrete deliverables per phase.
- **Part F — Edge cases, failure modes, and governance checklist.**

---

# PART A — RESEARCH: HOW TOP-TIER COMPANIES ACTUALLY BUILD MONOREPOS

This is not folklore — it's grounded in publicly documented engineering practice.

## A.1 The core insight: monorepo = single source tree + strict tooling, NOT "one big app"

The single most misunderstood thing about FAANG monorepos is that people assume "monorepo" means "monolith." It doesn't. At Google, roughly 95% of code lives in one repository shared by tens of thousands of engineers, yet a Google engineering manager confirmed that <cite index="4-1">despite the monorepo, Google's codebase was not monolithic, and an engineer noted they "honestly notice very little difference from orgs that use separate repos, like at AWS."</cite> The repository is a **storage and versioning strategy**; the **architecture** inside it is still modular, service-oriented, and boundary-enforced. This is the exact distinction your requirement #2 ("modular monolith + feature-based" inside a monorepo) is built on — you are doing precisely what Google/Meta do, just at a much smaller scale and with JS tooling instead of Blaze/Buck2.

Key structural facts about the two biggest reference implementations:

- Google's monorepo (internally "Google3") holds <cite index="4-1">billions of lines of code, uses Trunk-Based Development as the norm, C++/Kotlin/Java/Python/Go/TypeScript as officially supported languages with heavy use of Protobuf, and enforced language style guides</cite>. Its own build system is called Blaze internally, open-sourced as Bazel.
- Google's directory layout is not ad hoc: <cite index="5-1">Google's co-mingled applications and services sit within highly structured and uniform source trees, so a developer from one project team instantly recognizes the directory structure for another team's application — and that consistency is enforced globally, the same way Buck and Bazel lay out trees for production and test code</cite>. This is a direct research validation of your "registry based + feature based" idea: **structure must be uniform and mechanically enforced, not left to convention.**
- Meta, Uber (iOS), and Netflix are also confirmed monorepo/trunk-based practitioners at scale: <cite index="5-1">Google and Facebook are the most famous organizations resting development on a single company-wide trunk that fits the monorepo design, and Netflix and Uber disclosed in 2017 that they do too.</cite>

## A.2 Why trunk-based development is the load-bearing practice, not the build tool

The build tool (Bazel/Buck2) gets the attention, but the actual practice that makes a monorepo tractable is **trunk-based development** — everyone commits small changes directly (or via very short-lived branches) to one mainline. <cite index="1-1">It works particularly well for monorepos because monorepos amplify the cost of long-lived branches — the conflict surface is huge — so the two things that must be solid are selective testing (only run tests affected by a change) and a merge queue that prevents two green PRs from combining to break main.</cite> Concretely, <cite index="1-1">selective testing (only running tests affected by the change) typically cuts CI time by 50 to 80 percent in a monorepo.</cite>

Scale reference point: <cite index="2-1">Google runs trunk-based development at a scale most teams will never touch — its monorepo holds over 2 billion lines of code, supports more than 25,000 developers, and processes roughly 40,000 commits per day</cite>, and this is backed by broader industry data — <cite index="2-1">the 2024 DORA Accelerate State of Devops Report, drawing on feedback from over 39,000 professionals, continues to identify trunk-based development as a required practice for continuous integration, and elite-performing teams deploy on demand with recovery times under an hour.</cite>

Even release stabilization doesn't break the trunk model: <cite index="2-1">Google cuts release branches as a snapshot of trunk at a point in time — bug fixes get cherry-picked in, new features don't — purely for risk management of the deploy, not to block the mainline.</cite>

**What this means for your project (a single small team, not 25,000 engineers):** you don't need Bazel-scale infra, but you should still adopt the _pattern_: short-lived feature branches, feature flags for incomplete work, and a CI pipeline that only rebuilds/tests what changed (Nx/Turborepo give you this for free via dependency-graph-aware "affected" commands).

## A.3 What the build system is actually solving

<cite index="2-1">Standard Git doesn't handle monorepos at this size gracefully — you need build systems like Bazel (Google), Buck (Meta), or Pants (Twitter) that process the dependency graph and only rebuild what's actually affected by a commit.</cite> In the JS ecosystem, **Nx** and **Turborepo** are the direct architectural descendants of this idea — they build a dependency graph of your packages and apps and give you "affected" builds/tests, remote caching, and (in Nx's case) enforced architectural boundaries.

The 2026 tooling landscape breaks down like this:

- <cite index="84-1">Turborepo serves as the 2026 default for most JS/TS teams due to its gentle learning curve and efficiency for under 100 packages, while Nx provides deep project graph understanding through "affected" commands, allowing enterprises with up to hundreds of packages to rebuild only changed dependencies.</cite>
- <cite index="86-1">Choose Turborepo for small-to-mid-size JavaScript and TypeScript monorepos that need fast task orchestration without adopting a new workspace model. Choose Nx when the repo has multiple teams, several app types, architectural boundaries to enforce, or enough CI cost that graph-aware affected commands and Nx Cloud are worth the extra concepts.</cite>
- Critically for **your specific requirements** (registry pattern, enforced modular boundaries, feature-based structure, multiple products sharing one identity/design system): Nx is the closer analogue to what FAANG companies do with Bazel/Buck, because it gives you **mechanically enforced module boundaries**, not just faster builds. <cite index="12-1">Nx provides mechanisms to enforce architectural boundaries and ensure projects can only depend on each other according to your organization's rules — you declaratively define constraints using project tags and enforce them automatically, either via ESLint for JS/TS import checks or a language-agnostic Conformance plugin.</cite>
- Pattern used in real Nx enterprise setups: <cite index="11-1">tag libraries as type:feature, type:data-access, scope:inventory, scope:user-profile, etc., then enforce rules like "a type:feature library cannot import another type:feature library" (prevents horizontal coupling) and "a type:data-access library cannot import a type:feature library" (prevents vertical/inverted coupling)</cite> via the `@nx/eslint-plugin/enforce-module-boundaries` rule.
- This is not a novelty — it mirrors Bazel's `visibility` rules and Buck's package boundaries directly, just implemented as an ESLint rule instead of a native build-graph constraint.
- Alternative/complementary tools exist too: <cite index="16-1">Dependency Cruiser and a tool called Sheriff are more versatile than Nx's built-in boundary checker for things like detecting whether a module is "shared enough," circular dependencies, or orphaned modules — though they have a steeper learning curve around concepts like automatic tagging.</cite>

**Decision for your project:** use **Nx** (not just Turborepo) specifically _because_ your requirements explicitly call for enforced architectural boundaries (registry pattern + modular monolith + feature-based). Turborepo alone gives you speed; Nx gives you speed **and** the governance layer that is the actual FAANG-grade differentiator.

## A.4 The organizational dimension — code layout mirrors team/domain ownership

<cite index="17-1">On large projects with multiple teams, projects are usually split into logical domains where each team focuses on a single domain, and each domain block has a clear public API that other domains can consume — but code organization alone doesn't stop developers from reaching into a domain's internals, which is why Nx ships the enforce-module-boundaries ESLint rule.</cite> Nx's own guidance frames this as a human/org problem as much as a technical one: <cite index="13-1">monorepos are often viewed only from the technical side, but they bring a shift in HR/org structure too — teams that were once isolated now work together on one solution, so a clean separation of concerns and well-defined cohesive units helps the organization scale and gives confidence in the architecture.</cite>

Even at 1-person or small-team scale, adopting this discipline early (one domain = one folder = one public API surface) is what lets the codebase later scale to a real team without a rewrite — this is the single highest-leverage decision in the whole project.

## A.5 Modular monolith as the deliberate middle ground

Contrary to the "microservices or nothing" narrative, modular monoliths are the industry's actual recommended starting point, and they map cleanly onto a monorepo:
<cite index="24-1">The advised approach is to start with a modular monolith and, while the application evolves, improve the architecture if needed — because all complex systems that work evolved from simpler systems that worked, and you can easily migrate from a modular monolith to microservices later since each module/domain is already separated and isolated; each module folder can become a separate microservice.</cite>

A concrete open-source reference implementation (`modular-monolith-nodejs`) demonstrates the exact primitives you'll need:
<cite index="21-1">To correctly register a module, you define a dependency on it in package.json, following a folder-naming convention (e.g. a "user" module lives in a "user-module" folder); modules are loaded by scanning specific directories, and the main unit of information transfer between and within modules is events — domain events produced by an action on an aggregate, handled synchronously in-memory within a single transaction, are the preferred way to handle side effects across aggregates within the same domain.</cite> For cross-module async communication in a single deployable process, <cite index="21-1">the application publishes messages to a single common queue for all modules; a single consumer listens for new messages and dispatches them to all modules by interface, and each module itself decides whether to handle a given message — the core app doesn't need to know.</cite> Architectural decisions themselves are tracked as first-class artifacts: <cite index="21-1">all architectural decisions are kept in a ./docs/adr directory, capturing an important architectural decision made along with its context and consequences.</cite> That ADR (Architecture Decision Record) discipline is standard at FAANG-adjacent engineering orgs and costs almost nothing to adopt.

The folder-per-domain pattern recommended broadly across the Node.js ecosystem:
<cite index="22-1">Structure your project by domain responsibility, where each folder is a separate module and business domain of the application — e.g. /src/account (userQueries.js, userMutations.js, userServices.js, index.js) and /src/billing (paymentProfileQueries.js, paymentProfileMutations.js, paymentProfileServices.js, index.js) — giving you the scalability, isolation, and organization benefits of microservices without the complexity of distributed systems, so you can iterate and move faster while keeping the option to peel a module into its own service later.</cite>

## A.6 The registry pattern — exactly how plugin/service registration works in production Node systems

Your requirement #2 explicitly calls for a "registry based pattern." Here's the production-grade version, not a toy example:
<cite index="27-1">A Registry Design Pattern is used to manage the lifecycle of plugins: the registry acts as a central store where each plugin registers itself, and the application looks up and invokes plugins when needed, so new plugins can be added without modifying core application code.</cite> The canonical structure: <cite index="29-1">a Key uniquely identifies each object in the registry (commonly a string or class type), the Value is the object/service being stored and retrieved, and a Lookup Mechanism registers and retrieves objects — giving centralized access (a single point to manage/retrieve objects across the system) and decoupling (removing the need to pass shared objects explicitly around the system).</cite>

At scale this converges with **dependency injection** and **service locator** patterns. A production DI container implementation looks like this (paraphrased from real container code): a container exposes `register(name, Implementation, dependencies)` for transient services and `registerSingleton(...)` for singletons, and a `resolve(name)` method that looks up the registered service, recursively resolves its declared dependencies, instantiates it (or returns the cached singleton), and caches it if it's a singleton. This is exactly the shape you should implement for your Notification/Media/Upload/Identity services so features never `import` a concrete service directly — they resolve it from the registry, making every service swappable and independently testable.

Two important production nuances the research surfaces:

- Naming collisions matter at scale — one modern approach <cite index="26-1">uses JavaScript Symbols as unique keys for service registration in TypeScript/Node.js DI containers specifically because Symbols guarantee true uniqueness and prevent naming collisions, improving robustness in large-scale projects where string keys could collide.</cite>
- Historically, Node's own module system encouraged an informal registry via singletons: <cite index="28-1">because of how `require` caches modules, singletons are among the most common Node.js design patterns found across the npm ecosystem.</cite> Your explicit registry should replace ad hoc `require`-based singletons for anything that crosses a module boundary — this is what makes the pattern "FAANG-grade" instead of accidental.
- Registries aren't free of trade-offs at true distributed scale: <cite index="29-1">scaling a registry across distributed environments or microservices can introduce complexity in managing consistency, synchronization, and access control — mitigated with dependency injection/service locator patterns, distributed caching, partitioning, or service discovery mechanisms as you grow.</cite> For a monorepo modular monolith (single process, single deployable), this risk is dormant until/unless you split modules into real microservices later — which is precisely the point of designing it this way now.

## A.7 Atomic design + design tokens — how real multi-product companies keep UI consistent while letting products diverge

Your requirement #3 ("global atomic UI + product-level UI customization") is a solved problem at design-system scale, and the solution is **tokens as the seam between "global" and "per-product."**
<cite index="35-1">Design tokens are the visual design atoms of a design system — named entities that store visual design attributes, used in place of hard-coded values (hex codes, pixel values) to maintain a scalable and consistent visual system for UI development.</cite> The concept originated at Salesforce and is now industry-standard.

Reference implementations:

- <cite index="34-1">Shopify baked a "tokens first" philosophy into Polaris, its design system — the entire visual hierarchy is built on top of design tokens, making theming effortless, which is essential for platforms like Shopify Plus and genuinely multi-brand ecosystems.</cite>
- <cite index="34-1">Atlassian leans heavily on behavioral patterns in its Design Guidelines, focusing not just on what components are but how they feel, using patterns alongside atoms/molecules to create consistent UX across very different products (Jira, Confluence, Trello).</cite>
- Netflix runs a similar model internally: its design system, nicknamed **Hawkins**, <cite index="35-1">is used across a Netflix Studio ecosystem spanning 80+ internal applications and 20+ languages.</cite>
- The practical token-consumption pattern (Shopify's actual published approach) looks like this in code: import the raw token set, then build a semantic theme object that maps semantic names (`backgroundSubdued`, `foregroundContrasting`, `highlightPrimary`) onto raw token values (`colorSkyLighter`, `colorWhite`, `colorIndigo`), and spacing tokens get parsed from px-strings into numbers for native/token consumers. This two-layer indirection — **raw tokens → semantic tokens → component styles** — is exactly the mechanism that lets one atomic component render differently per product without forking the component.
- Governance matters as much as tooling: <cite index="38-1">the Atlassian design system is maintained today by a dedicated team of 70 people, with deep integration between design and engineering so that contributions remain transparent, visible, and scalable.</cite> You obviously won't have 70 people, but the principle — a design system needs an _owner_ and a _contribution process_, not just a component folder — still applies even solo.

Evaluation dimensions used by practitioners to judge whether a design system is "real" apply directly to what you should build:
<cite index="39-1">component coverage, documentation clarity, accessibility support, code delivery and framework support, theming and design-token architecture, governance model, contribution process, and evidence of real-world adoption in shipped products.</cite>

## A.8 Notification systems — the fan-out architecture used at scale

Requirement #4 (Notification service) has a very well-documented reference architecture:
<cite index="57-1">Event → Message Queue → Fan-Out Workers → per-user Notification Store, with Channel Dispatchers for Email, SMS, Push, and WebSocket branching off the fan-out stage.</cite> The actual decision logic inside a fan-out worker: <cite index="57-1">check whether the user's notification preferences allow this channel — if not, decide whether to queue for later; check whether a rate limit has been hit — if so, batch or drop; check whether the notification is mandatory (2FA, legal) — if so, override user preferences.</cite>

Why per-channel queues, specifically (this is the part people get wrong when they build one shared queue):
<cite index="59-1">Each channel — push, email, SMS — gets its own queue and its own worker pool; this isolation is the whole point, because a slow SMS gateway backing up only backs up the SMS queue — push and email keep flowing.</cite> The isolation buys you <cite index="59-1">independent scaling (spin up more email workers without touching SMS), independent failure (one dead provider doesn't stall the others)</cite>, and independent rate limiting per provider.

Reliability details that separate "toy" from "production" notification systems:
<cite index="59-1">The API should accept the job, not do the job — enqueue the work and return in milliseconds; enqueue with a transactional outbox so an event is never lost or duplicated between your database and the queue; scale workers off queue depth, not request rate, so a spike becomes a backlog instead of an outage; and retries, dead-letter queues, idempotency, and back-pressure are what actually keep a large send from DDoSing your own downstream providers.</cite>
A concrete implementation pattern (paraphrased from a real .NET/RabbitMQ build, architecture-portable to Node): the API never blocks on the actual SMTP/Twilio/FCM call, so response time stays constant regardless of provider latency; dead-letter queues prevent silent message loss during outages; rate limiting lives in the dispatcher (not the API layer) so it's enforced no matter which internal caller triggers a notification; and channel dispatch fans out in parallel so one slow channel never delays another — failures in one channel are fully isolated from the rest.

At true FAANG scale, the numbers get large fast: <cite index="58-1">a system like this can be sending on the order of 10 million push notifications, 1 million SMS messages, and 5 million emails a day — services never talk directly to Apple/Google/Twilio, they call a centralized Notification Service API, which determines message type, builds the correct payload, and routes it through the appropriate channel before a third-party provider does final delivery.</cite>

## A.9 Media / Upload / Download — the resumable-upload reference architecture

Requirement #4 also needs Media + Upload/Download services. The industry-standard approach is **chunked, resumable, direct-to-storage** uploads — not routing large files through your application server.
<cite index="64-1">The gold-standard approach: if an upload is interrupted, resume from where it stopped, using libraries like tus-js-client/tusd or presigned URLs with S3 multipart upload — and critically, don't route files through your own server; upload directly to cloud storage, so your server never handles file bytes, avoiding memory pressure and bandwidth bottlenecks while the cloud provider handles the heavy lifting.</cite>

Mechanics of resumability (tus protocol, the most widely adopted open standard):
<cite index="68-1">A HEAD request to the upload URL returns an `Upload-Offset` header telling the client how many bytes the server already has; the client then issues a PATCH request that continues from that stored offset</cite> — no negotiation, no custom protocol, <cite index="63-1">just a number tracked server-side, and it's important to trigger your downstream processing pipeline (e.g. transcoding) from the "upload finished" event, not from a separate side-channel notification.</cite>

Why you still need a database record even with cloud-native resumable upload: <cite index="63-1">you need a database record of every upload — who uploaded it, when, what status it's in, and which chunks are done — this powers the resume feature and gives you an audit trail, plus you need to validate file types/sizes/chunk-ordering before anything touches storage (a raw presigned-URL approach only lets you find out something's wrong after the fact), and once the upload completes, the file should automatically be queued for processing server-side, triggered when status hits COMPLETED.</cite>

S3-specific mechanics worth knowing if you use S3/MinIO as the backing store: <cite index="67-1">the backend calls S3's multipart upload API to get an upload ID, the tus client sends the file stream in PATCH requests which the backend uploads to S3 in parts, and on completion S3 creates the final object by concatenating parts in ascending order by part number</cite> — <cite index="66-1">S3 caps individual parts at 5GB and limits a multipart upload to 10,000 parts total, so your chosen part size determines your maximum practical file size (e.g. 5MB parts caps you around 48.8GB; scale part size up for bigger files).</cite> MinIO is a fully compatible self-hosted alternative for local/dev environments: <cite index="66-1">MinIO implements the S3 API, so the same integration patterns work without modification.</cite>

## A.10 Global pagination — cursor/keyset pagination is the FAANG-standard, and Slack's own migration story is the most instructive case study

Requirement #6 (global pagination). The well-documented failure mode of naive pagination: <cite index="76-1">using `LIMIT <count> OFFSET <offset>` doesn't scale well for large datasets.</cite> This is precisely why GitHub, Shopify, Twitter, Facebook, and Instagram's GraphQL APIs all standardized on cursor pagination: <cite index="74-1">Relay-style pagination — developed by Meta — is used by Facebook, Instagram, GitHub, and Shopify</cite>, following the **GraphQL Cursor Connections spec**: <cite index="72-1">a query like `users(first: 5)` returns a `UserConnection` object containing the first 5 users inside `edges`, plus pagination metadata like `endCursor` (the cursor of the last user returned) and `hasNextPage` — to get the next page, you pass that `endCursor` as the `after` argument on the next query.</cite>

Two cursor styles exist and the difference matters for your architecture:
<cite index="71-1">A session-based cursor encodes server state — a token the server holds, like a snapshot or cache entry, that means nothing outside that server context and cannot be reconstructed if the session expires. In keyset pagination, by contrast, the cursor encodes data coordinates rather than server state</cite> — meaning the cursor is a self-contained, stateless pointer (e.g., an encoded `{createdAt, id}` tuple), which is the version you should build, since it survives server restarts and horizontal scaling with zero shared state.

Slack's own engineering write-up is the most useful real case study because it documents _why_ they evolved past textbook Relay and what they kept vs. discarded: <cite index="76-1">even with its trade-offs, cursor-based pagination met all of Slack's requirements for a pagination strategy; Relay's spec (edges/pageInfo, with an edge wrapping a node + a cursor) lets a client paginate forward and backward from any item in a collection — but Relay Cursor Connections don't actually enforce any particular underlying database pagination scheme, since the cursor is just an encoded opaque value, so a server could implement either offset- or true cursor-based storage underneath and still expose the same Relay-shaped API.</cite> Slack ultimately <cite index="76-1">settled on a new cursor-based strategy sharing Relay's principles but choosing to focus on doing one thing well: forward pagination through an entire dataset in a backwards-compatible way</cite>, rather than implementing Relay's full bidirectional spec. **This is the right scope for your project too** — full bidirectional Relay connections are more machinery than a small/medium product needs; forward cursor pagination with an opaque, self-describing cursor gets you 90% of the benefit.

Performance mechanics — why cursor/keyset beats OFFSET at the database layer specifically:
<cite index="77-1">Using WHERE clauses to implement cursor pagination (rather than OFFSET) lets the database leverage indexes to jump directly to the relevant records, whereas OFFSET must scan and discard that many rows first — so as the value of OFFSET grows, its cost grows too, while WHERE-based keyset pagination has roughly fixed cost regardless of how deep into the dataset you page.</cite> Practical production guardrails: <cite index="78-1">make cursors opaque so clients can't reverse-engineer or tamper with sort values, and always set a maximum page size — never let a client request an unbounded limit.</cite>

## A.11 Single identity across multiple products — how SSO/federated identity is actually architected

Requirement #7. The reference pattern is **one Identity Provider (IdP), many Service Providers (SPs)**, communicating via a signed, short-lived token — this is literally how Google's own account system spans Workspace, Cloud, and BeyondCorp Enterprise: <cite index="50-1">Google is one of the largest identity providers on the internet — for business customers, it provides administratively managed Google accounts usable across Google Workspace, Google Cloud, and BeyondCorp Enterprise, and (for third-party integration) supports SSO from multiple external identity providers via protocols including SAML.</cite>

Mechanically, this is what "logging in once and being recognized everywhere" actually requires: <cite index="53-1">a central domain performs authentication and then shares the session with other domains — for example, the authentication domain generates a signed JWT (optionally encrypted via JWE) containing everything needed to identify the user, and because it's signed, the client cannot modify it; the token is passed to the client and then to the original or any other trusting domain via redirect, and used by those domains to identify the user without a fresh login.</cite>

An enterprise-grade real implementation makes the "one login, many apps" mechanism explicit: <cite index="44-1">SSO is implemented by providing a global session and then generating protocol-specific tokens based on that global session, with tokens consumed by a routing tier to enforce a security model for accessing underlying microservices — giving a cloud-scale IAM platform on a multi-tenant, microservices architecture.</cite>

Two identity concepts you must not conflate (this trips up almost every from-scratch implementation):
<cite index="49-1">Federated Identity and Single Sign-On are different things. SSO's goal is: authenticate once, gain access to multiple related-but-independent applications, without being re-prompted to log in — normally via a cookie or token; once you're authenticated with the IdP, a session is established, and when you navigate to a different application trusting the same IdP, that application checks with the IdP, which recognizes your existing session and confirms your identity — no fresh login. You can have Federated Identity _without_ SSO — e.g., using "Login with GitHub" on five different tools, but being asked to re-authorize on each one; that's federation without single sign-on.</cite> **Logout is the sharp edge**: <cite index="49-1">in federated architectures, each application and identity provider can maintain independent sessions, making it extremely difficult to coordinate a comprehensive logout across all systems</cite> — you must design "logout everywhere" deliberately; it is not automatic.

Protocol-level building blocks to standardize on (these are the ones every real IAM platform supports, so you should too, even self-hosted): <cite index="46-1">SAML, OAuth 1.0, OAuth 2.0, OpenID Connect, and SCIM (System for Cross-domain Identity Management) for provisioning/lifecycle</cite>. For a from-scratch JS implementation, **OAuth 2.0 + OpenID Connect (OIDC)** is the correct pair: OAuth2 handles authorization/tokens, OIDC layers a standardized identity/profile claim on top, and SCIM is the standard if you ever need to sync user lifecycle (create/suspend/delete) across products automatically.

## A.12 Sources consulted

Trunk-based development & Google/Meta monorepo scale: Mergify engineering blog; TMS Outsource; _Software Engineering at Google_ (Abseil-hosted); The Pragmatic Engineer ("Inside Google's Engineering Culture"); trunkbaseddevelopment.com.
Nx/module boundaries: dev.to (module boundary articles), Nx official docs (`nx.dev/docs/features/enforce-module-boundaries`, Nx blog "Taming Code Organization with Module Boundaries"), Frontendpedia, Luong Hong Thuan's blog, Stefanos Lignos's blog.
Modular monolith / Node.js structure: LogRocket, Medium (Bilal Khursheed, Petar Ivanov, thetshaped.dev), GitHub `mgce/modular-monolith-nodejs`, devActivity.
Registry / DI / service locator patterns: Leapcell, GeeksforGeeks, RisingStack Engineering, Egor Panok's blog, Mario Casciaro (author of _Node.js Design Patterns_), O'Reilly.
Design tokens & atomic design: Medium (Maya Gomoniuk), Bornfight, GitHub `Shopify/polaris-tokens`, npm, Superside, UXPin, Shaheer Malik's blog, Shopify Restyle docs.
Identity/SSO: Google Patents (US20180075231A1, unified identity platform patent), LoginRadius, USPTO patent docs, Google Cloud Blog, Auth0 docs & blog.
Notification architecture: DEV Community (.NET 8 notification service), Medium (Madhur Banger), scalewithchintan.com, Codelit.io, Meerako, systemdesignhandbook.com, The Augmented Dev.
Media/upload architecture: Medium (Shashwat Singh, Selvakumar Ponnusamy, Shubham Soni), Codelit.io, tus.io official blog, resumablejs.com docs, DEV Community (tus + Node tutorial).
Pagination: Keyhole Software, Agility CMS, OneUptime, Contentful, Medium (Rcls — Slack pagination + DynamoDB), **Slack Engineering blog ("Evolving API Pagination at Slack")**, GraphQL.js docs, Codelit.io.
Monorepo tooling comparison (2026): dev.to (Nx vs Turborepo vs Lerna), daily.dev, digitalapplied.com, pkgpulse.com (x2), devtoolreviews.com.

---

# PART B — TRANSLATING THE RESEARCH INTO YOUR STACK

Your requirements, mapped to the FAANG pattern that satisfies them, and the concrete JS-ecosystem tool that implements it:

| #   | Your Requirement                               | FAANG-grade pattern it corresponds to                                                                                        | Concrete tool/approach in this stack                                                                                                                                                                                        |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Any frontend + MERN/MEAN + JSDoc               | Officially-supported language + enforced style guide (Google)                                                                | Node.js + Express (backend), React (frontend), MongoDB _or_ Postgres, strict JSDoc + `checkJs` via `tsconfig.json` for type-safety without TypeScript compilation                                                           |
| 2   | Registry + modular monolith + feature-based    | Bazel/Buck visibility rules → Nx tags + enforce-module-boundaries; modular-monolith-nodejs reference                         | Nx workspace, `libs/<domain>/{feature,data-access,ui,util}`, an in-house `ServiceRegistry` + `ModuleRegistry`                                                                                                               |
| 3   | Global atomic UI + per-product customization   | Design tokens (Salesforce/Shopify Polaris) + semantic token layer (Shopify Restyle pattern)                                  | `packages/design-tokens` (raw) → `packages/theme-<product>` (semantic) → `packages/ui` (atoms/molecules/organisms consuming semantic tokens only)                                                                           |
| 4   | Notification, Media, Upload, Download services | Event → queue → fan-out → per-channel workers (Slack/Meerako pattern); resumable direct-to-storage upload (tus/S3 multipart) | `services/notification-service`, `services/media-service`, BullMQ/Redis queues, tus-node-server or S3 multipart + presigned URLs                                                                                            |
| 5   | Global pagination                              | Slack's forward-only opaque cursor, keyset-indexed                                                                           | `packages/pagination` shared utility: encode/decode opaque base64 cursors over indexed `(sortKey, _id)` tuples                                                                                                              |
| 6   | Top-tier DSA + data design                     | Index-aware, algorithmically justified data structures (as opposed to accidental complexity)                                 | Documented per data-structure choice: B-tree indexes for range/pagination queries, LRU cache for hot reads, trie for search-as-you-type, consistent hashing for cache/queue sharding, heap for rate-limiter/priority queues |
| 7   | Single identity across products                | OAuth2 + OIDC IdP, global session → per-product signed JWT (Google/Auth0 pattern)                                            | `services/identity-service` (IdP) issuing OIDC-compliant tokens consumed by every product via a shared `@yourorg/auth-client` package                                                                                       |

**Key architectural decision, stated explicitly:** you are building **one Nx monorepo** containing:

- **N "products"** (deployable frontend apps + their BFF layer) that are thin — they compose features, they don't own business logic.
- **M "domain modules"** (feature-based: `identity`, `notification`, `media`, `billing`, etc.) that are modular-monolith-style — each owns its own routes/service/data-access/model, registers itself into the app via the Registry, and could later be extracted into a real microservice with minimal change because its boundary is already clean.
- **One design-system package family** (tokens → per-product themes → atomic components) shared by every product.
- **One identity service** that every other module/product depends on for `getCurrentUser()`, never for anything else — this keeps identity from becoming a god-module.

# PART C — TARGET ARCHITECTURE

## C.1 Top-level repo layout

```
your-monorepo/
├── apps/                          # deployable units only — thin composition layer
│   ├── product-a-web/             # React SPA/SSR for Product A
│   ├── product-b-web/             # React SPA/SSR for Product B (2nd product proves the pattern)
│   ├── product-a-api/              # BFF (Backend-for-Frontend) for Product A — Express
│   ├── product-b-api/              # BFF for Product B
│   └── admin-console/              # internal ops dashboard (optional, high FAANG-signal)
│
├── services/                      # modular-monolith domain services (each independently extractable)
│   ├── identity-service/           # THE single source of user identity (OIDC provider)
│   ├── notification-service/       # fan-out + channel dispatch (email/sms/push/in-app)
│   ├── media-service/              # upload/download/transcode/CDN issuance
│   └── billing-service/            # example of a 3rd business-domain module (optional/stub)
│
├── libs/                          # Nx libraries — the actual "feature-based module" units
│   ├── identity/
│   │   ├── feature-auth/           # scope:feature — UI flows, orchestration
│   │   ├── data-access-identity/   # scope:data-access — DB/API calls only
│   │   ├── domain-identity/        # scope:domain — pure business logic, no I/O
│   │   └── util-identity/          # scope:util — stateless helpers
│   ├── notification/
│   │   ├── feature-notifications/
│   │   ├── data-access-notifications/
│   │   ├── domain-notifications/
│   │   └── util-notifications/
│   ├── media/
│   │   ├── feature-media/
│   │   ├── data-access-media/
│   │   ├── domain-media/
│   │   └── util-media/
│   └── shared/
│       ├── ui/                     # scope:ui — atomic design system (see C.3)
│       │   ├── atoms/
│       │   ├── molecules/
│       │   ├── organisms/
│       │   └── templates/
│       ├── design-tokens/          # raw + semantic tokens per product
│       ├── pagination/             # cursor encode/decode, keyset query helpers
│       ├── registry/               # ServiceRegistry + ModuleRegistry core
│       ├── logger/
│       ├── error-handling/
│       ├── validation/             # shared JSDoc-typed schema validators (zod/joi)
│       └── testing-utils/
│
├── tools/                          # codegen scripts, ADR templates, custom Nx generators
├── docs/
│   └── adr/                        # Architecture Decision Records (mandatory, see A.5)
├── nx.json                          # Nx workspace config — tags, target defaults, caching
├── package.json                     # root — pnpm workspaces
├── pnpm-workspace.yaml
├── tsconfig.base.json                # path aliases for every lib; checkJs:true for JSDoc typing
├── .eslintrc.json                   # enforce-module-boundaries rules live here
└── turbo.json (optional)            # if layering Turborepo cache on top of Nx tasks
```

**Why `apps/` vs `services/` vs `libs/` are three different things (this is the part most from-scratch monorepos get wrong):**

- `apps/` = things that get deployed and have a runtime entrypoint (a server listening on a port, or a bundled SPA).
- `services/` = domain-owning backend modules with their own persistence, business rules and (optionally) their own process — today they may be mounted _inside_ a product's BFF process (modular monolith), tomorrow they can run standalone.
- `libs/` = everything else: pure logic, UI, and cross-cutting utilities that get imported by both `apps/` and `services/`, never the reverse.

## C.2 Module boundary rules (the enforced part — mirrors A.3)

Define tags in every `project.json`:

- `scope:feature`, `scope:data-access`, `scope:domain`, `scope:util`, `scope:ui`
- `domain:identity`, `domain:notification`, `domain:media`, `domain:billing`, `domain:shared`
- `platform:node`, `platform:web` (so browser code never imports a Node-only package)

ESLint dependency constraints (conceptually — actual config lives in `.eslintrc.json`):

1. A `scope:feature` lib may depend on `scope:data-access`, `scope:domain`, `scope:util`, `scope:ui` — **never another `scope:feature`** (prevents horizontal coupling between features).
2. A `scope:data-access` lib may depend on `scope:domain`, `scope:util` — **never `scope:feature`** (prevents inverted/vertical coupling).
3. A `scope:domain` lib may depend only on `scope:util` — pure business logic, zero I/O, zero framework imports. This is what makes your business rules unit-testable in milliseconds and portable if you ever change frameworks.
4. Cross-`domain:*` imports are forbidden except through an explicit **public API** (`index.js`) tagged `domain:shared` or through the Registry (see D.1) — e.g., `domain:media` code must never `require('../../identity/data-access-identity/db-model')` directly; it asks the Identity Registry entry for `getCurrentUser(userId)`.
5. `apps/*` may depend on any `scope:feature`, but nothing may depend on an app.

## C.3 Atomic UI tree (requirement #3, structural view — full design detailed in Part D.2)

```
libs/shared/ui/
├── atoms/       (Button, Input, Icon, Avatar, Badge, Spinner)
├── molecules/   (FormField, SearchBar, NotificationBell, Pagination controls)
├── organisms/   (NavBar, DataTable, UploadDropzone, NotificationCenter)
├── templates/   (DashboardLayout, AuthLayout, SettingsLayout)
└── theme/
    ├── ThemeProvider.jsx        # reads active product theme, injects CSS vars/context
    └── tokens.contract.js       # the *shape* every product theme must satisfy (documented via JSDoc typedefs)

libs/shared/design-tokens/
├── raw/
│   └── base.tokens.json          # colorBlue500, spacing-4, radius-2, fontSize-md ...
└── themes/
    ├── product-a.theme.js        # semantic mapping: primary -> raw.colorBlue500, etc.
    └── product-b.theme.js        # same semantic *keys*, different raw values/brand
```

## A.13 EXTENDED RESEARCH — beyond the 7 stated requirements (CI/CD governance, data isolation, authorization)

The first research pass covered exactly the 7 requirements. This section covers the surrounding FAANG-grade concerns that any real monorepo needs, whether or not they were explicitly asked for — because an unaddressed one of these is exactly where a "toy" monorepo breaks in production.

### A.13.1 CI/CD strategy for a monorepo (not just "how to build a registry")

The single biggest operational risk in any monorepo, documented consistently across sources, is **running everything on every commit**: <cite index="90-1">running all tests and builds for every change wastes resources and time — the key is detecting which parts of the codebase changed and running only the relevant pipelines.</cite> The standard shape of this pipeline:
<cite index="93-1">Change Detector compares the current branch with main, identifies changed files, maps files to projects using the dependency graph, and returns the affected applications list — so if you only change `web-react`, you should NOT rebuild `api-springboot`.</cite> At bigger scale, this is implemented as **parent/child pipelines**: <cite index="90-1">the parent pipeline detects changes and triggers child pipelines for affected projects only.</cite>

Ownership and review discipline is treated as a first-class CI/CD concern, not an afterthought: <cite index="91-1">implement access controls using GitHub's CODEOWNERS file to manage who can approve changes to specific parts of the repository, and use path-based triggers so CI only runs jobs when relevant parts of the codebase change.</cite> A concrete CODEOWNERS layout used in practice: <cite index="89-1">`/apps/web/ @web-team`, `/apps/api/ @backend-team`, `/packages/ui/ @design-systems`, `/packages/utils/ @platform-team`</cite> — mapped onto your repo, that becomes `/libs/identity/ @identity-owner`, `/libs/shared/ui/ @design-system-owner`, etc.

Versioning inside a monorepo should be **per-package, not global**: <cite index="88-1">version each service or library independently using tools like Lerna, Nx, or Changesets rather than a single global version — this reduces unnecessary version bumps and simplifies dependency tracking — and enforce Conventional Commits (`feat:`, `fix:`, `chore:`) to automate changelog generation, versioning, and release notes.</cite> Cross-cutting changes get one more explicit safeguard: <cite index="88-1">gate releases with contract tests before releasing, to validate that interdependent services conform to expected interfaces and to stop breaking changes propagating unnoticed.</cite>

Common anti-patterns called out repeatedly: <cite index="95-1">"the kitchen sink" monorepo (shoving unrelated projects together with no real relationship), ignoring flaky tests instead of quarantining them, and over-engineering — you don't need Bazel-grade tooling for 3 packages, start simple and grow into the heavier tooling as the repo actually grows.</cite>

### A.13.2 Data isolation inside a modular monolith — the part your requirement #2 implies but doesn't say out loud

"Modular monolith" only holds up if the _database_ is modular too — this is the most common way modular monoliths quietly rot back into a big-ball-of-mud, and it's extremely well documented:
<cite index="102-1">What starts as a convenient `JOIN payments.transactions ON orders.payment_id = payments.id` becomes the coupling trap — extracting the payments module later requires untangling months (or years) of accumulated database coupling. A query like `SELECT o.*, c.email FROM orders_schema.orders o JOIN customers_schema.customers c ON o.customer_id = c.id` still works inside a monolith, but breaks the moment you separate services — which is exactly the point: it forces you to implement proper service-to-service communication instead of a sneaky database join.</cite>

Four recognized levels of data isolation, from weakest to strongest, each a legitimate choice depending on stage:

1. **Shared tables, no isolation** — <cite index="97-1">simple to implement, easy to query across modules, but offers limited isolation: changes in one module's schema can affect others, and there's real risk of data leakage between modules.</cite> Not recommended even at small scale for your project, given you explicitly want modular-monolith discipline.
2. **Separate schema per module, same database** — <cite index="97-1">a good balance between isolation and manageability: each module's data lives in its own schema within a single database</cite>, and this is the choice most reference implementations converge on: <cite index="99-1">in a modular monolith each module has its own database schema and its own data-access context — this separation is intentional, it enforces boundaries and makes it possible to extract a module into a microservice later.</cite> **This is the recommended default for your project.**
3. **Separate database per module, same server/infra** — <cite index="98-1">offers the strongest isolation but demands more from your infrastructure and team; choose this when you have a clear roadmap toward microservices, strong DevOps maturity, and a team comfortable with eventual consistency.</cite>
4. **Fully separate infrastructure per module** (different DB engine even) — reserved for modules with genuinely different data shapes (e.g., a graph-shaped module next to a relational one); <cite index="101-1">modules following this rule can only access their own tables and cannot share tables with other modules — full stop.</cite>

The hard rule that makes any of these levels actually work, regardless of which you pick: <cite index="98-1">module boundaries must be enforced at the code level, not just in documentation</cite> — every module exposes a narrow public interface/repository class (e.g., `IIdentityModule`, `INotificationModule`) and no other module is allowed to touch its tables directly, even though they physically live in the same server.

When you genuinely need cross-module data (a dashboard needing data from Identity + Billing + Notification, for example), the documented, non-hacky answer is **not** a cross-schema JOIN: <cite index="99-1">the Composite View Pattern — also known as Backend-for-Frontend (BFF) — creates a separate aggregation layer that queries multiple modules and combines the results, sitting between the frontend and the modular monolith</cite>, and for pure reporting/analytics, <cite index="102-1">use a read replica plus an ETL pipeline into a reporting store where you can freely cross-join, and for search, use a dedicated search index (e.g., Elasticsearch) that modules publish into rather than querying each other's live tables.</cite> This maps directly onto your `apps/product-a-api` (the BFF) and a future `services/search-service` / `services/reporting-service`.

### A.13.3 Authorization (RBAC/ABAC) across multiple products — the part that makes "single identity" actually useful

Single identity (requirement #7) answers "who is this user?" — it does not answer "what can this user do in Product B?" That's a separate, equally important layer:
<cite index="106-1">RBAC introduces an abstraction: users belong to roles (Viewer, Editor, Admin), roles define which operations are allowed, and permissions target specific resources and actions rather than being assigned per-user — this keeps access control predictable as systems and teams grow.</cite>

Two things the research flags as commonly under-built, both directly relevant to a multi-product platform:

- **Client-side flags/roles are not security**: <cite index="105-1">the actual enforcement of access rights must happen on the server side using the application's authorization logic, not just by hiding a UI element behind a client-side flag — you should secure client-side flags by assuming they are always public.</cite>
- **Plain RBAC eventually isn't expressive enough** once you have per-product, per-resource permissions (e.g., "Admin of Product A" should not automatically be "Admin of Product B"): <cite index="112-1">modern applications often blend RBAC, ABAC (attribute-based), and ReBAC (relationship-based) to balance simplicity and expressiveness — RBAC handles broad access categories, while ABAC/ReBAC refine permissions based on context and relationships</cite>, evaluated by a policy engine (open-source examples: OpenFGA, Oso, Casbin) rather than scattered `if (user.role === 'admin')` checks across the codebase.
- Feature-flag systems are themselves a security surface, not just a release tool: <cite index="105-1">treat your feature-flag system as a Tier-1 control plane with strict RBAC and least privilege, segregate tokens by environment, and require audit logs so you can reconstruct exactly who changed a flag state and why.</cite>

**Design implication for your architecture:** identity (`who`) and authorization (`what can they do, in which product`) must be two separate, composable concerns. `services/identity-service` issues the identity token; a separate `libs/shared/authz` package (policy evaluation, `can(user, action, resource, product)`) is consulted by every product's BFF on every privileged request. Never bake per-product permission logic into the identity service itself — that's exactly the kind of god-module coupling Part A.6 warned about.

---

# PART D — DEEP DIVES (ONE PER REQUIREMENT, WITH IMPLEMENTATION-LEVEL DETAIL)

## D.1 Registry pattern + modular monolith + feature-based modules

**Core primitive — `ServiceRegistry`** (lives in `libs/shared/registry`):

```js
/**
 * @template T
 * @typedef {{ name: string, factory: (deps: Record<string, any>) => T, dependencies?: string[], singleton?: boolean }} ServiceDefinition
 */

class ServiceRegistry {
  #definitions = new Map();
  #singletons = new Map();

  /** @param {ServiceDefinition} def */
  register(def) {
    if (this.#definitions.has(def.name)) {
      throw new Error(
        `Service "${def.name}" already registered — no silent overrides.`,
      );
    }
    this.#definitions.set(def.name, def);
    return this;
  }

  /** @param {string} name @returns {any} */
  resolve(name) {
    if (this.#singletons.has(name)) return this.#singletons.get(name);
    const def = this.#definitions.get(name);
    if (!def) throw new Error(`Service "${name}" not registered.`);
    const deps = {};
    for (const dep of def.dependencies ?? []) deps[dep] = this.resolve(dep);
    const instance = def.factory(deps);
    if (def.singleton) this.#singletons.set(name, instance);
    return instance;
  }
}

module.exports = { ServiceRegistry };
```

**`ModuleRegistry`** — the higher-level companion that turns each `services/*` folder into a self-registering plug-in, mirroring the reference Node modular-monolith design where each module decides for itself whether to react to an event:

```js
/**
 * @typedef {{
 *   name: string,
 *   registerRoutes?: (app: import('express').Express) => void,
 *   registerServices?: (registry: ServiceRegistry) => void,
 *   onEvent?: (eventName: string, payload: unknown) => Promise<void> | void
 * }} AppModule
 */

class ModuleRegistry {
  /** @type {AppModule[]} */
  #modules = [];

  /** @param {AppModule} mod */
  register(mod) {
    this.#modules.push(mod);
    return this;
  }

  /** @param {import('express').Express} app */
  mountAll(app) {
    for (const m of this.#modules) m.registerRoutes?.(app);
  }

  /** @param {ServiceRegistry} registry */
  registerAllServices(registry) {
    for (const m of this.#modules) m.registerServices?.(registry);
  }

  /** @param {string} eventName @param {unknown} payload */
  async dispatch(eventName, payload) {
    // every module decides for itself whether the event is relevant — core dispatcher doesn't care
    await Promise.allSettled(
      this.#modules.map((m) => m.onEvent?.(eventName, payload)),
    );
  }
}
```

Each domain module (`services/notification-service/index.js`) exports one `AppModule` object. The app's entrypoint (`apps/product-a-api/main.js`) is then just:

```js
const { ModuleRegistry } = require("@yourorg/registry");
const identityModule = require("@yourorg/identity-service");
const notificationModule = require("@yourorg/notification-service");
const mediaModule = require("@yourorg/media-service");

const modules = new ModuleRegistry()
  .register(identityModule)
  .register(notificationModule)
  .register(mediaModule);

modules.registerAllServices(serviceRegistry);
modules.mountAll(app);
```

This single pattern _is_ the "registry-based + modular-monolith + feature-based" requirement, made concrete: adding a new domain means writing a new `AppModule` and registering it — zero edits to existing modules, and the module is trivially extractable into its own process later (swap `mountAll`/in-process `dispatch` for an HTTP route and a message-queue subscriber; the module's internal code doesn't change).

**Feature-based internal layout of every domain module** (mirrors Nx tags from Part C.2):

```
libs/notification/
├── feature-notifications/        # orchestration: "send welcome email on signup"
├── data-access-notifications/    # Mongo/Postgres queries, queue publishing — I/O only
├── domain-notifications/         # pure functions: templating rules, throttle math — zero I/O
└── util-notifications/           # stateless helpers (formatters, constants)
```

## D.2 Global atomic UI + product-level customization

Three-layer token architecture (validated against Shopify Polaris's actual published pattern — see A.7):

**Layer 1 — raw tokens** (`libs/shared/design-tokens/raw/base.tokens.json`): the literal design values, brand-agnostic — `color-blue-500: "#2563eb"`, `spacing-4: "16px"`, `radius-md: "8px"`, `font-size-md: "16px"`.

**Layer 2 — semantic theme per product** (`libs/shared/design-tokens/themes/product-a.theme.js`):

```js
/** @typedef {import('../tokens.contract').ThemeContract} ThemeContract */
const raw = require("../raw/base.tokens.json");

/** @type {ThemeContract} */
module.exports = {
  color: {
    backgroundPrimary: raw["color-white"],
    backgroundSubdued: raw["color-sky-lighter"],
    foregroundPrimary: raw["color-ink-dark"],
    brandAccent: raw["color-blue-500"], // Product A brand
    danger: raw["color-red-500"],
  },
  spacing: {
    xs: raw["spacing-1"],
    sm: raw["spacing-2"],
    md: raw["spacing-4"],
    lg: raw["spacing-6"],
  },
  radius: { sm: raw["radius-sm"], md: raw["radius-md"] },
};
```

`product-b.theme.js` implements the **exact same keys** (`ThemeContract`) with different raw values (e.g., `brandAccent: raw['color-purple-500']`). This is the actual mechanism that satisfies "global atomic UI + product-level customization": **the contract (shape) is global and frozen; the values are per-product.**

**Layer 3 — atomic components consume only semantic tokens, never raw ones and never hard-coded values:**

```jsx
// libs/shared/ui/atoms/Button.jsx
import { useTheme } from "../theme/ThemeProvider";

/** @param {{ variant?: 'primary'|'danger', children: React.ReactNode, onClick?: () => void }} props */
export function Button({ variant = "primary", children, onClick }) {
  const theme = useTheme();
  const bg =
    variant === "danger" ? theme.color.danger : theme.color.brandAccent;
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        borderRadius: theme.radius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      }}
    >
      {children}
    </button>
  );
}
```

`ThemeProvider` is instantiated once per app (`apps/product-a-web` imports the `product-a.theme.js`, `apps/product-b-web` imports `product-b.theme.js`) — the exact same `<Button>` component renders on-brand for each product with zero forking, matching Atlassian's documented approach of one shared component library serving visually distinct products (Jira/Confluence/Trello).

**Governance, even solo:** keep a `libs/shared/ui/CONTRIBUTING.md` with the rule "no component may import a color/spacing value that isn't a semantic token" and enforce it with a small ESLint rule or a lint-staged grep check — this is the miniature version of what a real design-system team does at 70-person scale (A.7).

## D.3 Notification, Media, Upload, Download services

**Notification service** — event → per-channel queue → dispatcher (per A.8):

```
services/notification-service/
├── api/            # POST /notifications (enqueue only — returns 202 Accepted in <10ms)
├── fanout/          # reads ingress queue, resolves recipients + channel preferences, republishes per channel
├── channels/
│   ├── email.worker.js      # own queue, own worker pool, own rate limiter
│   ├── sms.worker.js
│   ├── push.worker.js
│   └── in-app.worker.js     # writes to per-user notification store, read by NotificationCenter organism
├── preferences/     # per-user, per-channel opt-in/opt-out store
└── templates/       # rendering (sandboxed templating — never eval user-editable strings as code)
```

Rules straight from the research (A.8), non-negotiable at any scale: the API only enqueues (never calls a provider inline); each channel gets its own queue and worker pool so a slow SMS gateway never blocks push/email; every send goes through a transactional outbox so an event is never silently lost between DB write and queue publish; workers scale off queue depth, not request rate; mandatory notifications (2FA, legal) bypass user preference filtering — everything else respects it.

**Media/Upload/Download service** — resumable, direct-to-storage (per A.9):

```
services/media-service/
├── upload/          # tus-compatible endpoint OR S3 presigned-URL issuance — never buffers file bytes through Node
├── processing/       # triggered on upload-complete event: transcode, thumbnail, virus-scan
├── download/         # issues time-limited signed CDN/S3 URLs — never streams large files through the app server
└── metadata/         # DB record: owner, status (PENDING/UPLOADING/PROCESSING/READY/FAILED), chunks-received, checksum
```

Non-negotiable rules from A.9: validate file type/size/chunk-order server-side before touching storage (a raw presigned URL alone can't do this); track upload state in a DB row (`status`, `chunksReceived`) so resume is a lookup, not a negotiation; trigger the processing pipeline from the server-observed "upload complete" event, not a client-reported one (a client can lie or disappear); size your S3 part size deliberately (5MB parts → ~48.8GB max; scale up for bigger files, since S3 caps parts at 5GB and 10,000 parts total).

## D.4 Global pagination

Shared package `libs/shared/pagination` implements **opaque, self-describing, keyset cursors** (the Slack-validated approach from A.10) — not session state, not raw offsets:

```js
/**
 * @typedef {{ sortValue: string|number, id: string }} CursorPayload
 */

/** @param {CursorPayload} payload @returns {string} opaque cursor */
function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** @param {string} cursor @returns {CursorPayload} */
function decodeCursor(cursor) {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

const MAX_PAGE_SIZE = 50; // hard server-side ceiling — never trust client "limit"

/**
 * Builds a MongoDB filter for forward keyset pagination on (sortField, _id) — index-friendly, O(log n + limit).
 * @param {{ cursor?: string, sortField: string, limit?: number }} args
 */
function buildKeysetQuery({ cursor, sortField, limit = 20 }) {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  if (!cursor) return { filter: {}, limit: safeLimit };
  const { sortValue, id } = decodeCursor(cursor);
  return {
    filter: {
      $or: [
        { [sortField]: { $lt: sortValue } },
        { [sortField]: sortValue, _id: { $lt: id } },
      ],
    },
    limit: safeLimit,
  };
}

module.exports = {
  encodeCursor,
  decodeCursor,
  buildKeysetQuery,
  MAX_PAGE_SIZE,
};
```

Every list endpoint across every product/service imports this **one** package — this is what "global pagination" actually means: one cursor format, one page-size ceiling, one query-building convention, everywhere, so a client-side `<Pagination>` molecule (Part C.3) works identically regardless of which product/module's data it's paginating. Required composite index per collection: `{ [sortField]: -1, _id: -1 }` — without it you've reintroduced OFFSET-style full scans with extra steps.

## D.5 DSA & data-design choices, stated explicitly with justification

A FAANG-grade system doesn't sprinkle algorithms randomly — every non-trivial data structure choice is tied to a specific, named access pattern:

| Problem                                                                         | Data structure / algorithm                                                                                 | Why (Big-O justification)                                                                                                                                 |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paginated list reads at scale                                                   | Keyset pagination over a composite B-tree index `(sortField, _id)`                                         | O(log n + page size) vs. OFFSET's O(n) — see A.10                                                                                                         |
| Hot read cache (user profile, active session, theme config)                     | LRU cache (Redis, or in-process `Map` + doubly linked list)                                                | O(1) get/set/evict; bounds memory while keeping p99 latency flat under repeated reads                                                                     |
| Search-as-you-type (user search, media filename search)                         | Trie (prefix tree) or a dedicated search index (Elasticsearch/OpenSearch) for anything beyond prefix match | Trie: O(k) lookup for a k-length prefix, independent of corpus size; beyond simple prefixes, offload to a real inverted index rather than reinventing one |
| Notification/job priority queue (rate-limited sends, retries with backoff)      | Binary heap (priority queue) inside BullMQ/Redis-backed queues                                             | O(log n) insert/extract-min — lets "send in 5 minutes" and "send now" coexist in one structure without scanning                                           |
| Rate limiting per user/IP (API gateway, notification channel throttling)        | Sliding-window counter or token bucket (Redis `INCR` + TTL, or a leaky-bucket Lua script)                  | O(1) per check; token bucket specifically absorbs bursts without the herding/undercounting flaws of fixed windows                                         |
| Sharding cache/queue load across workers                                        | Consistent hashing                                                                                         | Adding/removing a worker node only reshuffles ~1/N of keys, not all of them — critical once notification/media workers scale horizontally                 |
| Duplicate/idempotency detection (webhook retries, at-least-once queue delivery) | Hash set / Bloom filter (for very high volume, probabilistic pre-check) keyed by idempotency key           | O(1) average lookup; Bloom filter trades a small false-positive rate for O(1) space-efficient pre-filtering before a real DB check                        |
| Permission checks across roles/resources (RBAC/ABAC evaluation)                 | Precomputed role→permission bitsets, or a policy graph evaluated once and cached per request               | Bitset intersection is O(1)-ish (word-sized AND) vs. re-walking a role hierarchy on every request                                                         |
| Cross-module aggregate reporting (BFF composite views, per A.13.2)              | Read replica + scheduled ETL into a denormalized reporting store, never live cross-schema joins            | Keeps OLTP write path fast; avoids the coupling trap documented in A.13.2                                                                                 |

**Data modeling principle that ties this together:** every collection/table that will ever be paginated must be designed with its sort/index key decided _before_ the schema is written, not retrofitted — retrofitting a keyset index onto an unsorted, unindexed collection under production load is one of the most common "we built it wrong" failures in the wild.

## D.6 Single identity across multiple products

`services/identity-service` is an OAuth2 + OIDC provider (self-hosted options: build minimal OIDC support yourself on top of `jose`/`openid-client`, or adopt Keycloak/Ory Hydra if you don't want to hand-roll token issuance — hand-rolling OIDC correctly, especially token revocation and JWKS rotation, is a well-known place to introduce subtle security bugs).

Flow (per A.11):

1. User authenticates once against `identity-service` → a **global session** is established (server-side session store, e.g. Redis).
2. `identity-service` issues a short-lived, signed **ID token** (OIDC) + **access token** (OAuth2) scoped to the requesting product.
3. Every product's BFF (`apps/product-a-api`) verifies the token signature against `identity-service`'s public JWKS — it never talks to a shared session store directly; it never re-implements auth logic; it depends only on `@yourorg/auth-client`.
4. **Logout-everywhere** is handled explicitly (this is the sharp edge called out in A.11): logging out invalidates the _global session_, and every product's BFF checks token validity against a short-TTL revocation check (or simply relies on very short access-token TTLs — e.g., 5–15 minutes — with silent refresh, so a revoked session naturally stops working within minutes even without a live revocation call on every request).

```js
// libs/shared/auth-client — every product imports ONLY this, never talks to identity-service internals directly
/** @param {import('express').Request} req @returns {Promise<{ userId: string, roles: string[] } | null>} */
async function getCurrentUser(req) {
  const token = extractBearerToken(req);
  if (!token) return null;
  const claims = await verifyAgainstJwks(token); // throws on invalid/expired/revoked
  return { userId: claims.sub, roles: claims.roles ?? [] };
}
module.exports = { getCurrentUser };
```

Authorization (per A.13.3) is deliberately a **separate** package (`libs/shared/authz`) — `identity-service` answers "who," `authz` answers "what can they do, in Product B specifically" — so identity never becomes the god-module every other service is afraid to touch.

---

# PART E — STEP-BY-STEP IMPLEMENTATION PLAN

Build in this order. Each phase produces something runnable — never batch multiple phases before running/testing.

### Phase 0 — Repo bootstrap & governance (½–1 day)

1. `pnpm init` → set up `pnpm-workspace.yaml` (`apps/*`, `services/*`, `libs/**`).
2. `npx create-nx-workspace@latest --preset=ts` (allow JS + JSDoc; set `"checkJs": true` in `tsconfig.base.json` so JSDoc gets real type-checking without a TS compile step).
3. Root `.eslintrc.json`: install `@nx/eslint-plugin`, define the tag taxonomy (`scope:*`, `domain:*`, `platform:*`) from Part C.2, write the `depConstraints`.
4. Add `CODEOWNERS`, a `docs/adr/0001-modular-monolith-over-microservices.md` (write your first ADR now, while the reasoning is fresh — per A.5).
5. Set up Conventional Commits + Changesets for per-package semantic versioning (A.13.1).
6. CI skeleton (GitHub Actions/GitLab CI): one workflow, `nx affected -t lint,test,build` gated on changed files only (A.13.1) — build this before you have much code, so it's never an afterthought.

### Phase 1 — Shared foundation libs (1–2 days)

Build, in this exact order (each depends only on the previous):

1. `libs/shared/util` — logger, error-handling, env-config loader.
2. `libs/shared/registry` — `ServiceRegistry` + `ModuleRegistry` (Part D.1). Unit test it in isolation before anything depends on it.
3. `libs/shared/pagination` — cursor encode/decode + keyset query builder (Part D.4). Unit test with a fake in-memory dataset.
4. `libs/shared/design-tokens` — raw tokens + `ThemeContract` JSDoc typedef + one theme (`product-a`).
5. `libs/shared/ui` — atoms only for now (Button, Input, Icon) consuming the theme contract. Storybook it if time allows — even a minimal one pays for itself the moment you add product B.

### Phase 2 — Identity service first, always (2–4 days)

Identity is a dependency of everything else — build and stabilize it before Notification/Media, even though it's listed 4th/7th in your requirements.

1. `services/identity-service`: user model, password/OAuth login, OIDC-shaped token issuance, JWKS endpoint, Redis-backed global session.
2. `libs/shared/auth-client`: `getCurrentUser(req)` — the only way any other module ever touches identity.
3. `libs/shared/authz`: role/permission model, `can(user, action, resource, product)` — start with plain RBAC (Part A.13.3); don't reach for ABAC/ReBAC until you actually have a case plain roles can't express.
4. First real end-to-end test: one `apps/product-a-api` route, protected, using `auth-client` + `authz` — prove the whole chain works before building anything else.

### Phase 3 — First product, thin (3–5 days)

1. `apps/product-a-web` (React) + `apps/product-a-api` (Express BFF) — wire up `ModuleRegistry`, mount the identity module.
2. Build one full vertical feature end-to-end (e.g., user profile CRUD) touching every layer: `feature-*` → `data-access-*` → `domain-*`, using the shared `ui` atoms and the pagination package for a list view.
3. This is your "does the whole architecture actually work" checkpoint — do not proceed to Phase 4 until this feature is fully working, tested, and deployed to at least a staging environment.

### Phase 4 — Platform services (in parallel once Phase 3's pattern is proven): (1–2 weeks)

1. `services/notification-service` — start with in-app + email channels only; add SMS/push once the fan-out/queue skeleton (Part D.3) is proven with two channels.
2. `services/media-service` — start with direct S3/MinIO presigned-URL upload (simpler than full tus) for a v1; upgrade to resumable chunked upload once basic upload/download/CDN-serving works end-to-end.
3. Wire both into `apps/product-a-api` via the `ModuleRegistry` — no new mounting mechanism, reuse Phase 2/3's pattern exactly.

### Phase 5 — Second product proves the architecture (3–5 days)

1. `apps/product-b-web` + `apps/product-b-api`, `libs/shared/design-tokens/themes/product-b.theme.js`.
2. Reuse **every** shared lib and service as-is. If you find yourself forking a "shared" component or duplicating identity logic here, that's a signal a boundary was drawn wrong in Phase 1–2 — fix the abstraction, don't route around it.
3. Prove single-identity works across products: log in on Product A, confirm the session/token is recognized (per whatever cross-domain session strategy you chose — see A.11's SSO section) on Product B without a second login.

### Phase 6 — Hardening & governance (ongoing, start in parallel with Phase 4)

1. DB isolation: pick separate-schema-per-module (Part A.13.2 recommended default) and enforce it — no cross-schema joins, ever; add a lint/CI check that greps for cross-module raw queries if feasible.
2. Observability: structured logging with correlation IDs threaded through the registry's `dispatch()`, basic metrics (queue depth, request latency, cache hit rate).
3. Security pass: secrets via environment/secret-manager (never committed), dependency scanning (`npm audit`/Dependabot/Renovate — A.13.1), rate limiting on public endpoints (Part D.5's token-bucket entry).
4. Load-test the pagination and notification fan-out paths specifically — these are the two subsystems designed for scale; verify the design assumptions under real load before trusting them.
5. Write the remaining ADRs as decisions get made (DB isolation level chosen, IdP self-hosted vs. Keycloak, queue technology chosen) — this is what makes the repo legible to the next engineer (or to you, in six months).

---

# PART F — DECISIONS LOG: THE ARCHITECTURE, MADE SELECTIVE (NO OPEN QUESTIONS)

You asked for the checklist to stop being a checklist — every item below is now a made decision for **this project specifically**: a solo/small-team build, running entirely **local + free-tier until Product 1 ships**, that still has to _look and behave_ like a professional, FAANG-adjacent setup so the migration/scale path later is a config change, not a rewrite.

Rule used to make every call below: **pick the option that is free or self-hosted locally, is the same technology/pattern a real production deployment would use (no throwaway toy substitutes), and requires the least amount of re-architecture when you do eventually deploy.** Where a decision changes once you actually deploy, that's noted as "**At launch:**".

**A — Access control / permissions**
Decision: build `authz` as a small in-repo library from day one (plain RBAC — user → roles → permissions, stored in your own DB), not a hosted vendor (Auth0/Oso Cloud cost money and add a network dependency you don't need pre-launch). Enforce every check server-side in the BFF layer; treat any client-side flag/role check as cosmetic only. CODEOWNERS file goes in now even solo — it's free, and it documents ownership boundaries for when you _do_ bring on collaborators.
_At launch:_ no change — this scales as-is; only add ABAC/ReBAC (Oso/OpenFGA) if you hit a case plain roles can't express.

**B — Backups & disaster recovery**
Decision: local Docker volumes for Mongo/Postgres + a scheduled `mongodump`/`pg_dump` cron script writing to a local/free cloud-storage folder (e.g., free-tier Backblaze B2 or just a synced local folder). Write the "identity-service is down" runbook now as a markdown file in `docs/runbooks/` — it costs 20 minutes and it's the single highest-blast-radius failure in your system.
_At launch:_ swap the destination folder for a real managed backup target; the script logic doesn't change.

**C — CI/CD**
Decision: **GitHub Actions free tier** (2,000 CI minutes/month free on private repos, unlimited on public) running `nx affected -t lint,test,build` on every push. No merge-queue product needed at your team size — trunk-based development with required status checks on `main` gives you the same safety without paying for Mergify.
_At launch:_ add a merge queue only once you have multiple people merging concurrently.

**D — Data isolation**
Decision: **separate schema per module, single free database instance** (local Docker Mongo or Postgres) — this is the "good balance" tier from A.13.2 and it's free at any scale you'll hit pre-launch. No cross-schema joins in code, enforced by convention + a lightweight custom ESLint/grep check in CI that flags cross-module raw queries.
_At launch:_ same setup, just point at a managed DB (Atlas free tier / Supabase free tier / Railway free tier all work); don't split into separate DB instances until a module actually needs independent scaling.

**E — Events & idempotency**
Decision: **BullMQ + local Docker Redis** (fully free, self-hosted) for all queues (notification fan-out, media processing). Every consumer checks an idempotency key against a Redis `SET NX` before processing — free, O(1), no separate infra needed for this at your scale.

**F — Feature flags**
Decision: **do not adopt a third-party feature-flag service** (LaunchDarkly/Unleash Cloud cost money you don't need yet). Build one `feature_flags` table + a tiny `isEnabled(flagKey, userId)` helper in `libs/shared/util`. It's RBAC-gated (only admins can toggle) and audit-logged (a `flag_changes` table) from day one — the professional pattern, minus the vendor bill.
_At launch:_ self-host Unleash (OSS, free, Docker) if flag volume/complexity grows past a single table.

**G — (Governance) Design system**
Decision: enforce "components only consume semantic tokens" with a one-line custom ESLint rule (grep-based is fine) rather than a heavyweight design-tooling pipeline (Figma tokens sync, Style Dictionary, etc.) — those are worth adopting once you have a second designer/product, not before.

**H — (Hardening) Secrets management**
Decision: `.env` files, git-ignored, one per app/service, with a committed `.env.example` documenting required keys. No paid secret manager needed pre-launch.
_At launch:_ migrate to your host's built-in secret manager (Railway/Render/Fly.io all have free-tier-friendly env-var secret storage) — same variable names, zero code change if you read from `process.env` consistently now.

**I — Identity & session**
Decision: **do not stand up Keycloak/Ory Hydra** for a pre-launch solo build — that's real infra overhead for a problem you don't have yet (multiple external IdPs, enterprise SSO customers). Instead: hand-roll a minimal OIDC-_shaped_ `identity-service` (own user table, bcrypt/argon2 password hashing, JWT access tokens signed with a locally-generated RS256 keypair, JWKS endpoint serving the public key, Redis-backed session for "logout everywhere"). This keeps the _shape_ production-correct (any product's BFF just verifies against JWKS — swapping in real Keycloak later is a config change, not a rewrite) while costing nothing and running entirely in Docker.
_At launch:_ if you ever need social login (Google/GitHub OAuth) or enterprise SAML, that's the trigger to graduate to Keycloak — not before.

**J — JSDoc/type safety**
Decision: `"checkJs": true` in `tsconfig.base.json`, enforced as a required CI check (`tsc --noEmit`) from Phase 0 — this is free, has zero infra cost, and is the highest-leverage bug-prevention tool available to a JS-only (no TypeScript build step) codebase.

**K — Keyset pagination correctness**
Decision: every collection that will ever be paginated gets its composite index (`{ sortField: -1, _id: -1 }`) defined in the same migration/schema file that creates the collection — not added later. Page-size ceiling (`MAX_PAGE_SIZE = 50`) is hardcoded in the shared `pagination` package, not configurable per-request.

**L — Logging & observability**
Decision: **Pino** (structured JSON logging, free, fast) + a correlation-ID middleware that generates a request ID and threads it through `ModuleRegistry.dispatch()`. For viewing logs pre-launch: just stdout + `docker logs`, or a free local Grafana+Loki stack via `docker-compose` if you want dashboards. No paid observability vendor (Datadog/New Relic) until you have real production traffic to observe.

**M — Migrations**
Decision: each module owns its own migration folder (`services/<name>/migrations/`) versioned independently — use `node-pg-migrate` (Postgres) or a lightweight versioned-migration convention for Mongo (there's no native migration system; use `migrate-mongo`, free/OSS). Never one repo-wide migration file.

**N — Notification reliability**
Decision: build the full per-channel-queue architecture (Part D.3) from the start, but point every "channel" at a **free/sandbox provider** while pre-launch: email via a free-tier transactional provider (e.g. Resend/Mailtrap sandbox — no real sends, no cost), SMS/push channels built but stubbed/logged-only until you have a real budget for Twilio/FCM. The architecture doesn't change when you flip a stub to a real provider — that's the point of the channel-worker abstraction.

**O — Onboarding** — _(you already answered "Yes")_
Confirmed decision: one `docker-compose.yml` (Mongo/Postgres + Redis + MinIO) + one `pnpm dev` command via Nx's `run-many`. This is built in Phase 0, not deferred.

**P — Performance budgets**
Decision: skip formal SLA numbers pre-launch (no real traffic to budget against) — but _do_ write a one-line comment at each pagination/notification-enqueue endpoint stating the intended target (e.g. "target: <100ms enqueue") so it's a documented intention you can hold yourself to once you load-test, not a retrofitted guess.

**Q — Quotas & rate limiting**
Decision: `express-rate-limit` backed by the same local Redis instance (free, no extra infra) on every public route from day one — this is cheap enough to build now and dangerous enough to skip that there's no reason to defer it.

**R — Rollback**
Decision: since you're running one deployable BFF per product pre-launch (not yet split into independent processes per module), rollback is "redeploy the previous Docker image tag" — simple and sufficient at this stage. Document this explicitly as a _current_ limitation in an ADR so future-you knows independent per-module rollback isn't there yet by design, not by accident.

**S — Storage costs (media)**
Decision: **MinIO** in Docker (S3-API-compatible, fully free, self-hosted) as your object store pre-launch — write the same S3 SDK code you'd use against real AWS S3, just point the endpoint at MinIO. Add a scheduled cleanup job for abandoned multipart uploads from day one (it's a 10-line cron job and prevents a real cost surprise the day you do switch to real S3).
_At launch:_ swap the S3 endpoint/credentials to real AWS S3 (or keep MinIO self-hosted if you want to stay zero-cloud-cost longer) — zero code change if you used the S3 SDK correctly against MinIO.

**T — Testing pyramid**
Decision: **Vitest** (fast, free, works fine with `checkJs` JS) for unit tests on every `domain-*` lib; **Testcontainers** (free, spins up real Mongo/Postgres/Redis in Docker for integration tests — no mocking DB behavior) for `data-access-*` libs; **Supertest** for a handful of true end-to-end flows per product. No paid test infra needed at this stage.

**U — Uniform structure**
Decision: enforced via Nx generators — write one custom Nx generator (`nx g @yourorg/generators:domain-module`) that scaffolds the `feature/data-access/domain/util` shape identically every time, so uniformity isn't a matter of remembering a convention, it's mechanically produced.

**V — Versioning**
Decision: **Changesets** (free, OSS, works great with pnpm workspaces + Nx) from day one, even solo — the discipline of writing a changeset per PR is what makes changelogs and future version bumps painless, and it costs nothing to start now versus retrofitting later.

**W — WebSocket / real-time**
Decision: defer building this until an actual feature needs it (e.g., live in-app notification badge) — when you do, implement it as one more channel worker subscribing to the same fan-out queue (Part D.3), using `socket.io` or native `ws` (both free) — never a separate bespoke real-time system.

**X — eXtraction readiness**
Decision: the litmus test from Part F (original) stands as a standing rule, not a one-time check: before merging any module's PR, ask "could this be deleted from `ModuleRegistry` and stood up as its own process today?" If the answer requires touching another module's internals, block the PR. This costs nothing and is the single best predictor of whether your modular monolith stays real.

**Y — Team size vs. tooling fit**
Decision: **Nx confirmed** (not Turborepo) — your explicit requirements (registry pattern, enforced boundaries, feature-based structure) need Nx's governance layer even at team-size-of-one, because the _discipline_ is the deliverable, not just build speed. Revisit only if Nx's config overhead genuinely starts costing you more time than it saves — unlikely at your stated scope.

**Z — Zero-downtime deploys**
Decision: not a pre-launch concern (you won't have live traffic to protect) — but write the expand/contract migration convention into your `docs/adr/` now as the _standing rule_ for all future schema changes, so it's habit before it's ever load-bearing.

---

# PART G — LOCAL-ONLY / FREE-TIER OPERATING CONSTRAINT (EXPLICIT)

Noted and binding for all phases in Part E until further notice:

- **No paid infrastructure, no live deployment**, until Product 1 (first `apps/product-a-*`) is fully built and the repo structure is validated end-to-end locally.
- Everything in Parts A–F above has been chosen specifically so that **the pre-launch (local/free) version and the eventual production version are the same architecture** — swapping MinIO→S3, local Redis→managed Redis, sandbox email→real provider, and `.env`→secret manager are **configuration changes**, not redesigns. This is deliberate: it means Phase-by-phase migration later is a deployment exercise, not an architecture rewrite.
- **Local stack, fully free, confirmed for this project:** Docker Compose running Mongo _or_ Postgres (pick per D.4's index style — Mongo is fine if you follow the composite-index rule), Redis (BullMQ + rate-limiting + sessions), MinIO (S3-compatible media storage), and the Nx workspace itself. No cloud account required to build or test any part of Parts A–F.

**Next step you mentioned:** once you share your current codebase, I'll produce a **phase-by-phase migration blueprint** — mapping what exists today onto this target structure (Parts C/D), in the same dependency order as Part E (foundation libs → identity → first vertical feature → platform services → second product), flagging exactly which existing files move where, which get split, and which get rewritten versus kept. Share the repo (or its structure/`package.json`/key folders) whenever ready and I'll build that blueprint against it directly rather than in the abstract.

---

# PART H — EXTENDED RESEARCH: THE PERSPECTIVES NOT YET COVERED

The first two research passes covered your 7 requirements plus the surrounding governance concerns (CI/CD, data isolation, authz). This pass covers the remaining pillars of "enterprise-grade monorepo" that show up once a repo has real history and real traffic: Git performance at scale, alternate JS monorepo tooling, internal developer platforms, API gateway architecture, and event/schema contracts. Each ends with a **decision** for this project, following the same free-tier/local-first rule as Part F.

## H.1 Git itself becomes the bottleneck before your build tool does

Nobody warns you that the build system (Nx/Bazel) isn't the first thing that gets slow in a growing monorepo — **Git itself** is. The lived version of this problem: <cite index="117-1">a new engineer's first `git clone` took fourteen minutes and produced a 5GB working directory containing forty services, half of which she'd never touch — her laptop fans never stopped.</cite> The fix isn't abandoning the monorepo, it's a specific set of Git features: <cite index="117-1">sparse checkout, partial clones, the commit-graph file, and fsmonitor — after which the 14-minute clone becomes 90 seconds and the working directory drops from 5GB to 200MB.</cite>

This is exactly the class of problem Microsoft solved and open-sourced for anyone: <cite index="115-1">Scalar is a set of tools/extensions for Git that let very large monorepos run on plain Git without a virtualization layer, achieved through partial clone (reduces time to get a working repository by not downloading all Git objects right away) alongside sparse-checkout.</cite> Concretely, as of Git 2.38 this is built in: <cite index="113-1">by simply switching `git clone` to `scalar clone`, you get partial clone, sparse-checkout, background maintenance, and advanced config options all pre-configured for your repository — and if you've already cloned, running `scalar register` retrofits the same features onto an existing clone.</cite> Even without Scalar specifically, the raw commands are directly usable today: <cite index="117-1">`git clone --filter=blob:none --no-checkout <repo>`, then `git sparse-checkout init --cone`, then `git sparse-checkout set services/billing libs/api-client`, then `git checkout main`.</cite>

Two persistent myths this research explicitly debunks (directly relevant to your worry about whether a monorepo will "scale"):
<cite index="117-1">Myth: "monorepos don't scale past a few GB" — wrong with modern Git; sparse checkout + partial clone + commit-graph + fsmonitor make a 50GB monorepo feel like a 500MB one for daily work, and Google/Meta/Microsoft run far larger than that. Myth: "monorepos force everyone onto the same release schedule" — wrong; each service in a monorepo can deploy on its own schedule, since the repo is shared but the deployment pipelines are not — many real monorepos have some services deploying every commit alongside others deploying quarterly.</cite>

**Decision for this project:** irrelevant at your current repo size (a handful of apps/services/libs is nowhere near the multi-GB range where this bites) — but adopt the habit now for free: initialize the repo with `git sparse-checkout init --cone` capability in mind (i.e., don't nest unrelated large binary assets directly in source folders; keep large media/test fixtures in a documented separate location) so that if the repo does grow to dozens of services, sparse-checkout can be turned on later without restructuring. No action needed pre-launch beyond this awareness.

## H.2 Rush.js — the other production-grade JS monorepo manager, and why Nx still wins for your case

Nx and Turborepo aren't the only serious options. Microsoft's own JS monorepo tool, used internally at real scale, is **Rush**: <cite index="125-1">Rush is built by professional engineers who maintain large production monorepos, containing hundreds of apps with many years of Git history — to manage that scale, Rush offers parallel builds, subset builds, incremental builds, and distributed builds, plus repo policies that let new package dependencies be reviewed before they're accepted, consistent dependency version enforcement across the repo, and lockstep or independent versioning strategies for different subsets of projects.</cite> It was born from a real internal need: <cite index="128-1">Rush was created by the platform team for Microsoft SharePoint, which builds hundreds of production npm packages every day from internal and public Git repositories, for third-party SDKs and live services with millions of users.</cite>

Rush's specific technical edge worth knowing about even if you don't adopt it: <cite index="125-1">Rush's installation model leverages the PNPM package manager specifically to eliminate phantom dependencies and npm doppelgangers that frustrate large-scale installations</cite> — this validates the earlier tooling decision in Part B/C to use **pnpm** as the package manager regardless of which task-runner (Nx) sits on top; Rush and Nx converge on the same underlying fix for JS's biggest monorepo footgun (a package silently working because some _other_ package happened to hoist the dependency it needed).

**Decision for this project:** stay with **Nx** (already justified in A.3/A.13.3 for its enforced module-boundary governance), but adopt Rush's validated idea explicitly: **pnpm workspaces, not npm or Yarn**, specifically to avoid phantom dependencies — this was already the plan, and this research pass confirms it independently from a second production-scale tool, not just Nx's own docs.

## H.3 Internal Developer Platforms (Backstage) and code search — the "how do 700 engineers not get lost" layer

Once a monorepo has enough services and libraries, the next FAANG-grade concern is **discoverability** — can an engineer find out what exists, who owns it, and how it's documented, without asking in Slack? The reference implementation, now an industry standard: <cite index="132-1">Backstage is a framework for building internal developer portals (IDPs), open-sourced by Spotify five years ago; today it's the IDP platform of choice with over 3,000 companies having adopted it, and Spotify's own 700 R&D squads still rely on it daily.</cite> Its core object model: <cite index="130-1">Backstage's software catalog tracks every component your teams build — services, libraries, data pipelines, infrastructure — and its plugin architecture lets teams integrate Kubernetes dashboards, CI/CD status, documentation (via TechDocs), and cost monitoring into a single developer-experience surface; Software Templates with "Golden Path" scaffolding help teams create new services that follow organizational standards from day one.</cite>

The measured impact is well documented, not just marketing: <cite index="136-1">engineers using Backstage at Spotify are 2.3x more active in GitHub, create 2x the code changes in 17% less cycle time, deploy software 2x as often with software deployed for 3x as long, and are 5% more likely to still be at Spotify one year later.</cite>

For code discovery specifically (searching across the whole monorepo, not just your own editor's index), the reference tool is **Sourcegraph**: <cite index="130-1">Sourcegraph Code Search, paired with a developer portal like Backstage or Port, gives engineers both deep code understanding and a service catalog — add a metrics platform and you can measure whether the investment is reducing friction.</cite>

Notably, Backstage itself is built the way this document recommends you build: <cite index="135-1">Backstage is a React-based framework with an extensible plugin architecture, and it is itself a monorepo — using the Lerna monorepo library for managing multi-package repositories, with the UI source in `packages/app` and each integration living in the `plugins` folder</cite> — i.e., the tool for managing enterprise developer experience is itself a real-world validation of the "apps + libs/plugins" split from Part C.1.

**Decision for this project:** **not adopted pre-launch** — Backstage's entire value proposition (service catalog, ownership discovery across many teams, golden-path templates) is solving a problem you don't have yet at one product and a small team. The honest trigger to revisit: the day you can no longer answer "what services exist and who owns them" from memory or a single `docs/adr` glance — likely well after Product 1 launches and a second/third product and a real team exist. Note it here so it's a deliberate deferral, not an unknown gap. Sourcegraph similarly deferred — `grep`/your editor's search is sufficient at current repo size, and Sourcegraph's free/Cody tiers can be revisited once search-across-the-monorepo genuinely becomes slow.

## H.4 API gateway architecture — BFF vs. GraphQL Federation, and why your BFF choice (Part C.1) is the right one right now

Your architecture already put a BFF (`apps/product-a-api`) in front of each product. This research pass validates that choice against the alternative (GraphQL Federation) and clarifies exactly when you'd need to switch:
<cite index="137-1">Two architectural patterns dominate this problem: Backend for Frontend (BFF) — dedicated backend services, one per client type — and an Aggregation Layer via GraphQL Federation (e.g. Apollo Gateway), a single unified GraphQL schema composing multiple independently-owned subgraphs.</cite> Federation's actual selling point is organizational, not technical: <cite index="142-1">federation avoids the problem of centralizing development of the entire API graph on a single team or technology — doing that would essentially recreate a monolith and all the problems that come with it — first, control of the response payload shifts to the consumer, making the payload dynamic, versus REST typically revealing a service's entire schema with no consumer control.</cite>

But federation is explicitly **not free complexity**, and the research is blunt about when it's the wrong call: <cite index="143-1">Federation comes with a lot of complexity and overhead — if you have a small team, or even multiple teams that work closely together, Federation might be a bigger burden than a benefit, and if you're not already invested in GraphQL, Federation might be too much to chew on at once.</cite> The decision heuristic given directly: <cite index="143-1">ask yourself if you're actually suffering from the problems Federation solves — do you have multiple teams trying to build APIs together? Would you like different technologies/frameworks/languages for different parts of your API? Are you already invested in GraphQL and do your API consumers like it?</cite> — for a solo/small-team, single-BFF-per-product setup, the answer to all three is no.

The 2026 guidance converges on a hybrid, which is exactly your long-term option if you ever do need both: <cite index="144-1">the most successful architectures often mix these — a generic API Gateway that routes traffic to specific BFFs, one of which might itself be a GraphQL server</cite>, and <cite index="137-1">a common enterprise pattern places a BFF in front of an Apollo Gateway.</cite>

**Decision for this project:** **REST BFF per product, no GraphQL Federation** — confirmed as the correct choice for your stated scale (one small team, MERN/MEAN-class stack, a handful of products). Revisit only if you reach the specific trigger condition above: multiple independent teams building against the same underlying data who are constantly blocked waiting on each other for new REST fields — not before.

## H.5 Event/schema contracts — the part that keeps your Notification/Media event-driven design from silently breaking

Your Notification service (Part D.3) and the `ModuleRegistry.dispatch()` event mechanism (Part D.1) are, by definition, an event-driven system — which means every event has an implicit schema, and that schema _will_ change over time. Left unmanaged, this is a well-documented failure mode: <cite index="145-1">when a producer changes an event schema without coordination, consumers break — schema registry contract testing validates that schema changes are compatible with existing consumers before deployment, catching incompatibilities before they reach production.</cite>

The core discipline, regardless of which serialization format you use: <cite index="150-1">schemas are code — version them in git, lint them, review them in PRs; validate compatibility in CI to catch breaking changes before they reach production; and never rename or retype an existing field — add new fields with defaults instead.</cite> Compatibility-mode enforcement is the actual mechanism a real schema registry provides: <cite index="147-1">a schema registry enforces compatibility rules and manages schema versions centrally, preventing the classic failure where a producer sends new/removed fields while a consumer still expects the original version.</cite>

For **your specific scale** (in-process `ModuleRegistry.dispatch(eventName, payload)`, not yet a real Kafka/Pulsar cluster), the heavyweight tools (Confluent Schema Registry, Avro, Apicurio) are overkill, but the discipline transfers directly and cheaply: <cite index="146-1">contract testing ensures that two systems — a consumer and a provider — can communicate properly by adhering to a predefined contract that defines expected interactions and data structures, keeping both sides in sync</cite> without necessarily requiring a standalone registry service.

**Decision for this project:** every event payload gets a **JSDoc `@typedef`** in `libs/shared/util` (e.g., `NotificationRequestedEvent`, `MediaUploadCompletedEvent`), checked by `checkJs` (already adopted in Part F/J) — this _is_ your schema registry at this scale: version-controlled, reviewed in PRs, and type-checked in CI, at zero infrastructure cost. The one hard rule to enforce now, cheaply, because retrofitting it later is exactly where real systems break: **never remove or retype a field on an existing event `@typedef` — only add new optional fields.** Revisit a real schema registry (Apicurio is free/OSS and self-hostable) only if/when you introduce a real message broker (Kafka/Pulsar/NATS) instead of in-process dispatch — not before.

## H.6 Updated source list for this pass

Git-at-scale tooling: GitHub Blog ("The Story of Scalar", "Bring your monorepo down to size with sparse-checkout"), InfoWorld, GitHub `microsoft/scalar`, Azure DevOps Blog, GitFlow.dev, `microsoft/git` philosophy docs.
Rush/alternate JS tooling: ThemeSelection, DeepWiki (`grafana/rushstack`), Fullstack.com, GitHub `microsoft/rushstack`, rushjs.io, rushstack.io, npm-compare.com.
Internal developer platforms & code search: Sourcegraph blog, GitHub (Spotify Backstage Developer Portal), Spotify Engineering blog (x2), internaldeveloperplatform.org, Pradeep Loganathan's blog, Backstage marketing site.
API gateway/BFF/Federation: Medium (Umesh Kushwaha, Lakshitha Wisumperuma), GeeksforGeeks, OneUptime, 200oksolutions.com, Strapi blog, graphql-api-gateway.com, Tirnav Solutions.
Event schema/contract testing: OneUptime (x2), DEV Community (Francisco Barril), Java Code Geeks, Medium (Chinthaka Dharmasiri), TotalShiftLeft.ai, Codelit.io, arXiv (contract evolution paper), IBM Automation blog, datasops.com.

Now i need to verify and research remaining factors if left out i think caching laye rleft out nginx left

I need to make it ready for every environment but no deployment until i am ready till then only free tier + local development but reaady for every enviroment

# Monorepo Architecture — Gap Analysis Addendum

**Purpose:** you flagged caching and nginx as missing. Both are real gaps — and once I went looking for what else breaks in a real deployment of this exact design (registry-based modular monolith, event-driven notification/media, multi-product SSO, local-first/free-tier constraint), nine more showed up. This is Part I onward, continuing directly from Part H of the original document. Same rule as Part F/G: **free/local now, same shape at launch.**

---

# PART I — CACHING LAYER (the confirmed gap)

## I.1 Why this was missing and why it matters

The original document gave Redis three jobs — BullMQ queue backing, rate-limit counters, session storage — but never gave it its fourth, most common job: **sitting in front of the database as a read cache.** Without it, every "hot" read (a user profile rendered on every page, a product-a theme config, a paginated list's first page) round-trips to Mongo/Postgres every single time, which is exactly the kind of thing that's invisible at zero traffic and becomes the first bottleneck the moment either product gets real usage.

## I.2 The pattern to use, and why

Five named patterns exist — cache-aside (lazy-loading), write-through, write-behind (write-back), read-through, and refresh-ahead — and picking the wrong one for a given data shape is a documented source of stale data, cache stampedes, or wasted DB load. <cite index="9-1">Each solves a different problem — choosing the wrong one causes stale data, cache stampedes, or unnecessary DB load.</cite>

**Decision for this project — cache-aside for reads, explicit invalidation on writes, everywhere except one exception:**

- **Cache-aside (lazy loading)** is the default for every read path: <cite index="7-1">the application checks the cache first; on a miss, it loads from the database and populates the cache with a TTL</cite>. This is the right default because it requires no extra write-path complexity and degrades gracefully — a cold or evicted cache just costs one DB round-trip, nothing breaks.
- **Write-through** is the one exception: for data that must never be stale for even a few hundred milliseconds after a write — the identity session claims and permission bitset from D.6/A.13.3 — <cite index="4-1">the updates to the cache are synchronous and flow through the cache to the database</cite>, so a permission change is visible immediately, not after a TTL expires. Don't use write-through anywhere else; the added write latency isn't worth it for anything that can tolerate a short TTL.
- **Write-behind** is explicitly **not adopted** — it optimizes write throughput at the cost of durability risk, which is the wrong trade for a small system where correctness matters more than shaving write latency.

## I.3 Concrete rules (make this real, not aspirational)

1. **Every cached key gets a TTL, no exceptions.** Keys without expiry silently accumulate until memory pressure forces an eviction storm — by then it's an incident, not a tuning knob.
2. **Add jitter to TTLs.** A flat 300-second TTL on every key written in the same batch means every one of them expires in the same instant under load — stagger with `ttl = base ± random(0, base * 0.1)` so misses spread out instead of stampeding the DB together.
3. **Cache key = deterministic hash of query params**, not the raw params — e.g., `products:list:${hash({filters, sort, cursor})}` — this is the standard pattern for query-result caching and it composes cleanly with the pagination package from Part D.4 (the opaque cursor is already a stable string, so it hashes cleanly).
4. **Invalidate on write, not just TTL-expire.** On any mutation to a cached entity, delete its cache-aside key(s) inline in the same request handler that performed the write — don't rely on TTL alone, or you'll serve stale reads for the full TTL window after every edit.
5. **Licensing note, since you're pinning versions for a multi-year project:** Redis 8.0+ moved to a tri-license (RSALv2/SSPLv1/AGPLv3); running it as an internal cache behind your own service (never reselling Redis itself) doesn't trigger any practical obligation under any of the three, but if that's ever a concern, **Valkey** (Linux Foundation, BSD-licensed, wire-compatible fork) is a drop-in replacement with zero code change.

## I.4 What gets cached, concretely, mapped onto your existing modules

| Cached data                            | Pattern       | TTL                         | Invalidated on               |
| -------------------------------------- | ------------- | --------------------------- | ---------------------------- |
| User profile (identity)                | Cache-aside   | 5 min + jitter              | Profile update               |
| Permission bitset / role set (authz)   | Write-through | N/A (always fresh)          | Role/permission change       |
| Product theme config (design tokens)   | Cache-aside   | 1 hour                      | Theme deploy (rare)          |
| Paginated list first page (per module) | Cache-aside   | 30–60s + jitter             | Any write to that collection |
| Notification preferences               | Cache-aside   | 5 min                       | Preference update            |
| JWKS public keys (auth-client side)    | Cache-aside   | Match key-rotation interval | Key rotation event           |

## I.5 Local/free-tier decision

Same Redis container already in your `docker-compose.yml` (Part G) — this is a **new usage of existing infra**, not a new service. Use logical key prefixes (`cache:`, `queue:`, `session:`, `ratelimit:`) in the **same** Redis instance pre-launch; split into a dedicated cache-only Redis instance only if you ever see queue latency degrade because cache traffic is competing for the same event loop — not before.

---

# PART J — REVERSE PROXY / EDGE ROUTING (the second confirmed gap)

## J.1 Why you need this even at "just two products, all local"

Right now your plan has each app/BFF bind its own port (`product-a-web:3000`, `product-a-api:4000`, `product-b-web:3001`, `product-b-api:4001`, `identity-service:5000`...). That works until you need any of: a single `https://` entrypoint to test cross-product cookies (required to prove SSO in Phase 5), TLS at all in local dev, or a stable way to add a new product without hand-editing every developer's `/etc/hosts` and remembering seven port numbers.

## J.2 Traefik, not nginx — decision and reasoning

The original ask ("nginx left out") is real, but the actual right tool for **this specific setup** (Docker Compose, services that come and go, labels already the natural place to declare metadata in your stack) is **Traefik**, not raw nginx:

<cite index="12-1">Traefik wins when the backends are dynamic — Kubernetes, Docker Compose, Consul — and you want routing rules to follow services automatically. Nginx wins when the backend list is stable, raw performance matters, or you need its long-tail of modules</cite>. Concretely: <cite index="13-1">add labels to services in Compose → Traefik auto-discovers and configures routers/middlewares/services without clicking</cite>, and unlike nginx, <cite index="17-1">Traefik watches the Docker socket, detects containers with traefik.enable=true, and creates routes in seconds — adding a new service to your proxy is adding labels to its docker-compose.yml block</cite>, versus nginx where <cite index="17-1">each new service still requires a manual config change, a file reload, and separately running Certbot for SSL</cite>.

This maps directly onto Part E's phased build plan — every time you add a product (Phase 5) or a service (Phase 4), the proxy config is _already done_, because it's declared as labels on the container you're adding anyway, not a separate file you have to remember to touch.

**The one thing Traefik doesn't do that you'll eventually want:** <cite index="14-1">Traefik is a reverse proxy only — it doesn't serve static content directly; many setups use Traefik as the edge proxy with Nginx serving individual applications</cite>. **Decision:** if/when a product ships as a static SSR build needing raw static-file performance, put a slim nginx (or just serve via your Node SSR server, which is simpler pre-launch) _behind_ Traefik for that one app — don't replace Traefik at the edge for it.

## J.3 What this buys you specifically for your architecture

- **Local wildcard TLS with zero config**, which you need to correctly test SSO cookie behavior: <cite index="13-1">Let's Encrypt HTTP‑01 or DNS‑01 (for wildcard)</cite> in production; locally, pair Traefik with **mkcert** (free, generates a locally-trusted CA + certs for `*.localhost` domains — no browser warnings, no self-signed-cert workarounds).
- **A single entrypoint per environment**: `product-a.localhost`, `product-b.localhost`, `identity.localhost`, `admin.localhost` — all routed by one Traefik container reading labels off your existing compose services. This is also the _only_ realistic way to validate cross-subdomain SSO cookie behavior (`Domain=.localhost`, `SameSite=None; Secure`) before you ever touch a real domain.
- **A dashboard for free**: <cite index="16-1">Traefik has the concept of middleware chains that you can compose and reuse across routers</cite>, and it ships a live routes dashboard in-box — useful for debugging "why is product-b-api not receiving traffic" without adding a separate observability tool.
- **Same shape in production**: Traefik's Kubernetes Ingress controller and its Docker provider use the _same_ label/rule vocabulary, so the routing rules you write for local Compose are not thrown away when you eventually deploy — this satisfies your explicit "ready for every environment, no rewrite at deploy time" constraint exactly the way MinIO→S3 and local Redis→managed Redis already do in Part G.

## J.4 Concrete addition to `docker-compose.yml`

```yaml
traefik:
  image: traefik:v3.6
  command:
    - "--providers.docker=true"
    - "--providers.docker.exposedbydefault=false"
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"
    - "--api.dashboard=true"
  ports: ["80:80", "443:443", "8080:8080"]
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./certs:/certs # mkcert-generated certs mounted here

product-a-web:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.product-a-web.rule=Host(`product-a.localhost`)"
    - "traefik.http.routers.product-a-web.tls=true"
```

Every other app/service gets the same three labels — this is the entire integration cost, and it's paid once per service, at creation time, via the Nx generator from Part F/U.

---

# PART K — RESILIENCE BETWEEN BFF AND SERVICES (a real gap the doc's D.1–D.6 didn't cover)

Your `ModuleRegistry.dispatch()` is in-process today, so this is dormant — but Phase 4/5 explicitly plans for services to become independently callable (D.1: "swap `mountAll`/in-process `dispatch` for an HTTP route... the module's internal code doesn't change"). The moment any BFF makes a real network call to another service (e.g., `product-a-api` calling `identity-service` over HTTP instead of an in-process function), you have a distributed-systems failure mode the original document never addresses: what happens when identity-service is briefly slow or down.

<cite index="21-1">Without a circuit breaker, a failing downstream service can cascade through your entire stack: requests pile up, thread pools exhaust, memory grows, and your healthy service becomes an unhealthy one.</cite> The standard Node fix: <cite index="21-1">opossum, the de-facto circuit breaker library for Node.js, maintained by the Node.js Foundation's nodeshift team</cite>, combined with retry and bulkhead. The recommended layering order: <cite index="28-1">the general best practice is to implement Retry inside the Circuit Breaker — the caller attempts an operation, the circuit breaker checks its state, and if open, fails fast to a fallback</cite>.

**Decision for this project:** wrap every cross-service HTTP call (not in-process `dispatch()` calls, which don't need this) in an `opossum` breaker with a concurrency limiter (`p-limit`), using the same shape already validated in production Node code:

```js
const breaker = new CircuitBreaker(callIdentityService, {
  timeout: 3000, // fail fast rather than hang the BFF request
  errorThresholdPercentage: 50,
  resetTimeout: 30_000, // half-open retry window
  volumeThreshold: 5, // don't trip on the first request ever made
});
breaker.fallback(() => cachedOrDegradedResponse());
```

Wire this into `libs/shared/resilience` (new lib, same tier as `libs/shared/registry`) so every future service-to-service call reuses one hardened client instead of a bespoke `fetch()`. This is free (opossum is OSS) and costs nothing pre-launch since there's no real network yet to fail — but it must exist _before_ Phase 4 turns any in-process call into a real HTTP call, not retrofitted after the first outage.

---

# PART L — REMAINING GAPS (shorter — real, but lower-urgency at your stated scale)

**L.1 Health checks & graceful shutdown.** Every `services/*` and `apps/*-api` needs a `GET /healthz` (liveness) and `GET /readyz` (readiness — checks its DB/Redis connection, not just "process is running"), plus a `SIGTERM` handler that stops accepting new requests, lets in-flight ones finish, and closes BullMQ workers cleanly before exit. Add this in Phase 1 alongside the shared `util` lib — it's a 20-line addition per service and it's what Docker Compose (`healthcheck:` in each service) and any future orchestrator both depend on to know a container is actually usable, not just running.

**L.2 Config validation at boot.** `.env` files are already the plan (Part F.H) — add one thing: validate them at process start with a small schema (`zod` or `envalid`), so a missing/malformed env var fails loudly at boot instead of surfacing as a confusing runtime error three requests later. Cheap, free, high-leverage — same tier of decision as the `checkJs` call in Part F.J.

**L.3 Cross-subdomain cookie/CORS specifics for SSO.** A11's SSO flow needs one concrete decision the doc left implicit: cookies must be set with `Domain=.localhost` (or your real parent domain later), `SameSite=None; Secure`, which _requires_ HTTPS even in local dev — this is precisely why Part J's mkcert+Traefik TLS setup isn't optional polish, it's a hard prerequisite for testing Phase 5's "log in once, recognized on Product B" checkpoint at all. Document this dependency explicitly in the Phase 5 checklist.

**L.4 Search infrastructure, decided now instead of left as an aside.** D.5's DSA table already flags Elasticsearch/OpenSearch for beyond-prefix search but never turns it into a decision. **Decision:** defer entirely until a feature actually needs full-text search — a trie or a simple indexed `LIKE`/regex query covers prefix search at your pre-launch scale. When you do need it, **OpenSearch** (Apache-2.0, fully free, self-hosted via one more Docker Compose service) over Elasticsearch, to avoid the SSPL licensing question entirely rather than revisiting it later.

**L.5 Bull Board.** Since BullMQ is already the queue choice (Part F.E), add **Bull Board** (free, OSS, one more Docker service or mounted route) as soon as Phase 4's notification queues exist — it's the difference between debugging a stuck notification by reading Redis keys by hand versus looking at a dashboard, and it costs nothing.

**L.6 Accessibility in the design system.** Part D.2's atomic components (Button, etc.) have no a11y contract — add one rule now, while there's only one component: every atom ships with correct ARIA attributes and passes `eslint-plugin-jsx-a11y` in CI. Retrofitting this after twenty components exist is far more expensive than starting with it on Button #1.

---

# PART M — UPDATED FREE-TIER LOCAL STACK (supersedes Part G's list)

Docker Compose, all free/self-hosted, same "config-change-not-rewrite" rule as before:

Mongo/Postgres · Redis (queues + rate-limit + sessions + **cache**, logically prefixed) · MinIO · **Traefik** (edge routing + local TLS via mkcert) · **Bull Board** (queue visibility, added Phase 4) · OpenSearch (added only when a real search feature needs it) · the Nx workspace itself.

No cloud account required for any part of Parts A–M. Nothing here changes the "no deployment until Product 1 is ready" constraint from Part G — everything above runs in the same `docker-compose.yml`, and every item is a config swap (not a redesign) at real-launch time, exactly like Part G's original list.
