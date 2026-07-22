# Inkwell

A Medium-inspired publishing platform — a quiet place to **read, write, and share stories**.
Clean serif reading typography, multi-clap, responses, tags, follow, and bookmarks.

Built as a full-stack MVP:

- **Frontend** — Next.js 15 (App Router, JavaScript + JSDoc), Tailwind CSS, Tiptap editor
- **Backend** — Node.js + Express, MongoDB + Mongoose
- **Auth** — JWT access/refresh tokens in httpOnly cookies, bcrypt password hashing
- **Security** — server-side HTML sanitization (`sanitize-html`), rate limiting, request validation

> Accent color is **deep indigo** (not Medium's green); the wordmark and components are original.

---

## Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| Node.js | v20+ (tested on v24) | |
| pnpm | v9+ (tested on v11) | `npm i -g pnpm` |
| MongoDB | v4.4+ running locally | see options below |

### Getting MongoDB

**Option A — local install:** Start your local `mongod` (default `mongodb://127.0.0.1:27017`).

**Option B — Docker (no install):**
```bash
docker run -d --name inkwell-mongo -p 27017:27017 mongo:latest
```

---

## Setup (fresh clone → running app)

```bash
# 1. Install all workspace dependencies (client + server)
pnpm install

# 2. Create env files from the examples
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 3. Seed the database with demo users + stories (optional but recommended)
pnpm seed

# 4. Start both apps together (client on :3000, server on :5000)
pnpm dev
```

Then open **http://localhost:3000**.

### Demo login (after seeding)

| Email | Password |
|---|---|
| `ada@inkwell.dev` | `password123` |

All five seeded users share the password `password123`.

---

## Environment variables

**`server/.env`**

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin + cookie target |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/inkwell` | database |
| `JWT_ACCESS_SECRET` | dev value | **change in production** |
| `JWT_REFRESH_SECRET` | dev value | **change in production** |
| `JWT_ACCESS_EXPIRES` | `15m` | access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | refresh token TTL |
| `COOKIE_SECURE` | `false` | set `true` behind HTTPS |
| `EMAIL_FROM` | `Inkwell <onboarding@resend.dev>` | From address for outgoing emails |
| `RESEND_API_KEY` | (empty) | Resend API key (production email delivery) |
| `MAILTRAP_API_TOKEN` | (empty) | Mailtrap API token (sandbox email testing) |
| `MAILTRAP_INBOX_ID` | (empty) | Mailtrap Inbox ID (sandbox email testing) |

**`client/.env.local`**

| Var | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Frontend site URL (for canonical tags) |
| `NEXT_PUBLIC_ENABLE_SUBDOMAINS` | `false` | Enable wildcard subdomain routing middleware |

---

## Available scripts (run from repo root)

| Command | Effect |
|---|---|
| `pnpm dev` | Run client + server concurrently |
| `pnpm build` | Production build of the client |
| `pnpm start` | Run both apps in production mode |
| `pnpm seed` | Wipe + reseed the database |
| `node server/src/scripts/promote_admin.js <email>` | Promote a user to admin role |
| `node server/src/scripts/check_scheduled_posts.js` | Runner script for auto-publishing scheduled draft posts |
| `node server/src/scripts/test_phase_e.js` | Phase E integration verification test suite |

Per-app: `pnpm --filter client <script>` / `pnpm --filter server <script>`.

---

## Project structure

```
inkwell/
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # App Router routes (see below)
│       ├── components/     # layout / post / editor / ui / profile / membership
│       ├── context/        # AuthContext, SocketContext
│       ├── hooks/          # useInfiniteScroll
│       └── lib/            # api.js (fetch wrapper), utils.js
├── server/                 # Express API
│   └── src/
│       ├── config/         # db, env, passport, socket
│       ├── models/         # User, Post, Comment, Notification, Publication, ReadEvent...
│       ├── controllers/    # auth, user, post, comment, notification, admin...
│       ├── routes/         # auth, user, post, comment, notification, admin...
│       ├── middlewares/    # auth, error, rateLimiter, upload, validate
│       ├── utils/          # jwt, slugify, sanitize, readTime, asyncHandler, apiResponse
│       ├── validators/     # auth, post
│       └── scripts/        # seed, check_scheduled_posts, test_phase_e
└── package.json            # pnpm workspace root
```

### Frontend routes

| Path | Page |
|---|---|
| `/` | Home feed (infinite scroll) |
| `/login`, `/register` | Auth (supports email/password and Google + GitHub OAuth) |
| `/forgot-password` | Request password-reset email |
| `/reset-password` | Consume reset token → set new password |
| `/search?q=` | Search results |
| `/tag/[tag]` | Tag-filtered feed |
| `/@[username]` | Public profile + author's stories |
| `/p/[slug]` | Read a story |
| `/new-story` | Editor (create & post scheduling) |
| `/edit/[slug]` | Editor (edit own) |
| `/settings` | Edit profile + avatar + email preferences + account deletion |
| `/notifications` | Notifications inbox page |
| `/bookmarks` | Saved stories |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/pub/[slug]` | Publication profile page (approved stories + team) |
| `/pub/[slug]/dashboard` | Publication member dashboard (submissions review queue + team roles) |
| `/lists` | Personal reading lists management |
| `/lists/[slug]?username=` | Single reading list view |
| `/admin` | Admin dashboard stats overview |
| `/admin/users` | Admin user management (role/ban toggles) |
| `/admin/reports` | Admin moderation reports queue |

### API endpoints

Standard envelope: `{ success, data, message }` (or `{ success:false, message, errors? }`).

```
Auth
POST   /api/auth/register              POST   /api/auth/forgot-password
POST   /api/auth/login                 POST   /api/auth/reset-password
POST   /api/auth/logout                GET    /api/auth/unsubscribe      (token)
POST   /api/auth/refresh               GET    /api/auth/verify-email     (token)
GET    /api/auth/me                    POST   /api/auth/resend-verification

Users
GET    /api/users/:username            PATCH  /api/users/me/subdomain
PATCH  /api/users/me                   POST   /api/users/me/export/request
POST   /api/users/me/avatar            GET    /api/users/me/export/download
POST   /api/users/:username/follow     POST   /api/users/me/delete-request
GET    /api/users/me/bookmarks         DELETE /api/users/me             (token)

Posts + Comments + Recommendations
GET    /api/posts  (?cursor,limit,tag,author,q,status)
POST   /api/posts                      GET    /api/posts/tags/trending (7-day)
GET    /api/posts/:slug                POST   /api/posts/:slug/clap
PATCH  /api/posts/:slug  (author)      POST   /api/posts/:slug/bookmark
DELETE /api/posts/:slug  (author)      GET    /api/posts/:slug/comments
GET    /api/posts/recommended          POST   /api/posts/:slug/comments
GET    /api/posts/:slug/related        DELETE /api/comments/:id  (author)

Publications & Submissions
POST   /api/publications               POST   /api/posts/:slug/submit
GET    /api/publications/:slug         DELETE /api/posts/:slug/submit
PATCH  /api/publications/:slug         PATCH  /api/publications/:pubSlug/submissions/:postId
GET    /api/publications/:slug/dashboard
POST   /api/publications/:slug/members
PATCH  /api/publications/:slug/members/:userId
DELETE /api/publications/:slug/members/:userId

Reading Lists
POST   /api/lists                      PATCH  /api/lists/:id
GET    /api/lists/mine                 POST   /api/lists/:id/posts
GET    /api/users/:username/lists      DELETE /api/lists/:id/posts/:postId
GET    /api/lists/:username/:slug      DELETE /api/lists/:id

Membership & Payout Ledger (Razorpay Test Mode)
POST   /api/membership/subscribe       POST   /api/telemetry/read-event
POST   /api/membership/verify          GET    /api/writer/payout-ledger
POST   /api/membership/cancel
POST   /api/webhooks/razorpay          (HMAC raw-body)

Post Revisions
GET    /api/posts/:slug/revisions
GET    /api/posts/:slug/revisions/:revisionId
POST   /api/posts/:slug/revisions/:revisionId/restore

Reports
POST   /api/reports

Admin Tools
GET    /api/admin/stats                PATCH  /api/admin/posts/:id/unhide
GET    /api/admin/reports              PATCH  /api/admin/comments/:id/unhide
PATCH  /api/admin/reports/:id          GET    /api/admin/users
PATCH  /api/admin/users/:id/role       PATCH  /api/admin/users/:id/ban
                                       PATCH  /api/admin/users/:id/unban

Feeds + Uploads
GET    /api/feed/rss                   POST   /api/uploads/image
GET    /api/feed/user/:username/rss    GET    /api/health
GET    /api/feed/tag/:tag/rss
```


---

## Security notes

- **Stored XSS prevention:** all editor HTML is sanitized server-side with `sanitize-html` before
  saving — `<script>`, event handlers, and `javascript:` URLs are stripped.
- **Passwords:** bcrypt (cost 12), never returned in any API response (`select: false`).
- **Tokens:** 15-min access + 7-day refresh, both httpOnly + `sameSite: lax` cookies. No tokens in
  `localStorage`. The client transparently refreshes on a 401.
- **Rate limiting** on `/api/auth/*`, **express-validator** on all mutating bodies, **author-only**
  guards on post/comment edit + delete.
- **Email verification:** new accounts receive a verification email on registration. Publishing is
  gated behind `emailVerified === true`. Token is single-use, 24-hour TTL, hash-not-raw stored.
- **Password-reset:** forgot-password flow uses a cryptographically random token, SHA-256 hashed
  before storage, 30-minute TTL, enumeration-safe (same response whether email exists or not).
- **Account deletion:** two-step flow — confirmation email sent first, then `DELETE /api/users/me`
  with token. Full 14-step cascade: post revisions, reports (own & targeted), comments on own posts, own comments (soft/hard deleted based on replies), posts, bookmarks, follows, claps, avatar file, reading lists, publication memberships/transfers, viewer read events, active Razorpay subscription cancellation. AuditLog, MembershipPayment, and PayoutLedgerEntry records are preserved.
- **Immediate Ban Check:** Banned users are immediately blocked (403) from accessing all authenticated routes on their very next request.
- **Unsubscribe:** all marketing/notification emails carry a CAN-SPAM-compliant one-click
  unsubscribe link. Security emails (reset, delete confirmation) are never suppressible.

---

## Assumptions & decisions

- **Monorepo** via pnpm workspaces; `pnpm dev` runs both apps with `concurrently`.
- **Images** are stored on local disk (`server/uploads/`, gitignored) and served via
  `express.static`. Seed data uses remote demo images (picsum / pravatar).
- **`sharp`** native build is intentionally skipped (`pnpm-workspace.yaml`) — Next.js 15 runs fine
  without it in local dev; `verifyDepsBeforeRun: false` keeps `pnpm dev`/`seed` from erroring on it.
- **`/@[username]`** is implemented as a `[username]` dynamic segment that captures the whole
  `@ada` string and strips the leading `@` (static routes like `/search`, `/p` take precedence).
- Password-reset email is supported via Mailtrap sandbox or Resend API, falling back to console logging in local development.

## Current status — Phase D complete

**MVP core** (auth, posts, comments, claps, bookmarks, follow, search, RSS, SEO, export) — Done.

**Phase A (Ownership & Trust Foundation)** — Done:
- Forgot-password / reset-password email flow (Mailtrap sandbox or Resend)
- Email verification — token, verified badge, gates publishing
- New-content notification emails to followers (`notify.js`)
- Weekly digest emails (`send-weekly-digest.js` cron script)
- Email preferences — master toggle + digest frequency (CAN-SPAM unsubscribe)
- Legal pages — `/terms` and `/privacy` with real drafted content
- Account deletion — two-step cascade with full erasure or anonymize option
- `Follow` model — attributed follow history powering sovereign export
- Sovereign export upgraded — `followers.json` with `followedAt` + `sourcePost`

**Phase B (Safety & Integrity)** — Done:
- Moderation Queue & Report APIs — POST report, 3x priority auto-flagging, admin resolution (dismiss/action), RSS/Weekly-digest/Feed filter, AuditLog
- Admin Dashboard UI — stats overview, user role/ban control, report list queue
- Post Edit Revision History — 50-limit snapshot database compare on update, diff render slideover panel, content restore
- Threaded Comments — 5-depth nesting clamp, recursive UI rendering, soft-delete branch preserving child replies
- Account Deletion Cascade Overhaul — strict 13-step sequence

**Phase D (Monetization Mechanism - Razorpay Test Mode)** — Done:
- Read-Time Telemetry Foundation — `ReadEvent` active foreground reading seconds via Page Visibility API (capped at 30 mins/session)
- Paywall Gating & Entitlement — `locked` paywall toggle respects Phase C's `Post.visibleQuery()` shared visibility filter (stories remain 100% discoverable across feeds/search/RSS/recommendations; truncation applies strictly on single story view and RSS XML for non-members)
- Razorpay Test-Mode Integration — client checkout modal (`checkout.js`), HMAC verification (`POST /api/membership/verify`), first-party cancellation (`POST /api/membership/cancel`), raw-body webhook signature verification (`POST /api/webhooks/razorpay`), idempotency deduplication (`WebhookEvent`)
- Engagement-Weighted Writer Payout Ledger — proportional pool revenue allocation calculated from subscriber active read time (`MembershipPayment`, `PayoutLedgerEntry`, `GET /api/writer/payout-ledger`)
- Account Deletion Cascade Updates — 14-step sequence auto-canceling active test subscriptions and deleting viewer `ReadEvents` while preserving financial audit logs

**Phases E–G** are planned. See `INKWELL_FULL_PRODUCT_ROADMAP.md` for the full breakdown.

---

## Verification checklist

All items below were exercised against the running app (`pnpm dev`, client :3000 + server :5000):

- [x] `pnpm install && pnpm dev` starts both client and server with zero errors
- [x] Register → login → session persists on refresh (httpOnly cookie + `/auth/me`)
- [x] Create draft → publish → appears in home feed
- [x] Clap increments and persists; **capped at 50 per user** (sending 60 clamps to 50)
- [x] Comment post + delete — **delete blocked (403) for non-owner**, allowed (200) for owner
- [x] Tag filter (`?tag=`) and search (`?q=`) return correct filtered results
- [x] Follow/unfollow toggles and updates the follower count
- [x] Bookmark toggle persists and shows on `/bookmarks`
- [x] `<script>alert(1)</script>` submitted in the editor does **not** execute on the story page
      (sanitized to inert text server-side; `javascript:` links stripped)
- [x] Banned user is immediately blocked (403) from authenticated requests (verified via login and token lookup)
- [x] Admin stats page, users table with role/ban controls, and reports queue show correct real-time data
- [x] 3x user reports auto-elevate a post to high-priority inside the queue
- [x] Resolving report as actioned hides content, writes AuditLog, and excludes post from feeds (sitemaps, feeds, digests)
- [x] Post edits trigger snapshots under revisions, showing word-level LCS diffs and allowing full restores
- [x] Comment replying depth clamps to 5; deleting a parent comment with replies converts it to soft-deleted placeholder
- [x] Cascade account deletion clears reports, post revisions, comments (soft/hard deleted), bookmarks, follows, and claps
- [x] Publications created with reserved slug check, multi-author submissions, editor approval/rejection notes, and profile page filtering
- [x] "For You" tab provides transparent recommendation ranking alongside chronological "Latest" feed with clear signal disclosures
- [x] Reading lists support public/private visibility, block draft post additions, and render dangling reference placeholders for deleted/hidden stories
- [x] Paywalled stories remain discoverable in feeds while server-truncating single view & RSS feed items for non-subscribers
- [x] Razorpay test-mode checkout verifies HMAC signatures and processes webhooks idempotently with raw-body verification
- [x] Writer payout ledger accurately computes engagement-weighted pool revenue split from member active reading seconds
- [x] 14-step account deletion cascade cancels test-mode subscriptions and deletes viewer telemetry while preserving financial audit records
- [x] Related posts display up to 3 same-tag stories and trending tags calculate over a 7-day recency window
- [x] Account deletion handles publication owner transfer to senior member or soft-archival when no other members exist
- [x] No horizontal scroll / broken layout at 320 / 375 / 768 / 1024 / 1440 / 1920px
- [x] Production build (`pnpm --filter client build`) compiles all routes with no type/lint errors
```
