# 🖋️ Notifications Domain Module

> Architecture and query performance documentation for the `notifications` module.
> Built per Inkwell Blueprint (v3.0) §5 & §7 and Step 5 standing rules.

---

## 1. Responsibilities

The `notifications` domain module owns notification creation, persistence, inbox querying, mark-as-read status, and real-time Socket.IO push messaging.

- **Data Access Boundary**: Access to notification documents is strictly restricted to `MongoNotificationRepository` (`notifications.repository.mongo.js`).
- **Bridge Policy**: `server/src/models/Notification.js` is a permanent bridge re-exporting `notifications.model.js`.
- **Real-time Gateway**: `NotificationGateway` (`notifications.gateway.js`) encapsulates Socket.IO event emissions and socket disconnects.
- **Cascades**: User account deletion cleanup (Cascade Step 16) interfaces strictly via `notificationRepository` methods (`deleteManyByRecipient` and `deleteActorNotifsExceptSoftDeletedComments`).

---

## 2. Schema & Indexes

> **Independently Sourced Indexes (verified from `Notification.js`)**:

| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ recipient: 1 }` | Single-field | Recipient inbox lookup & cascade deletion (Step 16) | $O(\log N + K)$ |
| `{ read: 1 }` | Single-field | Filter unread notifications count | $O(\log N + K)$ |
| `{ recipient: 1, createdAt: -1 }` | Compound | Paginated inbox fetch sorted chronological reverse | $O(\log N + K)$ |

---

## 3. Query Performance & Complexity Matrix

| Operation | Query Shape | Index Used | Complexity |
|---|---|---|---|
| `createAndEmit` | `Notification.create(...)` + populate actor | N/A | $O(1)$ |
| `findOwnPaginated` | `Notification.find({ recipient }).sort({ createdAt: -1 })` | `{ recipient: 1, createdAt: -1 }` | $O(\log N + K)$ |
| `countUnread` | `Notification.countDocuments({ recipient, read: false })` | `{ recipient: 1 }` / `{ read: 1 }` | $O(\log N + K)$ |
| `markRead` | `Notification.findOne({ _id, recipient })` + `save()` | Primary key `_id` | $O(1)$ |
| `markAllRead` | `Notification.updateMany({ recipient, read: false })` | `{ recipient: 1 }` | $O(K)$ |
| `findRecentClapNotif` | `Notification.findOne({ recipient, actor, type: "clap", ... })` | `{ recipient: 1 }` | $O(\log N)$ |
| `deleteManyByRecipient` | `Notification.deleteMany({ recipient: userId })` | `{ recipient: 1 }` | $O(K)$ |
| `deleteActorNotifsExceptSoftDeletedComments` | `Notification.deleteMany({ actor: userId, ... })` | Field scan on actor | $O(K)$ |

---

## 4. Socket.IO Gateway & Authentication Architecture

- **Handshake Auth**: `io.engine.use()` verifies httpOnly `accessToken` cookie during handshake.
- **Personal Rooms**: Connected sockets join `user:${userId}` room upon connection.
- **Ban Disconnect**: `disconnectUserSockets(userId)` cleanly disconnects active user sockets on ban without exposing raw tokens to client JS.
