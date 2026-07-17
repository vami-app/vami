# 🖋️ Inkwell — Full Product Development Roadmap

> **Supersedes** `INKWELL_IMPLEMENTATION_ROADMAP.md`. That doc had a Month-4 launch/deploy chapter. **Void it.** Per this conversation: no paid services, no launch planning, no hosting talk, no domain talk — anywhere in this document. Product development only, until the product itself is genuinely competitive. Launch is a separate decision, made later, from a position of strength — not baked into a build calendar.
> **Baseline:** `PROJECT_BLUEPRINT.md` v1.1.0.
> **Standard:** every feature built to real completion — proper edge-case handling, proper QA, no shortcuts taken to hit an artificial date. If a feature honestly needs 6-8 weeks done right, it gets 6-8 weeks.

---

## 0. Ground rules (as instructed)

| Rule | Meaning here |
|---|---|
| No paid services | No Cloudinary/Atlas migration, no hosting, no domains, no SPF/DKIM, no deploy anywhere in this doc |
| No launch planning | No "soft launch," no invite lists, no niche-picking-for-go-live. That conversation happens after this roadmap, not during it |
| No artificial "out of scope" | Every feature in the original blueprint's Out-of-Scope list is now IN scope, fully specced below, with an honest duration |
| No time constraint | Durations below are honest solo-dev estimates for doing each feature properly. Where that's 1-2 months, it's 1-2 months. Total is stated plainly, not massaged to look smaller |

**The one true exception — stated once, not hidden:** Medium's core distribution advantage is a paid human curation staff (~15+ community editors + an internal curation team reviewing submissions daily). That is headcount, not a feature. It cannot be "developed." Everywhere Medium's advantage comes from staffing, this roadmap builds the honest algorithmic analog instead (Phase C, item 13) — not a dishonest promise to replicate people.

---

## 1. Current state — Phase A complete

| Layer | Built |
|---|---|
| Auth | Register/login/logout/refresh/me, JWT httpOnly cookies, bcrypt cost-12 |
| Password reset | Full flow — token hash, 30-min TTL, enumeration-safe |
| Email verification | Full flow — token (24h TTL, hash-not-raw), verified badge on profile, publishing gated |
| Email notifications | New-content notifications to followers (`notify.js`), `notifiedAt` guard (no re-send on edit) |
| Weekly digest | `send-weekly-digest.js` cron script — tag-follow aware, `lastDigestSentAt` idempotency guard |
| Email preferences | Master email toggle + digest frequency, CAN-SPAM one-click unsubscribe endpoint |
| Posts | CRUD, drafts, tags, full-text search, SEO fields, canonical URLs, sitemap/robots |
| Engagement | Claps (capped 50/user), bookmarks, follow/unfollow, flat comments |
| Syndication | RSS (global/author/tag), subdomain claiming |
| Ownership | ZIP export — profile.json, followers.json (with `followedAt`+`sourcePost`), posts as JSON + Markdown |
| Legal | `/terms` and `/privacy` — real content cross-referenced to actual data practices |
| Account deletion | Two-step cascade: confirm-email token → DELETE; full erasure or anonymize option |
| Follow model | `Follow` collection — source of truth for attribution; `followedTags` array for digest |
| Security | sanitize-html, rate limiting, author-only guards, CORS origin-check |

Everything below extends this foundation toward Phases B–G.


---

## 2. Full feature backlog, phased by dependency — nothing cut

### Phase A — Ownership & Trust Foundation (COMPLETED)

