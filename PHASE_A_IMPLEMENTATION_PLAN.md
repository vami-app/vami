# 🖋️ Inkwell — Phase A Implementation Plan (Ownership & Trust Foundation)

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and `PROJECT_BLUEPRINT.md` v1.1.0.
> Spec-level detail only — no code. Every field, endpoint, and edge case named so implementation is a direct translation, not a design exercise.

---

## 0. Estimate revision — flagged upfront, not buried

Deep read of the blueprint surfaced a dependency the original phase overview didn't itemize: **notification email and the digest can't legally ship without a working one-click unsubscribe**, and **Sovereign Export needs follow-event data that doesn't exist in the current schema** (`User.followers`/`following` are bare ObjectId arrays — no `followedAt`, no attribution). Both require a schema foundation step before items 1–4 can be built correctly instead of retrofitted.

Also found: the original digest spec ("posts from followed authors/tags") assumes tag-following, which **doesn't exist in the current `User` model at all**. Adding it properly.

**Revised Phase A total: ~6.5 weeks** (was ~5). Flagging the revision rather than hiding it.

| Step | Covers | Days |
|---|---|---|
| 0 | Schema & compliance foundations | 2.5 |
| 1 | New-content notification (item 1) | 2.5 |
| 2 | Weekly digest + tag-follow (item 2) | 4.5 |
| 3 | Settings UI (item 4) | 2 |
| 4 | Sovereign Export upgrade (item 3) | 3.5 |
| 5 | Legal pages (item 5) | 4 |
| 6 | Account deletion cascade (item 6) | 6.5 |
| 7 | Email verification (item 7) | 7 |
| **Total** | | **~32.5 days (~6.5 wks)** |

Build in this order — each step is a real dependency for what follows, not an arbitrary sequence.

---

## Step 0 — Schema & Compliance Foundations

### New model: `Follow` — `server/src/models/Follow.js`

| Field | Type | Constraints |
|---|---|---|
| `follower` | ObjectId → User | required, indexed |
| `followee` | ObjectId → User | required, indexed |
| `followedAt` | Date | default now |
| `sourcePost` | ObjectId → Post | nullable — set only if the follow originated from a story page's follow button, null if from the profile page directly |

Compound unique index: `{ follower: 1, followee: 1 }`. This collection is the **source of truth for attribution** (Sovereign Export needs it). `User.followers`/`following` arrays stay as-is — they're the fast-read denormalized cache every existing controller already relies on (`toCardJSON`, profile follower counts, feed queries). Don't touch those paths. Write/delete a `Follow` doc **alongside** every existing array push/pull in the follow-toggle logic — same transaction, no separate migration of read paths.

### `User.js` additions

| Field | Type | Default | Purpose |
|---|---|---|---|
| `emailPrefs.allEmails` | Boolean | `true` | Master switch — reset/security email always sends regardless |
| `emailPrefs.digestFrequency` | enum `'weekly' \| 'off'` | `'weekly'` | Digest cadence |
| `followedTags` | [String] | `[]` | **New capability, not in current schema.** Needed because the original digest spec ("followed authors/tags") assumes this exists — it doesn't. Small addition, real gap closed here |
| `lastDigestSentAt` | Date | `null` | Idempotency guard — prevents double-send if the digest script runs twice in a week |

### `Post.js` addition

| Field | Type | Default | Purpose |
|---|---|---|---|
| `notifiedAt` | Date | `null` | Guards against re-notifying followers on every subsequent edit of an already-published post |

### New utility: `server/src/utils/unsubscribeToken.js`

