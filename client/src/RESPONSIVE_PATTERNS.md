# Inkwell — Responsive Pattern Reference

> **Created**: Phase K, Step 1 (2026-07-27)
> **Companion to**: `INKWELL_IMPROVEMEN_AND_SCALING_BLUEPRINT.md` §3.1–§3.2
> **Purpose**: One row per component naming the blueprint §3.2 layout pattern (Reflow / Reposition / Reveal-Conceal / Replace), with the quoted current JSX that earns that classification — or that surface's *absence* of pattern implementation, stated plainly.
> **Rule**: Any row updated by a later step must replace the quoted snippet with the new post-change snippet, and add a `> **Updated in Phase K Step N:**` annotation.

---

## Breakpoint Token Scale (Phase K Step 1)

Established in `client/tailwind.config.js` `theme.screens` block. Placed under `theme` (not `theme.extend`) so it replaces Tailwind stock defaults:

```js
// tailwind.config.js — screens block as of Phase K Step 1 (Corrected)
screens: {
  xs:   '0px',   // 0–479px: phones in portrait
  sm: '480px',   // 480–767px: phablets / large phones in landscape / small tablets
  md: '768px',   // 768–1023px: tablets
  lg: '1024px',   // 1024–1279px: small laptops / desktop
  xl: '1280px',   // 1280–1535px: standard desktop
  '2xl': '1536px', // 1536px+: wide desktop
},
```

**Prior state (G1/G2 confirmed at session start):** No `screens` key existed. Tailwind stock defaults were: `sm:640px md:768px lg:1024px xl:1280px 2xl:1536px`. No `xs` token existed anywhere.

**Correction Note (Step 1 Defect Fix):** Initial Step 1 draft had `xs: 480px, sm: 640px`, leaving `sm` at stock 640px and creating an unsourced 480–639px gap. Corrected to `xs: 0px, sm: 480px`, matching blueprint §3.1's zone table where `sm` starts at 480px.

**Visual behavior impact of shifting `sm` from 640px to 480px:**
- Moving `sm` start from 640px to 480px means any utility prefixed with `sm:` now activates 160px earlier (between 480px and 639px).
- **Grep sweep across `client/src/`** identified `sm:` usage in 21 files (`PostCard`, `Navbar`, `Footer`, `VerificationBanner`, `Skeleton`, `StoryPageClient`, `page` components for `lists`, `dashboard`, `pub`, `membership`, `[username]`, `admin` pages).
- **Specific impact on 480–639px viewports (phablets/small tablets):**
  - `Navbar.jsx`: "Write a story" and "Sign in" buttons become visible at 480px+ (`hidden sm:block`).
  - `PostCard.jsx`: Title font scales to text-2xl and thumbnail image expands to h-28 w-40 at 480px+ (`sm:text-2xl sm:h-28 sm:w-40`).
  - `Footer.jsx`, `VerificationBanner.jsx`, `Skeleton.jsx`, `Dashboard`: Layout flex-directions switch from column to row at 480px+ instead of waiting for 640px.
- `md:` (768px) and `lg:` (1024px) breakpoint rules are unaffected — `Navbar` search overlay toggle and `MobileDrawer` use `md:` (768px) and behave identically.

---

## Pattern Classification Table

> **Evidence rule**: every "Pattern" cell is followed by a "Current implementation (quoted)" cell. A pattern classification without a quote is incomplete and must not be considered closed. Same discipline as Phase H's endpoint-by-endpoint verbatim comparison matrices.

---

