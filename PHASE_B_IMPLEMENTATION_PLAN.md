# 🖋️ Inkwell — Phase B Implementation Plan (Safety & Integrity)

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and `PROJECT_BLUEPRINT.md` v1.2.0.
> Spec-level detail only — no code. Every field, endpoint, and edge case named so implementation is a direct translation, same standard as the Phase A plan.

---

## 0. Estimate revision — flagged upfront, not buried

The roadmap's Phase B total (7.5 weeks) covers items 8–11 only. It doesn't account for a real prerequisite: **there is currently no `role` or `status` concept on `User` at all.** Admin dashboard (item 9) needs ban/role management; moderation (item 8) needs an admin actor to resolve reports. Neither can be built on a schema that doesn't distinguish an admin from anyone else. This needs a foundation step before Step 1, same pattern as Phase A's Step 0.

Also surfaced: **two of Phase A's cascade-list gaps are now real**, not hypothetical — Phase A's own account-deletion doc flagged "when Phase B introduces `Post.revisions` and a reports/moderation queue, this cascade list must be revisited." That moment is now. Both are called out explicitly in Steps 1 and 4 below, with the actual required changes to Phase A's existing deletion cascade — not deferred again.

**Revised Phase B total: ~8.5 weeks** (was 7.5).

| Step      | Covers                                                 | Days                      |
| --------- | ------------------------------------------------------ | ------------------------- |
| 0         | Role/status schema + admin middleware foundation       | 2.5                       |
| 1         | Moderation — reports, review queue, audit log (item 8) | 9.5                       |
| 2         | Admin dashboard (item 9)                               | 13.5                      |
| 3         | Revision history (item 10)                             | 6.5                       |
| 4         | Nested comments/threads (item 11)                      | 9.5                       |
| **Total** |                                                        | **~41.5 days (~8.5 wks)** |

Build in this order. Step 2 genuinely depends on Step 1's `Report`/`AuditLog` models existing first — the admin dashboard's moderation queue view has nothing to render otherwise.

---

## Step 0 — Role/Status Foundation

### `User.js` additions

| Field    | Type                        | Default    | Purpose                                                   |
| -------- | --------------------------- | ---------- | --------------------------------------------------------- |
| `role`   | enum `'user' \| 'admin'`    | `'user'`   | Gates all `/api/admin/*` routes                           |
| `status` | enum `'active' \| 'banned'` | `'active'` | Checked on every authenticated request, not just at login |

### Critical behavior change — `requireAuth` middleware

`requireAuth` already loads the user from the database on every request (not just decoding the JWT). Add `status !== 'active'` → 403 to that same lookup. This is what makes a ban take effect **immediately** on the banned user's very next request — not after their 15-minute access token happens to expire. This is a change to existing, already-shipped middleware, not new code — call it out in the diff explicitly so it isn't missed as "just adding a field."

### New middleware: `requireAdmin`

Runs after `requireAuth`. Checks `req.user.role === 'admin'` → 403 if not. Applied to every `/api/admin/*` route in Steps 1–2.

### The first-admin bootstrap problem — real, not hypothetical

There is no invite or self-promotion flow, by design (an open "become admin" endpoint would be a standing vulnerability). The very first admin account must be created by a one-off script run directly against the database: `server/src/scripts/promote_admin.js <email>` — sets that one user's `role` to `'admin'`. This is a deliberate manual step. Document it as such in the README, don't leave it undiscoverable.

### Edge cases

| Case                                                | Handling                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Banned user has a still-valid access token          | Next request still 403s — DB-backed check, not JWT-trusted                |
| Non-admin hits `/api/admin/*`                       | 403, not 404 — consistent with the rest of the API's explicit error style |
| `promote_admin.js` run against a non-existent email | Clear script error, no silent no-op                                       |

### Definition of done

Manually promote a seeded user to admin → they can hit a stub `/api/admin/*` route, everyone else gets 403. Ban a different seeded user → their next request (with a still-fresh access token) is rejected immediately, not after token expiry.

---

## Step 1 — Moderation: Reports, Review Queue, Audit Log

### New model: `Report` — `server/src/models/Report.js`

