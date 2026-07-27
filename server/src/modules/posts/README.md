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
- **Phase I Step 1 DSA Optimization Pass**:
  - **Compound Index**: `{ status: 1, publishedAt: -1, _id: -1 }` index configured on `posts.model.js` backing cursor-based feed pagination.
  - **Trending Tags Min-Heap**: Bounded size-20 `TagMinHeap` replaces full sort for $O(t \log 20)$ top tag extraction.
  - **Full-Text Search**: Mongo native `$text` query replaces regex `$or` scan in `findVisibleFeed({ search })`.
- **Administrative Scripts Exemption**: Offline scripts (`seed.js`, `seed-content.js`, `test_seo_spec.js`, `run_evidence_verification.js`) use the permanent bridge (`models/Post.js`).
- **Real-Time Consumer Migration**: `check_scheduled_posts.js` rewired to `postRepository.findDueScheduled` and `publishScheduled`.