### 1. `PostList`
**File**: [`client/src/components/post/PostList.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/post/PostList.jsx)

**Blueprint target pattern**: Reflow (1→2→3 column grid)

**Current implementation (quoted, lines 87–101):**
```jsx
return (
  <div>
    {posts.map((p) => (
      <PostCard key={p.id || p.slug} post={p} showStatus={showStatus} />
    ))}
    {hasMore && (
      <div ref={sentinelRef} className="py-8 text-center text-sm text-ink-faint">
        {loading ? "Loading more…" : ""}
      </div>
    )}
    {error && posts.length > 0 && (
      <p className="py-4 text-center text-sm text-red-600">{error}</p>
    )}
  </div>
);
```

**Classification**: **Reflow — target, not current.** The wrapping `<div>` has no grid classes. `PostCard` items stack in a single column at all viewports today. The Reflow pattern (1→2→3 columns across breakpoints) is what this component *should* implement in a later Phase K step; it is not implemented today.

**No-behavior-change confirmation**: This row is a description of existing behavior. No code was changed by Phase K Step 1. The single-column layout at all viewports is unchanged.

---

### 2. `RelatedPosts`
**File**: [`client/src/components/post/RelatedPosts.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/post/RelatedPosts.jsx)

**Blueprint target pattern**: Reflow (1→2→3 column grid)

**Current implementation (quoted, lines 32–41):**
```jsx
return (
  <section className="mx-auto max-w-reading px-4 pt-12 border-t border-gray-100 mt-12">
    <h2 className="font-serif text-2xl font-bold text-ink mb-6">Related Stories</h2>
    <div className="divide-y divide-gray-100">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  </section>
);
```

**Classification**: **Reflow — target, not current.** `divide-y divide-gray-100` produces a single-column stacked list at all widths. `max-w-reading` (680px) constrains the container — appropriate for a reading-column context, but the multi-column grid target is not implemented.

**No-behavior-change confirmation**: Description of existing behavior. Phase K Step 1 made no JSX changes. Layout is unchanged.

---

### 3. `TrendingTags`
**File**: [`client/src/components/post/TrendingTags.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/post/TrendingTags.jsx)

**Blueprint target pattern**: Reposition (below feed on `xs`/`sm`, right rail on `lg`+)

**Current implementation (quoted, lines 20–37):**
```jsx
return (
  <div>
    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink">
      Trending tags
    </h3>
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Link
          key={t.tag}
          href={`/tag/${t.tag}`}
          className="rounded-full bg-gray-100 px-3.5 py-2 text-sm text-ink hover:bg-gray-200"
        >
          {t.tag}
        </Link>
      ))}
    </div>
  </div>
);
```

**Classification**: **Reposition — target, not current.** The component itself has no positioning logic — it's a plain `<div>`. Its placement (below feed vs. right rail) is entirely controlled by whatever parent layout renders it. The Reposition pattern must be implemented at the parent page layout level, not inside this component. The component is reposition-ready (no self-positioning assumptions) but the parent layout doesn't implement the breakpoint switch yet.

**No-behavior-change confirmation**: Description of existing behavior. Phase K Step 1 made no JSX changes.

---

### 4. `Navbar` — search behavior
**File**: [`client/src/components/layout/Navbar.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/layout/Navbar.jsx)

**Blueprint target pattern**: Reposition (inline search on `md`+, icon-toggle overlay on `xs`/`sm`)

**Current implementation (quoted — desktop form, lines 62–73; mobile toggle, lines 78–85; mobile bar, lines 143–157):**

Desktop search (`md:flex`, hidden below):
```jsx
<form
  onSubmit={onSearch}
  className="hidden flex-1 max-w-sm items-center rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 md:flex"
>
  <SearchIcon className="h-4 w-4 text-ink-faint dark:text-gray-400" />
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search stories and tags"
    className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint dark:placeholder:text-gray-500 dark:text-gray-200"
  />
</form>
```

Mobile search toggle button (`md:hidden`):
```jsx
<button
  className="flex h-11 w-11 items-center justify-center rounded-md text-ink dark:text-gray-200 md:hidden"
  onClick={() => setSearchOpen((v) => !v)}
  aria-label="Search"
>
  <SearchIcon className="h-5 w-5" />
</button>
```

