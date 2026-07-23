# Inkwell Blueprint — 03: Server Architecture (Backend)

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Entry Point & Bootstrap

### `server/src/server.js`
The application bootstrap sequence:
1. Calls `connectDB()` — connects Mongoose to MongoDB.
2. `app.listen(env.port)` — starts HTTP server.
3. Registers `SIGINT` / `SIGTERM` handlers for graceful shutdown.

### `server/src/app.js`
Creates and configures the Express application:
- `app.set('trust proxy', 1)` — trust reverse proxy (for rate limiter IP detection).
- CORS with `credentials: true` and origin locked to `env.clientUrl`.
- JSON body parser (1 MB limit) + URL-encoded + cookie-parser.
- `express.static` on `/uploads/` with 7-day cache + `Cross-Origin-Resource-Policy: cross-origin`.
- Health check: `GET /api/health`.
- Rate limiters and route mounts.
- 404 handler + centralized error handler at the bottom.

---

## 2. Configuration Layer

### `server/src/config/env.js`
Loads `server/.env` via dotenv. Exports a typed config object:

| Property           | Type    | Default                             |
|--------------------|---------|-------------------------------------|
| `port`             | number  | `5000`                              |
| `nodeEnv`          | string  | `"development"`                     |
| `clientUrl`        | string  | `"http://localhost:3000"`           |
| `mongoUri`         | string  | `"mongodb://127.0.0.1:27017/inkwell"`|
| `jwtAccessSecret`  | string  | `"dev_access_secret_change_me"`     |
| `jwtRefreshSecret` | string  | `"dev_refresh_secret_change_me"`    |
| `jwtAccessExpires` | string  | `"15m"`                             |
| `jwtRefreshExpires`| string  | `"7d"`                              |
| `cookieSecure`     | boolean | `false` (set `true` in prod/HTTPS)  |
| `isProd`           | boolean | Derived from `nodeEnv === 'production'`|

### `server/src/config/passport.js`
- Configures Google (`passport-google-oauth20`) and GitHub (`passport-github2`) OAuth strategies with custom `CookieStateStore` for state-based CSRF protection without `express-session`.
- Strategies are only registered when real credentials exist (mock values are skipped).
- Account-linking helper `handleOAuthUser`: first searches by provider ID, then by email. If an email match is found, it links the provider ID and sets `emailVerified = true`. Otherwise creates a new user with `generateUniqueUsername()` and auto-verified email.
- GitHub strategy handles private primary email via `GET https://api.github.com/user/emails` as a fallback using the OAuth access token.
- OAuth callback URL is derived from `env.clientUrl` (localhost vs. production domain).
- Route handlers in `auth.routes.js` check `passport._strategies` before attempting authentication; if an OAuth provider is unconfigured, requests are safely redirected to `/login?error=...` rather than throwing an unhandled 500 error.

### `server/src/config/socket.js`
- Initializes a Socket.IO `Server` attached to the HTTP server returned by `app.listen()`.
- Engine-level handshake middleware (`io.engine.use()`) parses httpOnly cookies and verifies the `accessToken` JWT, attaching the user to `req.user`. Banned or missing users are rejected before a socket is established.
- Each authenticated connection joins the personal room `user:<userId>` for targeted notification delivery.
- `userSocketMap` (`Map<userIdString, Set<socketIdString>>`) tracks all active socket IDs per user.
- Exports:
  - `initSocket(httpServer)` — call once after `app.listen()` in `server.js`.
  - `emitNotificationToUser(recipientId, notification)` — push live `notification` event to a recipient's personal room.
  - `disconnectUserSockets(userId)` — forcibly disconnect all sockets for a user (called on admin ban).
  - `getIO()` — returns the current `Server` instance.

---

## 3. Database Models

### `Notification` model — `server/src/models/Notification.js`

| Field | Type | Constraints |
|---|---|---|
| `recipient` | ObjectId → User | required, indexed |
| `actor` | ObjectId → User | required |
| `type` | String | enum: `['clap', 'comment', 'reply', 'follow']`, required |
| `targetType` | String | enum: `['post', 'comment', 'user']`, required |
| `targetId` | ObjectId | required |
| `read` | Boolean | default `false`, indexed |
| `createdAt` | Date | default `Date.now` |

### `User` model — `server/src/models/User.js`

