# PostRevisions Module

## Bridge Policy Statement
`server/src/models/PostRevision.js` is a **permanent bridge**, re-exporting `modules/post-revisions/post-revisions.model.js`. This policy maintains codebase consistency across all extracted models (`Highlight`, `ReadingList`, `PostRevision`).

## Schema & Index Citations
- Source file: `server/src/modules/post-revisions/post-revisions.model.js` (moved verbatim from `server/src/models/PostRevision.js`).
- **Single-field `{ post: 1 }` index**:
  `post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true }` (Line 13)
