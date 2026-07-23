# Inkwell Blueprint — 07: Security Model & Processing Pipelines

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Security Model

| Threat | Mitigation Strategy |
|---|---|
| **Stored XSS via Editor** | `sanitize-html` applied server-side before `contentHtml` is saved. Strips `<script>`, all event handler attributes (`onload`, `onerror`), and dangerous schemes (`javascript:`, `data:`). |
| **Password Exposure** | `password` field configured with `select: false` on Mongoose schema — never returned in queries unless explicitly `.select('+password')`. Password hashes use bcrypt (cost 12). |
| **Weak Passwords** | Minimum 8 characters enforced via `express-validator`. |
| **Session Hijacking / XSS Token Theft** | Access (15m) and Refresh (7d) tokens stored exclusively in `httpOnly`, `sameSite: lax` cookies. Zero tokens stored in `localStorage` or `sessionStorage`. |
| **Rate Limiting / Abuse** | Express rate limiters applied globally (`generalLimiter`: 1000/15m) and specifically to auth endpoints (`authLimiter`: 50/15m). Password reset and export requests carry strict individual throttles. |
| **Unverified Publishing** | Publishing stories is gated behind `emailVerified === true`. Unverified users can draft content but cannot publish until email verification token is consumed. |
| **Password Reset Tampering** | Forgot-password flow uses cryptographically random tokens (32 bytes), SHA-256 hashed before storage with a 30-minute TTL. Enumeration-safe responses prevent account discovery. |
| **Immediate Ban Enforcement** | Banned users are blocked immediately (403) from accessing all authenticated API routes on their very next request. All active Socket.IO connections for the banned user are force-disconnected via `disconnectUserSockets(userId)`. |
| **Account Deletion Cascade** | Two-step confirmation flow. Full 18-step cascade erases or anonymizes data (posts, comments, post revisions, reports, bookmarks, follows, claps, publication memberships, reading lists, viewer read events, avatar files, notifications, highlights) while canceling active Razorpay test subscriptions and preserving financial audit integrity (`MembershipPayment`, `PayoutLedgerEntry`, authored `ReadEvent` denominator totals, `AuditLog`). |
| **CAN-SPAM Compliance** | All notification and digest emails carry a one-click unsubscribe link. Users can toggle email preferences or adjust digest frequency. Security/transactional emails remain non-suppressible. |
| **Webhook HMAC Authentication** | Webhooks from Razorpay (`POST /api/webhooks/razorpay`) require valid `X-Razorpay-Signature` calculated over raw body bytes via HMAC SHA-256 with `RAZORPAY_WEBHOOK_SECRET`. |
| **Webhook Idempotency** | Webhook processing is guarded by a dedicated `WebhookEvent` model with a unique index on `eventId`. Duplicate replayed events return 200 with `{ duplicate: true }` without mutating database state. |

---

### 1.1 Account Deletion 18-Step Cascade & Preserve-vs-Delete Matrix

