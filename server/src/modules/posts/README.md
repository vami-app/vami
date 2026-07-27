# Post Module Architecture & Verification Record

> **Module**: `posts`
> **Primary Models**: `Post` (`posts.model.js`)
> **Bridge File**: `server/src/models/Post.js`

---

## 1. Architecture Overview
- **`posts.model.js`**: Verbatim copy of schema definition.
- **`posts.repository.mongo.js`**: `MongoPostRepository` handles pure data access for feed queries, post CRUD, view counts, claps increments, related stories, sitemap projections, cross-module publication submissions, telemetry, ledger/analytics, candidate recommendations, and cascade operations.
- **`posts.service.js`**: `PostService` handles business rules, slug generation, HTML content sanitization, paywall entitlement checks (`canReadFull`), locked preview truncation, and notification dispatching.
- **`posts.controller.js`**: `PostController` handles all 11 core HTTP endpoints for the Post domain.
- **`posts.module.js`**: Kernel registry entry points.

---

## 2. Inventory & Boundary Rules
- **Pure Repository Boundary**: `MongoPostRepository` contains zero business rules and zero entitlement logic.
- **No DSA Non-Contamination**: `$text` search, full-sort trending tags, and single-stage recommendation candidate selection preserved verbatim.
- **Administrative Scripts Exemption**: Offline scripts (`seed.js`, `seed-content.js`, `test_seo_spec.js`, `run_evidence_verification.js`) use the permanent bridge (`models/Post.js`).
- **Real-Time Consumer Migration**: `check_scheduled_posts.js` rewired to `postRepository.findDueScheduled` and `publishScheduled`.
