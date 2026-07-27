# Phase J, Step 2: Due Process Before Removal (Moderation & Payout-Dispute Appeal Workflow)

> **Status**: **CLOSED (100% PASS)** — Verified against 20 test files, 63 tests green.  
> **Blueprint Reference**: `INKWELL_PRODUCT_SCALING_BLUEPRINT.md` (v3.0) §6.1, §6.4 (Build Table Row 2), §2.1 (`moderation` module), and §7.

---

## 1. Summary of Accomplishments

1. **Pre-Investigation Gate (G1–G8 Closed):**
   - Verified pre-existing `Report` model in `server/src/models/Report.js` for user content flags.
   - Built new, dedicated `Dispute` model in `server/src/modules/moderation/dispute.model.js` for writer enforcement appeals.
   - Established 7-day `HELD` state for account restrictions and payout adjustments; funds are not debited/withheld during `HELD`.
   - Reused `requireAuth` + `requireAdmin` for reviewer queue and decision endpoints.
   - Extended account deletion cascade (Step 18) to void active disputes (`disputeRepository.voidForUser`).

2. **Modular Monolith Architecture (`server/src/modules/moderation/`):**
   - Implemented `Dispute` Mongoose schema (`dispute.model.js`).
   - Implemented `IDisputeRepository` interface and `MongoDisputeRepository` data access.
   - Implemented `DisputeService` business logic (hold validation, state machine, notifications, finalization sweep).
   - Implemented `DisputeController` with 6 API endpoints.
   - Implemented `FinalizationJob` background sweep for auto-finalizing expired dispute windows.
   - Registered `moderationModule` in Kernel Registry (`server/src/app.js`).

3. **Public Policy & Documentation:**
   - Published public moderation & appeals policy document at [server/src/docs/policies/moderation-appeals.md](file:///c:/Users/ABSA00065/Desktop/Project/server/src/docs/policies/moderation-appeals.md) (served via `GET /api/policy/moderation-appeals`).

4. **Integration Test Suite & Verification (§12):**
   - Created [server/test/integration/disputes.test.js](file:///c:/Users/ABSA00065/Desktop/Project/server/test/integration/disputes.test.js) covering all 8 negative-path & state-machine scenarios required by §12.6.
   - Executed full Vitest suite: **20 test files passed, 63 tests green (100% PASS)**.
   - Verified 11/11 binary sign-off criteria in [walkthrough.md](file:///C:/Users/ABSA00065/.gemini/antigravity-ide/brain/172f581b-a4fb-48fb-8daa-8f289d51a18a/walkthrough.md).

---

## 2. API Contract Summary (6 Endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 1 | `GET` | `/api/moderation/actions/pending` | `requireAuth` | Writer lists their own `HELD` enforcement actions |
| 2 | `POST` | `/api/moderation/disputes` | `requireAuth` | Writer files dispute within 7-day hold window |
| 3 | `GET` | `/api/moderation/disputes/mine` | `requireAuth` | Writer views status of their filed disputes |
| 4 | `GET` | `/api/moderation/disputes/queue` | `requireAuth` + `requireAdmin` | Admin views queue of `submitted` / `under_review` disputes |
| 5 | `PATCH` | `/api/moderation/disputes/:id/decision` | `requireAuth` + `requireAdmin` | Admin decision (`upheld` vs `overturned` + note + `razorpaySettled` check) |
| 6 | `GET` | `/api/policy/moderation-appeals` | Public | Serves published public moderation & appeals policy document |

---

## 3. Test Suite Baseline & Reconciliation

- **Prior Baseline (Phase J Step 1):** 19 test files / 54 tests.
- **Phase J Step 2 Added:** 1 test file (`test/integration/disputes.test.js`), 9 test cases.
- **Current Suite:** **20 test files / 63 tests passed (100% PASS)**.