| # | Feature | Status | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|---|
| 1 | New-content notification email | **Completed** | 3-4 days | Direct parity with Medium's "notify me by email" feature | Publish → all followers get one email in Mailtrap, no dupes on re-save |
| 2 | Weekly digest (local `node-cron` script, not wired into Express) | **Completed** | 3-4 days | Parity with Medium Digest emails | Skip-send verified on empty digest, correct top-clapped selection on seeded data |
| 3 | Sovereign Export upgrade — `followers.json` (email + name + `followedAt` + `sourcePost`), permanent no-lock guarantee encoded as a failing-build test | **Completed** | 1 week | Exceeds Medium's May-2025 subscriber-export lockdown — this is the one dated, verifiable regression Medium has publicly regressed on | `run_evidence_verification.js` asserts a follower added "today" is present in export, always, no gate possible |
| 4 | Settings: master email toggle + digest frequency | **Completed** | 3-4 days | Parity, with the exception that reset/security email is never suppressible | Toggle off → notif/digest suppressed, reset email still sends |
| 5 | Legal pages (ToS, Privacy) — real drafted content, not placeholder text | **Completed** | 3-5 days | Table stakes, currently zero coverage | Both pages live, reference actual data practices (export, deletion, email use) accurately |
| 6 | Account deletion — full cascade | **Completed** | 1 week | Currently absent from API entirely | Delete test user → zero orphaned refs in `Post`, `Comment`, others' `bookmarks`/`followers`/`following` |
| 7 | Email verification — full flow (not soft-gate): verify token, verified badge, gates specific actions | **Completed** | 1-1.5 weeks | Parity — Medium requires no verification but most serious platforms do; builds trust infra needed for Phase C/D | Unverified accounts flagged, verified badge shows on profile, token single-use + expiring |

### Phase B — Safety & Integrity (~7-8 weeks)

| # | Feature | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|
| 8 | Moderation — reports on posts/comments, review queue, audit log | 1.5-2 weeks | Medium's curation team does this with paid staff; this is the buildable floor under it | Report 3x → queue entry → soft-delete → hidden from feed, preserved in DB, action logged with actor+timestamp |
| 9 | Admin dashboard — full: user management (ban/unban/role), content moderation queue, basic site stats (users, posts, reports over time) | 2-3 weeks | Medium has this internally; you need the equivalent, done properly, not a stub | Admin can ban a user (blocks login), resolve a report, view a stats page with real aggregated numbers |
| 10 | Revision history — snapshot per edit, diff view, restore | 1-1.5 weeks | Medium gives writers **zero** edit history — genuine exceed, not parity | 3 edits → 3 revisions visible with a real diff (not just raw dumps) → restore reverts content and itself creates a revision |
| 11 | Nested comments/threads | 1.5-2 weeks | Parity — Medium's responses are flat too, actually; do this because readers expect it now, not because Medium has it | Reply-to-reply renders correctly at depth ≥3, deletion of a parent handles orphaned children explicitly (soft-delete parent, keep thread intact) |

### Phase C — Growth Engine (~8 weeks)

| # | Feature | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|
| 12 | Publications — multi-author collections, editor roles, submission/review workflow, publication profile pages | 3-4 weeks | This is Medium's actual growth engine (nomination editors feed the Boost pipeline). Real scope — new model, new roles, new pages. Not a bolt-on | A publication with 3 authors: one submits a draft, an editor approves it, it appears under the publication's page and the author's own profile |
| 13 | Interest-based recommendation scoring (tag-affinity + engagement-weighted ranking) — **the honest algorithmic analog to Medium's General Distribution, not a replica of their curation staff** | 2-3 weeks | Explicitly not attempting to replicate paid human curation (see §0). This is the buildable piece: weighted Mongo aggregation on tag overlap + recency + engagement, no ML infra required | Two users with different clap/follow histories get demonstrably different home-feed ranking on identical underlying post set |
| 14 | Reading Lists — named, shareable, multiple per user | 1 week | Parity with Medium Lists | Create 2 named lists, one public, viewable logged-out at a stable URL |
| 15 | Related posts + trending-tags recency weighting | 3-5 days | Parity, cheap win | Story page shows 3 same-tag related posts; trending sidebar reflects last-7-days activity, not all-time |

### Phase D — Monetization Mechanism (~5-6 weeks, mechanism only)

> Built using Stripe **test mode** — zero cost, zero real transactions. This is mechanism development, not a launch. Going live with real money is a separate, later decision.

