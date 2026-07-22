# Inkwell Blueprint — 06: API Reference

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Response Envelope

All API endpoints return a standardized JSON envelope:

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address" }
  ]
}
```

---

## 2. Complete Endpoint List

### Auth (`/api/auth/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account; sets access & refresh cookies |
| POST | `/api/auth/login` | — | Verify credentials; sets cookies |
| POST | `/api/auth/logout` | required | Clears auth cookies |
| POST | `/api/auth/refresh` | — | Rotates tokens using refresh cookie |
| GET | `/api/auth/me` | required | Returns current authenticated user |
| POST | `/api/auth/forgot-password` | — | Requests password reset email (rate limited) |
| POST | `/api/auth/reset-password` | — | Consumes reset token → sets new password |
| GET | `/api/auth/verify-email` | — | Consumes verification token → marks emailVerified true |
| POST | `/api/auth/resend-verification` | required | Triggers new verification email |
| GET | `/api/auth/unsubscribe` | — | CAN-SPAM compliant one-click email unsubscribe |

---

### Users (`/api/users/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:username` | optionalAuth | Public profile data, post counts, follow status |
| PATCH | `/api/users/me` | required | Update name, bio, avatarUrl, email preferences |
| POST | `/api/users/me/avatar` | required | Upload avatar image (multipart) |
| POST | `/api/users/:username/follow` | required | Toggle follow/unfollow user |
| GET | `/api/users/me/bookmarks` | required | List bookmarked posts |
| POST | `/api/users/me/export/request` | required | Request ZIP export (throttled 1/24h) |
| GET | `/api/users/me/export/download` | required | Streams ZIP export file |
| PATCH | `/api/users/me/subdomain` | required | Claim unique custom subdomain |
| POST | `/api/users/me/delete-request` | required | Send account deletion confirmation email |
| DELETE | `/api/users/me` | required | Permanently delete or anonymize account (requires token) |

---

### Posts & Comments & Recommendations (`/api/posts/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | optionalAuth | Feed query (`cursor`, `limit`, `tag`, `author`, `q`, `status`) |
| POST | `/api/posts` | required | Create post (draft or publish) |
| GET | `/api/posts/recommended` | required | Personalized candidate list for "For You" feed |
| GET | `/api/posts/tags/trending` | — | Top tags based on last 7 days activity |
| GET | `/api/posts/sitemap-data` | — | Minimal public fields query for sitemap generator |
| GET | `/api/posts/:slug` | optionalAuth | Single story view (increments view count if published) |
| GET | `/api/posts/:slug/related` | optionalAuth | Up to 3 related same-tag stories |
| PATCH | `/api/posts/:slug` | required (author) | Update story content/status |
| DELETE | `/api/posts/:slug` | required (author) | Delete story |
| POST | `/api/posts/:slug/clap` | required | Multi-clap (capped at 50 per user) |
| POST | `/api/posts/:slug/bookmark` | required | Toggle bookmark on story |
| GET | `/api/posts/:slug/comments` | optionalAuth | List comments for story |
| POST | `/api/posts/:slug/comments` | required | Add comment or reply |
| DELETE | `/api/comments/:id` | required (author) | Delete comment (soft-delete if has replies) |

---

### Publications & Submissions (`/api/publications/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/publications` | required | Create publication (creator becomes owner) |
| GET | `/api/publications/:slug` | optionalAuth | Public profile (approved posts + public team) |
| PATCH | `/api/publications/:slug` | owner/editor | Edit name, description, logo, cover |
| GET | `/api/publications/:slug/dashboard` | member | Member dashboard (submissions queue + team roles) |
| POST | `/api/publications/:slug/members` | owner/editor | Invite user by username |
| PATCH | `/api/publications/:slug/members/:userId` | owner | Change member role |
| DELETE | `/api/publications/:slug/members/:userId` | owner or self | Remove member or leave publication |
| POST | `/api/posts/:slug/submit` | author | Submit story to publication |
| DELETE | `/api/posts/:slug/submit` | author | Withdraw pending submission |
| PATCH | `/api/publications/:pubSlug/submissions/:postId` | owner/editor | Approve, reject (with note), or request changes (with note) |

---

### Reading Lists (`/api/lists/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/lists` | required | Create reading list |
| GET | `/api/lists/mine` | required | Fetch authenticated user's reading lists |
| GET | `/api/users/:username/lists` | optionalAuth | Public lists for user profile |
| GET | `/api/lists/:username/:slug` | optionalAuth | Single list view (handles dangling references) |
| PATCH | `/api/lists/:id` | owner | Rename or toggle visibility |
| POST | `/api/lists/:id/posts` | owner | Add post to list (blocks draft/hidden posts) |
| DELETE | `/api/lists/:id/posts/:postId` | owner | Remove post from list |
| DELETE | `/api/lists/:id` | owner | Delete list |

---

### Membership & Payout Ledger (`/api/membership/`, `/api/telemetry/`, `/api/writer/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/membership/subscribe` | required | Initialize test-mode Razorpay subscription session |
| POST | `/api/membership/verify` | required | Verify client payment HMAC signature |
| POST | `/api/membership/cancel` | required | Cancel Razorpay test subscription server-side |
| POST | `/api/webhooks/razorpay` | public (HMAC signed) | Receive subscription lifecycle webhooks (raw body signature check) |
| POST | `/api/telemetry/read-event` | optionalAuth | Record active foreground reading seconds (capped at 30 mins) |
| GET | `/api/writer/payout-ledger` | required | Retrieve calling writer's engagement-weighted payout ledger entries |

---

### Post Revisions (`/api/posts/:slug/revisions/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/:slug/revisions` | required (author) | List edit revisions (up to 50 snapshots) |
| GET | `/api/posts/:slug/revisions/:revisionId` | required (author) | View specific revision snapshot details |
| POST | `/api/posts/:slug/revisions/:revisionId/restore` | required (author) | Restore post to revision state |

---

### Reports & Admin (`/api/admin/`, `/api/reports/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reports` | required | Submit report on post or comment (3x auto priority) |
| GET | `/api/admin/stats` | admin | Platform overview stats (users, posts, reports) |
| GET | `/api/admin/reports` | admin | Moderation reports review queue |
| PATCH | `/api/admin/reports/:id` | admin | Resolve report (dismiss or action) |
| PATCH | `/api/admin/posts/:id/unhide` | admin | Restore hidden post visibility |
| PATCH | `/api/admin/comments/:id/unhide` | admin | Restore hidden comment visibility |
| GET | `/api/admin/users` | admin | Paginated list of users |
| PATCH | `/api/admin/users/:id/role` | admin | Promote/demote user role (user/admin) |
| PATCH | `/api/admin/users/:id/ban` | admin | Ban user account |
| PATCH | `/api/admin/users/:id/unban` | admin | Unban user account |

---

### Feeds & Utilities (`/api/feed/`, `/api/uploads/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/feed/rss` | — | Global RSS 2.0 feed (latest 50 published) |
| GET | `/api/feed/user/:username/rss` | — | Author RSS 2.0 feed |
| GET | `/api/feed/tag/:tag/rss` | — | Tag RSS 2.0 feed |
| POST | `/api/uploads/image` | required | Upload image file (multipart, max 5MB) |
| GET | `/api/health` | — | API health check endpoint |

---

*Next document: [07 Security Model & Processing Pipelines](07_security_and_pipelines.md)*
