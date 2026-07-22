# 🖋️ Inkwell — Phase C Implementation Plan (Growth Engine)

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and `PROJECT_BLUEPRINT.md` v1.3.0.
> Spec-level detail only — no code. Same standard as Phase A/B: every field, endpoint, and edge case named so implementation is a direct translation.

---

## 0. Estimate revision — and one real philosophical conflict, flagged upfront

The roadmap's Phase C total (8 weeks) covers items 12–15 as additive features. Two things surfaced that aren't additive — they touch decisions already made and documented earlier in this project.

### Conflict 1 — item 13 collides with an existing, explicit commitment

The SEO/Ownership/Portability spec (the very first Inkwell spec written) contains a section titled "Discovery Model Constraints (explicit non-goal)": _"v1 discovery has no ranking model, no curation queue, no 'Boost' concept of any kind... If a ranking signal is ever introduced, it must be publicly documented in-product, not a black box — that opacity is precisely what pushed writers off Medium."_

Item 13 introduces exactly that ranking signal. Silently making it the new home-feed default would reverse a founding differentiator without saying so. **Resolution, stated as policy, not implementation detail:** personalized ranking ships as an explicit, labeled second tab (**"For You"**) alongside the existing chronological feed (**"Latest"**, unchanged default). Never a silent replacement. The ranking factors are disclosed in-product (a simple "Why am I seeing this?" affordance listing the actual signals — tag overlap, recency, engagement — no vague "our algorithm" copy). This is the one non-negotiable design constraint for this phase.

### Conflict 2 — item 12 collides with Phase B's own forward-looking note, and needs a real answer now

Phase B's `PostRevision.editedBy` field was deliberately generalized with this exact comment: _"future-proofs for Phase C publications where an editor other than the original author might edit."_ That implies editors can directly edit submitted drafts. But this whole project's core wedge — the reason it exists instead of just being another Medium clone — is content ownership. An editor silently rewriting someone's draft cuts against that at the root.

**Resolution, stated as policy:** editors do **not** edit content directly in v1. They approve, reject with a required note, or request changes (also a required note) — the author retains sole write access to their own draft always. This means `PostRevision.editedBy` will, in practice, never differ from the post's `author` under this phase's rules. The field stays as-is (harmless, still correctly generalized) — this note just resolves the ambiguity Phase B left open, rather than letting an implementation quietly decide it either way.

### Foundational gap — no group/membership concept exists at all

`User.role` is a single global enum (`user`/`admin`) from Phase B. Publications need a role that's _scoped to a specific publication_ (owner/editor/writer) — a different, additional concept, not an extension of the existing one. New model required (Step 1).

### Foundational gap — the "must-exclude-hidden-content" surface count is about to hit 7

Phase B already required feed, sitemap, both RSS feeds, and search to independently filter `moderationStatus: 'hidden'` — flagged then as "the same class of bug as the SEO phase's draft-leak issue." Phase C adds three more surfaces that need the identical filter: related-posts suggestions, the recommendation-scoring candidate pool, and publication profile pages. Continuing to duplicate this filter per-surface is how one of these eventually gets missed. **This phase is the point to stop copy-pasting it** — a single shared query helper, used everywhere, is Step 0 work, not a nice-to-have.

**Revised Phase C total: ~9 weeks** (was 8). Flagging the revision rather than absorbing it silently, same as both prior phases.

| Step      | Covers                                                                           | Days                  |
| --------- | -------------------------------------------------------------------------------- | --------------------- |
| 0         | Shared visibility filter + Publication/membership schema foundation              | 3                     |
| 1         | Publications — model, roles, submission/review workflow, profile pages (item 12) | 17                    |
| 2         | Interest-based recommendation scoring, "For You" tab (item 13)                   | 12                    |
| 3         | Reading Lists (item 14)                                                          | 5                     |
| 4         | Related posts + trending recency weighting (item 15)                             | 3                     |
| **Total** |                                                                                  | **~40 days (~9 wks)** |

Build in this order. Step 2's candidate-pool query and Step 4's related-posts query both depend on Step 0's shared filter existing first, not each reimplementing it.

---

## Step 0 — Shared Visibility Filter + Publication Schema Foundation

