# Phase F & G Implementation Plan — Inkwell

> Companion to `INKWELL_FULL_PRODUCT_ROADMAP.md` and the modular blueprint suite v1.7.0.
> Closes the full A–G roadmap. Implementation-ready as of 2026-07-23.

---

## Part 1 — Phase F: Reader Experience Depth

### Estimate Summary

| Step | Feature | Days |
|------|---------|------|
| F-0 | Dark Mode (token pass, cookie-based SSR-safe theme) | 9 |
| F-1 | Writer Analytics Dashboard | 6 |
| F-2 | Highlighting / Annotation | 12 |
| **Total** | | **~27 days (~5.5 weeks)** |

---

### F-0 — Dark Mode

**Gap resolved:** Flash of wrong theme is a Next.js SSR problem. The fix is a cookie (readable server-side in the root layout's Server Component), not localStorage.

#### Server: `User.js`
- Add `themePreference` field: `enum ['light','dark','system']`, default `'system'`
- Updated via existing `PATCH /api/users/me`
- `toPublicJSON()` updated to include `themePreference`

#### Server: `user.controller.js` — `updateMe`
- Accept `themePreference` in PATCH body
- Validate against enum; set cookie response header alongside DB save

#### Client: `tailwind.config.js`
- Enable `darkMode: 'class'` strategy
- Add `dark:` pairs for every `accent-*` and `ink-*` token
- Add dark background/surface tokens

#### Client: `globals.css`
- Add CSS custom property pairs with light defaults and `.dark` overrides
- `prose-article` dark variant
- Article reading content uses `prose dark:prose-invert` (already in `@tailwindcss/typography`)

#### Client: `app/layout.jsx` — Root Server Component
- Read `theme` cookie at request time before first paint
- Apply `dark` class to `<html>` server-side based on resolved cookie value

#### Client: `context/ThemeContext.jsx` — NEW
- `ThemeProvider` client component
- Manages theme state, toggling, cookie sync, and `PATCH /api/users/me` for logged-in users
- Exposes `useTheme()` hook

#### Client: `components/layout/ThemeToggle.jsx` — NEW
- Sun/moon icon toggle button
- Wired to `useTheme()`, updates cookie + (if logged in) DB preference

#### DoD
- Every route respects the theme via CSS custom properties
- No flash on cold page load with saved dark preference
- Logged-in user switching theme: single `PATCH` + cookie update, no reload required

---

### F-1 — Writer Analytics Dashboard

**No new model.** Read-only aggregation over existing `Post`, `ReadEvent`, `Comment`, `Follow`.

**Privacy hard boundary:** endpoint never returns per-viewer identity — aggregates only.

#### Server: `controllers/analytics.controller.js` — NEW

```
GET /api/writer/analytics   Auth: required
Returns:
  - posts[]: { slug, title, views, totalClaps, commentCount, avgReadTimeSeconds, isCurrentlyHidden }
  - trend: 30-day buckets (date → { views, claps })
  - followerCount, followerGrowth (30-day daily buckets)
```

Privacy guarantees:
- `ReadEvent.viewer` used only for `viewerWasMember` filter, never returned
- Response contains no `viewer`, `userId`, or user-identifying field anywhere

#### Server: `routes/writer.routes.js` — NEW
- `GET /api/writer/analytics → requireAuth → getWriterAnalytics`
- `GET /api/writer/payout-ledger` moved here from `ledger.routes.js`

#### Client: `app/(main)/dashboard/page.jsx` — NEW
- Writer analytics dashboard
- Weekly-bucketed trend chart (SVG/CSS only)
- Per-post stats table: views, claps, comments, avg read time
- Follower growth section

#### DoD
- Dashboard shows correct weekly-bucketed trend against seeded data
- Code check confirms zero per-viewer identity in response payload

---

### F-2 — Highlighting / Annotation

**Gap resolved:** No stored character offsets (breaks on content edits). Uses quote + context for fuzzy re-location at render time.

**Gap resolved:** Paywall leak blocked via `canReadFull(post, viewer)` on creation.

#### Server: `models/Highlight.js` — NEW

| Field | Type | Constraints |
|-------|------|-------------|
| `owner` | ObjectId → User | required, indexed |
| `post` | ObjectId → Post | required, indexed |
| `quote` | String | required |
| `contextBefore` | String | ~40 chars before quote |
| `contextAfter` | String | ~40 chars after quote |
| `note` | String | optional, maxlength 500 |
| `createdAt` | Date | auto |

Private-only for v1.

#### Server: `controllers/highlight.controller.js` — NEW

| Method | Path | Auth | Logic |
|--------|------|------|-------|
| POST | `/api/posts/:slug/highlights` | required | Validates `canReadFull` → 403 if not entitled |
| GET | `/api/posts/:slug/highlights/mine` | required | Own highlights on post |
| PATCH | `/api/highlights/:id` | owner only | Edit note |
| DELETE | `/api/highlights/:id` | owner only | Remove |

#### Client: `components/post/HighlightLayer.jsx` — NEW
- Wraps article content, listens for `mouseup`/`selectionchange`
- Floating toolbar on text selection: highlight + add note
- On page load: fetches own highlights, fuzzy-matches against DOM
- Confident match → colored underlay; No match → "no longer found" indicator

#### Client: `hooks/useHighlights.js` — NEW
- `useHighlights(slug)` — fetches, creates, edits, deletes highlights

#### Client: `components/post/HighlightPopover.jsx` — NEW
- Floating note editor anchored at selection position

#### Cascade addition — `user.controller.js` `deleteAccount`
- Step 18: `await Highlight.deleteMany({ owner: user._id })`
- Post bulk-delete loop: `Highlight.deleteMany({ post: { $in: postIds } })`

#### DoD
- Select text → highlight persists across reload, visible only to highlighter
- Post content edited → highlight re-locates correctly or shows not-found, never wrong position
- Non-member highlights locked post preview → 403 blocked
- Deleted user's highlights purged (assertion in cascade test)

---

### F — Consolidated Cascade Table

| Deleted user's... | Cascade behavior |
|---|---|
| `Highlight` docs (owner) | DELETE |
| `Highlight` docs on hard-deleted post | DELETE alongside post |

---

## Part 2 — Phase G: Quality & Correctness Infrastructure

### Estimate Summary

| Step | Feature | Days |
|------|---------|------|
| G-0 | Test infrastructure foundation | 4 |
| G-1 | Vitest unit + integration suite | 14 |
| G-2 | Playwright E2E suite | 12 |
| **Total** | | **~30 days (~6 weeks)** |

---

### G-0 — Test Infrastructure Foundation

#### Server: `config/env.js`
- Add `mongoUriTest`: `process.env.MONGO_URI_TEST || (mongoUri + '_test')`

#### Server: `config/db.js`
- `NODE_ENV === 'test'` → connect to `mongoUriTest`, drop DB before suite

#### Server: `utils/email.js`
- Test branch: records to `sentEmails[]`, never calls external HTTP
- Exports `getSentEmails()` and `clearSentEmails()` for test inspection

#### Server: `test/setup/socketTestServer.js` — NEW
- Ephemeral `http.createServer(app)` + `io` per test file, random port
- `afterAll()` teardown included

#### `.env.test` + `server/package.json`
- `"test": "vitest run"`, `"test:watch": "vitest"`
- Add `vitest`, `@vitest/coverage-v8` as devDependencies

#### DoD
- Test suite run twice → identical results; dev DB unchanged

---

### G-1 — Vitest Unit + Integration Suite

#### File organization — `server/test/`

```
server/test/
  setup/
    db.js                   connectTestDB / dropTestDB helpers
    socketTestServer.js
  unit/
    entitlement.test.js     canReadFull() — 6 branches
    slugify.test.js         makeSlug/baseSlug
    ledger.test.js          computeLedgerForPeriod() isolated math
    diff.test.js            lib/diff.js pure string logic
    highlightLocate.test.js Phase F fuzzy re-location
  integration/
    moderation.test.js      migrated from test_phase_b/c.js
    cascade.test.js         15-step + Phase F step 18
    payout-ledger.test.js   migrated from test_phase_d.js
    oauth.test.js           first-time OAuth signup
    analytics.test.js       Phase F privacy checks
    highlight.test.js       Phase F CRUD + paywall-leak guard
    darkmode.test.js        Phase F themePreference PATCH + cookie
```

#### DoD
- `pnpm test` produces structured report, no raw console output
- All migrated phase-script assertions pass, zero coverage loss
- Unit tests run with no MongoDB connection

---

### G-2 — Playwright E2E Suite

**Zero real external calls:** Email → no-op stub. Payments → `test-sign` path.

#### `e2e/` (workspace root)

```
e2e/
  playwright.config.js      baseURL, html+junit reporters, workers:1
  fixtures/
    auth.fixture.js         register + verify helper
  specs/
    auth.spec.js
    publish.spec.js
    engage.spec.js          clap, comment, follow
    moderation.spec.js
    membership.spec.js      subscribe test-mode
    highlight.spec.js
    analytics.spec.js
    darkmode.spec.js        cookie check on reload
    oauth.spec.js
```

#### DoD
- Full E2E run passes locally
- Zero real emails, zero real payment API calls
- HTML report at `e2e/playwright-report/`

---

## Cross-Check — Full A–G Roadmap Closure

| Check | Covered by |
|-------|-----------|
| Highlight cascade with real assertions | `cascade.test.js` step 18 |
| Analytics — zero per-viewer identity | `analytics.test.js` response shape |
| Dark mode no-flash cold load | `darkmode.spec.js` cookie + reload |
| Paywall-highlight-leak guard blocked | `highlight.test.js` 403 assertion |
| Test DB isolation | G-0 before/after diff |
| Email + Razorpay stubs — zero external calls | G-0 stubs confirmed in G-1/G-2 |
| Phase D doc-sync (`test-sign` in doc06) | `08_env_vars_and_workflow.md` update |

---

*Plan created 2026-07-23. Sequence: F-0 → F-1 → F-2 → G-0 → G-1 → G-2.*