| Field          | Type                                                        | Constraints                                                |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `reporter`     | ObjectId → User                                             | required                                                   |
| `targetType`   | enum `'post' \| 'comment'`                                  | required                                                   |
| `targetId`     | ObjectId                                                    | required — references `Post` or `Comment` per `targetType` |
| `reason`       | enum (`spam`, `harassment`, `misinformation`, `other`)      | required                                                   |
| `details`      | String, maxlength 500                                       | optional free text                                         |
| `status`       | enum `'pending' \| 'reviewed' \| 'dismissed' \| 'actioned'` | default `'pending'`                                        |
| `priorityFlag` | Boolean                                                     | default `false`                                            |
| `createdAt`    | Date                                                        | auto                                                       |

Compound unique index: `{ reporter, targetType, targetId }` — one report per user per target, not infinitely re-reportable by the same person.

### Auto-flagging threshold — a design decision, stated explicitly

The roadmap's own definition of done reads "Report 3x → queue entry → soft-delete → hidden from feed." Read literally, that's auto-hide-on-report-count with **no human review** — which is a brigading vector: a coordinated group could mass-report and silence a legitimate post before any admin sees it. **This plan does not implement literal auto-hide.** Instead: 3+ pending reports on the same target sets `priorityFlag: true`, surfacing it at the top of the admin queue — it does **not** flip `moderationStatus` on its own. A human admin action is what actually hides content (Step 2). If auto-hide-without-review is actually wanted, that's a one-line change to flip later — flagging the choice now so it's a decision, not a silent interpretation.

### New model: `AuditLog` — `server/src/models/AuditLog.js`

| Field        | Type                                                                                                                                                               | Notes                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `actor`      | ObjectId → User                                                                                                                                                    | the admin who took the action                           |
| `action`     | enum (`post_hidden`, `post_unhidden`, `comment_hidden`, `comment_unhidden`, `user_banned`, `user_unbanned`, `role_changed`, `report_dismissed`, `report_actioned`) | required                                                |
| `targetType` | enum `'post' \| 'comment' \| 'user' \| 'report'`                                                                                                                   | required                                                |
| `targetId`   | ObjectId                                                                                                                                                           | required                                                |
| `metadata`   | Object (Mixed)                                                                                                                                                     | optional context — e.g. previous role, dismissal reason |
| `createdAt`  | Date                                                                                                                                                               | auto                                                    |

**Policy call, flagged explicitly:** `AuditLog` rows are never deleted, including when the `actor` (an admin) later has their own account deleted. Audit trails are a record of what happened, not a user-owned artifact — the `actor` ref is allowed to go stale/orphaned on purpose, the same way financial or compliance logs elsewhere survive the account that generated them. Confirm this reads right to you; it's a real policy decision, not an obvious default.

### `Post.js` / `Comment.js` addition

| Field              | Type                         | Default     | Purpose                                                                   |
| ------------------ | ---------------------------- | ----------- | ------------------------------------------------------------------------- |
| `moderationStatus` | enum `'visible' \| 'hidden'` | `'visible'` | Soft-delete flag — content is preserved, never hard-deleted by moderation |

**Cross-cutting change, easy to miss:** every existing read path that currently filters `status: 'published'` must now also filter `moderationStatus: 'visible'` — the home feed query, `sitemap-data`, both RSS builders, and full-text search. This is the same class of bug as the earlier draft-leak issue from the SEO/portability phase: a hidden post silently surviving in the sitemap or RSS feed because one query path got missed. Treat it with the same seriousness — a single regression test asserting a hidden post is absent from all four surfaces, not just a manual spot-check.

### New endpoints

| Method | Path                             | Auth         | Description                                                                  |
| ------ | -------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| POST   | `/api/reports`                   | required     | Create a report against a post or comment                                    |
| GET    | `/api/admin/reports`             | requireAdmin | Paginated, filterable by status, sorted `priorityFlag` desc then `createdAt` |
| PATCH  | `/api/admin/reports/:id`         | requireAdmin | Resolve — dismiss, or action (hides target + writes `AuditLog`)              |
| PATCH  | `/api/admin/posts/:id/unhide`    | requireAdmin | Reverses a hide action — moderation is not one-way                           |
| PATCH  | `/api/admin/comments/:id/unhide` | requireAdmin | Same, for comments                                                           |

### Edge cases