### Shared filter, not a per-surface copy

Introduce one canonical definition — e.g. a `Post.visibleQuery()` static/helper — encoding exactly: `status: 'published'`, `moderationStatus: 'visible'`. Every read path that currently hand-writes both conditions (feed, sitemap-data, both RSS builders, search) gets refactored to call it instead of repeating the two-field filter inline. Every new Phase C surface (related posts, recommendation candidates, publication pages) is written against this helper from day one, never against a fresh inline filter. This is a refactor of existing Phase B code as much as it's new-code hygiene — call it out as touching already-shipped files, not purely additive.

### New model: `Publication` — `server/src/models/Publication.js`

| Field                    | Type            | Constraints                                                    |
| ------------------------ | --------------- | -------------------------------------------------------------- |
| `name`                   | String          | required, maxlength 80                                         |
| `slug`                   | String          | required, unique, indexed — same `makeSlug()` pattern as posts |
| `description`            | String          | maxlength 300                                                  |
| `logoUrl` / `coverImage` | String          | optional                                                       |
| `owner`                  | ObjectId → User | required — the founding member, always has full rights         |
| `createdAt`              | Date            | auto                                                           |

### New model: `PublicationMember` — `server/src/models/PublicationMember.js`

| Field         | Type                                   | Constraints                                            |
| ------------- | -------------------------------------- | ------------------------------------------------------ |
| `publication` | ObjectId → Publication                 | required, indexed                                      |
| `user`        | ObjectId → User                        | required, indexed                                      |
| `role`        | enum `'owner' \| 'editor' \| 'writer'` | required                                               |
| `invitedBy`   | ObjectId → User                        | required — accountability trail for who granted access |
| `joinedAt`    | Date                                   | default now                                            |

Compound unique index: `{ publication, user }` — one membership record per user per publication.

**Deliberately no open self-join.** Joining a publication requires an existing editor/owner to invite (endpoint in Step 1) — an open "request to join → auto-added" flow would be a spam vector into someone else's publication, same reasoning as the no-open-admin-promotion decision from Phase B.

### `Post.js` addition

| Field              | Type                                                                          | Default  | Purpose                                                             |
| ------------------ | ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `publication`      | ObjectId → Publication, nullable                                              | `null`   | Set only if the post is submitted to a publication                  |
| `submissionStatus` | enum `'none' \| 'pending' \| 'approved' \| 'rejected' \| 'changes_requested'` | `'none'` | Independent of `status`(draft/published) — see the decoupling below |

### The decoupling, stated explicitly

`status` (draft/published) stays entirely under the author's control, unchanged from every prior phase. `submissionStatus` is a **separate** axis: a post can be `published` (visible on the author's own profile, indexable, in RSS/sitemap under the author) while simultaneously `pending` publication review — publishing your own work was never gated on an editor. Only appearing _under the publication's own page_ requires `submissionStatus: 'approved'`. This mirrors how the SEO phase kept ownership and reach as separate concerns; publications get the same treatment — an editor gates _distribution through their publication_, never the author's _right to publish at all_.

### Edge cases

| Case                                                                                        | Handling                                                                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| User tries to submit someone else's post to a publication                                   | Blocked — `POST` submission endpoint (Step 1) requires `post.author === req.user._id`                                   |
| Publication `slug` collides with a reserved word or existing username's subdomain namespace | Same reserved-word + collision-check pattern already built for subdomains (Phase A/SEO work) — reuse it, don't reinvent |
| A writer role tries to invite another member                                                | Blocked — only `owner`/`editor` roles can invite, enforced server-side per endpoint, not just hidden in the UI          |

### Definition of done

`Publication.visibleQuery()`-equivalent helper exists and is the _only_ place the two-field filter is written; feed/sitemap/RSS/search (Phase B surfaces) are refactored to call it, confirmed via a single shared regression test rather than four separate ones. A `Publication` + `PublicationMember` can be created and queried; reserved-slug and self-join blocks confirmed.

---

## Step 1 — Publications: Model, Roles, Submission/Review, Profile Pages

### New endpoints — publication management