| # | Feature | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|
| 16 | Paywall — per-post "locked" flag, preview truncation for non-members | 1.5-2 weeks | Parity with Medium's member-only story mechanic | Locked post shows first N paragraphs to non-members, full content to members, verified at API level (not just hidden by CSS) |
| 17 | Membership tier + Stripe test-mode subscription | 2 weeks | Parity with Medium's $5/mo membership | Test-mode checkout completes, `User.membershipStatus` updates via webhook, locked content unlocks correctly |
| 18 | Writer payout ledger — data model + calculation logic (engagement-weighted split, no live payout wiring) | 1-1.5 weeks | Direct parity with Partner Program math | Given seeded read-time data across writers, ledger produces a correct proportional split, verified against hand-calculated expected values |

### Phase E — Identity, Access, Real-time (~4.5-5 weeks)

| # | Feature | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|
| 19 | OAuth (Google + GitHub via Passport.js) | 1-1.5 weeks | Parity | Both providers complete full signup/login round-trip, account-linking handles existing-email collision correctly |
| 20 | Real-time notifications (Socket.IO — live bell icon for claps/comments/follows) | 2 weeks | Medium has none of this (email/digest only) — genuine exceed | Two browser sessions, action in one reflects live in the other's bell icon within ~1s, reconnect-after-disconnect handled |
| 21 | Post scheduling (future `publishedAt`, local check mechanism) | 1 week | Parity — commonly requested, absent from Medium | Scheduled post stays draft-invisible until scheduled time, auto-publish without manual action |

### Phase F — Reader Experience Depth (~4-5 weeks)

| # | Feature | Duration | Medium comparison | Definition of done |
|---|---|---|---|---|
| 22 | Highlighting/annotation — private first, shareable later | 1.5-2 weeks | Parity with Medium highlights | Select text on a story → highlight persists across reload, visible only to the highlighter initially |
| 23 | Writer analytics dashboard — views/claps trend, top posts | 1-1.5 weeks | Exceeds Medium's. | Dashboard shows correct weekly-bucketed trend against seeded data |
| 24 | Dark mode — full token-level pass, not inverted colors | 1-1.5 weeks | Parity | Every component respects theme via CSS custom properties, verified across all routes, no unstyled flashes |

### Phase G — Quality & Correctness Infrastructure (~3.5-5 weeks, local only)

| # | Feature | Duration | Note |
|---|---|---|---|
| 25 | Automated test suite — unit + integration (Vitest), all controllers | 2-3 weeks | This is quality infra, not deployment. Runs locally, catches regressions as backlog grows |
| 26 | E2E suite (Playwright), local execution | 1.5-2 weeks | No cloud CI, no deploy step |

---

## 3. Honest total timeline

| Phase | Status | Weeks | Cumulative |
|---|---|---|---|
| A — Ownership & Trust | **Completed** | 5 | 0 |
| B — Safety & Integrity | Pending | 7.5 | 7.5 |
| C — Growth Engine | Pending | 8 | 15.5 |
| D — Monetization Mechanism | Pending | 5.5 | 21 |
| E — Identity, Access, Real-time | Pending | 5 | 26 |
| F — Reader Experience Depth | Pending | 4.5 | 30.5 |
| G — Quality Infrastructure | Pending | 4 | 34.5 |

**Real total: ~39-40 weeks, roughly 9-10 months, done properly, no corners cut.**

If you want a checkpoint at the "3-4 month" mark you originally framed: that lands you at the end of **Phase B** (~12-13 weeks) — meaning ownership, trust, safety, and integrity are fully solid. That is a genuinely defensible, competitive product core at that point — not a finished one. Phases C-G are real, necessary, and none of them are cut. They come after.

---

## 4. What's explicitly NOT in this document

Launch planning, hosting, domains, paid infra, marketing, niche selection for go-live. Not deferred — just a different conversation, for after this roadmap is substantially executed.

---

*Roadmap drafted: 2026-07-17 — full-scope companion to PROJECT_BLUEPRINT.md v1.1.0. No feature omitted.*