| Case                                                               | Handling                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self-reporting own content                                         | 400                                                                                                                                                                                                                                                                                     |
| Duplicate report, same user + target                               | 409, friendly message, caught by the unique index                                                                                                                                                                                                                                       |
| Reporting a comment on your own post                               | Allowed — still valid to flag abuse in your own comment section                                                                                                                                                                                                                         |
| Reporting a target that's already hidden                           | Recorded anyway (audit trail); admin queue UI should indicate "already hidden" so it's not confusing                                                                                                                                                                                    |
| Reported user's account later gets fully deleted (Phase A cascade) | **Phase A's cascade list must be updated**: `Report` docs where `reporter` = the deleted user should be deleted (the report itself is a user-owned action); `Report` docs where `targetId` references that user's now-deleted posts/comments should also be cleaned up in the same pass |

### Definition of done

Three different seeded users report the same post → it surfaces with `priorityFlag: true` at the top of the admin queue, but is still fully visible on the site (no auto-hide happened). Admin marks it "actioned" → `moderationStatus` flips to `hidden`, an `AuditLog` entry exists with correct actor/action/target, and the post is confirmed absent from the home feed, sitemap, both RSS feeds, and search results — all four, not a subset. Unhide reverses it cleanly across the same four surfaces.

---

## Step 2 — Admin Dashboard

Depends on Step 0 (role/status) and Step 1 (`Report`/`AuditLog`).

### New endpoints

| Method | Path                         | Auth         | Description                                                                                            |
| ------ | ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| GET    | `/api/admin/users`           | requireAdmin | Paginated, searchable by username/email; shows role, status, post count, join date                     |
| PATCH  | `/api/admin/users/:id/ban`   | requireAdmin | Sets `status: 'banned'`, writes `AuditLog`                                                             |
| PATCH  | `/api/admin/users/:id/unban` | requireAdmin | Reverses                                                                                               |
| PATCH  | `/api/admin/users/:id/role`  | requireAdmin | Change role; writes `AuditLog`                                                                         |
| GET    | `/api/admin/stats`           | requireAdmin | Aggregated: total users, posts by status, reports by status, 30-day signup/post counts bucketed by day |

### Last-admin lockout guard — real edge case, not paranoia

`PATCH /api/admin/users/:id/role` demoting a user from admin to user must check: if this is the only remaining admin, block the demotion with a clear error. Same logic applies to an admin banning themselves — technically allowed (recoverable by another admin), but if they're the _only_ admin, that's a genuine self-lockout with no recovery path except re-running `promote_admin.js` directly against the database. Client-side should warn before either action; server-side should hard-block the demotion case specifically, since that one has no manual recovery path as clean as the ban case does.

### Client: `client/src/app/(admin)/admin/`

- `layout.jsx` — admin-only guard. **This client-side check is UX only — it hides the nav, it is never the actual security boundary.** The real boundary is `requireAdmin` on the server. State this explicitly in the component so a future edit doesn't accidentally start treating the client guard as sufficient.
- `page.jsx` — stats overview
- `users/page.jsx` — user list, ban/unban/role actions
- `reports/page.jsx` — moderation queue from Step 1

### Edge cases

| Case                                           | Handling                                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-admin navigates directly to `/admin/*` URL | Client redirects (UX), but the underlying API calls would 403 regardless even if the redirect were somehow bypassed                                                                             |
| Demoting the last admin                        | Blocked server-side with a clear error message                                                                                                                                                  |
| Stats query performance at current data volume | Live aggregation on every dashboard load is fine at this scale — not worth precomputing/caching yet; note as a future concern only if Phase C's growth work materially changes post/user volume |

### Definition of done

Ban a second seeded user via the admin UI → their next API call (not just the UI) is rejected. Promote a user to admin → they gain access to `/admin/*`. Attempt to demote the only admin → blocked with a clear message. Stats page shows real numbers matching the actual seeded/test data, not placeholders.

---

## Step 3 — Revision History

### New model: `PostRevision` — `server/src/models/PostRevision.js`