Mobile expanded search bar (`{searchOpen && ...}`, `md:hidden`):
```jsx
{searchOpen && (
  <form onSubmit={onSearch} className="border-t border-gray-100 px-4 py-2 md:hidden">
    <div className="flex items-center rounded-full bg-gray-100 px-4 py-2.5">
      <SearchIcon className="h-4 w-4 text-ink-faint" />
      <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stories and tags"
        className="ml-2 w-full bg-transparent text-sm outline-none"
      />
    </div>
  </form>
)}
```

**Classification**: **Reposition — already implemented.** The pattern is live: `md:flex` / `md:hidden` split the search between an always-visible inline form (≥768px) and a toggle-then-expand overlay (below 768px). This is the one component in the six whose blueprint target is already implemented. The breakpoint used is stock Tailwind `md` (768px) — after Phase K Step 1, this resolves to the same 768px since `md` is unchanged in the new scale.

**No-behavior-change confirmation**: The new `tailwind.config.js` `screens.md` is still `768px` — identical to Tailwind stock `md`. Visual behavior at every viewport is unchanged.

---

### 5. `MobileDrawer`
**File**: [`client/src/components/layout/MobileDrawer.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/layout/MobileDrawer.jsx)

**Blueprint target pattern**: Replace (drawer replaces inline links on mobile; inline links present on desktop)

**Current implementation (quoted — panel, lines 26–84; `Navbar` mount site, Navbar.jsx line 160):**

Drawer panel (fixed, slide-in, `md:hidden`):
```jsx
<aside
  className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] transform bg-white shadow-xl transition-transform md:hidden ${
    open ? "translate-x-0" : "-translate-x-full"
  }`}
  role="dialog"
  aria-modal="true"
>
```

Backdrop (`md:hidden`):
```jsx
<div
  className={`fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden ${
    open ? "opacity-100" : "pointer-events-none opacity-0"
  }`}
  onClick={onClose}
  aria-hidden="true"
/>
```

Mounted unconditionally in `Navbar.jsx` (line 160):
```jsx
<MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
```

**Classification**: **Replace — already implemented.** `md:hidden` on both the panel and the backdrop means the drawer is a CSS-hidden no-op at ≥768px. Below 768px the hamburger button (`md:hidden` in `Navbar.jsx` line 50) opens it via `drawerOpen` state. The inline desktop navigation links live in the Navbar itself (avatar menu, Write link) — the drawer is the phone-only replacement. The Replace pattern is live.

**No-behavior-change confirmation**: `screens.md` unchanged at 768px. The `md:hidden` boundary is identical before and after.

---

