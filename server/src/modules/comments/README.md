# 🖋️ Comments Domain Module

> Architecture and query performance documentation for the `comments` module.
> Built per Inkwell Blueprint (v3.0) §5 & §7 and Step 4 standing rules.

---

## 1. Responsibilities

The `comments` domain module owns all user comments, threaded responses, and soft/hard delete lifecycle rules on posts.

- **Data Access Boundary**: Access to comment documents is strictly restricted to `MongoCommentRepository` (`comments.repository.mongo.js`).
- **Bridge Policy**: `server/src/models/Comment.js` is a permanent bridge re-exporting `comments.model.js`.
- **Side Effects**: Notification side-effects on comment/reply creation are executed strictly in `CommentService` (`comments.service.js`).
- **Cascades**: User account deletion cascades (Steps 5 & 6) interface strictly via `commentRepository` methods (`deleteManyByPostIds`, `findOtherCommentsByAuthor`, `anonymizeAndSoftDelete`, `hardDelete`).

---

## 2. Schema & Indexes

> **Independently Sourced Indexes (verified from `Comment.js`)**:

| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ post: 1 }` | Single-field | List comments by post, cascade delete by post IDs (Cascade Step 5) | $O(\log N + K)$ |
| `{ parentComment: 1 }` | Single-field | Has-replies check (`Comment.exists({ parentComment })`) | $O(\log N)$ |
| `{ moderationStatus: 1 }` | Single-field | Filter visible comments in listing | $O(\log N + K)$ |

---

## 3. Query Performance & Complexity Matrix

| Operation | Query Shape | Index Used | Complexity |
|---|---|---|---|
| `create` | `Comment.create(...)` | N/A | $O(1)$ |
| `findByPost` | `Comment.find({ post, moderationStatus: "visible" }).sort({ createdAt: 1 })` | `{ post: 1 }` | $O(\log N + K)$ |
| `findById` | `Comment.findById(id)` | Primary key `_id` | $O(1)$ |
| `findByIdAndAuthor` | `Comment.findOne({ _id: id, author: authorId })` | Primary key `_id` | $O(1)$ |
| `hasReplies` | `Comment.exists({ parentComment: commentId })` | `{ parentComment: 1 }` | $O(\log N)$ |
| `softDelete` | `Comment.findById(...)` + `save()` | Primary key `_id` | $O(1)$ |
| `hardDelete` | `Comment.deleteOne({ _id: commentId })` | Primary key `_id` | $O(1)$ |
| `deleteManyByPostIds` | `Comment.deleteMany({ post: { $in: postIds } })` | `{ post: 1 }` | $O(K)$ |
| `findOtherCommentsByAuthor` | `Comment.find({ author: authorId, post: { $nin: postIds } })` | Primary key / field scan | $O(K)$ |
| `anonymizeAndSoftDelete` | `Comment.findById(...)` + `save()` (reassign author) | Primary key `_id` | $O(1)$ |

---

## 4. Dependencies & Bridge Policy

- **Permanent Bridge**: `server/src/models/Comment.js` re-exports `modules/comments/comments.model.js`.
- **Side-Effects**: Notification dispatch relies on `Notification.create` and socket emitter (additive shim until `Notification` module extraction).
