# 🖋️ Inkwell — Phase J, Step 3: Real Portability (Sovereign Payment-Relationship Export)

> **Status**: **CLOSED (100% PASS — 11/11 Binary Sign-Off Criteria Satisfied)**  
> **Verification Report**: [walkthrough.md](file:///C:/Users/ABSA00065/.gemini/antigravity-ide/brain/172f581b-a4fb-48fb-8daa-8f289d51a18a/walkthrough.md)  
> Companion to `INKWELL_PRODUCT_SCALING_BLUEPRINT.md` (v3.0) §6.1 ("real audience/revenue portability"), §6.3 (sovereign export), §6.4 (build table, row 3).

---

## 1. Unified Pre-Investigation Gate (G1–G10 Closed)

All 10 pre-investigation questions G1–G10 were investigated directly against the codebase in a single pass:

| # | Question | Empirical Finding | Architectural Resolution |
|---|---|---|---|
| G1 | `MembershipPayment` & `User` schema shape | `MembershipPayment` stores `user`, `amountCents`, `razorpayPaymentId`, `periodStart`, `periodEnd`. `User` stores `membershipStatus`, `razorpayCustomerId`, `razorpaySubscriptionId`. | Export reads stored `MembershipPayment` documents and subscriber `User` records directly. Zero model schema changes required. |
| G2 | Existing export mechanic | `streamExport(res, user, posts)` in `exportAccount.js` streams a ZIP archive containing `profile.json`, `followers.json`, `posts-index.json`, and markdown/JSON stories. | Extended `streamExport` to add `payment-relationships.json` and `PORTABILITY_DISCLOSURE.md` inside the ZIP archive. |
| G3 | Existing export code location | Called in `users.service.js` line 322 via `downloadExport` (`GET /api/users/me/export`). | Extended `streamExport` in `exportAccount.js` to query subscriber payment records without altering existing endpoints. |
| G4 | Razorpay webhook data stored | `razorpayPaymentId`, `amountCents`, `periodStart`, `periodEnd`, `razorpaySubscriptionId`, `razorpayCustomerId`. | All payment history data is already persisted locally in MongoDB. |
| G5 | Razorpay API rate limits & cost | Export reads local MongoDB collections directly. | 0 external Razorpay API requests fired during export download; 0 rate-limit or third-party downtime risk. |
| G6 | Download response pattern | `GET /api/users/me/export` streams `.zip` archive via `archive.pipe(res)` with `Content-Disposition: attachment; filename="inkwell-sovereign-export.zip"`. | Reused existing stream response pattern. |
| G7 | Baseline commit hash & test count | Git Hash: `6e8a6ee00fa07545ff63861bcdf870e1557f2006`. Baseline: **20 test files / 63 tests passing**. | Test suite baseline confirmed at 20 files / 63 tests. |
| G8 | Frontend settings surface | Settings page exists at `client/src/app/(main)/settings/page.jsx`. | Created `SovereignExportCard.jsx` and embedded it in `settings/page.jsx`. |
| G9 | Frontend routing pattern | Next.js App Router route `/settings`. | Embedded export component directly in `/settings`. |
| G10 | Existing export trigger button | `requestExport` and `downloadExport` API methods exist in `client/src/lib/api.js`. | Connected `SovereignExportCard.jsx` to existing API endpoints. |

---

## 2. Summary of Implementation & Revenue Model Alignment

1. **Backend Sovereign Export Pipeline:**
   - **Confirmed Platform Model:** Inkwell operates on a platform-wide reader membership pool (per Phase J Step 1's `computeLedgerForPeriod` formula). Monthly reader membership fees are pooled and distributed to writers based on member read time.
   - **Targeted Semantics Fix:** Extended `streamExport` in [server/src/utils/exportAccount.js](file:///c:/Users/ABSA00065/Desktop/Project/server/src/utils/exportAccount.js) to accurately export:
     1. `totalEarnedPayoutCents` and `payoutHistory` (from `PayoutLedgerEntry`).
     2. `subscribers`: Sovereign reader directory (`subscriberId`, `name`, `email`, `membershipStatus`, `isPlatformMember`, `razorpaySubscriptionId`).
   - Bundled `PORTABILITY_DISCLOSURE.md` detailing pool-based revenue model, sovereign audience directory rights, and Razorpay auto-charge token security boundaries.
   - Registered `/api/users/me/export` alias route in [users.module.js](file:///c:/Users/ABSA00065/Desktop/Project/server/src/modules/users/users.module.js).

2. **Frontend UI Components & Settings Surface:**
   - Created [SovereignExportCard.jsx](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/membership/SovereignExportCard.jsx) featuring zip download trigger button, honest 2026 card processor disclosure banner, and download status state.
   - Embedded `SovereignExportCard` in [client/src/app/(main)/settings/page.jsx](file:///c:/Users/ABSA00065/Desktop/Project/client/src/app/%28main%29/settings/page.jsx).

3. **Integration Test Suite & Reconciled Results:**
   - Updated [test/integration/sovereign-export.test.js](file:///c:/Users/ABSA00065/Desktop/Project/server/test/integration/sovereign-export.test.js) covering all 4 required scenarios (§12.6).
   - Reconciled Test Suite Output: **21 test files passed, 67 tests passed (100% GREEN)**.
   - Rule 11 Parity Check: Scenario count ($4$) equals new test count ($4$), reconciling $63 + 4 = 67$.