### 6. `CommentSection` — reply nesting indent
**File**: [`client/src/components/post/CommentSection.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/components/post/CommentSection.jsx)

**Blueprint target pattern**: Reposition / Replace (flatten past depth 3 on phones — the blueprint's §3.11 "sharpest existing example")

**Current implementation (quoted — reply list indent, lines 258–271):**
```jsx
{/* Recursive Replies List */}
{comment.replies && comment.replies.length > 0 && (
  <ul className="ml-4 border-l border-gray-100 pl-4 space-y-4">
    {comment.replies.map((reply) => (
      <CommentNode
        key={reply.id}
        comment={reply}
        onReplySubmit={onReplySubmit}
        onDelete={onDelete}
        user={user}
        depth={depth + 1}
      />
    ))}
  </ul>
)}
```

Reply form indent (lines 239):
```jsx
<form onSubmit={submitReply} className="ml-4 border-l-2 border-accent-100 pl-4 py-2 space-y-2">
```

**Classification**: **Reposition/Replace — target, not current.** Indent is a fixed `ml-4 pl-4` (16px) applied at every depth, at every viewport. There is no depth cap, no viewport-conditional flattening, no `xs:`/`sm:` breakpoint on the margin. The `depth` prop is passed down through recursion but is used only to gate the Reply button (`comment.depth < 5`) — not to adjust visual indent. On a 320px phone, 5 levels of 16px indent = 80px consumed before the first character. The blueprint's "flatten past depth 3" target is not implemented.

**No-behavior-change confirmation**: Description of existing behavior. Phase K Step 1 made no JSX changes. Fixed-margin indenting at all viewports is unchanged.

---

### 7. `PublicationDashboardPage` — member sidebar
**File**: [`client/src/app/(main)/pub/[slug]/dashboard/page.jsx`](file:///c:/Users/ABSA00065/Desktop/Project/client/src/app/(main)/pub/[slug]/dashboard/page.jsx)

**Blueprint target pattern**: Reveal-Conceal (temporary drawer on phones, persistent sidebar panel on desktop)

**Current implementation (quoted — overall layout, lines 138–152):**
```jsx
return (
  <div className="mx-auto max-w-5xl px-4 py-8">
    <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
      <div>
        <Link href={`/pub/${publication.slug}`} ...>← Back to publication</Link>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink">
          {publication.name} Dashboard
        </h1>
      </div>
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-soft uppercase tracking-wider">
        Your role: {myRole}
      </div>
    </div>
    {/* Submissions Review Queue ... */}
    {/* Member Management (inline, no sidebar) */}
  </div>
);
```

**Classification**: **Reveal-Conceal — target, not current. No sidebar exists.** The page is a single-column `max-w-5xl` layout. The member management section (team list, invite form) renders inline below the submissions queue at all viewports. There is no sidebar, no panel, no drawer — no reveal-conceal implementation of any kind. The blueprint's "persistent panel on desktop / temporary drawer on phone" describes a component that does not yet exist in the codebase.

**No-behavior-change confirmation**: Description of existing behavior. Phase K Step 1 made no JSX changes.

---

## Summary: Implementation Status by Pattern

| # | Component | Pattern | Status |
|---|---|---|---|
| 1 | `PostList` | Reflow (1→2→3 col) | **Target only — not implemented** |
| 2 | `RelatedPosts` | Reflow (1→2→3 col) | **Target only — not implemented** |
| 3 | `TrendingTags` | Reposition (below→rail) | **Target only — component is reposition-ready; parent layout not wired** |
| 4 | `Navbar` search | Reposition (inline→toggle) | ✅ **Already implemented** (`md:flex`/`md:hidden`, `768px`) |
| 5 | `MobileDrawer` | Replace | ✅ **Already implemented** (`md:hidden` panel + backdrop) |
| 6 | `CommentSection` indent | Reposition/Replace (flatten @depth 3+) | **Target only — fixed `ml-4` indent at all viewports, no breakpoint logic** |
| 7 | `PublicationDashboardPage` sidebar | Reveal-Conceal | **Target only — no sidebar exists; single-column layout only** |

**Of six blueprint example surfaces: 2 already implement their target pattern. 4 are targets for later Phase K steps.**

---

## G-Gate Record (Phase K Step 1)

| # | Gate | Finding |
|---|---|---|
| G1 | Blueprint's "no breakpoint scale" claim still true? | **Confirmed** — no `screens` key in `tailwind.config.js` before this step. Stock Tailwind defaults only. |
| G2 | Exact current breakpoint config, quoted | `sm:640px md:768px lg:1024px xl:1280px 2xl:1536px` (stock). No `xs`. |
| G3 | All six named components exist at documented paths? | **5 of 6 confirmed by filename search.** `PublicationDashboardPage` found at `app/(main)/pub/[slug]/dashboard/page.jsx` (not a components/ file — a page). All six read and quoted. |
| G4 | Zero `server/` files in diff? | **Pre-committed and confirmed by §7.3.** |
| G5 | Visual-regression / screenshot test infra exists? | **None.** No Playwright screenshot tests, no Storybook, no jest-image-snapshot. §7.5 evidence ceiling is text-only (quoted JSX). |
