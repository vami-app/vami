# 🖋️ Inkwell — Phase J, Step 5: Single-Membership Positioning & Metered Free Reads

> **Status**: **CLOSED (100% PASS — 9/9 Binary Sign-Off Checklist Criteria Satisfied)**  
> **Verification Report**: [walkthrough.md](file:///C:/Users/ABSA00065/.gemini/antigravity-ide/brain/172f581b-a4fb-48fb-8daa-8f289d51a18a/walkthrough.md)  
> Companion to `INKWELL_PRODUCT_SCALING_BLUEPRINT.md` (v3.0) §6.2, §6.4 (Build Table Rows 5 & 6).

---

## 1. Closure of Pre-Investigation Gate (G1 through G14)

All 14 pre-investigation questions G1–G14 were investigated directly against the codebase in a single pass:

| # | Question | Empirical Finding | Architectural Decision |
|---|---|---|---|
| G1 | `server/src/modules/membership/` directory check | 9 module directories exist (`comments`, `highlights`, `moderation`, `notifications`, `post-revisions`, `posts`, `publications`, `reading-lists`, `users`). No `membership` module directory exists. | Maintained flat file structure without scope creep or unstated module creation. |
| G2 | Location of membership models | `MembershipPayment.js`, `PayoutLedgerEntry.js`, `WebhookEvent.js`, `ReadEvent.js` live flat in `server/src/models/`. | Extended `User.js` / `entitlement.js` directly. |
| G3 | `User.membershipStatus` cardinality | `users.model.js:62` defines `membershipStatus: ["none", "active", "past_due", "canceled"]`. No per-writer or per-publication arrays exist. | Single-membership marketing claim verified as 100% true. |
| G4 | `subscribe` endpoint parameters | `membership.controller.js:18` takes `req.user` with 0 writer/publication inputs. | Confirms platform-wide subscription contract. |
| G5 | Current `canReadFull` source | `utils/entitlement.js`: checks `post.locked`, `viewer` author/admin role, and `viewer.membershipStatus === "active"`. | Extended `canReadFull(post, viewer, freeReadContext)` to evaluate `freeReadContext.remainingFreeReads > 0`. |
| G6 | Current `ReadEvent` schema source | `models/ReadEvent.js`: stores `post`, `viewer`, `viewerWasMember`, `activeSeconds`. | Queried monthly `ReadEvent` count for non-member locked story reads. |
| G7 | Monthly free read counter pattern | `ReadEvent` stores `viewer` ID and `createdAt` timestamp. | Computed monthly free reads dynamically: `ReadEvent.countDocuments({ viewer: viewerId, viewerWasMember: false, createdAt: { $gte: startOfMonth } })`. |
| G8 | Client `/membership` route check | No `membership` route directory existed in `client/src/app/(main)/`. | Created `client/src/app/(main)/membership/page.jsx`. |
| G9 | Settings/disclosure visual pattern | `SovereignExportCard.jsx` uses border cards, bold headers, and transparent disclosure copy. | Applied same visual language for `/membership` landing page. |
| G10 | Baseline test count & commit hash | Baseline Hash: `6e8a6ee00fa07545ff63861bcdf870e1557f2006`. Baseline: **22 test files / 71 tests passing**. | Established baseline at 22 test files / 71 tests. |
| G11 | Existing test assertions | `ledger.test.js`, `auth.test.js`, `entitlement.test.js` assert single status string. | Maintained 100% backward compatibility. |
| G12 | Cascade deletion check | `cascade.test.js` step 14 already deletes `ReadEvent` documents (`ReadEvent.deleteMany({ viewer: user._id })`). | Zero cascade schema additions required. |
| G13 | Paywall gating check | `Post.visibleQuery()` filters status and moderationStatus. Paywall enforcement lives solely in `canReadFull`. | Single point of enforcement in `entitlement.js`. |
| G14 | Operative verification standard | Verified §6.1–§6.8 as operative verification protocol. | Closed all gate rows with empirical evidence. |

---

## 2. Summary of Implementation & Domain-Meaning Verification

1. **J5-A Single-Membership Positioning Page (`/membership`):**
   - Built [client/src/app/(main)/membership/page.jsx](file:///c:/Users/ABSA00065/Desktop/Project/client/src/app/%28main%29/membership/page.jsx) featuring the *"One Membership. Access Every Writer."* positioning, formula-fidelity pool breakdown, value pillars, and `SubscribeModal` trigger.

2. **J5-B Metered Free Reads (3 Free Locked Story Reads / Month):**
   - Updated [server/src/utils/entitlement.js](file:///c:/Users/ABSA00065/Desktop/Project/server/src/utils/entitlement.js) extending `canReadFull(post, viewer, freeReadContext)` to allow full access when `freeReadContext.remainingFreeReads > 0`.
   - Updated `getPost` in [server/src/modules/posts/posts.service.js](file:///c:/Users/ABSA00065/Desktop/Project/server/src/modules/posts/posts.service.js) to compute monthly free reads and return `freeReadContext: { remainingFreeReads, totalMonthlyQuota: 3, isFreeReadApplied }`.

3. **Integration Test Suite & Verification Results:**
   - Built [server/test/integration/metered-reads.test.js](file:///c:/Users/ABSA00065/Desktop/Project/server/test/integration/metered-reads.test.js) covering all 4 required scenarios (§11.7).
   - Executed full Vitest suite & independent re-run: **23 test files passed, 75 tests passed (100% GREEN)**.
   - Scenario/test-count parity satisfied: $71 \text{ baseline tests} + 4 \text{ new tests} = 75 \text{ tests green}$.
