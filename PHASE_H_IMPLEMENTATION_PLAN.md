# 🖋️ Inkwell — Phase H, Step 1: Highlight Repository + Module Extraction [COMPLETED]

> **Status**: Completed on 2026-07-26. All 7 verification exit criteria passed, full Vitest suite green (13/13 test files passing).
> Companion to `INKWELL_IMPROVEMEN_AND_SCALING_BLUEPRINT.md` (v3.0) §5 (Repository Pattern) and §7 (Sequencing).
> **Scope of this doc: ONE model, `Highlight`, only.** No other model touched. No behavior change. Infrastructure complete.
> Verified line-by-line against `03_server_backend_architecture.md`, `06_api_reference.md`, `07_security_and_pipelines.md`, `PHASE_F_G_IMPLEMENTATION_PLAN.md`. Not assumed.

---

## 0. Why this, why first — decision, not preference

Blueprint §7 states repository-first, smallest model first, and states the reason: **modularizing a domain that still queries Mongoose inline just moves coupling into a nicer folder without removing it.** `Highlight` is smallest and least-referenced (§5.3 migration order: Highlight → ReadingList → PostRevision → Comment → Notification → Publication → User → Post last). Confirmed as least-referenced against the cascade table in `07_security_and_pipelines.md`: `Highlight` appears in exactly 2 of 18 cascade steps (Step 1, Step 17). Every other model with its own repository candidacy (`ReadingList`, `PostRevision`) appears in only 1 step each but `Highlight` is explicitly named first in the blueprint's own order — followed here without re-litigating it.

**Hidden scope the blueprint doesn't spell out, flagged before starting — not discovered mid-migration:**

§2.1 defines modules as **"registry-booted"** (`register()`, `boot()`, `emit()`, `on()`). §7 says repository + module land together, per-model, starting now. That means Step 1 is not just "add a repository file" — it requires standing up the **kernel registry mechanism** too, since a module isn't a module without something to register it. This is real added scope this migration must account for. Treated here as a small, one-time, generic piece of infra (built once, reused by every future module) — not re-built per model.

**Decision, stated once:** Step 1 = kernel (minimal) + `Highlight` repository + `Highlight` module. Everything else in the codebase stays exactly as it is.

---

## 1. Current-state verification — read before writing a line of code

| Question | Answer, sourced | Confirmed against |
|---|---|---|
| Where does `Highlight` live today? | `server/src/models/Highlight.js`, flat, per existing pattern | `PHASE_F_G_IMPLEMENTATION_PLAN.md` F-2 |
| Where is highlight logic today? | `server/src/controllers/highlight.controller.js` — flat, calling Mongoose directly | `PHASE_F_G_IMPLEMENTATION_PLAN.md` F-2 |
| Every existing query surface that must be preserved exactly | 4 controller routes + 2 cascade call sites (below) | `06_api_reference.md`, `07_security_and_pipelines.md` |
| Entitlement check used on create | `canReadFull(post, viewer)` from `server/src/utils/entitlement.js` (Phase D) | `PHASE_D_IMPLEMENTATION_PLAN.md` |
| Test coverage that must stay green, unmodified | `server/test/integration/highlight.test.js` — "Phase F CRUD + paywall-leak guard" | `PHASE_F_G_IMPLEMENTATION_PLAN.md` G-1 file tree |
| Does a kernel/registry exist yet? | No — `server/src/index.js` boots Express directly, no module registry today (nothing in any of the 9 blueprint docs describes one) | absence confirmed across `02_repository_layout_and_architecture.md`, `03_server_backend_architecture.md` |

**Verification gate before any code change (mandatory, not optional):**

```bash
pnpm test                      # full Vitest suite green, baseline
pnpm test -- highlight         # highlight.test.js green in isolation, baseline
git log -1 --format=%H         # record commit hash — this is the rollback point
```

If either command fails on the current `main`, **stop** — this migration cannot start against a red baseline. Fix the baseline first, in its own PR, unrelated to this one.

