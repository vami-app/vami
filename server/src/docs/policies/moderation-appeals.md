# Inkwell Moderation & Appeals Policy (v1.0)

> **Effective Date**: 2026-07-27  
> **Applies to**: All registered writers, authors, and partner program participants.

---

## 1. Overview & Due Process Rights
Inkwell believes that content creators deserve clear explanations, fair review, and due process before any enforcement action reaches a permanent state. No account restriction or payout adjustment becomes irreversible without a window in which the affected writer can submit an appeal.

---

## 2. Appealable Actions & The 7-Day Hold Window
The following enforcement actions are subject to a **7-day hold window** prior to finalization:
1. **Account Restrictions**: Temporary deactivations or status holds.
2. **Payout Adjustments**: Revenue holds or engagement adjustments.
3. **Content Removals**: Hiding or removing published stories/comments.

During the 7-day hold window:
- Writers receive a notification containing the specific enforcement reason and a link to file a dispute.
- Payout ledger balances remain intact under review and are **not debited or withheld** until final decision or window expiration.

---

## 3. How to Submit a Dispute
- Writers may file a dispute via the dashboard or `POST /api/moderation/disputes`.
- Statements must be clear, honest, and under 2,000 characters.
- Disputes must be filed before `windowExpiresAt` (7 days from action notice).

---

## 4. Review Process & Decision Outcomes
A human reviewer evaluates each submitted dispute alongside policy guidelines:
- **Upheld**: The original enforcement action is confirmed and finalized permanently.
- **Overturned**: The enforcement action is reversed, restoring account/content visibility or reversing payout holds.

---

## 5. Finality & Single Review Cycle
Each enforcement action is eligible for **one review cycle**. Decisions rendered by human reviewers are final. Unappealed actions auto-finalize upon expiration of the 7-day hold window.
