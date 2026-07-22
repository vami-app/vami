# Inkwell Blueprint — 09: Feature Status & Roadmap Tracking

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Feature Status Matrix

The table below tracks the status of all core platform capabilities across phases:

| Feature Item | Phase | Original Status | Current Status | Notes & Verification |
|---|---|---|---|---|
| MVP Core (Auth, Posts, Comments, Claps, Bookmarks, Follow, Search, RSS, Export) | MVP | Core | ✅ **Completed** | Foundation shipped in v1.0.0 |
| Password-reset email | Phase A | Excluded (MVP) | ✅ **Completed** | Mailtrap/Resend integration, 30m TTL, SHA-256 token hash |
| Email verification | Phase A | Excluded (MVP) | ✅ **Completed** | Full flow: token, 24h TTL, verified badge, gates publishing |
| Followers notification email | Phase A | Excluded (MVP) | ✅ **Completed** | `notify.js` dispatcher with `notifiedAt` guard |
| Weekly digest | Phase A | Excluded (MVP) | ✅ **Completed** | `send-weekly-digest.js` cron script, tag-follow aware |
| Email preferences & Unsubscribe | Phase A | Excluded (MVP) | ✅ **Completed** | CAN-SPAM compliant one-click unsubscribe, master toggle |
| Legal pages (ToS & Privacy) | Phase A | Excluded (MVP) | ✅ **Completed** | `/terms` & `/privacy` live with real drafted content |
| Sovereign export upgrade | Phase A | Excluded (MVP) | ✅ **Completed** | Includes `followers.json` (`followedAt` & `sourcePost`) |
| Moderation queue & reports | Phase B | Pending | ✅ **Completed** | POST report, 3x priority auto-flag, admin action/dismiss, AuditLog |
| Admin dashboard UI | Phase B | Pending | ✅ **Completed** | `/admin` stats, user role & ban manager, moderation queue |
| Edit revision history | Phase B | Pending | ✅ **Completed** | 50-limit snapshot database compare, LCS diff slideover, restore |
| Threaded comments | Phase B | Pending | ✅ **Completed** | 5-depth nesting clamp, recursive UI rendering, soft-delete branch |
| Account deletion cascade | Phase B | Pending | ✅ **Completed** | Strict 13-step cascade with erasure or anonymization modes |
| Shared visibility filter | Phase C | Pending | ✅ **Completed** | `Post.visibleQuery()` canonical helper across all read paths |
| Publications & Review workflow | Phase C | Pending | ✅ **Completed** | Multi-author collections, owner/editor/writer roles, submit/review/withdraw, profile & dashboard |
| Transparent Discovery ("For You" tab) | Phase C | Pending | ✅ **Completed** | Personalized recommendation scoring (tags/follows/decay/engagement) with "Why these stories?" disclosure |
| Reading Lists | Phase C | Pending | ✅ **Completed** | Named public/private lists, draft/hidden post blocks, dangling reference placeholders |
| Related posts & 7-day trending tags | Phase C | Pending | ✅ **Completed** | Same-tag story recommendations on article page + 7-day window on trending tags |
| Publication deletion cascade | Phase C | Pending | ✅ **Completed** | Publication owner transfer to senior member / soft-archival on account deletion |
| Paywall & Preview truncation | Phase D | Pending | ✅ **Completed** | Locked toggle, 3-paragraph server truncation, RSS preview truncation, `canReadFull` helper |
| Razorpay Test-Mode Subscription | Phase D | Pending | ✅ **Completed** | Checkout modal, HMAC signature verify, server cancel, raw-body webhook signature, `WebhookEvent` dedup |
| Writer Payout Ledger | Phase D | Pending | ✅ **Completed** | `ReadEvent` telemetry, `MembershipPayment` & `PayoutLedgerEntry` models, engagement-weighted math |
| OAuth & Real-time Notifications | Phase E | Pending | ✅ **Completed** | Google/GitHub OAuth (Passport.js), Socket.IO live notification stream & inbox, post scheduling |
| Reader Experience Depth | Phase F | Pending | Planned | Highlighting/annotations, writer analytics dashboard, dark mode |
| Quality Infrastructure | Phase G | Pending | Planned | Vitest unit tests, Playwright E2E suite (local-only) |

---

## 2. Phased Roadmap Summary

| Phase | Focus | Status | Duration |
|---|---|---|---|
| **Phase A** | Ownership & Trust Foundation | **Completed** | 5 weeks |
| **Phase B** | Safety & Integrity | **Completed** | 7.5 weeks |
| **Phase C** | Growth Engine | **Completed** | 9 weeks |
| **Phase D** | Monetization Mechanism | **Completed** | 6 weeks |
| **Phase E** | Identity, Access, Real-time | **Completed** | 6 weeks |
| **Phase F** | Reader Experience Depth | Pending | 4.5 weeks |
| **Phase G** | Quality Infrastructure | Pending | 4 weeks |

*For complete feature specs, definitions of done, and implementation rules, refer to `INKWELL_FULL_PRODUCT_ROADMAP.md`.*

---

*Blueprint updated: 2026-07-22 — Synchronized with Phase E completion. v1.6.0.*
