# 🖋️ Inkwell — Phase D Implementation Plan (Monetization Mechanism - Razorpay Revision)

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and `PROJECT_BLUEPRINT.md` v1.4.0.  
> **Razorpay test mode only** — zero cost, zero real transactions. Spec-level detail covering models, endpoints, paywall gating, webhooks, ledger math, and cascade updates.

---

## 0. Estimate Revision & Structural Gaps Resolved Upfront

The roadmap's Phase D total (5.5 weeks) covers items 16–18. Two structural gaps and four Razorpay-specific mechanics were resolved upfront:

### Gap 1 — Engagement-weighted payout requires real read-time telemetry
`Post.views` is a simple counter with no per-user session attribution. `claps` are capped at 50/user. Using claps alone would skew payouts toward high-clap stories rather than actual time spent reading.  
**Resolution:** Create a minimal `ReadEvent` telemetry model (Step 0) capturing active foreground reading seconds via the Page Visibility API.

### Gap 2 — "Locked" paywall must respect Phase C's shared visibility filter
Setting `locked: true` must **never** alter `Post.visibleQuery()`. Paywalled stories remain 100% discoverable across all feeds, search, RSS, related posts, and recommendations. Locking only truncates `contentHtml` for non-entitled readers on single story view (`GET /api/posts/:slug`) and RSS feed items.

### Razorpay Integration Realities
1. **No hosted customer portal:** Cancellation must be a first-party server-side endpoint (`POST /api/membership/cancel`) invoking Razorpay's API.
2. **Client-side modal checkout:** Client opens `checkout.js` with server-generated `subscription_id` and calls `POST /api/membership/verify` with HMAC signature.
3. **Webhook signature verification:** `POST /api/webhooks/razorpay` verifies `X-Razorpay-Signature` against raw body bytes.
4. **Idempotency:** Webhook events are deduplicated using a `WebhookEvent` model with a unique index on event `id`.

**Revised Phase D total: ~6 weeks (~27 days)**

| Step | Focus | Duration |
|---|---|---|
| 0 | Read-time tracking (`ReadEvent`) + Entitlement helper + Models foundation | 4 days |
| 1 | Paywall — `locked` flag, server-side HTML truncation, RSS truncation, entitlement check | 7 days |
| 2 | Razorpay Test-Mode Subscriptions — checkout modal, verify, cancel, webhooks, idempotency | 10 days |
| 3 | Writer Payout Ledger — `MembershipPayment`, `PayoutLedgerEntry`, calculation formula, endpoint | 6 days |
| **Total** | | **~27 days (~6 weeks)** |

---

## Step 0 — Read-Time Telemetry & Entitlement Schema Foundation

### 1. `ReadEvent` model — `server/src/models/ReadEvent.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `post` | ObjectId → Post | required, indexed |
| `viewer` | ObjectId → User | nullable (null for logged-out readers) |
| `viewerWasMember` | Boolean | default `false` — snapshot of entitlement at time of read |
| `activeSeconds` | Number | required, capped at 1800s (30m) per session |
| `createdAt` | Date | default `Date.now`, indexed |

Client sends a single beacon on page unload or route change via Page Visibility API.

### 2. `Post.js` schema additions

| Field | Type | Default | Notes |
|---|---|---|---|
| `locked` | Boolean | `false` | Author-managed paywall toggle |
| `previewParagraphCount` | Number | `3` | Number of leading `<p>` tags returned to non-entitled readers |

### 3. `User.js` schema additions

| Field | Type | Default | Notes |
|---|---|---|---|
| `membershipStatus` | String | `'none'` | enum: `'none' \| 'active' \| 'past_due' \| 'canceled'`, indexed |
| `razorpayCustomerId` | String | `null` | Test-mode Razorpay customer ID (`cust_...`) |
| `razorpaySubscriptionId` | String | `null` | Test-mode Razorpay subscription ID (`sub_...`) |

### 4. Canonical Entitlement Helper (`canReadFull`)

Located in `server/src/utils/entitlement.js`:
```js
function canReadFull(post, viewer) {
  if (!post.locked) return true;
  if (!viewer) return false;
  if (String(post.author._id || post.author) === String(viewer._id)) return true;
  if (viewer.role === 'admin') return true;
  return viewer.membershipStatus === 'active';
}
```

---

## Step 1 — Paywall: Locked Flag, Server-Side Truncation

### 1. Post Mutation Guard
Authors can toggle `locked` via `PATCH /api/posts/:slug`. Enforces existing ownership guard: `String(post.author) !== String(req.user._id)` → 403.

### 2. Server-Side Truncation in `GET /api/posts/:slug`
If `post.locked && !canReadFull(post, req.user)`:
- Parses `contentHtml` using `sanitize-html` / DOM parser.
- Extracts up to `previewParagraphCount` (default 3) `<p>` tags.
- Returns `{ ...postJSON, contentHtml: truncatedHtml, isLocked: true, previewOnly: true }`.