| Field | Type | Constraints |
|---|---|---|
| `name` | String | required, maxlength 80 |
| `username` | String | required, unique, lowercase, 3–30 chars, indexed |
| `email` | String | required, unique, lowercase, indexed |
| `password` | String | conditional required (`!googleId && !githubId`), `select: false` (never returned) |
| `googleId` | String | default `undefined`, sparse unique index |
| `githubId` | String | default `undefined`, sparse unique index |
| `bio` | String | maxlength 200, default `""` |
| `avatarUrl` | String | default `""` |
| `followers` | [ObjectId → User] | Array of follower user refs |
| `following` | [ObjectId → User] | Array of following user refs |
| `bookmarks` | [ObjectId → Post] | Array of bookmarked post refs |
| `subdomain` | String | lowercase, unique, sparse index |
| `customDomain` | String | default `null` (v2 BYO custom domain) |
| `exportRequestedAt` | Date | Timestamp throttle for account zip downloads |
| `exportStatus` | String | enum: `"idle" \| "pending" \| "ready" \| "failed"`, default `"idle"` |
| `passwordResetTokenHash` | String | `select: false` — SHA-256 of the emailed reset token |
| `passwordResetExpiresAt` | Date | `select: false` — reset token TTL (30 min) |
| `emailVerified` | Boolean | default `false` |
| `emailVerifyTokenHash` | String | `select: false` — SHA-256 of verification token |
| `emailVerifyExpiresAt` | Date | `select: false` — verification token TTL (24h) |
| `emailPrefs.allEmails` | Boolean | default `true` |
| `emailPrefs.digestFrequency` | String | enum: `'weekly' \| 'off'`, default `'weekly'` |
| `followedTags` | [String] | Array of followed tag strings, default `[]` |
| `lastDigestSentAt` | Date | Timestamp of last sent weekly digest |
| `role` | String | enum: `'user' \| 'admin'`, default `'user'` |
| `status` | String | enum: `'active' \| 'banned'`, default `'active'` |
| `membershipStatus` | String | enum: `'none' \| 'active' \| 'past_due' \| 'canceled'`, default `'none'`, indexed |
| `razorpayCustomerId` | String | default `null` — Razorpay test customer ID |
| `razorpaySubscriptionId` | String | default `null` — Razorpay test subscription ID |
| `createdAt` / `updatedAt` | Date | auto via timestamps |

**Hooks & methods:**
- `pre('save')` — bcrypt hash (cost 12) if password modified.
- `comparePassword(candidate)` — bcrypt compare.
- `toPublicJSON(includeEmail)` — safe API shape, includes subdomain/role/status.

---

### `Post` model — `server/src/models/Post.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `title` | String | required, maxlength 160 |
| `subtitle` | String | maxlength 200, default `""` |
| `slug` | String | required, unique, indexed |
| `contentHtml` | String | required — sanitized HTML from Tiptap |
| `coverImage` | String | URL or relative `/uploads/` path |
| `tags` | [String] | max 5, indexed |
| `author` | ObjectId → User | required, indexed |
| `status` | `"draft"` \| `"published"` | default `"draft"`, indexed |
| `moderationStatus` | `"visible"` \| `"hidden"` | default `"visible"`, indexed |
| `claps` | [clapSchema] | embedded `{ user, count (0–50) }` subdocs |
| `totalClaps` | Number | denormalized sum |
| `views` | Number | incremented on published reads (non-author) |
| `readTimeMinutes` | Number | computed at 200 WPM |
| `publishedAt` | Date | set on first publish |
| `scheduledAt` | Date | default `null`, timestamp for auto-publishing cron pipeline |
| `notifiedAt` | Date | default `null`, set when followers notified |
| `seo` | subdocument | contains optional `metaTitle`, `metaDescription`, `canonicalUrl` |
| `indexable` | Boolean | default `false`, set `true` on publish (unless hidden) |
| `publication` | ObjectId → Publication | nullable, default `null`, indexed |
| `submissionStatus` | String | enum: `'none' \| 'pending' \| 'approved' \| 'rejected' \| 'changes_requested'`, default `'none'`, indexed |
| `reviewNote` | String | default `""`, feedback note from editor/owner |
| `locked` | Boolean | default `false` — paywall toggle, indexed |
| `previewParagraphCount` | Number | default `3` — paragraph truncation count for non-members |