| Field                                                    | Type            | Notes                                                                                                                                           |
| -------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`                                                   | ObjectId → Post | required, indexed                                                                                                                               |
| `title`, `subtitle`, `contentHtml`, `tags`, `coverImage` | snapshot copies | the pre-change state, not the new state                                                                                                         |
| `editedBy`                                               | ObjectId → User | usually `post.author`, but named generically — future-proofs for Phase C publications where an editor other than the original author might edit |
| `createdAt`                                              | Date            | auto — this **is** the revision's timestamp                                                                                                     |

### Trigger logic

In `updatePost`, before applying changes: compare incoming `title`/`subtitle`/`contentHtml`/`tags` against current values. Only snapshot a revision if at least one of those actually changed — a bare `draft ↔ published` status toggle with no content change should not spam identical revisions.

### Cap

Keep the most recent 50 revisions per post; prune the oldest beyond that on each new write. This number has no external benchmark to match — Medium has zero revision history at all, so this is a "genuine exceed" feature with no equivalent to calibrate against. Treat 50 as a starting judgment call, not a requirement.

### New endpoints

| Method | Path                                             | Auth                  | Description                                |
| ------ | ------------------------------------------------ | --------------------- | ------------------------------------------ |
| GET    | `/api/posts/:slug/revisions`                     | required, author-only | List — metadata only (timestamp, editedBy) |
| GET    | `/api/posts/:slug/revisions/:revisionId`         | required, author-only | Full snapshot content                      |
| POST   | `/api/posts/:slug/revisions/:revisionId/restore` | required, author-only | Restores content into the live post        |

Author-only gate here uses the same pattern already established for draft visibility — no new authorization concept, just the existing one applied to a new resource.

### Restore must NOT touch

`status`, `publishedAt`, `indexable`, `canonicalUrl`, `notifiedAt` — restore changes content fields only. Critically: restoring content must **not** re-trigger Phase A's follower-notification flow. The `notifiedAt` reset is currently wired to the `draft → published` status transition specifically — a content-only restore doesn't touch `status`, so it shouldn't fire that guard. Confirm this interaction explicitly rather than assuming it "just works" — it's exactly the kind of cross-feature interaction that's easy to get wrong silently.

Restoring itself creates a new revision, snapshotting the state immediately before the restore — so a restore is itself undoable, not a one-way trapdoor.

### Diff view

Client-side, word-level diff on plaintext-stripped content (not a byte-level diff — unreadable on HTML). Use an existing small diff library rather than hand-rolling one; the requirement is a readable, human-scannable diff, not a specific implementation.

### Edge cases

| Case                                                             | Handling                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Restoring a revision older than the 50-cap prune window          | Impossible by construction — document as an accepted limitation, not a bug to chase                                                                                                                                                                                                                    |
| Two tabs editing the same post concurrently                      | Out of scope for this phase — existing last-write-wins behavior is unchanged, not being fixed here                                                                                                                                                                                                     |
| Long posts edited frequently → large cumulative revision storage | Acceptable at MVP scale; flag as a future compression/diff-storage concern, not now                                                                                                                                                                                                                    |
| **Author's account later fully deleted (Phase A cascade)**       | **Phase A's cascade list must be updated again**: `PostRevision` docs reference posts that are themselves being hard-deleted in full erasure — revisions are meaningless without their parent post, so they must cascade-delete alongside it, in the same pass as the post deletion, not left orphaned |

### Definition of done

Edit a published post three times with real content changes → three revisions exist, each holding the correct prior-state snapshot. Diff view renders a readable word-level diff between any two. Restore an older revision → live content matches it exactly, a new revision now exists capturing the pre-restore state, and `notifiedAt`/`indexable`/`canonicalUrl` are all unchanged by the restore.

---

## Step 4 — Nested Comments/Threads

### `Comment.js` additions

| Field                  | Type                         | Default                                 | Purpose                                                        |
| ---------------------- | ---------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `parentComment`        | ObjectId → Comment, nullable | `null`                                  | Top-level comments have `null`; replies reference their parent |
| `depth`                | Number                       | computed on create (`parent.depth + 1`) | Caps nesting, avoids recursive lookups for indentation         |
| `deletedButHasReplies` | Boolean                      | `false`                                 | See soft-delete branch below                                   |

### Max depth

Cap at 5 levels — a judgment call, not a hard external rule (name it as a configurable constant). Beyond the cap, replying is still allowed but the UI visually flattens further nesting rather than collapsing under its own indentation.

### Soft-delete branch — a real behavior fork, not one code path

Deleting a comment with **zero** replies: unchanged, hard-delete exactly as today.

Deleting a comment that **has** replies: don't hard-delete it. Set `content` to a placeholder (`"[deleted]"`), clear or hide the `author` ref in the UI (keep it in the DB for moderation audit purposes), set `deletedButHasReplies: true`. This is what the roadmap's own DoD means by "deletion of a parent handles orphaned children explicitly" — call out that this is genuinely two different code paths depending on whether replies exist, not a single unified delete.

### Endpoints

Extend the existing `POST /api/posts/:slug/comments` to accept an optional `parentComment` field. Validate: the referenced parent belongs to the same post (blocks cross-post parent injection), and the resulting depth doesn't exceed the cap — **clamp to max depth rather than reject**, since silently flattening a too-deep reply is better UX than an opaque rejection. Name this as the deliberate choice.

### Response shape — a real API decision, not an implementation detail

`GET /api/posts/:slug/comments` currently returns a flat array. Two options: return a nested tree directly (simpler for the client to render immediately), or keep it flat with `parentComment` refs and let the client assemble the tree (more flexible if comment counts ever need pagination later, since a fully nested payload doesn't paginate cleanly). **Recommend flat-with-parent-refs** — comment volume is currently unbounded per post, and pagination is a much easier retrofit onto a flat shape than a nested one.

### Cross-references, both required

- Replying to a comment on a post that is currently a draft or has `moderationStatus: 'hidden'` should be blocked — consistent with the existing "no interaction on non-visible posts" gate already established in the SEO/portability phase for drafts. Apply the same rule to hidden posts from Step 1.
- **Phase A's cascade list must be updated a second time**: a deleted user's comments must go through the same has-replies-check as any other deletion, not a blanket hard-delete — otherwise a deleted user's comment with live replies leaves those replies pointing at a hard-deleted parent instead of a `[deleted]` placeholder.

### Edge cases

| Case                                                      | Handling                                              |
| --------------------------------------------------------- | ----------------------------------------------------- |
| Deleting a leaf comment                                   | Unchanged — hard delete                               |
| Deleting a comment with replies                           | Soft-delete per above                                 |
| Deleting a reply whose own parent is already soft-deleted | Independent operations, no special handling needed    |
| Reply attempted on a hidden/draft post                    | Blocked, same gate as existing draft-interaction rule |
| Depth exceeds cap                                         | Clamped visually, reply still succeeds                |

### Definition of done

Reply-to-reply renders correctly at depth ≥3. Deleting a parent with replies leaves a `[deleted]` placeholder with the thread intact and replies still visible/repliable. Deleting a leaf comment removes it entirely. Depth cap visually clamps beyond 5 without blocking the underlying reply action.

---

## Phase A cascade — consolidated required updates

Both Steps 1 and 4 independently surfaced the same forward-looking note Phase A's own doc left for this moment. Consolidated here so it's done once, correctly, not twice piecemeal:

| Deleted user's...                                                          | Required cascade behavior                                                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Report` docs where they are `reporter`                                    | Delete                                                                                                                                 |
| `Report` docs where `targetId` references their now-deleted posts/comments | Delete                                                                                                                                 |
| `PostRevision` docs for their deleted posts                                | Delete, in the same pass as the post deletion                                                                                          |
| `Comment` docs they authored                                               | Route through the has-replies check — soft-delete-with-placeholder if replies exist, hard-delete otherwise (not a blanket hard-delete) |
| `AuditLog` docs where they are `actor`                                     | **Preserve** — audit trail integrity outlives the account, ref allowed to go stale intentionally (policy call, confirm it reads right) |

---

## Phase B — final cross-check before calling it done

- [ ] `requireAuth` DB-backed ban check confirmed to take effect on the very next request, not delayed by token TTL
- [ ] All four content-visibility surfaces (feed, sitemap, both RSS feeds, search) confirmed to exclude `moderationStatus: 'hidden'` content — one shared regression test, not four manual checks
- [ ] Last-admin demotion/lockout guard tested, not just coded
- [ ] Restore-from-revision confirmed not to re-trigger follower notification or touch SEO/indexing fields
- [ ] All three Phase A cascade updates (Report, PostRevision, Comment soft-delete) implemented — not left as three separate "later" notes again
- [ ] `promote_admin.js` documented in README as the deliberate first-admin bootstrap step

---

_Drafted 2026-07-17 — implementation-ready companion to Phase B of INKWELL_FULL_PRODUCT_ROADMAP.md._
