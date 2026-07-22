# 🖋️ Inkwell — Phase E Implementation Plan (Identity, Access, Real-time)

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and the modular blueprint suite v1.5.0.
> Spec-level detail covering both **Backend API & Data Layer** and **Frontend UI Components**.

---

## 0. Cascade Impact Assessment (mandatory first section, per the standing rule from Phase C)

Every new collection or field referencing `User` is a cascade dependency by definition. Assessed before anything else, not discovered after the fact:

| New thing this phase introduces | References `User`? | Cascade impact |
|---|---|---|
| `User.googleId` / `User.githubId` | Fields on `User` itself | None — dies with the `User` doc automatically |
| `Notification` (new collection) | Yes — `recipient` and `actor` | **Real impact.** Addressed in Step 4 |
| `Post.scheduledAt` | Field on existing `Post` | None beyond what the existing "delete all posts authored by user" step already covers |

One genuine new cascade dependency this phase (`Notification`), handled in Step 4, consolidated at the end — not left as a scattered note for Phase F to rediscover.

---

## 1. Estimate revision — flagged upfront, not buried

The roadmap's Phase E total (4.5–5 weeks) treats all three items as closer to bolt-ons than they actually are. Three real gaps surfaced:

**Gap 1 — `password` is currently `required: true` on `User`.** OAuth-only signups have no password at all. This has to become conditional, not just "add a Google button."