**Indexes:**
- Full-text: `{ title: 'text', subtitle: 'text', tags: 'text' }` — powers `?q=` search.
- Compound: `{ status: 1, publishedAt: -1 }` — powers feed sort.
- Compound: `{ publication: 1, submissionStatus: 1 }` — powers publication feeds.

**Hooks & methods:**
- `pre('save')` — recomputes `readTimeMinutes`, forces `indexable = true` (unless hidden) and generates `canonicalUrl`.
- `toCardJSON(viewerId)` — feed-safe response shape including viewer clap count, indexable state, publication status.
- `visibleQuery(extra)` — static helper returning canonical visibility query filter `{ status: 'published', moderationStatus: 'visible', ...extra }`.

---

### `Publication` model — `server/src/models/Publication.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `name` | String | required, trim, maxlength 80 |
| `slug` | String | required, unique, lowercase, indexed |
| `description` | String | maxlength 300, default `""` |
| `logoUrl` | String | default `""` |
| `coverImage` | String | default `""` |
| `owner` | ObjectId → User | required, indexed |
| `isArchived` | Boolean | default `false`, indexed |

---

### `PublicationMember` model — `server/src/models/PublicationMember.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `publication` | ObjectId → Publication | required, indexed |
| `user` | ObjectId → User | required, indexed |
| `role` | String | enum: `'owner' \| 'editor' \| 'writer'`, required |
| `invitedBy` | ObjectId → User | required |
| `joinedAt` | Date | default `Date.now` |

**Indexes:**
- Compound: `{ publication: 1, user: 1 }` (unique)

---

### `ReadingList` model — `server/src/models/ReadingList.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `owner` | ObjectId → User | required, indexed |
| `name` | String | required, trim, maxlength 80 |
| `slug` | String | required, lowercase |
| `visibility` | String | enum: `'public' \| 'private'`, default `'private'` |
| `posts` | [subdocument] | Array of `{ post: ObjectId → Post, addedAt: Date }` |

**Indexes:**
- Compound: `{ owner: 1, slug: 1 }` (unique per owner)

---

### `Comment` model — `server/src/models/Comment.js`

| Field | Type | Constraints |
|---|---|---|
| `post` | ObjectId → Post | required, indexed |
| `author` | ObjectId → User | required |
| `content` | String | required, maxlength 2000 |
| `parentComment` | ObjectId → Comment | nullable, default `null`, indexed |
| `depth` | Number | default `0`, max clamped at `5` |
| `deletedButHasReplies` | Boolean | default `false` |
| `moderationStatus` | `"visible"` \| `"hidden"` | default `"visible"`, indexed |

---

### `Follow` model — `server/src/models/Follow.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `follower` | ObjectId → User | required, indexed |
| `followee` | ObjectId → User | required, indexed |
| `followedAt` | Date | default `Date.now` |
| `sourcePost` | ObjectId → Post | nullable — set if follow originated from a post |

**Indexes:**
- Compound: `{ follower: 1, followee: 1 }` (unique)

---

### `Report` model — `server/src/models/Report.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `reporter` | ObjectId → User | required, indexed |
| `targetType` | `"post"` \| `"comment"` | required |
| `targetId` | ObjectId | required, index |
| `reason` | `"spam"` \| `"harassment"` \| `"misinformation"` \| `"other"` | required |
| `details` | String | optional, max 1000 |
| `priorityFlag` | Boolean | default `false`, auto `true` on 3+ reports |
| `status` | `"pending"` \| `"actioned"` \| `"dismissed"` | default `"pending"`, indexed |

**Indexes:**
- Compound: `{ reporter: 1, targetType: 1, targetId: 1 }` (unique)

---

### `AuditLog` model — `server/src/models/AuditLog.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `action` | String | enum: `post_hidden`, `post_unhidden`, `comment_hidden`, `comment_unhidden`, `user_banned`, `user_unbanned`, `role_changed`, `report_dismissed`, `report_actioned` |
| `actor` | ObjectId → User | required, index |
| `targetType` | `"post"` \| `"comment"` \| `"user"` \| `"report"` | required |
| `targetId` | ObjectId | required, index |
| `metadata` | Mixed | optional |

---