### 3. RSS Feed Truncation (`server/src/utils/rss.js`)
Locked posts in RSS feeds (`/api/feed/rss`, `/api/feed/user/:username/rss`, `/api/feed/tag/:tag/rss`) have their XML `<content:encoded>` truncated to the same 3-paragraph preview with a paywall notice link.

---

## Step 2 — Razorpay Test-Mode Subscription Integration

### 1. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/membership/subscribe` | required | Creates Razorpay Customer + Subscription; returns `{ subscriptionId, keyId, planId }` |
| POST | `/api/membership/verify` | required | HMAC-verifies `razorpay_payment_id`, `razorpay_subscription_id`, `razorpay_signature` |
| POST | `/api/membership/cancel` | required | Cancels active Razorpay subscription server-side |
| POST | `/api/webhooks/razorpay` | public (HMAC signed) | Receives subscription lifecycle webhooks using raw body bytes |

### 2. Webhook Event Deduplication (`WebhookEvent` Model)

| Field | Type | Constraints |
|---|---|---|
| `eventId` | String | required, unique index |
| `eventType` | String | required |
| `processedAt` | Date | default `Date.now` |

**Events Processed:**
- `subscription.activated`: Sets `user.membershipStatus = 'active'`, updates `razorpaySubscriptionId`.
- `subscription.charged`: Creates `MembershipPayment` record.
- `subscription.pending`: Sets `user.membershipStatus = 'past_due'`.
- `subscription.cancelled` / `subscription.completed`: Sets `user.membershipStatus = 'canceled'`.

---

## Step 3 — Writer Payout Ledger

### 1. `MembershipPayment` Model (`server/src/models/MembershipPayment.js`)

| Field | Type | Constraints / Notes |
|---|---|---|
| `user` | ObjectId → User | required, paying member |
| `amountCents` | Number | required (e.g. 49900 for ₹499.00) |
| `razorpayPaymentId` | String | required, unique index |
| `periodStart` / `periodEnd` | Date | required billing window |
| `createdAt` | Date | default `Date.now` |

### 2. `PayoutLedgerEntry` Model (`server/src/models/PayoutLedgerEntry.js`)

| Field | Type | Notes |
|---|---|---|
| `writer` | ObjectId → User | target writer |
| `periodStart` / `periodEnd` | Date | billing calculation period |
| `eligibleActiveSeconds` | Number | writer's share numerator |
| `platformActiveSeconds` | Number | total pool denominator |
| `poolCents` | Number | total subscriber pool in cents |
| `payoutCents` | Number | proportional payout result |
| `computedAt` | Date | calculation timestamp |

### 3. Ledger Formula
For a calculation period:
$$\text{Pool} = \sum \text{MembershipPayment.amountCents for period}$$
$$\text{Eligible Reads} = \text{ReadEvents where } \text{viewerWasMember} = \text{true} \land \text{viewer} \neq \text{author} \land \text{activeSeconds} \ge 10\text{s}$$
$$\text{Writer Share} = \frac{\sum \text{Writer's Eligible activeSeconds}}{\sum \text{Platform Eligible activeSeconds}} \times \text{Pool}$$

### 4. Writer Ledger Endpoint
- `GET /api/writer/payout-ledger` (authenticated writer): Returns writer's historical payout entries, read seconds breakdown, and pool percentages.

---

## Step 4 — 14-Step Account Deletion Cascade Update

Account deletion (`user.controller.js`) is updated to a 14-step sequence:

| Target Resource | Action on Account Deletion |
|---|---|
| Active Razorpay Subscription | **Step 14:** Server-side API call to Razorpay to cancel any active test subscription |
| Viewer `ReadEvents` | **Delete** `ReadEvent` records where `viewer === deletedUser._id` |
| Authored `ReadEvents` | **Preserve** (supports historical ledger auditability for platform denominator) |
| `MembershipPayment` records | **Preserve** (financial compliance record; `user` ref permitted to remain stale) |
| `PayoutLedgerEntry` records | **Preserve** (historical payout ledger record) |

---

## Verification Plan

### Automated Integration Test Suite (`server/src/scripts/test_phase_d.js`)
1. **Read-time telemetry:** Verify `ReadEvent` insertion and capping.
2. **Paywall truncation:** Assert `GET /api/posts/:slug` returns full HTML for author/admin/member and truncated HTML (3 paragraphs) for non-members. Assert RSS feed item truncation for locked posts.
3. **Razorpay verify HMAC:** Assert invalid signature returns 400 without updating `membershipStatus`.
4. **Webhook idempotency:** Replay `subscription.charged` webhook with identical event ID; verify single `MembershipPayment` document is created.
5. **Ledger calculation:** Seed 2 writers with 70%/30% read-time distribution across active members; verify `PayoutLedgerEntry` matches exact expected ratio.
6. **Cascade updates:** Delete subscriber with active Razorpay subscription; verify subscription cancellation call and reading list / read event cleanup.

---

*Plan updated: 2026-07-22 — Ready for Phase D execution.*