| Step | Code Operation / Target | Action Executed | Rationale / Ground-Truth Behavior |
|---|---|---|---|
| 1 | `Highlight` (on user's authored posts) | `deleteMany({ post: { $in: postIds } })` | Deletes text highlights on posts scheduled for deletion |
| 2 | `PostRevision` (snapshots of user's posts) | `deleteMany({ post: { $in: postIds } })` | Deletes revision snapshots associated with deleted posts |
| 3 | `Report` (submitted by user) | `deleteMany({ reporter: user._id })` | Cleans up pending reports submitted by the user |
| 4 | `Report` (targeting user's posts, user's comments, or comments on user's posts) | `deleteMany({ $or: [{ targetType: "post", targetId: { $in: postIds } }, { targetType: "comment", targetId: { $in: targetCommentIds } }] })` | Cleans up reports submitted by others targeting user's posts, user's comments, or comments left on user's posts |
| 5 | `Comment` (on user's authored posts) | `deleteMany({ post: { $in: postIds } })` | Deletes ALL comments left by anyone on the user's posts |
| 6 | `Comment` (authored by user on other people's posts) | Soft-deleted (`content = "[deleted]"`, `deletedButHasReplies = true`, `author` reassigned to `deleted` user) if comment has replies; hard-deleted (`deleteOne()`) if no replies | Preserves thread tree continuity for other readers if replies exist |
| 7 | `Post` (authored by user) | `deleteMany({ author: user._id })` (erase mode) | Deletes all post documents authored by the user |
| 8 | `User.bookmarks` | `updateMany({ bookmarks: { $in: postIds } }, { $pull: { bookmarks: { $in: postIds } } })` | Removes deleted post IDs from all other users' bookmarks |
| 9 | `Follow` | `deleteMany({ $or: [{ follower: user._id }, { followee: user._id }] })` & `updateMany` pulling `followers`/`following` | Deletes follow edges and cleans up user arrays in both directions |
| 10 | `Post.claps` | Filters user claps from `claps` array & recomputes `totalClaps` on affected posts | Updates clap counts across all clapped posts |
| 11 | Avatar File (`/uploads/`) | `fs.unlinkSync(filePath)` | Unlinks avatar file from server disk |
| 12 | `ReadingList` | `deleteMany({ owner: user._id })` | Deletes reading lists owned by the user |
| 13 | `PublicationMember` & `Publication` | Transfer ownership to senior member, or archive publication if sole owner, then `deleteMany({ user: user._id })` | Preserves publication continuity while removing user membership |
| 14 | `ReadEvent` (viewer telemetry) | `deleteMany({ viewer: user._id })` | Deletes user's viewer reading history |
| 15 | **Razorpay Subscription** | `user.membershipStatus = "canceled"` | Cancels active Razorpay test subscription |
| 16 | `Notification` | `deleteMany({ recipient: user._id })` & deletes actor notifications except soft-deleted comment ties | Cleans up user inbox and non-preserved actor notifications |
| 17 | `Highlight` (user's private annotations) | `deleteMany({ owner: user._id })` | Deletes user's private text selection highlights |
| 18 | `User` Document | `user.deleteOne()` | Deletes the user account record |
| *Preserved* | `ReadEvent` (authored posts) | **Preserved** | Retains historical platform denominator for writer payout audits |
| *Preserved* | `MembershipPayment` | **Preserved** | Retains financial invoice records |
| *Preserved* | `PayoutLedgerEntry` | **Preserved** | Retains historical writer payout ledger entries |
| *Preserved* | `AuditLog` | **Preserved** | Retains administrative audit log records |

---

## 2. Processing Pipelines

### 2.1 File Upload Pipeline

```
Client Form / Editor
  └── File Picker (selects PNG/JPEG/WEBP/GIF ≤ 5MB)
       │
       ├── POST /api/uploads/image (multipart/form-data)
       │    └── Express: requireAuth → upload.middleware (Multer)
       │         ├── Validates MIME type & size limit (5 MB)
       │         ├── Saves file to disk: server/uploads/<random24hex>.<ext>
       │         └── Returns JSON: { success: true, data: { url: "/uploads/<filename>" } }
       │
       └── StoryEditor / Avatar component receives URL
            └── Renders image via resolveMedia(path)
```

---

### 2.2 Sovereign Account Export Pipeline

Users retain full ownership of their data with instant ZIP downloads containing structured JSON and clean Markdown files.

```
POST /api/users/me/export/request
  └── Checks exportRequestedAt throttle (1 request per 24 hours)
       └── Updates User.exportStatus = 'ready'

GET /api/users/me/export/download
  └── Reads user document & fetches published + draft posts
       │
       ├── Streams ZIP archive using 'archiver'
       │    ├── profile.json (User profile, email, settings, timestamps)
       │    ├── followers.json (Attributed follower list with followedAt & sourcePost)
       │    ├── posts-index.json (Manifest list of all user stories)
       │    ├── posts/<slug>.json (Complete post metadata + contentHtml)
       │    └── posts/<slug>.md (Clean Markdown document rendered via 'turndown')
       │
       └── Pipes ZIP buffer directly to Client response stream
```

---

### 2.3 Razorpay Test Webhook & Membership Verification Pipeline

```
Client Checkout Modal (checkout.js)
  │
  ├── 1. POST /api/membership/subscribe (requireAuth)
  │    └── Returns subscriptionId & keyId (₹499/mo default)
  │
  ├── 2. User completes test mode payment overlay
  │    └── Returns razorpay_payment_id & razorpay_signature
  │
  ├── 3. POST /api/membership/verify (requireAuth)
  │    ├── Validates HMAC SHA-256 signature (keySecret)
  │    └── Returns { verified: true } (DOES NOT mutate membershipStatus)
  │
Razorpay Billing Webhook Server
  │
  └── 4. POST /api/webhooks/razorpay (Raw Body Buffer)
       ├── Express: captures rawBody in express.json verify callback
       ├── Verifies X-Razorpay-Signature over rawBody via HMAC SHA-256 (webhookSecret)
       ├── WebhookEvent.findOne({ eventId }) check (Idempotency deduplication)
       │    ├── If duplicate: returns 200 { duplicate: true }
       │    └── If new: creates WebhookEvent doc
       │
       └── Processes Event ('subscription.charged', 'subscription.activated'):
            └── Finds User by razorpaySubscriptionId or email
                 └── Mutates User.membershipStatus = 'active'
                      └── Creates MembershipPayment audit record (₹499.00)
```

---

*Next document: [08 Environment Variables & Developer Workflow](08_env_vars_and_workflow.md)*