### `PostRevision` model — `server/src/models/PostRevision.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `post` | ObjectId → Post | required, index |
| `editedBy` | ObjectId → User | required |
| `title` | String | required |
| `subtitle` | String | optional |
| `contentHtml` | String | required |
| `tags` | [String] | optional |
| `coverImage` | String | optional |

---

### `ReadEvent` model — `server/src/models/ReadEvent.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `post` | ObjectId → Post | required, indexed |
| `viewer` | ObjectId → User | required, indexed |
| `viewerWasMember` | Boolean | required — snapshotted membership entitlement at read time |
| `activeSeconds` | Number | required, capped at 1800s (30m) per foreground session |
| `createdAt` | Date | default `Date.now`, indexed |

---

### `MembershipPayment` model — `server/src/models/MembershipPayment.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `user` | ObjectId → User | required, indexed |
| `amountCents` | Number | required (default 49900 = ₹499.00) |
| `razorpayPaymentId` | String | required, unique, indexed |
| `periodStart` | Date | required — billing period start |
| `periodEnd` | Date | required — billing period end |

---

### `PayoutLedgerEntry` model — `server/src/models/PayoutLedgerEntry.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `writer` | ObjectId → User | required, indexed |
| `periodStart` | Date | required — ledger period start |
| `periodEnd` | Date | required — ledger period end |
| `eligibleActiveSeconds` | Number | required — writer's member read time |
| `platformActiveSeconds` | Number | required — platform member read time denominator |
| `poolCents` | Number | required — subscriber revenue pool |
| `payoutCents` | Number | required — engagement-weighted writer allocation |

---

### `WebhookEvent` model — `server/src/models/WebhookEvent.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `eventId` | String | required, unique, indexed — webhook idempotency deduplication |
| `eventType` | String | required — Razorpay event name (`subscription.charged`, etc.) |
| `receivedAt` | Date | default `Date.now` |

---

### `Highlight` model — `server/src/models/Highlight.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `owner` | ObjectId → User | required, indexed — highlighting reader |
| `post` | ObjectId → Post | required, indexed — target story |
| `quote` | String | required — selected text string |
| `contextBefore` | String | ~40 chars preceding quote for fuzzy re-location |
| `contextAfter` | String | ~40 chars following quote for fuzzy re-location |
| `note` | String | optional annotation note, maxlength 500 |
| `createdAt` | Date | default `Date.now` |

---

## 4. Middleware Chain

### Execution Flow
```
Request
  │
  ├── CORS (allow CLIENT_URL + credentials)
  ├── express.json() body parser (1 MB)
  ├── express.urlencoded()
  ├── cookieParser()
  │
  ├── /uploads/* → express.static (served files)
  ├── /api/health → quick health check
  │
  ├── /api/* → generalLimiter (1000 req / 15 min / IP)
  │
  ├── /api/auth/* → authLimiter (50 req / 15 min / IP) → auth routes
  ├── /api/posts/* → post routes
  ├── /api/publications/* → publication routes
  ├── /api/lists/* → reading list routes
  ├── /api/membership/* → membership & subscription routes
  ├── /api/webhooks/* → raw-body HMAC webhook routes
  ├── /api/telemetry/* → active read-time telemetry routes
  ├── /api/writer/* → writer payout ledger routes
  ├── /api/users/* → user routes
  ├── /api/admin/* → admin routes
  ├── /api/reports/* → report routes
  ├── /api/comments/* → comment routes
  ├── /api/feed/* → feed routes (RSS feeds)
  ├── /api/uploads/* → upload routes
  │
  ├── notFound (404 catcher)
  └── errorHandler (centralized)
```

### `auth.middleware.js` — Two guard modes

| Middleware | Behavior |
|---|---|
| `requireAuth` | Reads `accessToken` cookie → verifies → loads user → `req.user`. Throws 401 if missing/invalid. Banned users get 403. |
| `login` / `refresh` / `oauthCallback` | Checks `user.status === "banned"`. Throws 403 or redirects to `/login?error=account_banned`, preventing banned accounts from issuing sessions or logging in. |
| `optionalAuth` | Same as above but silently ignores missing/invalid token. |

### `error.middleware.js` — Centralized error handling
Normalizes all errors into `{ success: false, message, errors? }`.

