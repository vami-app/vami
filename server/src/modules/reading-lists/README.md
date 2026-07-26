# 🖋️ Reading Lists Domain Module

> Architecture and query performance documentation for the `reading-lists` module.
> Built per Inkwell Blueprint (v3.0) §2.1 and §4.9 standing rules.

---

## 1. Responsibilities

The `reading-lists` domain module owns user-created curated collections of stories (public and private).

- **Data Access Boundary**: Access to reading list documents is strictly restricted to `MongoReadingListRepository` (`reading-lists.repository.mongo.js`).
- **Visibility Guard**: Adding posts to reading lists requires validating that target posts are published and not hidden (`status === 'published' && moderationStatus !== 'hidden'`), evaluated in `ReadingListService` (`reading-lists.service.js`).
- **Cascades**: User account deletion cleanup (Cascade Step 12) interfaces via `readingListRepository.deleteManyByOwner(ownerId)`.

---

## 2. Schema & Indexes

> **Blueprint §4.9 Standing Rule Decision**: Compound index `{ owner: 1, slug: 1 }` (unique) pre-existing at line 36 of pre-migration `server/src/models/ReadingList.js`. Single-field `{ owner: 1 }` index declared on schema property at line 21.

| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ owner: 1 }` | Single-field | Find own lists (`findOwn`), delete lists by owner (Cascade Step 12) | $O(\log N + K)$ |
| `{ owner: 1, slug: 1 }` | Compound (Unique) | Single list lookup by owner & slug (`findByOwnerAndSlug`) | $O(\log N)$ |

---

## 3. Query Performance & Complexity Matrix

| Operation | Query Shape | Index Used | Complexity |
|---|---|---|---|
| `create` | `ReadingList.create(...)` | N/A | $O(1)$ |
| `findOwn` | `ReadingList.find({ owner }).sort({ updatedAt: -1 })` | `{ owner: 1 }` | $O(\log N + K)$ |
| `findByOwner` | `ReadingList.find({ owner, ...filter }).sort({ updatedAt: -1 })` | `{ owner: 1 }` | $O(\log N + K)$ |
| `findByOwnerAndSlug` | `ReadingList.findOne({ owner, slug })` | Compound `{ owner: 1, slug: 1 }` | $O(\log N)$ |
| `findById` | `ReadingList.findById(id)` | Primary key `_id` | $O(1)$ |
| `save` | `listDoc.save()` | Primary key `_id` | $O(1)$ |
| `delete` | `listDoc.deleteOne()` | Primary key `_id` | $O(1)$ |
| `deleteManyByOwner` | `ReadingList.deleteMany({ owner: ownerId })` | `{ owner: 1 }` | $O(K)$ |

---

## 4. Dependencies

- **Kernel**: Standard EventBus & Registry (`boot(app)` mounts `/api/lists`).
- **Cross-module**: Extended `PostRepository` shim (`findByIdOrSlug`) for validating post visibility before adding to list.

---

## 5. Bridge Policy

- `server/src/models/ReadingList.js` is a **permanent bridge file** re-exporting `server/src/modules/reading-lists/reading-lists.model.js`.
