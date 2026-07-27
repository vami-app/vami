# 🖋️ Inkwell — Phase H, Step 9: Membership Domain Repository + Module Extraction

> **Status**: **CLOSED (100% PASS — 9/9 Binary Sign-Off Checklist Criteria Satisfied)**  
> **Verification Report**: [walkthrough.md](file:///C:/Users/ABSA00065/.gemini/antigravity-ide/brain/172f581b-a4fb-48fb-8daa-8f289d51a18a/walkthrough.md)  
> Companion to `INKWELL_PRODUCT_SCALING_BLUEPRINT.md` (v3.0) §2.1, §5.

---

## 1. Closure of Pre-Investigation Gate (G1 through G16)

All 16 pre-investigation questions G1–G16 were investigated directly against the codebase:

| # | Question | Empirical Finding | Architectural Decision |
|---|---|---|---|
| G1 | Module directory list in `server/src/modules` | `ls server/src/modules` returned 9 directories. `membership` directory did not exist. | Created `server/src/modules/membership/` directory structure. |
| G2 | Location of flat models | `MembershipPayment.js`, `PayoutLedgerEntry.js`, `WebhookEvent.js`, `ReadEvent.js` lived flat in `server/src/models/`. | Moved schemas to `server/src/modules/membership/models/` and added re-export bridge shims. |
| G3 | Location of Razorpay endpoints | `membership.controller.js` & `routes/membership.routes.js`. `/subscribe`, `/verify`, `/cancel`, `/test-sign`. | Extracted controller methods to `modules/membership/membership.controller.js`. |
| G4 | Location of Razorpay webhook handler | `handleWebhook` in `membership.controller.js` mounted at `POST /api/webhooks/razorpay` in `routes/webhook.routes.js`. | Created `membership.webhook.js` inside `modules/membership/` kept separate per §2.1. |
| G5 | Call-site sweep for flat models | Swept 4 models across controllers, services, and tests. | Exported permanent model bridge shims in `server/src/models/` for 100% backward compatibility. |
| G6 | `posts.service.js` `ReadEvent` import | `posts.service.js` imports `models/ReadEvent.js`. | Bridge shim re-exports model cleanly without breaking module boundary. |
| G7 | `canReadFull` location | `utils/entitlement.js`. | Retained `canReadFull` in `utils/entitlement.js` as shared cross-cutting utility. |
| G8 | `ledger.controller.js` location | `controllers/ledger.controller.js`. | Integrated payout ledger computation into `membership.service.js`. |
| G9 | Account deletion cascade check | `users.service.js:534` step 14 deletes `ReadEvent` docs, step 15 updates membership status. | Delegated cascade calls to `membershipService`. |
| G10 | `cascade/` standalone module check | `cascade` is not a standalone module directory. | Delegated deletion tasks via `membershipService` call from `users.service.js`. |
| G11 | Baseline test count | Baseline Hash: `6e8a6ee00fa07545ff63861bcdf870e1557f2006`. Baseline: **23 test files / 75 tests passing**. | Established baseline at 23 test files / 75 tests. |
| G12 | Existing test imports | `sovereign-export.test.js`, `payout-ledger.test.js`, `disputes.test.js`, `posts.test.js`, `metered-reads.test.js`, `analytics.test.js`. | Model bridge shims guarantee 100% test suite compatibility. |
| G13 | Client feature folder check | `client/src/` contains `app`, `components`, `context`, `hooks`, `lib`. No `features/` directory. | Frontend structure remains untouched. |
| G14 | Lint enforcement rule check | No ESLint boundary rule configured in `server/package.json`. | Added module boundary unit test in integration suite (`test/integration/membership-module.test.js`). |
| G15 | Webhook idempotency contract | Unique index on `eventId` in `WebhookEvent`. `handleWebhook` checks duplicate before processing. | Preserved 100% in `membership.webhook.js`. |
| G16 | Mongoose index names check | Index definitions preserved byte-for-byte; zero database index renames or drops required. | 100% database schema compatibility. |

---

## 2. Summary of Implementation

1. **Extracted Membership Module Directory (`server/src/modules/membership/`):**
   - Extracted `MembershipPayment.model.js`, `PayoutLedgerEntry.model.js`, `WebhookEvent.model.js`, and `ReadEvent.model.js` into `server/src/modules/membership/models/`.
   - Created `membership.repository.interface.js`, `membership.repository.mongo.js`, `membership.service.js`, `membership.controller.js`, `membership.webhook.js`, `membership.validators.js`, and `membership.module.js`.

2. **Permanent Model Bridge Shims:**
   - Updated `server/src/models/MembershipPayment.js`, `PayoutLedgerEntry.js`, `WebhookEvent.js`, and `ReadEvent.js` to re-export module models for 100% backward compatibility.

3. **Integration Test Suite & Verification Results:**
   - Created [server/test/integration/membership-module.test.js](file:///c:/Users/ABSA00065/Desktop/Project/server/test/integration/membership-module.test.js) (3 test cases).
   - Executed full Vitest suite & independent re-run: **24 test files passed, 78 tests passed (100% GREEN)**.

> **Arithmetic correction (applied in Phase H Step 10):** This step's closing line originally stated "12 system models." The correct count at the end of Step 9 was **13 module-owned models** — this step itself migrated 4 models into `membership` (MembershipPayment, PayoutLedgerEntry, ReadEvent, WebhookEvent), bringing the running total from 9 to 13. The full authoritative 16-row model inventory and resolution of the 3 remaining flat models (`Follow`, `Report`, `AuditLog`) is in `PHASE_H_STEP10_IMPLEMENTATION_PLAN.md`.
