# Moderation Module Architecture & Verification Record

> **Module**: `moderation`  
> **Primary Models**: `Dispute` (`dispute.model.js`), `Report` (`models/Report.js`)  
> **Purpose**: Manages due process before permanent removal, hold-before-finalize state machine, appeal filing, and admin decision processing.

---

## 1. Architecture Overview
- **`dispute.model.js`**: `Dispute` schema definition capturing writer appeals, action targets, statement, status (`submitted`, `under_review`, `upheld`, `overturned`), reviewer notes, and `windowExpiresAt`.
- **`disputes.repository.mongo.js`**: `MongoDisputeRepository` handles pure data access for dispute CRUD, queue filtering, and finalization queries.
- **`disputes.service.js`**: `DisputeService` enforces hold validation, dispute creation windows, state machine transitions, notification dispatch, and finalization sweep logic.
- **`disputes.controller.js`**: `DisputeController` exposes HTTP handlers for the 6 moderation and policy endpoints.
- **`finalization.job.js`**: `FinalizationJob` background sweep job executing auto-finalization on expired dispute windows.
- **`moderation.module.js`**: Kernel registry entry point.

---

## 2. Boundary & Hold Rules
- **Hold-Before-Finalize**: Account restrictions and payout adjustments enter a 7-day `HELD` state. Balances are not debited/withheld during `HELD` until finalized or upheld.
- **Razorpay Reconciliation Flag**: Overturning an appeal on an already-settled Razorpay payout period sets `reconciliationFlag = true` for manual operator review instead of attempting automated external bank debits.
- **Pure Repository Boundary**: `MongoDisputeRepository` contains zero business logic and zero auth entitlement checks.