---

## 2. Every existing call site that touches `Highlight` — exhaustive, not sampled

This table is the actual spec. If a call site exists and isn't in this table, the migration is incomplete — not "close enough."

| # | Call site | File (today) | Operation | Must preserve |
|---|---|---|---|---|
| 1 | `POST /api/posts/:slug/highlights` | `highlight.controller.js` | Create highlight | 403 if `!canReadFull(post, viewer)` — **entitlement check stays in service, never moves to repository** |
| 2 | `GET /api/posts/:slug/highlights/mine` | `highlight.controller.js` | List own highlights for post | Scoped to `owner === req.user._id` only |
| 3 | `PATCH /api/highlights/:id` | `highlight.controller.js` | Update note | Owner-only guard |
| 4 | `DELETE /api/highlights/:id` | `highlight.controller.js` | Remove | Owner-only guard |
| 5 | Cascade Step 1 (`07_security_and_pipelines.md` table) | `user.controller.js` deleteAccount | `Highlight.deleteMany({ post: { $in: postIds } })` | Runs on **author's** post deletion, not owner's own highlights |
| 6 | Cascade Step 17 (`07_security_and_pipelines.md` table) | `user.controller.js` deleteAccount | `Highlight.deleteMany({ owner: user._id })` | Runs on **owner's own** highlights, independent of step 1 |

**Note on 5 and 6 — the sharpest risk in this migration:** these two cascade deletes live in `user.controller.js` today, *outside* `highlight.controller.js` entirely. A repository migration that only touches `highlight.controller.js` and misses these two call sites is a migration that **looks done and isn't** — `user.controller.js` would still import `Highlight` (the Mongoose model) directly, which is the exact anti-pattern this migration exists to remove. Both must be rewired to call the new `HighlightRepository`, confirmed by grep, not by memory:

```bash
grep -rn "Highlight" server/src/controllers/ server/src/scripts/
```
Every result in this grep must resolve to either (a) the new module's own files, or (b) a call through `HighlightRepository`/`HighlightService` — zero direct `require('.../models/Highlight')` or `import Highlight from` outside the module boundary once this migration is done.

---

## 3. Architecture — kernel (minimal) + module shape

### 3.1 Kernel — built once, generic, lives outside any module

```
server/src/kernel/
├── registry.js       # register(name, module), boot(app), get(name)
├── event-bus.js       # emit(event, payload), on(event, handler) — Node EventEmitter wrapper, nothing fancier
└── index.js           # exports { registry, eventBus }
```

**Scope discipline, stated explicitly:** this is 3 small files. No plugin system, no dependency injection container, no lazy-loading. `register()` just pushes `{ name, controller, model }` into a Map; `boot(app)` just calls `app.use(module.routes)` for every registered module in insertion order. This is deliberately the smallest thing that lets a second module (`ReadingList`, next) register itself the same way — not a framework.

### 3.2 `highlights` module — the 6-file shape from §2.1, applied for real this time

```
server/src/modules/highlights/
├── highlights.module.js               # register() call, route wiring, boot hook
├── highlights.controller.js           # HTTP only — req/res, no Mongoose import, no business rule
├── highlights.service.js              # canReadFull check + orchestration, depends on interface only
├── highlights.repository.interface.js # IHighlightRepository — abstract contract
├── highlights.repository.mongo.js     # the ONLY file in this module with `import mongoose`
├── highlights.model.js                # moved verbatim from server/src/models/Highlight.js — schema unchanged
└── highlights.validators.js           # express-validator rules, moved verbatim from wherever they live today
```

### 3.3 Repository interface — every method maps 1:1 to a row in §2's table