**Gap 2 — a "bell icon" with "reconnect-after-disconnect handled" (the roadmap's own DoD language) requires persisted notifications, not live-only socket events.** A toast that vanishes if you were offline isn't a bell icon with an unread count — it needs a persisted inbox model + full UI inbox dropdown and page.

**Gap 3 — the naive Socket.IO auth pattern (`socket.handshake.auth.token`, the pattern nearly every tutorial shows) requires a client-JS-readable token.** This project's entire security model (Phase A/B) is built on tokens *never* being JS-accessible. Building auth the tutorial way would quietly reopen that. The correct pattern for this app is `io.engine.use()` gated on the handshake, reusing the existing cookie-based JWT verification — confirmed against Socket.IO's current documentation, not assumed from memory.

**Revised Phase E total: ~6 weeks** (was 4.5–5).

| Step | Covers | Days |
|---|---|---|
| 0 | Schema foundation across all three items | 3 |
| 1 | OAuth — Google + GitHub (Backend + Auth UI buttons) | 7 |
| 2 | Real-time notifications — backend model, socket auth, client socket hook & bell/inbox UI | 12 |
| 3 | Post scheduling — backend execution script + editor schedule picker UI | 6 |
| 4 | Consolidated cascade cross-check & verification | 2 |
| **Total** | | **~30 days (~6 wks)** |

---

## Step 0 — Schema Foundation

### `User.js` changes

| Field | Type | Change |
|---|---|---|
| `password` | String | **`required` changed to conditional** — required only if `googleId` and `githubId` are both unset. Mongoose custom validator, not a blanket `required: false`, so an email/password signup still can't skip it |
| `googleId` | String, nullable | unique, sparse index — sparse so multiple `null` values don't collide on the unique constraint |
| `githubId` | String, nullable | unique, sparse index — same reasoning |

**Why sparse, stated explicitly:** a standard unique index rejects a second `null`. Every non-OAuth user would have `googleId: null`, and a plain unique index would let only one such user exist. Sparse indexes ignore documents missing the field entirely — set the field to `undefined` (not stored) rather than `null` for users without that provider, so the sparse behavior actually applies.

### New model: `Notification` — `server/src/models/Notification.js`

| Field | Type | Constraints |
|---|---|---|
| `recipient` | ObjectId → User | required, indexed |
| `actor` | ObjectId → User | required |
| `type` | enum `'clap' \| 'comment' \| 'reply' \| 'follow'` | required |
| `targetType` | enum `'post' \| 'comment' \| 'user'` | required |
| `targetId` | ObjectId | required |
| `read` | Boolean | default `false`, indexed |
| `createdAt` | Date | auto |

This is the source of truth. Socket.IO is the **push mechanism** for rows already written here — never the other way around. A client that's offline when a notification is created simply fetches it from `GET /api/notifications` on next load; the socket is purely a live-update convenience layer on top of a system that works correctly without it.

### `Post.js` addition

| Field | Type | Default | Purpose |
|---|---|---|---|
| `scheduledAt` | Date, nullable | `null` | Future publish time. Post stays `status: 'draft'` until this passes |

### Definition of done

`password` validator rejects a plain email/password registration with no password; accepts an OAuth-created user with neither password nor conflict. Sparse indexes confirmed by creating two OAuth-only users with no `googleId` collision. `Notification` collection created and queryable.

---

## Step 1 — OAuth: Google + GitHub (Backend & Frontend)

### Passport configuration — no session, no new middleware family

`session: false` on every strategy. Passport's verify callback terminates by calling the **exact same** `signAccessToken` / `signRefreshToken` / `setAuthCookies` utilities the password-login endpoint already uses, then redirects to `CLIENT_URL`. This is the single most important design constraint in this step: OAuth must not introduce a parallel session mechanism (`express-session`) — everything downstream (`requireAuth`, the ban check, the Socket.IO handshake in Step 2) keeps working unchanged because the cookie shape never varies by login method.

### New Endpoints & Frontend UI Buttons

| Layer | Component / Path | Description |
|---|---|---|
| Backend GET | `/api/auth/google` | Redirects to Google consent screen, `scope: ['profile', 'email']`, `state: true` |
| Backend GET | `/api/auth/google/callback` | Verify callback → issue JWT cookies → redirect to `CLIENT_URL` |
| Backend GET | `/api/auth/github` | Redirects to GitHub, `scope: ['user:email']` |
| Backend GET | `/api/auth/github/callback` | Same pattern |
| Frontend | `login/page.jsx` & `register/page.jsx` | Add "Continue with Google" & "Continue with GitHub" OAuth buttons linking to `/api/auth/google` & `/api/auth/github` |

### The account-linking decision, stated explicitly

Verify callback logic, same for both providers:

1. Look up by `googleId`/`githubId`. Found → log in.
2. Not found → look up by the email the provider returned.
3. Found by email, no provider ID set yet → **link**: set the provider ID on the existing account, and set `emailVerified: true`.
4. Not found at all → create a new user, `emailVerified: true` immediately (no verification email needed — the provider already attested it).

### GitHub's private-email quirk — a real, specific edge case

GitHub's OAuth profile payload can return a `null` email if the user has "keep my email private" enabled, even with `user:email` scope requested. The verify callback must make a second call to `GET /user/emails` and select the entry where `primary === true && verified === true`.

### Definition of done

Both providers complete a full signup round-trip issuing the same cookie pair password login issues. OAuth buttons on `/login` and `/register` launch provider consents seamlessly.

---

## Step 2 — Real-Time Notifications (Backend & Frontend UI)

### Trigger points — three, each with a self-action guard

| Trigger | Location | Guard |
|---|---|---|
| Clap | `post.controller.js` clap handler | Skip if `clapper === post.author`. Coalesce — update/touch existing recent `Notification` |
| Comment / reply | `comment.controller.js` create handler | Notify post author and parent comment author if reply. Skip if actor === recipient |
| Follow | `user.controller.js` follow toggle | Only on follow, never on unfollow |

### Endpoints & Frontend UI Components

| Layer | Component / Path | Description |
|---|---|---|
| Backend GET | `/api/notifications` | Paginated, own inbox only |
| Backend PATCH | `/api/notifications/:id/read` | Mark one read |
| Backend PATCH | `/api/notifications/read-all` | Mark all read |
| Frontend | `SocketContext.jsx` | `socket.io-client` hook managing socket lifecycle with HTTP-only cookie credentials (`withCredentials: true`) |
| Frontend | `Navbar.jsx` | Notification Bell icon with real-time unread badge counter & dropdown preview |
| Frontend | `notifications/page.jsx` | Full notification inbox page with filtering, read indicators, and pagination |

### Socket.IO Auth — httpOnly compatible pattern

Per Socket.IO documentation: `io.engine.use()` with handshake check (`req._query.sid === undefined`), running the **same** cookie-read-and-verify logic `requireAuth` uses. The client never touches or holds a raw token — the httpOnly cookie rides along automatically.

### Definition of done

Two browser sessions: an action in one produces a live update in the other's bell icon within about a second. Disconnecting and reconnecting preserves inbox state from persistent storage.

---

## Step 3 — Post Scheduling (Backend & Editor UI)

### Mechanism & Frontend UI

1. **Backend Script (`check_scheduled_posts.js`):** Queries `Post.find({ status: 'draft', scheduledAt: { $lte: now } })`, re-checks author active status, and calls `.save()` (triggering pre-save hooks for canonical URL, search indexing, and follower notifications).
2. **Frontend UI (`StoryEditor.jsx` / Publish Modal):** Adds a "Schedule post" toggle and ISO Date/Time picker allowing writers to select future `scheduledAt` when publishing a story.

### Definition of done

A post scheduled 2 minutes out via the story editor UI auto-publishes on the next script run with `publishedAt` equal to the scheduled time, firing follower notifications and search indexing hooks cleanly.

---

## Step 4 — Consolidated Cascade Cross-Check

Per Step 0's assessment, one real dependency to close:

| Deleted user's... | Required cascade behavior |
|---|---|
| `Notification` docs where they are `recipient` | Delete — their own inbox goes with the account |
| `Notification` docs where they are `actor`, referencing a hard-deleted action | Delete — notification describes action that no longer exists |
| `Notification` docs where they are `actor`, referencing a soft-deleted comment | **Preserve, actor reference goes stale** — identical to comment soft-deletion pattern |

---

## Phase E — Final Cross-Check

- [ ] OAuth-only account confirmed to have no `password` field set, without breaking email/password validation
- [ ] OAuth buttons styled and functional on `/login` and `/register`
- [ ] Socket.IO client integrated into frontend layout via `SocketContext.jsx` and `Navbar.jsx` Bell Icon
- [ ] Ban action confirmed to force-disconnect live sockets immediately
- [ ] Scheduled post picker in editor UI correctly populates `scheduledAt`
- [ ] Notification cascade verified with real automated assertions in `test_phase_e.js`

---

*Drafted 2026-07-22 — full backend and frontend implementation plan for Phase E of Inkwell.*