| Method | Path                                      | Auth                | Description                                                                                              |
| ------ | ----------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| POST   | `/api/publications`                       | required            | Create a publication; creator becomes `owner`                                                            |
| GET    | `/api/publications/:slug`                 | optionalAuth        | Public profile — approved posts only, uses the shared visibility filter + `submissionStatus: 'approved'` |
| PATCH  | `/api/publications/:slug`                 | owner/editor only   | Edit name/description/logo/cover                                                                         |
| POST   | `/api/publications/:slug/members`         | owner/editor only   | Invite a user by username, assign role                                                                   |
| PATCH  | `/api/publications/:slug/members/:userId` | owner only          | Change a member's role                                                                                   |
| DELETE | `/api/publications/:slug/members/:userId` | owner only, or self | Remove a member, or leave voluntarily                                                                    |

### New endpoints — submission/review

| Method | Path                                             | Auth              | Description                                                                                              |
| ------ | ------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------- |
| POST   | `/api/posts/:slug/submit`                        | author only       | Submit own post to a publication they're a member of; sets `publication` + `submissionStatus: 'pending'` |
| PATCH  | `/api/publications/:pubSlug/submissions/:postId` | editor/owner only | Approve, reject (required note), or request changes (required note)                                      |
| DELETE | `/api/posts/:slug/submit`                        | author only       | Withdraw a pending submission before review                                                              |

### Last-owner lockout guard — same pattern as Phase B's last-admin guard

Removing the sole `owner` member (via self-removal or role-change) must be blocked with a clear error, exactly mirroring Phase B's last-admin-lockout logic. A publication with zero owners is the group-scoped equivalent of the platform-wide lockout Phase B already solved once — reuse the reasoning, don't re-derive it.

### Client: `client/src/app/(main)/pub/[slug]/`

- `page.jsx` — publication profile: logo, description, member list (public-facing, names only — not full membership metadata), approved posts grid
- `dashboard/page.jsx` — member-only view: pending submissions queue (editors/owner), member management (owner), mirrors the shape of Phase B's admin dashboard but scoped to one publication instead of site-wide

**Same client/server boundary discipline as Phase B's admin panel:** the dashboard route's visibility check is UX only; every underlying endpoint re-checks membership/role server-side regardless of what the client hid or showed.

### Edge cases