- `signUnsubscribeToken(userId)` → short signed token embedding `userId` + purpose tag, using existing JWT secret infra (no new DB storage needed — flipping a boolean is safe to repeat, so the token doesn't need single-use tracking like the password-reset token does)
- `verifyUnsubscribeToken(token)` → returns `userId` or throws

### New endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/unsubscribe` | none (token in query string) | Verifies token, sets `emailPrefs.allEmails = false`, returns a simple confirmation page/response |

This must exist **before** Step 1 ships any bulk email — CAN-SPAM one-click unsubscribe isn't optional, and it was flagged as a compliance gap in earlier review of this project.

### Migration script: `server/src/scripts/backfill_follows.js`

One-time script for existing dev/seed data: for every entry in every `User.following` array, create a corresponding `Follow` doc with `followedAt` set to a backfill placeholder date and `sourcePost: null`. Without this, Sovereign Export would silently omit every pre-existing follow relationship in seeded/dev data.

### Definition of done

- `Follow` collection populated correctly after running the backfill script against seed data
- Toggling follow/unfollow via the existing endpoint correctly creates/deletes both the `Follow` doc and the array entries in the same operation
- Hitting the unsubscribe endpoint with a valid token flips `emailPrefs.allEmails` to `false`; invalid/expired token returns a clear error, doesn't throw a 500

---

## Step 1 — New-Content Notification Email

### New utility: `server/src/utils/notify.js`

`notifyFollowersOfNewPost(post)`:
1. Query `Follow.find({ followee: post.author })`, populate follower's `email`, `name`, `emailPrefs.allEmails`
2. Filter to `emailPrefs.allEmails !== false` and defensively exclude `follower._id === post.author` even though self-follow should already be blocked at the toggle level (verify that guard exists in `user.controller.js`; if missing, fix it as part of this step — it's a latent bug, not new scope)
3. Batch in chunks (~50 recipients) with a short delay between chunks, sized to whatever free-tier provider rate limit is active (Resend/Mailtrap) — keep the chunk size as a named constant, not hardcoded inline
4. Send via existing `email.js` + new `newPostNotificationTemplate()` in `emailTemplates.js` — table layout matching the existing password-reset template's style, includes the one-click unsubscribe link from Step 0
5. On completion, set `post.notifiedAt = new Date()` via a direct field update (not a full `post.save()`, to avoid re-triggering the `pre('save')` hook's side effects unnecessarily)

### Trigger points — `post.controller.js`

- `createPost`: if created directly with `status: 'published'`, call `notifyFollowersOfNewPost` after save
- `updatePost`: if `status` transitions `'draft' → 'published'`, same call
- Guard: only fire if `post.notifiedAt === null` — prevents re-sending on later edits to an already-published, already-notified post
- **Behavior change to existing hook:** the `Post` pre-save hook already resets `indexable` to `false` when status flips back to draft. Add `notifiedAt` reset to `null` in that same hook, so a republish after unpublishing triggers a fresh notification — this is a deliberate, explicit change to existing logic, not an oversight

### Send timing

Don't await the full notify call synchronously inside the publish request/response cycle — N email sends shouldn't add latency to a writer hitting "Publish." Fire it after the response is sent, wrapped in its own try/catch with per-recipient failure logging. A failed email send must never fail the publish action itself.

### Edge cases

| Case | Handling |
|---|---|
| Author has 0 followers | No-op, no error, `notifiedAt` still set |
| Provider send failure mid-batch | Log failure per recipient, continue batch, don't retry automatically (avoid duplicate sends on retry) |
| Post edited after publish (not a status change) | No re-notification — `notifiedAt` already set, guard holds |
| Post unpublished then republished | Re-notifies — `notifiedAt` reset by the pre-save hook |

### Definition of done

Publish a seeded post with followers who have varying `emailPrefs.allEmails` values → only opted-in followers receive an email in Mailtrap, dedup confirmed on a second harmless save of the same published post, `notifiedAt` set correctly.

---

## Step 2 — Weekly Digest + Tag-Follow

### New capability: tag-following

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/tags/:tag/follow` | POST | required | Toggle tag in `User.followedTags` |

Mirrors the existing follow-toggle pattern already used for authors — same validation shape (tag must exist in the current trending-tags set or be a previously-used tag; no free-text spam tags).

### New script: `server/src/scripts/send-weekly-digest.js`

Not wired into the Express process — a standalone script, invoked manually in dev (`node src/scripts/send-weekly-digest.js`), designed so a later external scheduler (cron, whatever form that takes) can call it without any code change.

Per-user logic:
1. Skip if `emailPrefs.digestFrequency !== 'weekly'` or `lastDigestSentAt` is within the last 6 days (idempotency guard)
2. Gather candidate posts: `Post.find({ status: 'published', publishedAt: { $gte: sevenDaysAgo } })` where `author` is in the user's `following` **or** any tag in `tags` matches the user's `followedTags`
3. Dedupe by post `_id` (a post can match both an authored-by-followed-author and a followed-tag condition)
4. Sort by `totalClaps` descending, cap at top N (e.g. 5)
5. **Skip send entirely if the candidate list is empty** — an empty digest trains people to ignore the next one
6. Send via `email.js` + new `weeklyDigestTemplate()`, set `lastDigestSentAt = new Date()`

### Edge cases

| Case | Handling |
|---|---|
| User follows nobody and no tags | Empty candidate list → skip, no email |
| User has `digestFrequency: 'off'` | Skip entirely, no partial logic runs |
| Script run twice same week (manual re-run in dev) | `lastDigestSentAt` guard prevents double-send |
| Post matches both an authored-by-followed-author and followed-tag condition | Deduped by `_id` before sending |

### Definition of done

Manual run against seeded data produces correct per-user candidate lists, empty-candidate users are skipped and logged (not silently ignored — log line so you can verify the skip was intentional, not a bug), re-running the script within 6 days sends nothing further.

---

## Step 3 — Settings UI

### Extend `PATCH /api/users/me`

Already exists — extend accepted body fields to include `emailPrefs.allEmails`, `emailPrefs.digestFrequency`. New validator rules in `user.validator.js`: `digestFrequency` must be one of the enum values, `allEmails` must be boolean.

### `client/src/app/(main)/settings/page.jsx` addition

New section, mirroring the copy pattern already researched: master toggle, frequency selector (disabled/greyed when master toggle is off), and a static line — *"You'll still receive account security emails even if this is off"* — visible regardless of toggle state, not just documentation.

### Definition of done

Toggling off in the UI persists via `PATCH /me`, subsequent notification/digest runs against that user correctly suppress (verified by re-running Step 1/2's test scenarios against a toggled-off account), reset-password email still arrives regardless.

---

## Step 4 — Sovereign Export Upgrade

### `exportAccount.js` addition

New file in the export ZIP: `followers.json` — built from `Follow.find({ followee: user._id })`, populating each follower's `email` and `name`, output shape: `{ email, name, followedAt, sourcePost: <slug or null> }`.

### Permanent no-lock guarantee — encoded as a test, not a policy doc

Add to `run_evidence_verification.js`: create a test user, follow them from a second test user **"today,"** trigger export, assert the new follower is present in `followers.json` with correct attribution. This test is the enforcement mechanism — if a future code change (including future-you, months from now) ever adds a date-based filter to this export path, this test fails the verification run and the build is caught before it ships. That's what makes "never locked" a real guarantee instead of a README claim.

### Cross-reference forward

When Step 6 (account deletion) removes a user, their `Follow` docs (both as follower and followee) must be deleted too — noted here so Step 6's cascade list doesn't miss it, since this collection didn't exist before this phase.

### Definition of done

Export ZIP contains `followers.json` with every current follower correctly attributed; the added verification test passes; a deleted user's `Follow` docs don't appear in either party's export after Step 6 lands.

---

## Step 5 — Legal Pages

### New route group: `client/src/app/(legal)/`

- `layout.jsx` — minimal header (Logo linking home, no full search/write nav needed), standard Footer
- `terms/page.jsx`, `privacy/page.jsx` — static content

### Content requirements — must accurately reflect real data flows, not boilerplate

Cross-referenced against the blueprint's own tables so the policy doesn't promise something the code doesn't do (or omit something it does):

| Must document | Source of truth |
|---|---|
| What's collected at registration | `User` model fields (§5.3) |
| Cookies used | httpOnly JWT access/refresh cookies (§10) — no tracking cookies exist, say so plainly |
| Third-party processors | Resend/Mailtrap (email), MongoDB (storage) — name them, don't hide behind "trusted partners" vagueness |
| Data export rights | Reference the actual export endpoint and what it now contains (Step 4) |
| Data deletion rights | Reference Step 6's endpoint once built |
| Children's privacy | Standard age-minimum boilerplate |
| Governing law | Placeholder — this is a real legal decision, not a technical one, flag as needing a non-engineering decision from you |

### Footer.jsx

Add links to `/terms` and `/privacy`.

### Definition of done

Both pages live and publicly reachable logged-out; every data-practice claim in the text is traceable to an actual field, endpoint, or third-party service that exists in the codebase — no aspirational claims.

---

## Step 6 — Account Deletion Cascade

### New endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/me/delete-request` | required | Sends a confirmation email with a delete-confirmation token (same signed-token pattern as unsubscribe) |
| DELETE | `/api/users/me` | required, `?token=` | Confirms and executes deletion |

Two-step, not a single destructive click — same caution level as the password-reset flow, for the platform's most irreversible action.

### Choice presented at confirmation

Per GDPR erasure expectations and the "brutally strict" standard, offer two paths explicitly:

| Option | Behavior |
|---|---|
| Full erasure | Everything below is hard-deleted |
| Anonymize | Account and login access removed; posts/comments remain, reattributed to a placeholder "Deleted User" identity — mirrors how most mature platforms actually handle this so a thread doesn't collapse into orphaned references |

### Full cascade list (the "full erasure" path — anonymize path skips the content-deletion rows)

| Data | Action |
|---|---|
| `Post` docs where `author = user` | Delete |
| `Comment` docs where `author = user` | Delete |
| Other users' `bookmarks` referencing deleted posts | `$pull` the post IDs |
| `Follow` docs where `follower = user` OR `followee = user` | Delete both directions |
| Other users' `followers`/`following` arrays containing this user | `$pull` — keeps the denormalized cache consistent with the `Follow` collection cleanup |
| Embedded `claps` subdocs on other users' posts referencing this user | `$pull` by user ref, then recompute affected posts' `totalClaps` |
| Uploaded avatar file on local disk | Unlink if present |
| `emailVerify*` / `passwordReset*` token fields | Irrelevant post-deletion, deleted with the user doc itself |

**Explicitly flagged as forward-looking:** Phase B introduces `Post.revisions` and a reports/moderation queue. When those land, this cascade list must be revisited — noting it here now so it isn't forgotten later, not pretending Phase A can account for models that don't exist yet.

### Local-dev constraint, stated plainly

A true multi-document transaction needs a MongoDB replica set; a single-node local `mongod` may not support it without extra config. Handle the cascade as an explicit sequence with try/catch around each step, logging exactly which step failed if one does, rather than silently assuming atomicity that local dev might not actually provide.

### Edge cases

| Case | Handling |
|---|---|
| User deletes account with active `Follow` relationships in both directions | Both directions cleaned, verified independently |
| User is the sole author in a scenario with embedded claps on their own posts | Post itself is deleted anyway, no dangling clap cleanup needed for own posts |
| Confirmation token expired before deletion confirmed | Clear error, must request a fresh one, no partial deletion occurs |

### Definition of done

Seed a user with posts, comments, follows (both directions), bookmarks referencing their posts from other users, and claps on their posts from other users. Run full erasure. Verify: zero orphaned references anywhere in the database, avatar file removed from disk, both delete paths (full erasure vs. anonymize) tested independently.

---

## Step 7 — Email Verification (Full Flow)

### `User.js` additions

| Field | Type | Notes |
|---|---|---|
| `emailVerified` | Boolean, default `false` | |
| `emailVerifyTokenHash` | String, `select: false` | Same hash-not-raw-token pattern as password reset |
| `emailVerifyExpiresAt` | Date, `select: false` | 24-hour TTL |

### New endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/verify-email` | none, `?token=` | Verifies hash + expiry, sets `emailVerified = true`, clears token fields |
| POST | `/api/auth/resend-verification` | required, rate-limited | Regenerates token, resends |

`registerRules`/`register` controller: after user creation, auto-send the verification email using the existing `email.js` + a new `verifyEmailTemplate()`.

### What gets gated — decided explicitly, not left ambiguous

| Action | Requires verification? |
|---|---|
| Browse, read, draft | No |
| **Publish** | **Yes** — blocks disposable-email spam-publishing, the actual risk this feature defends against |
| Follow, clap, comment | No — no meaningful spam vector here, gating it would just be friction |
| Sovereign Export | No — this is an ownership right, not a privilege to withhold pending verification |

`post.controller.js` publish path: if `!author.emailVerified`, return 403 with a clear, actionable message (not a generic "forbidden").

### UI

App-wide banner component, shown whenever `!user.emailVerified`, with a "resend" action wired to the new endpoint. Non-blocking — dismissible per session, reappears next login until verified.

### Edge cases

| Case | Handling |
|---|---|
| Token expired (>24h) | Clear error on verify attempt, must resend |
| Verify link clicked twice | Idempotent — second attempt on an already-verified account returns success, no error |
| Resend spammed | Dedicated rate limit, separate from `authLimiter` (this is a different abuse pattern than login/reset attempts) |
| Unverified user attempts publish | 403 with message pointing at the banner/resend action, not a bare status code |

### Definition of done

Register → banner shows, publish attempt blocked with a clear message → verify via emailed link → banner gone, publish succeeds → attempting to reuse the same verify link a second time is a harmless no-op, not an error.

---

## Phase A — final cross-check before calling it done

- [ ] Every new model/field is covered by at least one path in Step 6's cascade, or explicitly flagged as forward-looking for Phase B
- [ ] `run_evidence_verification.js` has a passing assertion for: notification dedup, digest idempotency, Sovereign Export attribution + no-lock guarantee, full deletion cascade, email verification gate
- [ ] `README.md` password-reset line corrected (still outstanding from the original doc-sync note)
- [ ] Legal pages' claims cross-checked line-by-line against actual endpoints/fields, not written independently of the code

---

*Drafted 2026-07-17 — implementation-ready companion to Phase A of INKWELL_FULL_PRODUCT_ROADMAP.md.*
