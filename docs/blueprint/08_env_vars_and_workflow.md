# Inkwell Blueprint — 08: Environment Variables & Developer Workflow

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Environment Variables

### Server (`server/.env`)

| Variable | Default | Required in Prod | Purpose / Notes |
|---|---|---|---|
| `PORT` | `5000` | ✓ | Express API port |
| `NODE_ENV` | `development` | ✓ | `production` disables error stack traces |
| `CLIENT_URL` | `http://localhost:3000` | ✓ | CORS origin & cookie target |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/inkwell` | ✓ | MongoDB connection string |
| `MONGO_URI_TEST` | `mongodb://127.0.0.1:27017/inkwell_test` | — | Isolated MongoDB URI for Vitest suite |
| `JWT_ACCESS_SECRET` | `dev_access_secret_change_me` | ✓ CHANGE ME | Min 32 random chars |
| `JWT_REFRESH_SECRET` | `dev_refresh_secret_change_me` | ✓ CHANGE ME | Different from access secret |
| `JWT_ACCESS_EXPIRES` | `15m` | — | Access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | — | Refresh token TTL |
| `COOKIE_SECURE` | `false` | Set `true` | Must be `true` behind HTTPS |
| `EMAIL_FROM` | `Inkwell <onboarding@resend.dev>` | ✓ | From address for outgoing emails |
| `RESEND_API_KEY` | (empty) | Prod only | Resend API key for production email delivery |
| `MAILTRAP_API_TOKEN` | (empty) | Dev/test only | Mailtrap API token for sandbox email testing |
| `MAILTRAP_INBOX_ID` | (empty) | Dev/test only | Mailtrap Inbox ID for sandbox email testing |
| `RAZORPAY_KEY_ID` | `rzp_test_key_id_default` | ✓ | Razorpay test mode Key ID |
| `RAZORPAY_KEY_SECRET` | `rzp_test_key_secret_default` | ✓ CHANGE ME | Razorpay test mode Key Secret (for HMAC verify) |
| `RAZORPAY_WEBHOOK_SECRET` | `rzp_test_webhook_secret_default` | ✓ CHANGE ME | Razorpay webhook secret (raw-body HMAC verification) |
| `RAZORPAY_PLAN_ID` | `plan_test_membership_499` | — | Razorpay test subscription plan ID (default ₹499/mo) |
| `GOOGLE_CLIENT_ID` | `mock_google_client_id` | Prod only | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | `mock_google_client_secret` | Prod only | Google OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | `mock_github_client_id` | Prod only | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | `mock_github_client_secret` | Prod only | GitHub OAuth App Client Secret |

> **Email delivery fallback hierarchy:** Resend (if `RESEND_API_KEY` set) → Mailtrap (if `MAILTRAP_API_TOKEN` + `MAILTRAP_INBOX_ID` set) → test mode array / console.log fallback.

### Client (`client/.env.local`)

| Variable | Default | Purpose / Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Frontend site URL (used for canonical tags & metadata) |
| `NEXT_PUBLIC_ENABLE_SUBDOMAINS` | `false` | Enable wildcard subdomain routing middleware |

---

## 2. Developer Workflow & Scripts

### Workspace Root Scripts (run from `inkwell/`)

```bash
pnpm install              # Install all workspace dependencies across client and server
pnpm dev                  # Run client (:3000) + server (:5000) concurrently
pnpm build                # Production build of Next.js client
pnpm start                # Run client and server in production mode
pnpm seed                 # Wipe DB and reseed with demo data
pnpm test                 # Run full Vitest unit & integration test suite (server/test)
```

### Per-Package Commands

```bash
pnpm --filter client dev
pnpm --filter server dev
pnpm --filter server seed
```

### Server Utility Scripts (run with `node server/src/scripts/<script-name>.js`)

| Script | Purpose |
|---|---|
| `seed.js` | Orchestrator: wipes DB (all 15 collections) & calls seed-data, seed-content, seed-moderation in sequence |
| `seed-data.js` | Seeds 120 users (including OAuth users with googleId/githubId, OAuth-only accounts, admins, power users, banned, unverified), 500 posts, 800 follows, 1200 comments |
| `seed-content.js` | Seeds 77 reading lists, 1192 read events, 37 member payments, 95 payout ledger entries, publications, 763 Notifications, 4 WebhookEvents, scheduled posts |
| `seed-moderation.js` | Seeds 120 reports (51 priority), 200 audit logs, and 168 post revisions for admin flow testing |
| `backfill_follows.js` | One-time migration utility: backfill `Follow` model from `User.followers/following` arrays |
| `check_scheduled_posts.js` | Auto-publishes scheduled draft posts (`scheduledAt <= now`); run as cron job |
| `promote_admin.js <email>` | Promotes a specified user account to admin role |
| `send-weekly-digest.js` | Manual trigger for the weekly digest email pipeline |
| `test_seo_spec.js` | Verifies user/post model schemas, subdomain validation, and pre-save hooks |
| `reset_export_limit.js` | Resets `exportRequestedAt` for all users (dev testing helper) |
| `run_evidence_verification.js` | 10-suite E2E verification: auth flows, indexing invariants, canonical URLs, subdomains, RSS, sitemap, ZIP export |
| `verify_four_open_items.js` | Targeted verification script for specific open implementation items |
| `test_phase_b.js` | Automated integration test suite for Phase B (moderation queue, admin, revisions, comments, cascade) |
| `test_phase_c.js` | Automated integration test suite for Phase C (publications, recommendations, reading lists, related posts, cascade) |
| `test_phase_d.js` | Automated integration test suite for Phase D (telemetry, paywall truncation across 3 feeds, Razorpay HMAC verify, webhook raw-body check & idempotency, 70/30 payout ledger split, 14-step cascade) |
| `test_phase_e.js` | Automated integration test suite for Phase E (OAuth account linking, Socket.IO handshake auth, live notification push, notification inbox REST, post scheduling auto-publish) |

### Development Ports & URLs

| Service | Port | URL |
|---|---|---|
| Client | 3000 | `http://localhost:3000` |
| Server API | 5000 | `http://localhost:5000` |
| API Health | — | `http://localhost:5000/api/health` |

### Demo Accounts (after `pnpm seed`)

| Name | Email | Password | Username | Role |
|---|---|---|---|---|
| Ada Lovelace | `ada@inkwell.dev` | `password123` | `ada` | User |
| James Baldwin | `james@inkwell.dev` | `password123` | `jbaldwin` | User |
| Grace Hopper | `grace@inkwell.dev` | `password123` | `grace` | User |
| Maya Chen | `maya@inkwell.dev` | `password123` | `maya` | User |
| Leo Torres | `leo@inkwell.dev` | `password123` | `leo` | User |

---

*Next document: [09 Feature Status & Roadmap Tracking](09_feature_status_and_roadmap.md)*