| Case                                                                                   | Handling                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor rejects a submission                                                            | `submissionStatus: 'rejected'`, required note stored, post's own `status`/`publishedAt`/indexability on the author's own profile are **untouched** — rejection only affects publication distribution                                                |
| Author withdraws a pending submission                                                  | `publication` and `submissionStatus` reset to `null`/`'none'` — clean revert, no residue                                                                                                                                                            |
| Post already approved into a publication, later edited by the author                   | Content-only edit, same as any other post — does **not** re-trigger a review cycle in v1 (editors approved a version; silently re-approving on every typo-fix isn't necessary at this stage — flag as an accepted v1 limitation, not a gap)         |
| Publication itself has zero remaining members (owner leaves, no other members existed) | Publication becomes ownerless and orphaned — this is exactly why the last-owner lockout guard exists; if it's ever bypassed (e.g. via account deletion cascade, see below), the publication must be explicitly archived, not left silently dangling |

### Definition of done

Three-author scenario from the roadmap's own DoD: one submits a draft to a publication, an editor approves it, it appears under both the publication's page and the author's own profile — with the publication page correctly excluding anything still `pending`/`rejected`/`changes_requested`.

---

## Step 2 — Interest-Based Recommendation Scoring, "For You" Tab

### Scoring approach — weighted aggregation, no ML infra, matching the roadmap's own framing

Candidate pool: posts from the shared visibility filter (Step 0), scored by a weighted combination of:

- Tag overlap with the viewer's `followedTags` (Phase A) and tags of authors they follow
- Recency (exponential-ish decay, not a hard cutoff — a great post from 10 days ago shouldn't vanish, just rank lower than one from today)
- Engagement (`totalClaps`, comment count) — same signals already surfaced elsewhere, not new data collection

No new model needed — this is a Mongo aggregation pipeline, computed live per request at current data volume (same "don't precompute yet" call Phase B made for admin stats, same reasoning: revisit only if Phase C-scale growth actually makes live aggregation slow).

### New endpoint

| Method | Path                     | Auth     | Description                                                                                                                                                     |
| ------ | ------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/posts/recommended` | required | Personalized candidate list — requires a logged-in user, since it's scored against _their_ follows/tags; logged-out visitors simply don't see the "For You" tab |

### Client

Home page gains a two-tab header: **Latest** (existing chronological `<PostList>`, unchanged, remains the default for logged-out visitors and the initial view for everyone) and **For You** (new, only shown to logged-in users). A small "Why these stories?" affordance on the For You tab states the actual factors in plain language — this is the in-product disclosure the Step 0 policy requires, not an afterthought.

### Edge cases

| Case                                    | Handling                                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| New user, no follows, no `followedTags` | Falls back to a recency+engagement-only ranking (same signals, tag-overlap term simply contributes zero) — never an empty tab    |
| Logged-out visitor                      | "For You" tab isn't shown at all — no personalization possible without an identity to personalize against                        |
| A publication-approved post             | Included in the candidate pool same as any other visible post — publication membership doesn't grant or deny ranking eligibility |

### Definition of done

Matches the roadmap's own DoD verbatim: two users with different clap/follow histories get demonstrably different home-feed ranking on an identical underlying post set. Additionally: the disclosure affordance is present and accurate, and the "Latest" tab's chronological behavior is unchanged from before this phase — regression-tested, not just assumed untouched.

---

## Step 3 — Reading Lists

### New model: `ReadingList` — `server/src/models/ReadingList.js`

| Field        | Type                                         | Constraints                                                                                               |
| ------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `owner`      | ObjectId → User                              | required, indexed                                                                                         |
| `name`       | String                                       | required, maxlength 80                                                                                    |
| `slug`       | String                                       | required — unique _per owner_, not globally (two different users can each have a list called "favorites") |
| `visibility` | enum `'public' \| 'private'`                 | default `'private'`                                                                                       |
| `posts`      | `[{ post: ObjectId → Post, addedAt: Date }]` | embedded, ordered by insertion                                                                            |
| `createdAt`  | Date                                         | auto                                                                                                      |

Compound unique index: `{ owner, slug }`.

### New endpoints

| Method | Path                           | Auth         | Description                                                     |
| ------ | ------------------------------ | ------------ | --------------------------------------------------------------- |
| POST   | `/api/lists`                   | required     | Create a list                                                   |
| GET    | `/api/lists/mine`              | required     | Own lists, all visibilities                                     |
| GET    | `/api/users/:username/lists`   | optionalAuth | Public lists only for viewing someone else's profile            |
| GET    | `/api/lists/:username/:slug`   | optionalAuth | Single list — 404 if private and viewer isn't the owner         |
| PATCH  | `/api/lists/:id`               | owner only   | Rename, change visibility                                       |
| POST   | `/api/lists/:id/posts`         | owner only   | Add a post                                                      |
| DELETE | `/api/lists/:id/posts/:postId` | owner only   | Remove a post                                                   |
| DELETE | `/api/lists/:id`               | owner only   | Delete the list itself (doesn't touch the posts, only the list) |

### Edge cases

| Case                                                          | Handling                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Adding a draft or hidden post to a list                       | Blocked — same "no interaction with non-visible content" principle applied consistently since the SEO phase's draft-gating and Phase B's comment-reply gating                                                                                                                                                                        |
| Post added to a list is later deleted or hidden by moderation | The list entry becomes a dangling reference — render it as a clearly-marked "removed" placeholder in the list view rather than a broken link or a silent disappearance; don't auto-purge, since the reading list itself (the curation act) is the user's own artifact, similar reasoning to why revision history isn't purged either |
| Public list viewed logged-out                                 | Fully works — that's the point of `visibility: 'public'`                                                                                                                                                                                                                                                                             |

### Definition of done

Matches roadmap DoD: create 2 named lists, one public, viewable logged-out at a stable URL. Additionally: adding a draft post is confirmed blocked, and a list containing a since-hidden post renders the placeholder correctly rather than erroring.

---

## Step 4 — Related Posts + Trending Recency Weighting

### Related posts

On the story page, query up to 3 posts sharing at least one tag with the current post, excluding the post itself, through the Step 0 shared visibility filter, ranked by tag-overlap-count then recency. No new model — a query addition to the existing story-page data load.

### Trending tags — recency-weighted, not all-time

`GET /api/posts/tags/trending` (existing, Phase 1 MVP endpoint) currently counts all-time post volume per tag. Change the aggregation window to the last 7 days, matching the roadmap's own stated fix ("reflects last-7-days activity, not all-time"). This is a one-field change to an existing aggregation's `$match` stage — same category of fix as Phase B's own dashboard-stats correction (the "Stories Published" miscount caught during Phase B verification) — small, but real, and worth naming as touching existing code rather than treating it as pure greenfield.

### Edge cases

| Case                                                                                 | Handling                                                                                                                                     |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A post with no shared-tag matches                                                    | Related-posts section simply doesn't render — no filler/fallback content, empty is honest                                                    |
| A tag's 7-day window has zero posts                                                  | Drops out of trending entirely rather than showing a stale all-time leader with no recent activity — matches the "recency" promise literally |
| Related-posts candidates include an unpublished revision-in-progress of another post | Not possible — Step 0's shared filter already excludes anything not `published`+`visible`, same guarantee as everywhere else                 |

### Definition of done

Matches roadmap DoD: story page shows 3 same-tag related posts; trending sidebar reflects last-7-days activity, confirmed against seeded data with posts both inside and outside the 7-day window.

---

## Cascade updates — consolidated, same discipline as Phase B's own consolidation

Phase C introduces two new ownership concepts (publication membership, reading lists) that account deletion must account for. Following the same pattern Phase B used to consolidate its own cascade additions rather than leaving them scattered:

| Deleted user's...                                                                                       | Required cascade behavior                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PublicationMember` docs where they are the member                                                      | Delete. If they were the sole `owner` of a publication with other members remaining, ownership must transfer to the most senior remaining editor (or the publication is archived if no other members exist) — **do not leave a publication ownerless**, this is the exact failure mode the last-owner lockout guard exists to prevent in the live-user case, and deletion is the one path that bypasses that guard, so it needs its own explicit handling |
| `Publication` docs where they are `owner` with no other members                                         | Archive (soft-flag, not hard-delete) — the publication's already-approved posts from _other_ authors shouldn't vanish because the founder left                                                                                                                                                                                                                                                                                                            |
| Posts with `submissionStatus: 'pending'` awaiting review from a publication the deleted user edits/owns | If they were the only reviewer, the submission is left `pending` indefinitely otherwise — flag as needing a fallback reviewer assignment or an explicit "no reviewer available" state, don't let it silently stall forever                                                                                                                                                                                                                                |
| `ReadingList` docs they own                                                                             | Delete, per the standard "user-owned artifact goes with the account" rule already established (same category as `Report`/`PostRevision` in Phase B's own cascade table)                                                                                                                                                                                                                                                                                   |
| Other users' `ReadingList.posts` entries referencing the deleted user's now-deleted posts               | Same dangling-reference-as-placeholder handling defined in Step 3, not a special case — the cascade doesn't need to reach into other users' lists and scrub them, the placeholder rendering already handles it at read time                                                                                                                                                                                                                               |

---

## Phase C — final cross-check before calling it done

- [ ] The shared visibility-filter helper exists and Phase B's four surfaces are confirmed refactored onto it, not left as four separate inline filters plus three new ones
- [ ] "For You" tab confirmed as additive alongside "Latest," never a silent default replacement — matches the SEO phase's original non-negotiable discovery-transparency commitment
- [ ] Confirmed editors cannot directly edit author content anywhere in the submission/review flow — only approve/reject/request-changes with required notes
- [ ] Last-owner lockout guard tested for publications, same rigor as Phase B's last-admin guard was tested (not just coded)
- [ ] Account deletion cascade updated for `PublicationMember`/`Publication`/`ReadingList` — ownerless-publication and orphaned-pending-submission cases specifically exercised, not just the simple delete-your-own-stuff case
- [ ] Reading list draft/hidden-post block and dangling-reference placeholder both confirmed via actual clicks, not just described

---

_Drafted 2026-07-22 — implementation-ready companion to Phase C of INKWELL_FULL_PRODUCT_ROADMAP.md._