### `rateLimiter.js`

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| `authLimiter` | 15 min | 50 | `/api/auth/*` |
| `forgotPasswordLimiter` | 15 min | 5 | `POST /api/auth/forgot-password` only |
| `generalLimiter` | 15 min | 1,000 | All `/api/*` |

### `upload.middleware.js`
- Storage: `multer.diskStorage` → `server/uploads/`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- File size limit: **5 MB**

### `validate.js`
Runs `validationResult(req)` after express-validator rules. Returns 422 with field errors on failure.

---

## 5. Utility Functions

| File | Function(s) | Purpose |
|---|---|---|
| `jwt.js` | `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`, `setAuthCookies`, `clearAuthCookies` | Sign/verify tokens + set/clear httpOnly cookies |
| `apiResponse.js` | `sendSuccess`, `ApiError` | Standard `{ success:true, data, message }` & error class |
| `asyncHandler.js` | `asyncHandler(fn)` | Wraps async express handlers; forwards errors to next() |
| `slugify.js` | `baseSlug`, `makeSlug` | Lowercase hyphenated base + 8 random hex chars |
| `sanitize.js` | `sanitizeContent(dirty)` | Strips `<script>`, event attrs, `javascript:` URLs |
| `readTime.js` | `estimateReadTime(html)` | Strips tags, counts words ÷ 200 WPM, min 1 minute |
| `entitlement.js` | `canReadFull(post, viewer)` | Canonical entitlement helper (unlocked, author, admin, active member) |
| `rss.js` | `buildFeed(params)` | Generates XML RSS feed string using `feed` library (truncates locked posts) |
| `exportAccount.js`| `streamExport(res, u, p)`| Streams a compressed ZIP directory using `archiver` & `turndown` |
| `notify.js` | `notifyFollowersOfNewPost` | Creates `Notification` DB records, calls `emitNotificationToUser()` for live socket push, and sends new-post emails to followers |

---

## 6. Seed & Verification Scripts

- **`seed.js`** (`pnpm seed`): Orchestrator — wipes DB and calls `seed-data.js`, `seed-content.js`, and `seed-moderation.js` in sequence.
- **`seed-data.js`**: Seeds 120 users, 500 posts, 800 follows, 1200 comments with realistic data.
- **`seed-content.js`**: Seeds 75 reading lists, 1186 read events, 37 member payments, 103 payout ledger entries, and publication memberships.
- **`seed-moderation.js`**: Seeds moderation reports, audit logs, and hidden content for testing admin flows.
- **`backfill_follows.js`**: Migration utility to backfill the `Follow` model from `User.followers`/`User.following` arrays (one-time migration helper).
- **`check_scheduled_posts.js`**: Queries for posts where `scheduledAt <= now` and `status === 'draft'`, sets `status = 'published'` and `publishedAt = scheduledAt`. Designed to run as a cron job.
- **`promote_admin.js <email>`**: CLI script to set `role = 'admin'` on a specific user account.
- **`send-weekly-digest.js`**: Manual trigger for the weekly digest email cron pipeline.
- **`reset_export_limit.js`**: Resets `exportRequestedAt` for all users (dev testing helper).
- **`run_evidence_verification.js`**: 10-suite E2E verification for auth, indexing, canonical URLs, subdomains, RSS, sitemaps, ZIP export.
- **`verify_four_open_items.js`**: Targeted verification script for specific open implementation items.
- **`test_seo_spec.js`**: Verifies user/post model schemas and pre-save hooks.
- **`test_phase_b.js`**: Integration test suite verifying moderation queue, admin dashboard, revision history, and 13-step cascade.
- **`test_phase_c.js`**: Integration test suite verifying publications, review workflow, recommendation scoring, reading lists, related posts, and cascade updates.
- **`test_phase_d.js`**: Integration test suite verifying read telemetry, paywall truncation across 3 RSS feeds, Razorpay HMAC verification, webhook raw-body signature check & idempotency, 70/30 payout ledger arithmetic (excluding self-reads and short reads), and 14-step cascade updates.
- **`test_phase_e.js`**: Integration test suite verifying OAuth account linking, Socket.IO authenticated handshake, live notification push, notification inbox REST API, and post scheduling auto-publish.

---

*Next document: [04 Client Architecture (Frontend)](04_client_frontend_architecture.md)*
