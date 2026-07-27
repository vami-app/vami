# 🖋️ Publications Domain Module

> Architecture, query performance, and RBAC documentation for the `publications` module.
> Built per Inkwell Blueprint (v3.0) §5 & §7 and Step 6 standing rules.

---

## 1. Responsibilities

The `publications` domain module owns publication entity management, member management, submission review workflow, member dashboard, and publication-level RBAC authorization.

- **Two-Model, Two-Repository Boundary**: `Publication` and `PublicationMember` are operated together in service orchestration but maintain strictly separate repositories:
  - `MongoPublicationRepository` (`publications.repository.mongo.js`) for `Publication` data access.
  - `MongoPublicationMemberRepository` (`publication-members.repository.mongo.js`) for `PublicationMember` data access.
  - Zero cross-model Mongoose imports exist inside either repository layer.
- **Bridge Policy**: `server/src/models/Publication.js` and `server/src/models/PublicationMember.js` are permanent bridges re-exporting `publications.model.js` and `publication-members.model.js`.
- **Cascades**: User account deletion cleanup (Cascade Step 13) interfaces strictly via `publicationRepository` and `publicationMemberRepository` methods (`countOwners`, `findSeniorMember`, `updateOwner`, `archive`, `deleteManyByUser`).

---

## 2. Schema & Indexes

> **Independently Sourced Indexes (verified from `Publication.js` & `PublicationMember.js`)**:

### Publication
| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ slug: 1 }` | Unique | Public profile & settings lookup | $O(\log N)$ |
| `{ owner: 1 }` | Single-field | Owner lookup | $O(\log N)$ |

### PublicationMember
| Index | Type | Target Query | Complexity |
|---|---|---|---|
| `{ publication: 1 }` | Single-field | Member list & dashboard query | $O(\log N + K)$ |
| `{ user: 1 }` | Single-field | User memberships lookup & cascade deletion (Step 13) | $O(\log N + K)$ |
| `{ publication: 1, user: 1 }` | Compound Unique | Member role-check guard & uniqueness constraint | $O(\log N)$ |

---

## 3. Query Performance & Complexity Matrix

| Operation | Query Shape | Index Used | Complexity |
|---|---|---|---|
| `createPublication` | `Publication.create` + `PublicationMember.create` | N/A | $O(1)$ |
| `getPublicationBySlug` | `Publication.findOne({ slug })` + `PublicationMember.find({ publication })` | `{ slug: 1 }`, `{ publication: 1 }` | $O(\log N + K)$ |
| `updatePublication` | `PublicationMember.findOne({ publication, user })` + `Publication.findById` save | `{ publication: 1, user: 1 }`, `_id` | $O(\log N)$ |
| `inviteMember` | `PublicationMember.findOne` + `PublicationMember.create` | `{ publication: 1, user: 1 }` | $O(\log N)$ |
| `updateMemberRole` | `PublicationMember.countDocuments({ publication, role: "owner" })` + save | `{ publication: 1 }` | $O(\log N)$ |
| `removeMember` | `PublicationMember.deleteOne` | `{ publication: 1, user: 1 }` | $O(\log N)$ |
| `submitPost` | `Post.findById` + update status | Primary key `_id` | $O(1)$ |
| `reviewSubmission` | `Post.findById` + update status | Primary key `_id` | $O(1)$ |
| `deleteManyByUser` | `PublicationMember.deleteMany({ user: userId })` | `{ user: 1 }` | $O(K)$ |