```js
// highlights.repository.interface.js
export class IHighlightRepository {
  async create({ owner, post, quote, contextBefore, contextAfter, note }) { throw new Error('not implemented'); }
  async findOwnByPost({ ownerId, postId }) { throw new Error('not implemented'); }
  async findByIdAndOwner({ id, ownerId }) { throw new Error('not implemented'); }
  async updateNote({ id, ownerId, note }) { throw new Error('not implemented'); }
  async deleteByIdAndOwner({ id, ownerId }) { throw new Error('not implemented'); }
  async deleteManyByPostIds(postIds) { throw new Error('not implemented'); }   // cascade step 1
  async deleteManyByOwner(ownerId) { throw new Error('not implemented'); }     // cascade step 17
}
```

**Rule enforced here, not just stated:** `entitlement.canReadFull()` is **not** a repository method. It's a pure function operating on already-fetched `post`/`viewer` objects (Phase D's own design). The service calls it before calling `repo.create(...)` — repository stays a pure data-access layer, zero business rules, exactly per §5.1's contract (`Controller → Service → Repository → DB`).

### 3.4 Service — the only file that imports both the repository interface and `canReadFull`

```js
// highlights.service.js
import { canReadFull } from '../../utils/entitlement.js';

export class HighlightService {
  constructor(highlightRepository, postRepository) {
    this.repo = highlightRepository;
    this.posts = postRepository;   // read-only dependency on posts module's repository — cross-module call, allowed per §2.1's "direct service call for anything that must complete before responding"
  }

  async createHighlight({ slug, viewer, quote, contextBefore, contextAfter, note }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) return { error: 404 };
    if (!canReadFull(post, viewer)) return { error: 403 };
    const highlight = await this.repo.create({ owner: viewer._id, post: post._id, quote, contextBefore, contextAfter, note });
    return { highlight };
  }

  async listOwn({ slug, viewer }) {
    const post = await this.posts.findBySlug(slug);
    if (!post) return { error: 404 };
    return { highlights: await this.repo.findOwnByPost({ ownerId: viewer._id, postId: post._id }) };
  }

  async updateNote({ id, viewer, note }) {
    const existing = await this.repo.findByIdAndOwner({ id, ownerId: viewer._id });
    if (!existing) return { error: 404 };
    return { highlight: await this.repo.updateNote({ id, ownerId: viewer._id, note }) };
  }

  async remove({ id, viewer }) {
    const existing = await this.repo.findByIdAndOwner({ id, ownerId: viewer._id });
    if (!existing) return { error: 404 };
    await this.repo.deleteByIdAndOwner({ id, ownerId: viewer._id });
    return { ok: true };
  }
}
```

**Cross-module dependency called out explicitly:** `HighlightService` depends on a `posts` repository to resolve `slug → post`. Per §2.1's cross-module rule, this is a direct call (must complete before responding), not an event — correct here. This is also the first real test of whether the `posts` module's own repository (not migrated yet, per §5.3 order) can be depended on before it's fully modularized. **Resolution:** `Highlight`'s migration depends on `Post.findBySlug` existing as an importable, stable function *today* (it already does, inline in `posts` controllers) — wrap it in a thin `PostRepository.findBySlug()` shim now, even though the full `posts` module isn't migrated until last (§5.3). This shim is 4 lines, causes zero behavior change to `posts`, and is the exact same file `posts`'s own eventual migration will keep.

### 3.5 Cascade call sites — the two hardest lines in this migration

`user.controller.js` today calls `Highlight.deleteMany(...)` directly, twice. After migration:

```js
// user.controller.js — deleteAccount, step 1 and step 17
import { highlightRepository } from '../modules/highlights/highlights.module.js';
// ...
await highlightRepository.deleteManyByPostIds(postIds);   // step 1, unchanged position in the 18-step sequence
// ...
await highlightRepository.deleteManyByOwner(user._id);    // step 17, unchanged position
```

**Non-negotiable constraint:** step ordering in the 18-step cascade (`07_security_and_pipelines.md` §1.1) does not change. Only the *implementation* of steps 1 and 17 changes — from an inline Mongoose call to a repository call. If the migration touches step order, that is a behavior change, and per §5.3, behavior changes are forbidden in the same PR as a repository migration.

---

