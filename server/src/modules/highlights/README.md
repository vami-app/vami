# 🖋️ Highlights Domain Module

> Architecture and query performance documentation for the `highlights` module.
> Built per Inkwell Blueprint (v3.0) §2.1 and §4.9 standing rules.

---

## 1. Responsibilities

The `highlights` domain module owns all user-created text highlights and private annotations on posts.

- **Data Access Boundary**: Access to highlight documents is strictly restricted to `MongoHighlightRepository` (`highlights.repository.mongo.js`).
- **Paywall Entitlement Guard**: Highlight creation requires reading entitlement (`canReadFull(post, viewer)`) evaluated at the service layer (`highlights.service.js`).
- **Cascades**: User deletion account cleanup (Cascade Steps 1 & 17) must interface via `HighlightRepository` methods.

---

## 2. Schema & Indexes

> **Blueprint §4.9 Standing Rule Decision**: No additional custom index needed; all query paths execute in $O(1)$ or $O(\log N + K)$ time on existing `owner`, `post`, and compound `{ owner: 1, post: 1 }` indexes.

| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ owner: 1 }` | Single-field | Delete many by owner (Cascade Step 17) | $O(\log N + K)$ |
| `{ post: 1 }` | Single-field | Delete many by post IDs (Cascade Step 1) | $O(\log N + K)$ |
| `{ owner: 1, post: 1 }` | Compound | Fetch own highlights for a post (`findOwnByPost`) | $O(\log N + K)$ |

---

## 3. Query Performance & Complexity Matrix

| Operation | Query Shape | Index Used | Complexity |
|---|---|---|---|
| `create` | `Highlight.create(...)` | N/A | $O(1)$ |
| `findOwnByPost` | `Highlight.find({ post, owner }).sort({ createdAt: 1 })` | `{ owner: 1, post: 1 }` | $O(\log N + K)$ |
| `findByIdAndOwner` | `Highlight.findOne({ _id, owner })` | Primary key `_id` | $O(1)$ |
| `updateNote` | `Highlight.findOne({ _id, owner })` + `save()` | Primary key `_id` | $O(1)$ |
| `deleteByIdAndOwner` | `Highlight.findOne({ _id, owner })` + `deleteOne()` | Primary key `_id` | $O(1)$ |
| `deleteManyByPostIds` | `Highlight.deleteMany({ post: { $in: postIds } })` | `{ post: 1 }` | $O(K)$ |
| `deleteManyByOwner` | `Highlight.deleteMany({ owner: ownerId })` | `{ owner: 1 }` | $O(K)$ |

---

## 4. Dependencies

- **Kernel**: Standard EventBus & Registry.
- **Cross-module**: `PostRepository.findBySlug()` for resolving post slugs to ObjectIds.
