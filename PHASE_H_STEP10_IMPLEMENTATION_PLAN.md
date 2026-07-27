# 🖋️ Inkwell — Phase H, Step 10: Model-Inventory Reconciliation & Closure Audit

> **Status**: **CLOSED (10/10 Binary Sign-Off Checklist Criteria Satisfied)**
> **Verification Report**: [walkthrough.md](file:///C:/Users/ABSA00065/.gemini/antigravity-ide/brain/9cb0b41e-e5bb-45f6-8863-bf93dd37cf57/walkthrough.md)
> Companion to `INKWELL_IMPROVEMEN_AND_SCALING_BLUEPRINT.md` (v3.0) §2.1, §5.

---

## 1. Origin of this Step

Step 9's walkthrough stated: *"Phase H model migration is now 100% complete across all 12 system models."*

`PROJECT_BLUEPRINT.md §03` names **16 models**. Cross-referencing Step 9's module directory list against the 16-model inventory produced:
- **13 confirmed module-owned** (Steps 1–9 migrated 13, not 12)
- **3 confirmed flat**: `Follow`, `Report`, `AuditLog`
- **`Follow` had no G-row in any prior phase confirming its module home**

This step was triggered by that arithmetic contradiction and exists to close it with real evidence.

---

## 2. Closure of Pre-Investigation Gate (G1 through G12)

| # | Question | Empirical Finding | Decision |
|---|---|---|---|
| G1 | Module directory listing (fresh re-run) | 10 modules: `comments`, `highlights`, `membership`, `moderation`, `notifications`, `post-revisions`, `posts`, `publications`, `reading-lists`, `users` | Step 9's G1 (9 dirs) superseded — Step 9 itself added `membership` |
| G2 | `Follow` location | Flat in `server/src/models/Follow.js` — 37-line active schema | Extract to `users` module |
| G3 | `Report` location | Flat in `server/src/models/Report.js` — 53-line active schema | Extract to `moderation` module |
| G4 | `AuditLog` location | Flat in `server/src/models/AuditLog.js` — 50-line active schema | Extract to `moderation` module |
| G5 | Production call-site sweep | 9 call-sites in 6 files across all 3 models | Bridge shims cover 4 files; 2 module-internal files updated to direct paths |
| G6 | `moderation.module.js` reference to Report/AuditLog? | Purely Dispute-scoped. No reference. | Real extraction work required |
| G7 | `Follow` target: `users/` or `follows/`? | `toggleFollow` + cascade already in `users.service.js`; `pullFollowReferences` in `IUserRepository` | `users/` — logic already there, blueprint §2.1 names no `follows/` dir |
| G8 | Cascade impact | `Follow`: both-direction deleteMany. `Report`: deleteMany by reporter. `AuditLog`: preserved (compliance-record pattern) | No cascade behavior changes |
| G9 | Tests importing flat models | `moderation.test.js` (Report, AuditLog) + `sovereign-export.test.js` (Follow) | Bridge shims maintain 100% compatibility |
| G10 | Baseline commit + test count | `e7fa1027` / 24 test files / 78 tests | Independently re-run (not inherited from Step 9) |
| G11 | Lint/boundary enforcement | No ESLint rule exists | `model-inventory.test.js` extends `membership-module.test.js` boundary pattern |
| G12 | Full 16-row reconciliation table | Produced — all 16 models mapped, each row backed by a command | See §3 below |

---

## 3. Full 16-Row Reconciliation Table (Part A Deliverable)

| # | Model | Status | Module | Canonical File |
|---|---|---|---|---|
| 1 | `User` | ✅ Module-owned (pre-Step-10) | `users` | `modules/users/users.model.js` |
| 2 | `Post` | ✅ Module-owned (pre-Step-10) | `posts` | `modules/posts/posts.model.js` |
| 3 | `Notification` | ✅ Module-owned (pre-Step-10) | `notifications` | `modules/notifications/notifications.model.js` |
| 4 | `Publication` | ✅ Module-owned (pre-Step-10) | `publications` | `modules/publications/publications.model.js` |
| 5 | `PublicationMember` | ✅ Module-owned (pre-Step-10) | `publications` | `modules/publications/publication-members.model.js` |
| 6 | `ReadingList` | ✅ Module-owned (pre-Step-10) | `reading-lists` | `modules/reading-lists/reading-lists.model.js` |
| 7 | `ReadEvent` | ✅ Module-owned (Step 9) | `membership` | `modules/membership/models/ReadEvent.model.js` |
| 8 | `MembershipPayment` | ✅ Module-owned (Step 9) | `membership` | `modules/membership/models/MembershipPayment.model.js` |
| 9 | `PayoutLedgerEntry` | ✅ Module-owned (Step 9) | `membership` | `modules/membership/models/PayoutLedgerEntry.model.js` |
| 10 | `WebhookEvent` | ✅ Module-owned (Step 9) | `membership` | `modules/membership/models/WebhookEvent.model.js` |
| 11 | `Comment` | ✅ Module-owned (pre-Step-10) | `comments` | `modules/comments/comments.model.js` |
| 12 | `PostRevision` | ✅ Module-owned (pre-Step-10) | `post-revisions` | `modules/post-revisions/post-revisions.model.js` |
| 13 | `Highlight` | ✅ Module-owned (pre-Step-10) | `highlights` | `modules/highlights/highlights.model.js` |
| 14 | `Follow` | ✅ Module-owned **(Step 10)** | `users` | `modules/users/follow.model.js` |
| 15 | `Report` | ✅ Module-owned **(Step 10)** | `moderation` | `modules/moderation/report.model.js` |
| 16 | `AuditLog` | ✅ Module-owned **(Step 10)** | `moderation` | `modules/moderation/audit-log.model.js` |

**Arithmetic (§6.3):** 13 (Steps 1–9) + 3 (Step 10) = **16 models total** ✓

> `Dispute` (`modules/moderation/dispute.model.js`) is a Phase J addition — NOT in the 16-model `PROJECT_BLUEPRINT.md §03` inventory and not counted here.

---

## 4. Summary of Implementation

1. **Created 3 canonical model files** in their module directories:
   - `server/src/modules/users/follow.model.js`
   - `server/src/modules/moderation/report.model.js`
   - `server/src/modules/moderation/audit-log.model.js`

2. **Converted 3 flat model files to bridge shims:**
   - `server/src/models/Follow.js` → re-exports `../modules/users/follow.model`
   - `server/src/models/Report.js` → re-exports `../modules/moderation/report.model`
   - `server/src/models/AuditLog.js` → re-exports `../modules/moderation/audit-log.model`

3. **Updated 2 module-internal service files** to use direct module paths:
   - `modules/users/users.service.js` — `toggleFollow` and cascade require Follow via `./follow.model`; cascade requires Report via `../moderation/report.model`
   - `modules/posts/posts.service.js` — `getRecommendedPosts` requires Follow via `../users/follow.model`

4. **New test**: `server/test/integration/model-inventory.test.js`
   - 9 scenarios: arithmetic assertion, all-16 bridge shim resolution, canonical location (3 Step-10 models), shim identity (all 16 + 3 specific)

5. **Verification Results:**
   - Baseline: 24 test files / 78 tests
   - After Step 10: **25 test files / 87 tests — all passing (100% GREEN)**
   - Commit: `2c8a459`