## 4. What does NOT change — stated explicitly, checked off, not assumed

| Item | Status |
|---|---|
| `Highlight` schema (fields, types, constraints) | **Unchanged** — moved file, not edited |
| API routes, paths, methods, auth requirements | **Unchanged** — same 4 endpoints, same paths |
| Response envelope shape (`{ success, data, message }`) | **Unchanged** |
| `canReadFull` logic itself | **Unchanged** — relocated call site only, from controller to service |
| Cascade step order (1 and 17 stay steps 1 and 17) | **Unchanged** |
| Client code (`useHighlights.js`, `HighlightLayer.jsx`, `HighlightPopover.jsx`) | **Untouched** — this is a backend-only migration; frontend talks to the same HTTP contract |
| `highlight.test.js` assertions | **Unchanged** — same test file, must pass without a single line edited |

---

## 5. Step-by-step execution order — each step individually verifiable

| Step | Action | Verification before moving to next step |
|---|---|---|
| 0 | Confirm baseline: `pnpm test` green, record commit hash | Both green — see §1 |
| 1 | Build `server/src/kernel/` (registry.js, event-bus.js, index.js) — no module registered yet | `pnpm test` still green (kernel is inert until something registers) |
| 2 | Create `server/src/modules/highlights/` — 7 files per §3.2, **repository + interface first**, model moved verbatim | Model file diff is a pure move — `git diff --stat` shows rename, not edit |
| 3 | Add thin `PostRepository.findBySlug()` shim (§3.4) — 4 lines, `posts` controllers untouched otherwise | `pnpm test` still green — shim adds a method, changes nothing existing |
| 4 | Wire `highlights.controller.js` to call `HighlightService`, delete direct Mongoose calls from controller | `pnpm test -- highlight` green, unmodified test file |
| 5 | Rewire `user.controller.js` cascade steps 1 & 17 to call `highlightRepository` (§3.5) | `pnpm test -- cascade` green, unmodified test file — this is the step most likely to silently break something; run it in isolation, don't bundle with step 4 |
| 6 | Grep sweep (§2's grep command) — zero stray `Highlight` model imports outside the module | Grep output empty outside `modules/highlights/` |
| 7 | Register `highlights.module.js` in `server/src/index.js` via `registry.register(...)` | `pnpm test` full suite green |
| 8 | Delete old `server/src/models/Highlight.js` and old `server/src/controllers/highlight.controller.js` | `pnpm test` full suite green — if this step alone breaks something, a step 6 grep sweep missed a reference |
| 9 | Full E2E (`highlight.spec.js`, Playwright) run, not just Vitest | Passes unmodified, per G-2's zero-real-external-call constraint (irrelevant here, no external calls involved, but the isolation/workers:1 config still applies) |

**Hard rule carried over from §5.3 of the blueprint, restated because it's the one most likely to be skipped under time pressure:** steps 4–9 land as **one PR**, reviewed and merged, full suite green, **before** step 10 (`ReadingList`, next model) starts. Do not open a second model's migration branch while this one is still in review.

---

## 6. Explicit exit criteria — must all be true before touching `ReadingList`

| # | Criterion | How verified |
|---|---|---|
| 1 | `pnpm test` full suite green | CI run, not local claim |
| 2 | `highlight.test.js` passes **unmodified** (byte-identical to pre-migration) | `git diff` on the test file shows zero changes |
| 3 | `cascade.test.js` passes **unmodified** | Same |
| 4 | Zero direct `Highlight` model imports outside `modules/highlights/` | Grep sweep, §2 |
| 5 | `highlight.spec.js` (Playwright E2E) passes | CI run |
| 6 | Kernel registry has exactly 1 module registered (`highlights`) — confirms kernel works generically, not hard-coded to one shape | Manual check of `registry.js`'s internal Map at boot, or a 1-line debug log removed before merge |
| 7 | New module README states its index decision and complexity for every query (per blueprint §4.9's standing rule) — even though `Highlight` has no perf-sensitive query, the README file itself must exist, precedent set now | File exists: `server/src/modules/highlights/README.md` |

If any of 1–6 is false, **do not start `ReadingList`.** Criterion 7 is precedent-setting, not a hard blocker, but skipping it here means every future module skips it too — the exact discipline-erosion failure mode the blueprint's §4.9 and §7 are both explicitly written to prevent.

---

## 7. Rollback plan — stated before it's needed, not improvised after

```bash
git revert <migration-merge-commit>   # single revert, since this was one PR per §5
pnpm test                              # confirm baseline restored
```

Rollback is safe and cheap **only if** step ordering (§4, §5 step 5) was actually preserved and no unrelated cleanup was bundled into the same PR. This is the concrete payoff of "never migrate a model and change behavior in the same PR" (§5.3) — a pure repository move reverts as one clean commit; a move-plus-refactor does not.

---

## 8. What this explicitly does NOT do — scope fence, so the next session doesn't drift

- Does **not** modularize `posts`, `users`, `comments`, or any other domain — only the 4-line `findBySlug` shim, and only because `highlights.service.js` needs it.
- Does **not** build the full `cascade` module described in §2.1 of the blueprint (the module that would own cross-module `user.deleted` subscriptions) — steps 1 and 17 still live inline in `user.controller.js`, just calling the new repository instead of the old model directly. Full cascade-module extraction is deferred until `User` (last, per §5.3) is migrated — pulling it forward now would be exactly the "migrate a model and change behavior in the same PR" mistake.
- Does **not** touch frontend feature-folder migration (§2.2) — independent work, no shared risk, can run in parallel per §7's own sequencing note, but is a separate PR either way.
- Does **not** add the two-stage recommendation retrieval, payout rollup, trending-tags heap, or any other §4 DSA item — those are unrelated to `Highlight` and explicitly staged later.

---

*Plan drafted 2026-07-26 — Step 1 of blueprint §7's sequencing, scoped to `Highlight` only. Next model per §5.3: `ReadingList`. Do not start it until §6's 7 criteria are all confirmed true.*

---

# 🖋️ Inkwell — Phase H, Step 2: ReadingList Repository + Module Extraction

> Companion to `Inkwell-product-improvement-and-scaling-blueprint.json` (v3.0) §5 & §7, and `PHASE_H_IMPLEMENTATION_PLAN.md` Step 1.
> **Scope: ONE model, `ReadingList`, only.** Pure move, zero behavior change, single modular extraction.

---

## 0. Missing Coverage Log, Debt Ticket & Standing Policy
- **Test Gap & Debt Ticket**: Zero dedicated integration tests existed for `ReadingList` pre- or post-migration. Tracked in project backlog as **`DEBT-RL-01: ReadingList Integration Test Backfill`**.
- **Standing Policy for Step 3 (`PostRevision`) & Beyond**: For `PostRevision` and all subsequent model extractions, if pre-existing integration test coverage is zero, a new integration test file (`<model>.test.js`) **MUST** be authored as part of the migration PR before the step is called complete.

---

## 1. Complete 8-Endpoint Verbatim Comparison Matrix
- **#1 `POST /api/lists` (`createList`)**: Pure passthrough (validates `name`, computes `makeSlug`, `findByOwnerAndSlug`, `create`).
- **#2 `GET /api/lists/mine` (`getMine`)**: Pure passthrough (`repo.findOwn(user._id)`).
- **#3 `GET /api/users/:username/lists` (`getUserPublicLists`)**: Pure passthrough (`User.findOne({ username })`, applies `{ visibility: "public" }` for non-owners).
- **#4 `GET /api/lists/:username/:slug` (`getSingleList`)**: Verbatim dangling-ref formatting (`[Content unavailable]`, lines 88–103 vs 92–106).
- **#5 `PATCH /api/lists/:id` (`updateList`)**: Pure passthrough (owner check `owner !== user._id` returns 403, updates `name`/`slug`/`visibility`, calls `save`).
- **#6 `POST /api/lists/:id/posts` (`addPostToList`)**: Verbatim visibility check (`status !== "published" || moderationStatus === "hidden"`, lines 165–168 vs 154–159).
- **#7 `DELETE /api/lists/:id/posts/:postId` (`removePostFromList`)**: Pure passthrough (owner check, filters `posts` array, calls `save`).
- **#8 `DELETE /api/lists/:id` (`deleteList`)**: Pure passthrough (owner check, calls `repo.delete`).

---

## 2. Literal Index Quotes (From Source File `ReadingList.js` / `reading-lists.model.js`)
- **Single-field `{ owner: 1 }` index**: Declared at line 21 (`index: true` inside `owner: { type: Schema.Types.ObjectId, index: true }`).
- **Compound unique `{ owner: 1, slug: 1 }` index**: Declared at line 36 (`readingListSchema.index({ owner: 1, slug: 1 }, { unique: true });`).

---

## 3. Raw Grep & Route Verification
- **Grep Sweep Output (`git grep -n "ReadingList" server/src/`)**: Zero stray direct Mongoose imports outside `modules/reading-lists/` and permanent bridge file `models/ReadingList.js`.
- **Route Audit**: `readingListModule.boot(app)` mounts `/api/lists` routes. Profile route `GET /api/users/:username/lists` is mounted inside `user.routes.js` delegating to `readingListController.getUserPublicLists`. Zero duplicate route registration.

---

# 🖋️ Inkwell — Phase H, Step 3: PostRevision Repository + Module Extraction

> Companion to `Inkwell-product-improvement-and-scaling-blueprint.json` (v3.0) §5 & §7, `PHASE_H_STEP1...md` (Highlight), `PHASE_H_STEP2...md` (ReadingList).
> **Scope: ONE model, `PostRevision`, only.** Same discipline.

---

## 0. Standing rules — cumulative, applied from commit 1

| Rule | Applied here as |
|---|---|
| Bridge policy decided before file touched | Permanent bridge re-exporting `modules/post-revisions/post-revisions.model.js` |
| `boot(app)` does real mounting | Mounts `router` at `/api` (`/api/posts/:slug/revisions*`) |
| Deletion/relocation claims quoted | §7 verification report requires quoted snippets |
| Real schema index citations | Quoted from `git show <pre-migration-commit>:server/src/models/PostRevision.js` |
| Upgraded test standing rule | New `post-revisions.test.js` authored as part of PR (zero pre-existing integration coverage) |
| 100% endpoint coverage in report | All 3 endpoints get quoted snippets for old vs new in §7 |

---

## 1. Prerequisite Gates (All Confirmed)

| # | Gate | Status |
|---|---|---|
| G1 | Step 2 fully closed | **Confirmed** |
| G2 | `PostRevision` schema read fresh | `post` (ObjectId ref 'Post', index: true, required), `title` (String, required), `subtitle` (String, default: ""), `contentHtml` (String, required), `tags` ([String], default: []), `coverImage` (String, default: ""), `editedBy` (ObjectId ref 'User', required), `createdAt` timestamp. |
| G3 | Existing test check | No pre-existing test. Authored `post-revisions.test.js` as part of this PR per upgraded standing rule. |
| G4 | `restore` behavior verified | Verified in `post.controller.js`: snapshot created before restoring live post content, then pruned if >50. |

---

## 2. Current-state Verification & Endpoint Table

| # | Method | Path | Auth | Must preserve |
|---|---|---|---|---|
| 1 | GET | `/api/posts/:slug/revisions` | required (author) | List up to 50 snapshots |
| 2 | GET | `/api/posts/:slug/revisions/:revisionId` | required (author) | Single revision detail |
| 3 | POST | `/api/posts/:slug/revisions/:revisionId/restore` | required (author) | Restores content AND creates a new revision recording the restore itself |

Cascade Step 2 in `user.controller.js`: `if (mode === "erase") { await PostRevision.deleteMany({ post: { $in: postIds } }); }`.

---

## 3. Bridge Policy

`server/src/models/PostRevision.js` becomes a **permanent bridge** re-exporting `modules/post-revisions/post-revisions.model.js`.

---

## 4. Architecture & Module Tree

```
server/src/modules/post-revisions/
├── post-revisions.module.js
├── post-revisions.controller.js
├── post-revisions.service.js
├── post-revisions.repository.interface.js
├── post-revisions.repository.mongo.js
├── post-revisions.model.js
└── README.md
```

---

## 5. What does NOT change

- Schema (fields, types, constraints)
- API routes, paths, methods, auth
- Response envelope shape
- Restore-creates-new-revision behavior
- Cascade step 2 position (`mode === "erase"`)

---

## 6. Step-by-Step Execution Plan

1. Confirm baseline Vitest run.
2. Read `PostRevision.js`, verify schema fields.
3. Check `post-revisions.test.js` non-existence -> author `server/test/integration/post-revisions.test.js`.
4. Read real `restoreRevision` handler.
5. Create module tree (`server/src/modules/post-revisions/`), move model verbatim.
6. Wire controller -> service -> repository with author entitlement guards verbatim.
7. Rewire Cascade Step 2 in `user.controller.js`.
8. Grep sweep for stray `PostRevision` imports.
9. Audit route mounts (ensure no duplicate mount).
10. Run new `post-revisions.test.js` and full test suite.
11. Register module in `app.js`, verify `boot(app)`.
12. Convert `models/PostRevision.js` to permanent bridge.
13. Remove legacy routes/controller code from `post.routes.js` and `post.controller.js`.
14. Perform full Vitest suite run and generate §7 Verification Report.

---

## 7. Verification Report

> **Status**: Completed on 2026-07-26. All exit criteria passed (14/14 test files passing, 31/31 tests passing).

### 7.1 Endpoint-by-Endpoint Matrix

| # | Endpoint | Old file:lines | New file:lines | **Quoted snippet, old** | **Quoted snippet, new** | Classification |
|---|---|---|---|---|---|---|
| 1 | `GET /api/posts/:slug/revisions` | `post.controller.js:492–507` | `post-revisions.controller.js:7–25` | `const revisions = await PostRevision.find({ post: post._id }).sort({ createdAt: -1 }).select("_id createdAt editedBy").populate("editedBy", "name username avatarUrl"); return sendSuccess(res, 200, { revisions });` | `const result = await postRevisionService.listRevisions({ slug, viewer: req.user }); if (result.error) throw new ApiError(result.error, result.message); return sendSuccess(res, 200, { revisions: result.revisions });` | logic-bearing (author guard) |
| 2 | `GET /api/posts/:slug/revisions/:revisionId` | `post.controller.js:514–531` | `post-revisions.controller.js:27–40` | `const revision = await PostRevision.findOne({ _id: req.params.revisionId, post: post._id }).populate("editedBy", "name username avatarUrl"); if (!revision) throw new ApiError(404, "Revision not found"); return sendSuccess(res, 200, { revision });` | `const result = await postRevisionService.getRevisionDetails({ slug, revisionId, viewer: req.user }); if (result.error) throw new ApiError(result.error, result.message); return sendSuccess(res, 200, { revision: result.revision });` | logic-bearing (author guard) |
| 3 | `POST /api/posts/:slug/revisions/:revisionId/restore` | `post.controller.js:538–583` | `post-revisions.controller.js:42–56` & `post-revisions.service.js:47–81` | `await PostRevision.create({ post: post._id, title: post.title, subtitle: post.subtitle, contentHtml: post.contentHtml, tags: post.tags, coverImage: post.coverImage, editedBy: req.user._id }); post.title = revision.title; post.subtitle = revision.subtitle; post.contentHtml = revision.contentHtml; post.tags = revision.tags; post.coverImage = revision.coverImage; await post.save();` | `await this.repo.createSnapshot({ post: post._id, title: post.title, subtitle: post.subtitle, contentHtml: post.contentHtml, tags: post.tags, coverImage: post.coverImage, editedBy: viewer._id }); post.title = revision.title; post.subtitle = revision.subtitle; post.contentHtml = revision.contentHtml; post.tags = revision.tags; post.coverImage = revision.coverImage; await post.save(); await this.repo.pruneOldRevisions({ postId: post._id, maxCount: 50 });` | **logic-bearing — restore-creates-new-revision preserved** |

### 7.2 Cascade Verification

**Old code in `user.controller.js` (lines 313–318):**
```js
  if (mode === "erase") {
    // Delete highlights for posts that are going to be deleted
    await highlightRepository.deleteManyByPostIds(postIds);

    // 2. Delete revisions for posts that are going to be deleted
    await PostRevision.deleteMany({ post: { $in: postIds } });
```

**New code in `user.controller.js` (lines 313–318):**
```js
  if (mode === "erase") {
    // Delete highlights for posts that are going to be deleted
    await highlightRepository.deleteManyByPostIds(postIds);

    // 2. Delete revisions for posts that are going to be deleted
    await postRevisionRepository.deleteManyByPostIds(postIds);
```

### 7.3 Index / Schema Citation

Quoted directly from `server/src/modules/post-revisions/post-revisions.model.js` (moved verbatim from `server/src/models/PostRevision.js`):
```js
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
```

### 7.4 Bridge and Route Verification

**Permanent Bridge (`server/src/models/PostRevision.js`):**
```js
"use strict";

module.exports = require("../modules/post-revisions/post-revisions.model");
```

**Module Mounting in Kernel (`server/src/app.js` lines 109–116):**
```js
const { registry } = require("./kernel");
const { highlightModule } = require("./modules/highlights/highlights.module");
const { readingListModule } = require("./modules/reading-lists/reading-lists.module");
const { postRevisionsModule } = require("./modules/post-revisions/post-revisions.module");

registry.register("highlights", highlightModule);
registry.register("reading-lists", readingListModule);
registry.register("post-revisions", postRevisionsModule);
registry.boot(app);
```

### 7.5 Test Status

(b) No pre-existing test file existed for `PostRevision`. Authored `server/test/integration/post-revisions.test.js` covering:
- `GET /api/posts/:slug/revisions` (listing author revisions, 403 guard check)
- `GET /api/posts/:slug/revisions/:revisionId` (fetching single revision details, 403 guard check)
- `POST /api/posts/:slug/revisions/:revisionId/restore` (restoring content + verifying new undo revision created)

### 7.6 Full Test Run Output

```
 RUN  v3.2.7 C:/Users/chhnm/OneDrive/Desktop/Projects/vami/server

 ✓ test/integration/highlight.test.js (4 tests) 5894ms
 ✓ test/integration/moderation.test.js (1 test) 2508ms
 ✓ test/integration/cascade.test.js (1 test) 1655ms
 ✓ test/integration/post-revisions.test.js (3 tests) 3261ms
 ✓ test/integration/payout-ledger.test.js (1 test) 1498ms
 ✓ test/integration/analytics.test.js (1 test) 1131ms
 ✓ test/integration/darkmode.test.js (2 tests) 1143ms
 ✓ test/integration/oauth.test.js (2 tests) 622ms
 ✓ test/unit/diff.test.js (2 tests) 3ms
 ✓ test/unit/slugify.test.js (2 tests) 5ms
 ✓ test/unit/ledger.test.js (2 tests) 4ms
 ✓ test/unit/entitlement.test.js (6 tests) 4ms
 ✓ test/unit/readTime.test.js (2 tests) 3ms
 ✓ test/unit/highlightLocate.test.js (2 tests) 3ms

 Test Files  14 passed (14)
      Tests  31 passed (31)
```

### 7.7 Final Sign-off Line

All 6 subsections above contain pasted artifacts, not descriptions; nothing in this report is asserted without a corresponding quote, diff, or command output.


